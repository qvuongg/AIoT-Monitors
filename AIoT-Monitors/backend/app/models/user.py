from app import db
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class UserRole:
    ADMIN = 'admin'
    TEAM_LEAD = 'team_lead'
    SUPERVISOR = 'supervisor'
    OPERATOR = 'operator'
    
    @classmethod
    def all_roles(cls):
        return [cls.ADMIN, cls.TEAM_LEAD, cls.SUPERVISOR, cls.OPERATOR]

# Remove the association table since we're using the UserProfile model

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    assignment_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    profile_id = db.Column(db.Integer, db.ForeignKey('profiles.profile_id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('profile_assignments', lazy='dynamic'))
    profile = db.relationship('Profile', backref=db.backref('user_assignments', lazy='dynamic'))
    assigner = db.relationship('User', foreign_keys=[assigned_by])
    
    def __init__(self, user_id, profile_id, assigned_by=None, assigned_at=None, is_active=True):
        self.user_id = user_id
        self.profile_id = profile_id
        self.assigned_by = assigned_by
        if assigned_at:
            self.assigned_at = assigned_at
        self.is_active = is_active

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    sessions = db.relationship('Session', backref='user', lazy='dynamic', foreign_keys='Session.user_id')
    created_commands = db.relationship('Command', back_populates='creator', foreign_keys='Command.created_by')
    
    # Updated to use profiles through UserProfile model instead of association table
    @property
    def profiles(self):
        active_assignments = UserProfile.query.filter_by(user_id=self.user_id, is_active=True).all()
        return [assignment.profile for assignment in active_assignments]
    
    def __init__(self, username, email, password=None, password_hash=None, role=None, phone=None):
        self.username = username
        self.email = email
        if password:
            self.set_password(password)
        elif password_hash:
            self.password_hash = password_hash
        self.role = role
        self.phone = phone
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_id(self):
        return str(self.user_id)
    
    def is_admin(self):
        return self.role == UserRole.ADMIN
    
    def is_team_lead(self):
        return self.role == UserRole.TEAM_LEAD
    
    def is_supervisor(self):
        return self.role == UserRole.SUPERVISOR
    
    def is_operator(self):
        return self.role == UserRole.OPERATOR
        
    def to_dict(self):
        return {
            'id': self.user_id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        } 