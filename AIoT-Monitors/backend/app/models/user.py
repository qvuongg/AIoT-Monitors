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

# User-Profile association table
user_profiles = db.Table('user_profiles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.user_id'), primary_key=True),
    db.Column('profile_id', db.Integer, db.ForeignKey('profiles.profile_id'), primary_key=True)
)

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
    profiles = db.relationship('Profile', secondary=user_profiles, lazy='subquery',
                          backref=db.backref('users', lazy=True))
    
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