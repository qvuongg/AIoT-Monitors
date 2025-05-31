from app import db
from datetime import datetime
from sqlalchemy.sql import func

# Note: We're removing the association table as it doesn't exist in the DB schema
# Instead, Command has a direct reference to CommandList via list_id

class CommandList(db.Model):
    __tablename__ = 'command_lists'
    
    list_id = db.Column(db.Integer, primary_key=True)
    list_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by])
    commands = db.relationship('Command', back_populates='command_list', lazy='dynamic')
    
    def __init__(self, list_name, description=None, created_by=None):
        self.list_name = list_name
        self.description = description
        self.created_by = created_by
    
    def to_dict(self):
        return {
            'id': self.list_id,
            'name': self.list_name,
            'description': self.description,
            'command_count': self.commands.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.creator.username if self.creator else None,
            'is_active': self.is_active
        }

class Command(db.Model):
    __tablename__ = 'commands'
    
    command_id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(db.Integer, db.ForeignKey('command_lists.list_id', deferrable=True))
    command_text = db.Column(db.Text, nullable=False)
    description = db.Column(db.String(255))
    is_dangerous = db.Column(db.Boolean, default=False)
    requires_confirmation = db.Column(db.Boolean, default=False)
    is_file_edit = db.Column(db.Boolean, default=False)  # New field for file edit commands
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id', deferrable=True))
    
    # Relationships
    command_list = db.relationship('CommandList', back_populates='commands')
    creator = db.relationship('User', back_populates='created_commands')
    
    def __init__(self, command_text, description=None, is_dangerous=False, 
                 requires_confirmation=False, created_by=None, list_id=None):
        self.command_text = command_text
        self.description = description
        self.is_dangerous = is_dangerous
        self.requires_confirmation = requires_confirmation
        self.created_by = created_by
        self.list_id = list_id
    
    def to_dict(self):
        return {
            'id': self.command_id,
            'list_id': self.list_id,
            'command': self.command_text,
            'description': self.description,
            'is_dangerous': self.is_dangerous,
            'requires_confirmation': self.requires_confirmation,
            'is_file_edit': self.is_file_edit,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.created_by
        } 