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
    raw_command = data['command'].strip()
    command_id = data.get('command_id')  # Optional now
    
    # Check permission based on user role
    if current_user.is_operator():
        # For operators, validate the command against their assigned profiles
        command_allowed = False
        matching_command = None
        
        # Loop through the user's profiles to find the command
        for profile in current_user.profiles:
            if not profile.command_list:
                continue
                
            # Check if any command in the profile's command list matches the raw command
            for cmd in profile.command_list.commands:
                if cmd.command_text.strip() == raw_command:
                    command_allowed = True
                    matching_command = cmd
                    break
                    
            if command_allowed:
                break
                
        if not command_allowed:
            return jsonify({
                'error': 'You do not have permission to use this command',
                'message': 'This command is not in your allowed commands list'
            }), 403
    
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
            'command_log': command_log.to_dict(),
            'success': True
        }), 200
        
    except paramiko.AuthenticationException:
        return jsonify({'error': 'Authentication failed', 'success': False}), 401
    except paramiko.SSHException as e:
        return jsonify({'error': f'SSH error: {str(e)}', 'success': False}), 500
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}', 'success': False}), 500

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
    """Get all sessions or active sessions"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    active_only = request.args.get('active_only', 'false').lower() == 'true'
    detailed = request.args.get('detailed', 'false').lower() == 'true'
    limit = request.args.get('limit', 20, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    # Build query based on user role
    query = Session.query
    
    if active_only:
        query = query.filter(Session.status == SessionStatus.ACTIVE)
    
    # Operators can only see their own sessions
    if current_user.is_operator():
        query = query.filter(Session.user_id == current_user.user_id)
    # Team leads can see all sessions
    elif current_user.is_team_lead():
        pass  # No additional filter needed
    # Supervisors and admins can see all sessions
    elif current_user.is_supervisor() or current_user.is_admin():
        pass  # No additional filter needed
    
    # Order by session id descending (newest first)
    query = query.order_by(Session.session_id.desc())
    
    # Apply pagination
    total_count = query.count()
    sessions = query.offset(offset).limit(limit).all()
    
    session_list = []
    for session in sessions:
        session_dict = session.to_dict()
        if detailed:
            # Add user details
            user = User.query.get(session.user_id)
            if user:
                session_dict['user'] = {
                    'id': user.user_id,
                    'username': user.username,
                    'role': user.role
                }
            
            # Add device details
            device = Device.query.get(session.device_id)
            if device:
                session_dict['device'] = {
                    'id': device.device_id,
                    'name': device.device_name,
                    'ip_address': device.ip_address
                }
        
        session_list.append(session_dict)
    
    return jsonify({
        'sessions': session_list,
        'total': total_count,
        'limit': limit,
        'offset': offset
    }), 200

@sessions_bp.route('/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Get details of a specific session"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    session = Session.query.get(session_id)
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check if the user has permission to view this session
    # Operators can only view their own sessions
    if current_user.is_operator() and session.user_id != current_user.user_id:
        return jsonify({'error': 'You do not have permission to view this session'}), 403
    # Team leads, supervisors and admins can view all sessions
    elif not (current_user.is_team_lead() or current_user.is_supervisor() or current_user.is_admin()):
        return jsonify({'error': 'You do not have permission to view this session'}), 403
    
    session_data = session.to_dict()
    
    # Add device details
    try:
        device = Device.query.get(session.device_id)
        if device:
            session_data['device'] = {
                'id': device.device_id,
                'name': device.device_name,
                'ip_address': device.ip_address,
                'device_type': device.device_type,
                'status': device.status,
                'ssh_port': device.ssh_port,
                'username': device.username,
                'location': device.location,
                'group_id': device.group_id
            }
            
            # Add device group info if available
            if device.group_id:
                from app.models.device import DeviceGroup
                group = DeviceGroup.query.get(device.group_id)
                if group:
                    session_data['device']['group'] = {
                        'id': group.group_id,
                        'name': group.group_name,
                        'description': group.description
                    }
    except Exception as e:
        print(f"Error getting device details: {str(e)}")
    
    # Get command history for this session
    try:
        commands = CommandLog.query.filter_by(session_id=session_id).order_by(CommandLog.executed_at.desc()).all()
        session_data['commands'] = [cmd.to_dict() for cmd in commands]
    except Exception as e:
        print(f"Error getting command history: {str(e)}")
        session_data['commands'] = []
    
    # For operators, include their allowed commands
    allowed_commands = []
    if current_user.is_operator():
        try:
            for profile in current_user.profiles:
                if profile.command_list:
                    for cmd in profile.command_list.commands:
                        allowed_commands.append({
                            'id': cmd.command_id,
                            'command': cmd.command_text,
                            'description': cmd.description,
                            'profile_id': profile.profile_id,
                            'profile_name': profile.profile_name
                        })
        except Exception as e:
            print(f"Error getting allowed commands: {str(e)}")
    
    # Also include the profile that grants access to this device
    if current_user.is_operator() and device:
        try:
            device_profiles = []
            for profile in current_user.profiles:
                if device.group_id == profile.group_id:
                    device_profiles.append({
                        'id': profile.profile_id,
                        'name': profile.profile_name,
                        'description': profile.description,
                        'group_id': profile.group_id,
                        'list_id': profile.list_id
                    })
            if device_profiles:
                session_data['device_profiles'] = device_profiles
        except Exception as e:
            print(f"Error getting device profiles: {str(e)}")
    
    return jsonify({
        'session': session_data,
        'allowed_commands': allowed_commands if current_user.is_operator() else []
    }), 200

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