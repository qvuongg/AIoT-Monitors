from app import create_app, db
from app.models.device import Device, DeviceGroup
from app.models.user import User, UserRole

def update_docker_devices():
    """Cập nhật thông tin các thiết bị Docker vào database"""
    app = create_app()
    
    with app.app_context():
        # Tìm hoặc tạo admin user
        admin = User.query.filter_by(role=UserRole.ADMIN).first()
        if not admin:
            print("Admin user not found!")
            return
        
        # Tìm hoặc tạo nhóm thiết bị Docker
        docker_group = DeviceGroup.query.filter_by(group_name="Docker Devices").first()
        if not docker_group:
            docker_group = DeviceGroup(
                group_name="Docker Devices",
                description="Docker containers running as SSH devices",
                created_by=admin.user_id
            )
            db.session.add(docker_group)
            db.session.commit()
        
        # Danh sách các thiết bị Docker
        docker_devices = [
            {
                "name": "Core Router 01",
                "ip_address": "localhost",
                "device_type": "router",
                "ssh_port": 2201,
                "username": "admin",
                "password": "secure_router_pwd123",
                "authentication_method": "password"
            },
            {
                "name": "My Docker Device 1",
                "ip_address": "localhost",
                "device_type": "server",
                "ssh_port": 2221,
                "username": "operator",
                "password": "operator_password",
                "authentication_method": "password"
            },
            {
                "name": "Dist Switch 01",
                "ip_address": "localhost",
                "device_type": "switch",
                "ssh_port": 2202,
                "username": "netadmin",
                "password": "sw1tch_adm1n_pwd",
                "authentication_method": "password"
            },
            {
                "name": "WebServer Prod 01",
                "ip_address": "localhost",
                "device_type": "server",
                "ssh_port": 2203,
                "username": "webadmin",
                "password": "WebServer#123",
                "authentication_method": "password"
            },
            {
                "name": "DB Server Prod 01",
                "ip_address": "localhost",
                "device_type": "server",
                "ssh_port": 2204,
                "username": "dbadmin",
                "password": "DBServer@456",
                "authentication_method": "password"
            },
            {
                "name": "Edge Gateway 01",
                "ip_address": "localhost",
                "device_type": "gateway",
                "ssh_port": 2205,
                "username": "edgeadmin",
                "password": "3dge_Dev1ce!",
                "authentication_method": "password"
            },
            {
                "name": "Edge Processor 01",
                "ip_address": "localhost",
                "device_type": "processor",
                "ssh_port": 2206,
                "username": "aiuser",
                "password": "ML_Pr0c3ss1ng",
                "authentication_method": "password"
            },
            {
                "name": "Firewall External 01",
                "ip_address": "localhost",
                "device_type": "firewall",
                "ssh_port": 2207,
                "username": "secadmin",
                "password": "F1r3w@ll_Adm1n",
                "authentication_method": "password"
            },
            {
                "name": "IDS System 01",
                "ip_address": "localhost",
                "device_type": "ids",
                "ssh_port": 2208,
                "username": "idsadmin",
                "password": "1nTru$10n_D3t3ct",
                "authentication_method": "password"
            },
            {
                "name": "Dev Test Server 01",
                "ip_address": "localhost",
                "device_type": "server",
                "ssh_port": 2222,
                "username": "devtester",
                "password": "DevTest@2025",
                "authentication_method": "password"
            }
        ]
        
        # Cập nhật hoặc tạo mới các thiết bị
        for device_data in docker_devices:
            device = Device.query.filter_by(device_name=device_data["name"]).first()
            
            if device:
                # Cập nhật thông tin thiết bị
                device.ip_address = device_data["ip_address"]
                device.ssh_port = device_data["ssh_port"]
                device.username = device_data["username"]
                device.password = device_data["password"]
                device.authentication_method = device_data["authentication_method"]
                device.group_id = docker_group.group_id
                print(f"Updated device: {device_data['name']}")
            else:
                # Tạo thiết bị mới
                device = Device(
                    device_name=device_data["name"],
                    ip_address=device_data["ip_address"],
                    device_type=device_data["device_type"],
                    ssh_port=device_data["ssh_port"],
                    username=device_data["username"],
                    password=device_data["password"],
                    authentication_method=device_data["authentication_method"],
                    group_id=docker_group.group_id,
                    created_by=admin.user_id
                )
                db.session.add(device)
                print(f"Created new device: {device_data['name']}")
        
        # Lưu thay đổi
        db.session.commit()
        print("Docker devices updated successfully!")

if __name__ == "__main__":
    update_docker_devices() 