from app import db
from datetime import datetime

class Profile(db.Model):
    __tablename__ = 'profiles'
    
    profile_id = db.Column(db.Integer, primary_key=True)
    profile_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    group_id = db.Column(db.Integer, db.ForeignKey('device_groups.group_id'), nullable=False)
    list_id = db.Column(db.Integer, db.ForeignKey('command_lists.list_id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by])
    device_group = db.relationship('DeviceGroup', foreign_keys=[group_id])
    command_list = db.relationship('CommandList', foreign_keys=[list_id])
    
    def __init__(self, profile_name, group_id, list_id, description=None, created_by=None):
        self.profile_name = profile_name
        self.group_id = group_id
        self.list_id = list_id
        self.description = description
        self.created_by = created_by
    
    def to_dict(self):
        return {
            'id': self.profile_id,
            'name': self.profile_name,
            'description': self.description,
            'group_id': self.group_id,
            'group_name': self.device_group.group_name if self.device_group else None,
            'list_id': self.list_id,
            'list_name': self.command_list.list_name if self.command_list else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.creator.username if self.creator else None,
            'is_active': self.is_active
        }
    
    @classmethod
    def get_active_profiles(cls):
        """Get all active profiles"""
        return cls.query.filter_by(is_active=True).all()
    
    @classmethod
    def get_profile_by_id(cls, profile_id):
        """Get a profile by ID"""
        return cls.query.get(profile_id) 