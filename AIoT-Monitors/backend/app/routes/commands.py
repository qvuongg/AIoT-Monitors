from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole, UserProfile
from app.models.command import Command, CommandList
from app.models.profile import Profile
from app.models.device import DeviceGroup
from datetime import datetime

commands_bp = Blueprint('commands', __name__)

# Command Routes
@commands_bp.route('', methods=['POST'])
@jwt_required()
def create_command():
    """Create a new command (Team Lead only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
        return jsonify({'error': 'Only admins and team leads can create commands'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'command']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create the new command
    new_command = Command(
        command_text=data['command'],
        description=data.get('description'),
        is_dangerous=data.get('is_dangerous', False),
        requires_confirmation=data.get('requires_confirmation', False),
        created_by=current_user.user_id,
        list_id=data.get('list_id')
    )
    
    db.session.add(new_command)
    db.session.commit()
    
    return jsonify({
        'message': 'Command created successfully',
        'command': new_command.to_dict()
    }), 201

@commands_bp.route('', methods=['GET'])
@jwt_required()
def get_commands():
    """Get all commands"""
    commands = Command.query.all()
    return jsonify({
        'commands': [command.to_dict() for command in commands]
    }), 200

@commands_bp.route('/<int:command_id>', methods=['GET'])
@jwt_required()
def get_command(command_id):
    """Get command by ID"""
    command = Command.query.get(command_id)
    
    if not command:
        return jsonify({'error': 'Command not found'}), 404
    
    return jsonify(command.to_dict()), 200

# Command List Routes
@commands_bp.route('/lists', methods=['POST'])
@jwt_required()
def create_command_list():
    """Create a new command list (Team Lead only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
        return jsonify({'error': 'Only admins and team leads can create command lists'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data or 'name' not in data:
        return jsonify({'error': 'Command list name is required'}), 400
    
    # Check if command list already exists with this name
    if CommandList.query.filter_by(list_name=data['name']).first():
        return jsonify({'error': 'Command list with this name already exists'}), 400
    
    # Create the new command list
    new_list = CommandList(
        list_name=data['name'],
        description=data.get('description'),
        created_by=current_user.user_id
    )
    
    db.session.add(new_list)
    db.session.commit()
    
    return jsonify({
        'message': 'Command list created successfully',
        'command_list': new_list.to_dict()
    }), 201

@commands_bp.route('/lists', methods=['GET'])
@jwt_required()
def get_command_lists():
    """Get all command lists"""
    command_lists = CommandList.query.all()
    return jsonify({
        'command_lists': [command_list.to_dict() for command_list in command_lists]
    }), 200

@commands_bp.route('/lists/<int:list_id>', methods=['GET'])
@jwt_required()
def get_command_list(list_id):
    """Get command list by ID"""
    command_list = CommandList.query.get(list_id)
    
    if not command_list:
        return jsonify({'error': 'Command list not found'}), 404
    
    return jsonify(command_list.to_dict()), 200

@commands_bp.route('/lists/<int:list_id>/commands', methods=['GET'])
@jwt_required()
def get_list_commands(list_id):
    """Get all commands in a list"""
    command_list = CommandList.query.get(list_id)
    
    if not command_list:
        return jsonify({'error': 'Command list not found'}), 404
    
    return jsonify({
        'commands': [command.to_dict() for command in command_list.commands]
    }), 200

@commands_bp.route('/lists/<int:list_id>/commands', methods=['POST'])
@jwt_required()
def add_command_to_list(list_id):
    """Add a command to a list (Team Lead only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
        return jsonify({'error': 'Only admins and team leads can add commands to lists'}), 403
    
    command_list = CommandList.query.get(list_id)
    
    if not command_list:
        return jsonify({'error': 'Command list not found'}), 404
    
    data = request.get_json()
    
    if not data or 'command_id' not in data:
        return jsonify({'error': 'Command ID is required'}), 400
    
    command = Command.query.get(data['command_id'])
    
    if not command:
        return jsonify({'error': 'Command not found'}), 404
    
    # Check if command is already in the list
    if command.list_id == list_id:
        return jsonify({'error': 'Command is already in this list'}), 400
    
    # Update the command's list_id to associate it with this list
    command.list_id = list_id
    db.session.commit()
    
    return jsonify({
        'message': 'Command added to list successfully'
    }), 200

# Profile Routes
@commands_bp.route('/profiles', methods=['POST'])
@jwt_required()
def create_profile():
    """Create a new profile (Team Lead only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
        return jsonify({'error': 'Only admins and team leads can create profiles'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'device_group_id', 'command_list_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if device group exists
    device_group = DeviceGroup.query.get(data['device_group_id'])
    if not device_group:
        return jsonify({'error': 'Device group not found'}), 404
    
    # Check if command list exists
    command_list = CommandList.query.get(data['command_list_id'])
    if not command_list:
        return jsonify({'error': 'Command list not found'}), 404
    
    # Check if profile already exists
    if Profile.query.filter_by(profile_name=data['name']).first():
        return jsonify({'error': 'Profile with this name already exists'}), 400
    
    # Create the new profile
    new_profile = Profile(
        profile_name=data['name'],
        group_id=data['device_group_id'],
        list_id=data['command_list_id'],
        description=data.get('description'),
        created_by=current_user.user_id
    )
    
    db.session.add(new_profile)
    db.session.commit()
    
    return jsonify({
        'message': 'Profile created successfully',
        'profile': new_profile.to_dict()
    }), 201

@commands_bp.route('/profiles', methods=['GET'])
@jwt_required()
def get_profiles():
    """Get all profiles"""
    profiles = Profile.query.all()
    return jsonify({
        'profiles': [profile.to_dict() for profile in profiles]
    }), 200

@commands_bp.route('/profiles/<int:profile_id>', methods=['GET'])
@jwt_required()
def get_profile(profile_id):
    """Get profile by ID"""
    profile = Profile.query.get(profile_id)
    
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    
    return jsonify(profile.to_dict()), 200

@commands_bp.route('/profiles/<int:profile_id>/users', methods=['POST'])
@jwt_required()
def assign_profile_to_user(profile_id):
    """Assign a profile to a user (Team Lead only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
            return jsonify({'error': 'Only admins and team leads can assign profiles to users'}), 403
        
        profile = Profile.query.get(profile_id)
        
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({'error': 'User ID is required'}), 400
        
        user_id = data['user_id']
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user already has this profile with is_active=True
        existing_profile = UserProfile.query.filter_by(
            user_id=user_id, 
            profile_id=profile_id,
            is_active=True
        ).first()
        
        if existing_profile:
            return jsonify({'error': 'User already has this profile'}), 400
        
        # Create new user-profile relationship with tracking info
        user_profile = UserProfile(
            user_id=user_id,
            profile_id=profile_id,
            assigned_at=datetime.utcnow(),
            assigned_by=current_user_id,
            is_active=True
        )
        
        db.session.add(user_profile)
        db.session.commit()
        
        return jsonify({
            'message': 'Profile assigned to user successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@commands_bp.route('/profiles/<int:profile_id>', methods=['PUT'])
@jwt_required()
def update_profile(profile_id):
    """Update a profile (Admin and Team Lead only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
        return jsonify({'error': 'Only admins and team leads can update profiles'}), 403
    
    profile = Profile.query.get(profile_id)
    
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        # Check if new name already exists in other profiles
        existing_profile = Profile.query.filter(Profile.profile_name == data['name'], 
                                                Profile.profile_id != profile_id).first()
        if existing_profile:
            return jsonify({'error': 'Another profile with this name already exists'}), 400
        profile.profile_name = data['name']
        
    if 'description' in data:
        profile.description = data['description']
        
    if 'device_group_id' in data:
        device_group = DeviceGroup.query.get(data['device_group_id'])
        if not device_group:
            return jsonify({'error': 'Device group not found'}), 404
        profile.group_id = data['device_group_id']
        
    if 'command_list_id' in data:
        command_list = CommandList.query.get(data['command_list_id'])
        if not command_list:
            return jsonify({'error': 'Command list not found'}), 404
        profile.list_id = data['command_list_id']
        
    if 'is_active' in data:
        profile.is_active = bool(data['is_active'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'profile': profile.to_dict()
    }), 200

@commands_bp.route('/profiles/<int:profile_id>/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_user_from_profile(profile_id, user_id):
    """Remove a user from a profile (Admin and Team Lead only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
            return jsonify({'error': 'Only admins and team leads can remove users from profiles'}), 403
        
        profile = Profile.query.get(profile_id)
        
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Find active user-profile relationship
        user_profile = UserProfile.query.filter_by(
            user_id=user_id, 
            profile_id=profile_id,
            is_active=True
        ).first()
        
        if not user_profile:
            return jsonify({'error': 'User does not have this profile'}), 400
        
        # Soft delete by setting is_active=False
        user_profile.is_active = False
        db.session.commit()
        
        return jsonify({
            'message': 'User removed from profile successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@commands_bp.route('/profiles/<int:profile_id>/users', methods=['GET'])
@jwt_required()
def get_profile_users(profile_id):
    """Get all users assigned to a profile"""
    profile = Profile.query.get(profile_id)
    
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    
    return jsonify({
        'users': [user.to_dict() for user in profile.users]
    }), 200

@commands_bp.route('/allowed', methods=['GET'])
@jwt_required()
def get_allowed_commands():
    """Lấy danh sách các lệnh được phép cho người dùng hiện tại dựa trên profile được gán"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Admin và Supervisor có thể sử dụng tất cả các lệnh
    if current_user.is_admin() or current_user.is_supervisor() or current_user.is_team_lead():
        commands = Command.query.all()
        return jsonify({
            'commands': [command.to_dict() for command in commands]
        }), 200
    
    # Đối với Operator, chỉ trả về các lệnh từ các profile được gán
    allowed_commands = set()
    
    # Lấy tất cả profile đang hoạt động của người dùng
    for profile in current_user.profiles:
        if profile.is_active and profile.command_list:
            # Thêm tất cả lệnh từ command_list của profile vào tập hợp allowed_commands
            for command in profile.command_list.commands:
                allowed_commands.add(command)
    
    return jsonify({
        'commands': [command.to_dict() for command in allowed_commands]
    }), 200

@commands_bp.route('/profiles/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_profiles(user_id):
    """Get all profiles assigned to a user"""
    try:
        # Get the current user for permission check
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Check permissions (users can view their own profiles, admins and team leads can view any)
        if current_user.user_id != user_id and not (current_user.is_admin() or current_user.is_team_lead()):
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        
        # Get the user to check if it exists and if it's an operator
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Only operators can have profiles (for non-operators, return empty list)
        if user.role != 'operator':
            return jsonify({
                'success': True,
                'count': 0,
                'profiles': [],
                'active_sessions': []
            }), 200
        
        # Get active user profile assignments for this user
        user_profiles = UserProfile.query.filter_by(user_id=user_id, is_active=True).all()
        profile_ids = [up.profile_id for up in user_profiles]
        profiles = Profile.query.filter(Profile.profile_id.in_(profile_ids)).all() if profile_ids else []
        
        # Get active sessions for this user
        from app.models.session import Session
        from app.models.device import Device
        
        active_sessions = []
        sessions = Session.query.filter_by(user_id=user_id, status='active').all()
        
        for session in sessions:
            device = Device.query.get(session.device_id) if session.device_id else None
            active_sessions.append({
                'id': session.session_id,
                'device_name': device.device_name if device else 'Unknown',
                'ip_address': device.ip_address if device else 'Unknown',
                'start_time': session.start_time.isoformat() if session.start_time else None,
                'status': session.status
            })
        
        # Get additional info about device groups and command lists
        profiles_data = []
        for profile in profiles:
            # Get device group info
            device_group = DeviceGroup.query.get(profile.group_id)
            # Get command list info  
            command_list = CommandList.query.get(profile.list_id)
            
            # Get devices in this group
            devices = []
            if device_group:
                from app.models.device import Device
                group_devices = Device.query.filter_by(group_id=profile.group_id, is_active=True).limit(5).all()
                
                for device in group_devices:
                    devices.append({
                        'id': device.device_id,
                        'name': device.device_name,
                        'ip_address': device.ip_address,
                        'status': device.status
                    })
            
            profile_data = {
                'id': profile.profile_id,
                'name': profile.profile_name,
                'description': profile.description,
                'group_id': profile.group_id,
                'group_name': device_group.group_name if device_group else None,
                'list_id': profile.list_id,
                'list_name': command_list.list_name if command_list else None,
                'created_at': profile.created_at.isoformat() if profile.created_at else None,
                'created_by': profile.created_by,
                'is_active': profile.is_active,
                'devices': devices
            }
            profiles_data.append(profile_data)
        
        return jsonify({
            'success': True,
            'count': len(profiles_data),
            'profiles': profiles_data,
            'active_sessions': active_sessions
        }), 200
    except Exception as e:
        print(f"Error in get_user_profiles: {str(e)}")
        return jsonify({'error': str(e)}), 500