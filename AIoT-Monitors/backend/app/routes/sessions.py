from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.device import Device
from app.models.session import Session, SessionStatus, CommandLog
from app.models.command import Command
from app.utils.ssh_client import SSHClient
import paramiko
import json

sessions_bp = Blueprint('sessions', __name__)

@sessions_bp.route('', methods=['POST'])
@jwt_required()
def create_session():
    """Create a new session (Operator)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data or 'device_id' not in data:
        return jsonify({'error': 'Device ID is required'}), 400
    
    device = Device.query.get(data['device_id'])
    
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    # Check if user has permissions for this device through profiles
    has_permission = False
    for profile in current_user.profiles:
        if device in profile.device_group.devices:
            has_permission = True
            break
    
    if not has_permission and not (current_user.is_admin() or current_user.is_supervisor()):
        return jsonify({'error': 'You do not have permission to access this device'}), 403
    
    # Create a new session
    new_session = Session(
        user_id=current_user.user_id,
        device_id=device.device_id,
        ip_address=request.remote_addr,
        user_agent=request.user_agent.string if hasattr(request, 'user_agent') else None
    )
    
    db.session.add(new_session)
    db.session.commit()
    
    return jsonify({
        'message': 'Session created successfully',
        'session': new_session.to_dict()
    }), 201

@sessions_bp.route('/<int:session_id>/commands', methods=['POST'])
@jwt_required()
def execute_command(session_id):
    """Execute a command in the session (Operator)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    session = Session.query.get(session_id)
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check if the user owns this session
    if session.user_id != current_user.user_id and not (current_user.is_admin() or current_user.is_supervisor()):
        return jsonify({'error': 'You do not own this session'}), 403
    
    # Check if the session is active
    if session.status != SessionStatus.ACTIVE:
        return jsonify({'error': 'Session is not active'}), 400
    
    data = request.get_json()
    
    if not data or 'command' not in data:
        return jsonify({'error': 'Command is required'}), 400
    
    device = Device.query.get(session.device_id)
    
    # Check if the command is allowed for the user
    raw_command = data['command']
    command_id = data.get('command_id')
    
    # If command_id is provided, check if it's in user's permitted commands
    if command_id:
        command = Command.query.get(command_id)
        if not command:
            return jsonify({'error': 'Command not found'}), 404
        
        # Check if the command is in the user's profiles
        command_allowed = False
        for profile in current_user.profiles:
            if command in profile.command_list.commands:
                command_allowed = True
                break
        
        if not command_allowed and not (current_user.is_admin() or current_user.is_supervisor()):
            return jsonify({'error': 'You do not have permission to use this command'}), 403
    
    # Execute the command via SSH
    try:
        ssh_client = SSHClient(
            hostname=device.ip_address,
            port=device.ssh_port,
            username=device.username,
            password=None,
            authentication_method=device.authentication_method
        )
        
        # Connect to the device
        ssh_client.connect()
        
        # Execute the command
        exit_code, output = ssh_client.execute_command(raw_command)
        
        # Close the connection
        ssh_client.close()
        
        # Log the command
        command_log = CommandLog(
            session_id=session.session_id,
            command_text=raw_command,
            user_id=current_user.user_id,
            device_id=device.device_id,
            output=output,
            status='success' if exit_code == 0 else 'failed',
            execution_time=None,
            is_approved=True
        )
        
        db.session.add(command_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Command executed successfully',
            'command_log': command_log.to_dict()
        }), 200
        
    except paramiko.AuthenticationException:
        return jsonify({'error': 'Authentication failed'}), 401
    except paramiko.SSHException as e:
        return jsonify({'error': f'SSH error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500

@sessions_bp.route('/<int:session_id>/edit-file', methods=['POST'])
@jwt_required()
def edit_file(session_id):
    """Edit a file in the session (Operator)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    session = Session.query.get(session_id)
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check if the user owns this session
    if session.user_id != current_user.user_id and not (current_user.is_admin() or current_user.is_supervisor()):
        return jsonify({'error': 'You do not own this session'}), 403
    
    # Check if the session is active
    if session.status != SessionStatus.ACTIVE:
        return jsonify({'error': 'Session is not active'}), 400
    
    data = request.get_json()
    
    if not data or 'file_path' not in data or 'content' not in data:
        return jsonify({'error': 'File path and content are required'}), 400
    
    device = Device.query.get(session.device_id)
    
    # Execute file edit via SSH
    try:
        ssh_client = SSHClient(
            hostname=device.ip_address,
            port=device.ssh_port,
            username=device.username,
            password=None,
            authentication_method=device.authentication_method
        )
        
        # Connect to the device
        ssh_client.connect()
        
        # Edit the file
        exit_code, output = ssh_client.edit_file(data['file_path'], data['content'])
        
        # Close the connection
        ssh_client.close()
        
        # Log the command
        command_log = CommandLog(
            session_id=session.session_id,
            command_text=f"edit file: {data['file_path']}",
            user_id=current_user.user_id,
            device_id=device.device_id,
            output=output,
            status='success' if exit_code == 0 else 'failed',
            execution_time=None,
            is_approved=True
        )
        
        db.session.add(command_log)
        db.session.commit()
        
        return jsonify({
            'message': 'File edited successfully',
            'command_log': command_log.to_dict()
        }), 200
        
    except paramiko.AuthenticationException:
        return jsonify({'error': 'Authentication failed'}), 401
    except paramiko.SSHException as e:
        return jsonify({'error': f'SSH error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500

@sessions_bp.route('/<int:session_id>', methods=['PUT'])
@jwt_required()
def end_session(session_id):
    """End a session"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    session = Session.query.get(session_id)
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check if the user owns this session or is supervisor/admin
    if session.user_id != current_user.user_id and not (current_user.is_admin() or current_user.is_supervisor()):
        return jsonify({'error': 'You do not have permission to end this session'}), 403
    
    data = request.get_json()
    status = data.get('status', SessionStatus.COMPLETED) if data else SessionStatus.COMPLETED
    
    # Validate status
    if status not in SessionStatus.all_statuses():
        return jsonify({'error': f'Invalid status. Must be one of: {SessionStatus.all_statuses()}'}), 400
    
    # End the session
    session.end_session(status)
    db.session.commit()
    
    return jsonify({
        'message': 'Session ended successfully',
        'session': session.to_dict()
    }), 200

@sessions_bp.route('', methods=['GET'])
@jwt_required()
def get_sessions():
    """Get all sessions or filter by active_only"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'User not found', 'sessions': []}), 404
        
        # Check for filter parameters
        active_only = request.args.get('active_only', 'false').lower() == 'true'
        
        # Base query
        query = Session.query
        
        # Apply filters
        if active_only:
            query = query.filter(Session.status == SessionStatus.ACTIVE)
        
        # Filter based on user role
        if not (current_user.is_admin() or current_user.is_supervisor()):
            # Regular operators can only see their own sessions
            query = query.filter(Session.user_id == current_user.user_id)
        
        # Get sessions
        sessions = query.all()
        
        # Format sessions for response
        formatted_sessions = []
        for session in sessions:
            try:
                session_data = session.to_dict()
                formatted_sessions.append(session_data)
            except Exception as e:
                print(f"Error processing session {session.session_id}: {str(e)}")
                # Include minimal session data
                formatted_sessions.append({
                    'id': session.session_id,
                    'device_id': session.device_id,
                    'status': session.status
                })
        
        return jsonify({
            'sessions': formatted_sessions
        }), 200
    except Exception as e:
        print(f"Error in get_sessions: {str(e)}")
        return jsonify({
            'error': f'Failed to retrieve sessions: {str(e)}',
            'sessions': []
        }), 500

@sessions_bp.route('/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Get session by ID"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    session = Session.query.get(session_id)
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check if the user has permission to view this session
    if session.user_id != current_user.user_id and not (current_user.is_admin() or current_user.is_supervisor()):
        return jsonify({'error': 'You do not have permission to view this session'}), 403
    
    return jsonify(session.to_dict()), 200

@sessions_bp.route('/<int:session_id>/commands', methods=['GET'])
@jwt_required()
def get_session_commands(session_id):
    """Get all commands in a session"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    session = Session.query.get(session_id)
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check if the user has permission to view this session
    if session.user_id != current_user.user_id and not (current_user.is_admin() or current_user.is_supervisor()):
        return jsonify({'error': 'You do not have permission to view this session'}), 403
    
    return jsonify({
        'commands': [command.to_dict() for command in session.command_logs]
    }), 200 