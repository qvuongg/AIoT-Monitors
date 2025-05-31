from app import db
from datetime import datetime
from pytz import UTC

class FileEditLog(db.Model):
    __tablename__ = 'file_edit_logs'
    __table_args__ = {'extend_existing': True}
    
    log_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('sessions.session_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    device_id = db.Column(db.Integer, db.ForeignKey('devices.device_id'))
    file_path = db.Column(db.Text, nullable=False)
    edit_type = db.Column(db.String(20), nullable=False)  # create, modify, delete
    edit_started_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(UTC))
    edit_finished_at = db.Column(db.DateTime(timezone=True))
    content_before = db.Column(db.Text)
    content_after = db.Column(db.Text)
    diff = db.Column(db.Text)
    
    # Relationships
    session = db.relationship('Session', backref='file_edits')
    user = db.relationship('User', backref='file_edits')
    device = db.relationship('Device', backref='file_edits')
    
    def __init__(self, session_id, user_id, device_id, file_path, edit_type,
                 content_before=None, content_after=None, diff=None):
        self.session_id = session_id
        self.user_id = user_id
        self.device_id = device_id
        self.file_path = file_path
        self.edit_type = edit_type
        self.content_before = content_before
        self.content_after = content_after
        self.diff = diff
        self.edit_started_at = datetime.now(UTC)
        self.edit_finished_at = datetime.now(UTC)
    
    def to_dict(self):
        return {
            'id': self.log_id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'device_id': self.device_id,
            'file_path': self.file_path,
            'edit_type': self.edit_type,
            'edit_started_at': self.edit_started_at.isoformat() if self.edit_started_at else None,
            'edit_finished_at': self.edit_finished_at.isoformat() if self.edit_finished_at else None,
            'content_before': self.content_before,
            'content_after': self.content_after,
            'diff': self.diff,
            'user': self.user.username if self.user else None,
            'device': {
                'id': self.device.device_id,
                'name': self.device.device_name,
                'ip_address': self.device.ip_address
            } if self.device else None
        }