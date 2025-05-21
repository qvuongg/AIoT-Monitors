from flask import Blueprint, jsonify, request
from app.utils.auth import token_required
from app.models.profile import Profile
from app.models.user import User, UserProfile
from app.models.device_group import DeviceGroup
from app.models.command_list import CommandList
from app import db

user_profiles_bp = Blueprint('user_profiles', __name__)

@user_profiles_bp.route('/api/users/me/profiles', methods=['GET'])
@token_required
def get_current_user_profiles(current_user):
    """
    Lấy danh sách profiles của người dùng hiện tại
    """
    try:
        return get_user_profiles(current_user, current_user.user_id)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@user_profiles_bp.route('/api/users/<int:user_id>/profiles', methods=['GET'])
@token_required
def get_user_profiles(current_user, user_id):
    """
    Lấy danh sách profiles được gán cho user
    """
    # Kiểm tra quyền truy cập: chỉ admin, team lead hoặc chính user đó mới có thể xem
    if current_user.user_id != user_id and current_user.role not in ['admin', 'team_lead']:
        return jsonify({
            'success': False,
            'error': 'Không có quyền truy cập'
        }), 403
    
    try:
        # Lấy user từ database
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy user'
            }), 404
        
        # Chỉ operator mới được gán profile
        if user.role != 'operator' and current_user.role not in ['admin', 'team_lead']:
            return jsonify({
                'success': False,
                'error': 'Chỉ có operator mới được gán profile'
            }), 403
        
        # Lấy danh sách profiles được gán cho user
        user_profiles = UserProfile.query.filter_by(user_id=user_id, is_active=True).all()
        profile_ids = [up.profile_id for up in user_profiles]
        profiles = Profile.query.filter(Profile.profile_id.in_(profile_ids)).all() if profile_ids else []
        
        # Lấy thêm thông tin về device_group và command_list cho mỗi profile
        profiles_data = []
        for profile in profiles:
            # Lấy thông tin device_group
            device_group = DeviceGroup.query.get(profile.group_id)
            # Lấy thông tin command_list
            command_list = CommandList.query.get(profile.list_id)
            
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
                'is_active': profile.is_active
            }
            profiles_data.append(profile_data)
        
        return jsonify({
            'success': True,
            'count': len(profiles_data),
            'profiles': profiles_data
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@user_profiles_bp.route('/api/user-profiles', methods=['POST'])
@token_required
def assign_profile_to_user(current_user):
    """
    Gán profile cho user
    """
    # Kiểm tra quyền truy cập: chỉ admin và team lead mới có thể gán profile
    if current_user.role not in ['admin', 'team_lead']:
        return jsonify({
            'success': False,
            'error': 'Không có quyền truy cập'
        }), 403
    
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        profile_id = data.get('profile_id')
        
        if not user_id or not profile_id:
            return jsonify({
                'success': False,
                'error': 'Thiếu thông tin user_id hoặc profile_id'
            }), 400
        
        # Kiểm tra user có tồn tại không
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy user'
            }), 404
        
        # Kiểm tra user có phải là operator không
        if user.role != 'operator':
            return jsonify({
                'success': False,
                'error': 'Chỉ có operator mới được gán profile'
            }), 400
            
        # Kiểm tra profile có tồn tại không
        profile = Profile.query.get(profile_id)
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy profile'
            }), 404
        
        # Kiểm tra đã tồn tại user profile chưa
        existing_user_profile = UserProfile.query.filter_by(
            user_id=user_id, 
            profile_id=profile_id,
            is_active=True
        ).first()
        
        if existing_user_profile:
            return jsonify({
                'success': False,
                'error': 'User đã được gán profile này rồi'
            }), 400
        
        # Tạo mới user profile
        user_profile = UserProfile(
            user_id=user_id,
            profile_id=profile_id,
            assigned_by=current_user.user_id
        )
        
        db.session.add(user_profile)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Đã gán profile {profile.profile_name} cho user {user.username}',
            'user_profile': {
                'assignment_id': user_profile.assignment_id,
                'user_id': user_profile.user_id,
                'profile_id': user_profile.profile_id,
                'assigned_at': user_profile.assigned_at.isoformat() if user_profile.assigned_at else None,
                'assigned_by': current_user.username,
                'is_active': user_profile.is_active
            }
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@user_profiles_bp.route('/api/user-profiles/<int:user_id>/<int:profile_id>', methods=['DELETE'])
@token_required
def remove_profile_from_user(current_user, user_id, profile_id):
    """
    Xóa profile khỏi user
    """
    # Kiểm tra quyền truy cập: chỉ admin và team lead mới có thể xóa profile
    if current_user.role not in ['admin', 'team_lead']:
        return jsonify({
            'success': False,
            'error': 'Không có quyền truy cập'
        }), 403
    
    try:
        # Kiểm tra user có tồn tại không
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy user'
            }), 404
        
        # Kiểm tra user có phải là operator không
        if user.role != 'operator':
            return jsonify({
                'success': False,
                'error': 'Chỉ có operator mới được gán profile'
            }), 400
        
        # Tìm user profile
        user_profile = UserProfile.query.filter_by(
            user_id=user_id,
            profile_id=profile_id,
            is_active=True
        ).first()
        
        if not user_profile:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy profile được gán cho user này'
            }), 404
        
        # Đánh dấu user profile là không hoạt động
        user_profile.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Đã xóa profile khỏi user {user.username}'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500