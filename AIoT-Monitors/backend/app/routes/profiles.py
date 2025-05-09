from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole, UserProfile
from app.models.profile import Profile
from app.models.device import DeviceGroup
from app.models.command import CommandList
from datetime import datetime

profiles_bp = Blueprint('profiles', __name__)

@profiles_bp.route('', methods=['GET'])
@jwt_required()
def get_profiles():
    """Lấy tất cả profiles"""
    try:
        # Thêm tham số để lọc các profiles đang hoạt động
        active_only = request.args.get('active', 'false').lower() == 'true'
        
        if active_only:
            profiles = Profile.get_active_profiles()
        else:
            profiles = Profile.query.all()
        
        return jsonify({
            'success': True,
            'count': len(profiles),
            'profiles': [profile.to_dict() for profile in profiles]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profiles_bp.route('/<int:profile_id>', methods=['GET'])
@jwt_required()
def get_profile(profile_id):
    """Lấy profile theo ID"""
    try:
        profile = Profile.get_profile_by_id(profile_id)
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Profile không tồn tại'
            }), 404
        
        return jsonify({
            'success': True,
            'profile': profile.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profiles_bp.route('', methods=['POST'])
@jwt_required()
def create_profile():
    """Tạo profile mới (Team Lead)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
            return jsonify({
                'success': False,
                'error': 'Chỉ Admin và Team Lead mới có quyền tạo profile'
            }), 403
        
        data = request.get_json()
        
        # Kiểm tra dữ liệu đầu vào
        required_fields = ['name', 'device_group_id', 'command_list_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Thiếu trường dữ liệu bắt buộc: {field}'
                }), 400
        
        # Kiểm tra device group tồn tại
        device_group = DeviceGroup.query.get(data['device_group_id'])
        if not device_group:
            return jsonify({
                'success': False,
                'error': 'Nhóm thiết bị không tồn tại'
            }), 404
        
        # Kiểm tra command list tồn tại
        command_list = CommandList.query.get(data['command_list_id'])
        if not command_list:
            return jsonify({
                'success': False,
                'error': 'Danh sách lệnh không tồn tại'
            }), 404
        
        # Kiểm tra profile đã tồn tại
        if Profile.query.filter_by(profile_name=data['name']).first():
            return jsonify({
                'success': False,
                'error': 'Profile với tên này đã tồn tại'
            }), 400
        
        # Tạo profile mới
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
            'success': True,
            'message': 'Tạo profile thành công',
            'profile': new_profile.to_dict()
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profiles_bp.route('/<int:profile_id>', methods=['PUT'])
@jwt_required()
def update_profile(profile_id):
    """Cập nhật profile (Admin và Team Lead)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
            return jsonify({
                'success': False,
                'error': 'Chỉ Admin và Team Lead mới có quyền cập nhật profile'
            }), 403
        
        profile = Profile.get_profile_by_id(profile_id)
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Profile không tồn tại'
            }), 404
        
        data = request.get_json()
        
        if 'name' in data:
            # Kiểm tra tên mới đã tồn tại ở các profiles khác chưa
            existing_profile = Profile.query.filter(
                Profile.profile_name == data['name'], 
                Profile.profile_id != profile_id
            ).first()
            
            if existing_profile:
                return jsonify({
                    'success': False,
                    'error': 'Tên profile đã tồn tại'
                }), 400
                
            profile.profile_name = data['name']
            
        if 'description' in data:
            profile.description = data['description']
            
        if 'device_group_id' in data:
            device_group = DeviceGroup.query.get(data['device_group_id'])
            if not device_group:
                return jsonify({
                    'success': False,
                    'error': 'Nhóm thiết bị không tồn tại'
                }), 404
                
            profile.group_id = data['device_group_id']
            
        if 'command_list_id' in data:
            command_list = CommandList.query.get(data['command_list_id'])
            if not command_list:
                return jsonify({
                    'success': False,
                    'error': 'Danh sách lệnh không tồn tại'
                }), 404
                
            profile.list_id = data['command_list_id']
            
        if 'is_active' in data:
            profile.is_active = bool(data['is_active'])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Cập nhật profile thành công',
            'profile': profile.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profiles_bp.route('/<int:profile_id>', methods=['DELETE'])
@jwt_required()
def delete_profile(profile_id):
    """Xóa profile (chỉ Admin)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_admin():
            return jsonify({
                'success': False,
                'error': 'Chỉ Admin mới có quyền xóa profile'
            }), 403
        
        profile = Profile.get_profile_by_id(profile_id)
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Profile không tồn tại'
            }), 404
        
        # Kiểm tra xem profile có đang được sử dụng không
        has_active_users = UserProfile.query.filter_by(profile_id=profile_id, is_active=True).count() > 0
        
        if has_active_users:
            # Thay vì xóa, đánh dấu là không hoạt động
            profile.is_active = False
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Profile đã được đánh dấu không hoạt động vì đang được gán cho người dùng'
            }), 200
        else:
            # Xóa profile nếu không có người dùng nào được gán
            db.session.delete(profile)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Đã xóa profile thành công'
            }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profiles_bp.route('/<int:profile_id>/users', methods=['GET'])
@jwt_required()
def get_profile_users(profile_id):
    """Lấy danh sách người dùng được gán profile"""
    try:
        profile = Profile.get_profile_by_id(profile_id)
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Profile không tồn tại'
            }), 404
        
        return jsonify({
            'success': True,
            'count': len(profile.users),
            'users': [user.to_dict() for user in profile.users]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profiles_bp.route('/<int:profile_id>/users', methods=['POST'])
@jwt_required()
def assign_profile_to_user(profile_id):
    """Gán profile cho user (Admin và Team Lead)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Kiểm tra quyền
        if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
            return jsonify({
                'success': False,
                'error': 'Chỉ Admin và Team Lead mới có quyền gán profile cho user'
            }), 403
        
        # Kiểm tra profile tồn tại
        profile = Profile.get_profile_by_id(profile_id)
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Profile không tồn tại'
            }), 404
        
        data = request.get_json()
        
        # Kiểm tra dữ liệu đầu vào
        if 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'Thiếu thông tin user_id'
            }), 400
            
        user_id = data['user_id']
        
        # Kiểm tra user tồn tại
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User không tồn tại'
            }), 404
            
        # Kiểm tra user có phải là Operator không
        if user.role != UserRole.OPERATOR:
            return jsonify({
                'success': False,
                'error': 'Chỉ có thể gán profile cho Operator'
            }), 400
            
        # Kiểm tra xem user đã có profile này chưa
        existing_profile = UserProfile.query.filter_by(
            user_id=user_id, 
            profile_id=profile_id,
            is_active=True
        ).first()
        
        if existing_profile:
            return jsonify({
                'success': False,
                'error': 'User đã được gán profile này'
            }), 400
            
        # Tạo mối quan hệ user-profile mới với tracking information
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
            'success': True,
            'message': f'User {user.email} đã được gán profile {profile.profile_name}'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profiles_bp.route('/<int:profile_id>/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_user_from_profile(profile_id, user_id):
    """Xóa user khỏi profile (Admin và Team Lead)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Kiểm tra quyền
        if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
            return jsonify({
                'success': False,
                'error': 'Chỉ Admin và Team Lead mới có quyền xóa user khỏi profile'
            }), 403
        
        # Kiểm tra profile tồn tại
        profile = Profile.get_profile_by_id(profile_id)
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Profile không tồn tại'
            }), 404
        
        # Kiểm tra user tồn tại
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User không tồn tại'
            }), 404
            
        # Kiểm tra xem user có profile này không
        user_profile = UserProfile.query.filter_by(
            user_id=user_id, 
            profile_id=profile_id,
            is_active=True
        ).first()
        
        if not user_profile:
            return jsonify({
                'success': False,
                'error': 'User chưa được gán profile này'
            }), 404
        
        # Thay vì xóa quan hệ, chỉ đánh dấu là không còn active
        user_profile.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'User {user.email} đã được xóa khỏi profile {profile.profile_name}'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 