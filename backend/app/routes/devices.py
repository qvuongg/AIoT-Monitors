from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.device import Device, DeviceGroup
import traceback

devices_bp = Blueprint('devices', __name__)

# Device Group Routes
@devices_bp.route('/groups', methods=['POST'])
@jwt_required()
def create_device_group():
    """Create a new device group (Admin or Team Lead)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
        return jsonify({'error': 'Only admins and team leads can create device groups'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data or 'name' not in data:
        return jsonify({'error': 'Device group name is required'}), 400
    
    # Check if device group already exists
    if DeviceGroup.query.filter_by(group_name=data['name']).first():
        return jsonify({'error': 'Device group with this name already exists'}), 400
    
    # Create the new device group
    new_group = DeviceGroup(
        group_name=data['name'],
        description=data.get('description'),
        created_by=current_user.user_id
    )
    
    db.session.add(new_group)
    db.session.commit()
    
    return jsonify({
        'message': 'Device group created successfully',
        'device_group': new_group.to_dict()
    }), 201

@devices_bp.route('/groups', methods=['GET'])
@jwt_required()
def get_device_groups():
    """Get all device groups"""
    device_groups = DeviceGroup.query.all()
    return jsonify({
        'device_groups': [group.to_dict() for group in device_groups]
    }), 200

@devices_bp.route('/groups/<int:group_id>', methods=['GET'])
@jwt_required()
def get_device_group(group_id):
    """Get device group by ID"""
    group = DeviceGroup.query.get(group_id)
    
    if not group:
        return jsonify({'error': 'Device group not found'}), 404
    
    return jsonify(group.to_dict()), 200

@devices_bp.route('/groups/<int:group_id>/devices', methods=['GET'])
@jwt_required()
def get_group_devices(group_id):
    """Get all devices in a group"""
    group = DeviceGroup.query.get(group_id)
    
    if not group:
        return jsonify({'error': 'Device group not found'}), 404
    
    return jsonify({
        'devices': [device.to_dict() for device in group.devices]
    }), 200

@devices_bp.route('/groups/<int:group_id>/devices', methods=['POST'])
@jwt_required()
def add_device_to_group(group_id):
    """Add a device to a group (Admin or Team Lead)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
        return jsonify({'error': 'Only admins and team leads can add devices to groups'}), 403
    
    group = DeviceGroup.query.get(group_id)
    
    if not group:
        return jsonify({'error': 'Device group not found'}), 404
    
    data = request.get_json()
    
    if not data or 'device_id' not in data:
        return jsonify({'error': 'Device ID is required'}), 400
    
    device = Device.query.get(data['device_id'])
    
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    # Check if device is already in the group
    if device.group_id == group_id:
        return jsonify({'error': 'Device is already in this group'}), 400
    
    # Quyền gán thiết bị:
    # - Admin: gán lại bất kỳ thiết bị nào
    # - Team Lead: chỉ gán thiết bị chưa thuộc group nào (group_id is None)
    if current_user.is_team_lead() and device.group_id is not None:
        return jsonify({'error': 'Team Lead chỉ được gán thiết bị chưa thuộc group nào'}), 403
    
    # Cập nhật thông tin nhóm và người gán
    device.group_id = group_id
    device.assigned_by = current_user.user_id
    db.session.commit()
    
    return jsonify({
        'message': 'Device added to group successfully',
        'device': device.to_dict()
    }), 200

# Device Routes
@devices_bp.route('', methods=['POST'])
@jwt_required()
def create_device():
    """Create a new device (Admin or Team Lead)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not (current_user.is_admin() or current_user.is_team_lead()):
        return jsonify({'error': 'Only admins and team leads can create devices'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'ip_address', 'device_type']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create the new device
    new_device = Device(
        device_name=data['name'],
        ip_address=data['ip_address'],
        device_type=data['device_type'],
        ssh_port=data.get('ssh_port', 22),
        username=data.get('username'),
        authentication_method=data.get('authentication_method', 'key'),
        group_id=data.get('group_id'),  # Optional group_id
        location=data.get('location'),
        customer_id=data.get('customer_id'),
        created_by=current_user.user_id
    )
    
    db.session.add(new_device)
    db.session.commit()
    
    return jsonify({
        'message': 'Device created successfully',
        'device': new_device.to_dict()
    }), 201

@devices_bp.route('', methods=['GET'])
@jwt_required()
def get_devices():
    """Get all devices"""
    try:
        # Lấy danh sách thiết bị từ database
        devices = Device.query.all()
        
        # Chuẩn bị danh sách thiết bị để trả về
        device_list = []
        
        # Xử lý từng thiết bị, bắt các ngoại lệ có thể xảy ra
        for device in devices:
            try:
                # Lấy thông tin cơ bản của thiết bị
                device_data = device.to_dict()  # Sử dụng to_dict() để lấy tất cả thông tin
                device_list.append(device_data)
            except Exception as e:
                print(f"Error processing device {device.device_id}: {str(e)}")
                # Trong trường hợp có lỗi, vẫn trả về thông tin cơ bản
                device_list.append({
                    'id': device.device_id,
                    'name': device.device_name,
                    'ip_address': device.ip_address,
                    'device_type': device.device_type
                })
        
        return jsonify({
            'devices': device_list
        }), 200
    except Exception as e:
        # Log error details for debugging
        print(f"Error in get_devices: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'error': f'Failed to retrieve devices: {str(e)}',
            'devices': []
        }), 500

@devices_bp.route('/<int:device_id>', methods=['GET'])
@jwt_required()
def get_device(device_id):
    """Get device by ID"""
    try:
        device = Device.query.get(device_id)
        
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        
        # Lấy dữ liệu thiết bị cơ bản
        device_data = {
            'id': device.device_id,
            'name': device.device_name,
            'ip_address': device.ip_address,
            'device_type': device.device_type,
            'ssh_port': device.ssh_port,
            'username': device.username,
            'status': device.status if hasattr(device, 'status') else 'unknown',
            'location': device.location,
            'customer_id': device.customer_id,
            'group_id': device.group_id,
            'is_active': device.is_active
        }
        
        # Thêm thông tin về group nếu có
        if device.group_id:
            try:
                group = DeviceGroup.query.get(device.group_id)
                if group:
                    device_data['group_name'] = group.group_name
            except:
                pass
        
        return jsonify(device_data), 200
    except Exception as e:
        print(f"Error in get_device: {str(e)}")
        return jsonify({'error': f'Error retrieving device: {str(e)}'}), 500

@devices_bp.route('/unassigned', methods=['GET'])
@jwt_required()
def get_unassigned_devices():
    """Get all devices that have not been assigned to any group or can be reassigned by admin"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Lấy danh sách thiết bị dựa trên quyền của người dùng
        if current_user.is_admin():
            # Admin có thể xem tất cả thiết bị để gán lại
            devices = Device.query.all()
        else:
            # Team Lead chỉ có thể xem thiết bị chưa được gán (assigned_by is NULL)
            devices = Device.query.filter(Device.assigned_by == None).all()
        
        # Chuẩn bị danh sách thiết bị để trả về
        device_list = []
        
        # Xử lý từng thiết bị
        for device in devices:
            try:
                device_data = {
                    'id': device.device_id,
                    'name': device.device_name,
                    'ip_address': device.ip_address,
                    'device_type': device.device_type,
                    'ssh_port': device.ssh_port,
                    'username': device.username,
                    'status': device.status if hasattr(device, 'status') else 'unknown',
                    'created_by': device.created_by,
                    'assigned_by': device.assigned_by,
                    'group_id': device.group_id
                }
                device_list.append(device_data)
            except Exception as e:
                print(f"Error processing device {device.device_id}: {str(e)}")
                device_list.append({
                    'id': device.device_id,
                    'name': device.device_name,
                    'ip_address': device.ip_address,
                    'device_type': device.device_type
                })
        
        return jsonify({
            'devices': device_list
        }), 200
    except Exception as e:
        print(f"Error in get_unassigned_devices: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'error': f'Failed to retrieve unassigned devices: {str(e)}',
            'devices': []
        }), 500 