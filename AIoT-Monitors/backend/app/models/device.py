from app import db
from datetime import datetime
from app.models.user import User

class DeviceStatus:
    ONLINE = 'online'
    OFFLINE = 'offline'
    UNKNOWN = 'unknown'
    MAINTENANCE = 'maintenance'
    
    @classmethod
    def all_statuses(cls):
        return [cls.ONLINE, cls.OFFLINE, cls.UNKNOWN, cls.MAINTENANCE]

class DeviceGroup(db.Model):
    __tablename__ = 'device_groups'
    
    group_id = db.Column(db.Integer, primary_key=True)
    group_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by])
    devices = db.relationship('Device', backref='group', lazy='dynamic')
    
    def __init__(self, group_name, description=None, created_by=None):
        self.group_name = group_name
        self.description = description
        self.created_by = created_by
    
    def to_dict(self):
        return {
            'id': self.group_id,
            'name': self.group_name,
            'description': self.description,
            'device_count': self.devices.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.creator.username if self.creator else None,
            'is_active': self.is_active
        }

class Device(db.Model):
    __tablename__ = 'devices'
    
    device_id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('device_groups.group_id'))
    device_name = db.Column(db.String(100), nullable=False)
    ip_address = db.Column(db.String(45), nullable=False)
    device_type = db.Column(db.String(50), nullable=False)
    ssh_port = db.Column(db.Integer, default=22)
    username = db.Column(db.String(50))
    password = db.Column(db.String(100))
    authentication_method = db.Column(db.String(20), default='key')
    last_checked_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='unknown')
    location = db.Column(db.String(100))
    customer_id = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by])
    assigner = db.relationship('User', foreign_keys=[assigned_by])
    sessions = db.relationship('Session', backref='device', lazy='dynamic')
    
    def __init__(self, device_name, ip_address, device_type, 
                 ssh_port=22, username=None, password=None, authentication_method='key', created_by=None, 
                 group_id=None, location=None, customer_id=None, assigned_by=None):
        self.device_name = device_name
        self.ip_address = ip_address
        self.device_type = device_type
        self.ssh_port = ssh_port
        self.username = username
        self.password = password
        self.authentication_method = authentication_method
        self.created_by = created_by
        self.group_id = group_id
        self.location = location
        self.customer_id = customer_id
        self.assigned_by = assigned_by
    
    def to_dict(self):
        try:
            group_name = None
            if self.group:
                group_name = self.group.group_name
                
            creator_name = None
            if self.creator:
                creator_name = self.creator.username
                
            assigner_name = None
            if self.assigner:
                assigner_name = self.assigner.username
                
            # Đảm bảo dữ liệu thời gian là hợp lệ
            created_at_str = None
            if self.created_at:
                try:
                    created_at_str = self.created_at.isoformat()
                except:
                    created_at_str = str(self.created_at)

            last_checked_at_str = None
            if self.last_checked_at:
                try:
                    last_checked_at_str = self.last_checked_at.isoformat()
                except:
                    last_checked_at_str = str(self.last_checked_at)
                    
            # Trả về cấu trúc dữ liệu tương ứng với frontend
            return {
                'id': self.device_id,
                'name': self.device_name,
                'ip_address': self.ip_address,
                'device_type': self.device_type,
                'ssh_port': self.ssh_port,
                'username': self.username,
                'status': self.status,
                'location': self.location,
                'customer_id': self.customer_id,
                'group_id': self.group_id,
                'group_name': group_name,
                'created_at': created_at_str,
                'created_by': creator_name,
                'assigned_by': assigner_name,
                'is_active': self.is_active,
                'last_checked_at': last_checked_at_str
            }
        except Exception as e:
            # Trường hợp có lỗi, trả về dữ liệu tối thiểu
            print(f"Error in Device.to_dict: {str(e)}")
            return {
                'id': self.device_id,
                'name': self.device_name,
                'ip_address': self.ip_address,
                'device_type': self.device_type
            } 