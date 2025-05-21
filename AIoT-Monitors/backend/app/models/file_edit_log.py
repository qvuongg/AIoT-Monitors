from app import db
from datetime import datetime, UTC

class FileEditLog(db.Model):
    __tablename__ = 'file_edit_logs'
    __table_args__ = {'extend_existing': True}
    
    log_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('sessions.session_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    device_id = db.Column(db.Integer, db.ForeignKey('devices.device_id'))
    file_path = db.Column(db.Text, nullable=False)
    edit_type = db.Column(db.String(20), nullable=False)  # create, modify, delete
    edit_started_at = db.Column(db.DateTime, default=datetime.now(UTC))
    edit_finished_at = db.Column(db.DateTime)
    content_before = db.Column(db.Text)
    content_after = db.Column(db.Text)
    diff = db.Column(db.Text)
    
    def __init__(self, session_id, file_path, edit_type, user_id=None, device_id=None,
                content_before=None, content_after=None, diff=None):
        self.session_id = session_id
        self.file_path = file_path
        self.edit_type = edit_type
        self.user_id = user_id
        self.device_id = device_id
        self.content_before = content_before
        self.content_after = content_after
        self.diff = diff
        self.edit_started_at = datetime.now(UTC)
    
    def to_dict(self):
        try:
            edit_started_at_str = None
            edit_finished_at_str = None
            
            if self.edit_started_at:
                try:
                    edit_started_at_str = self.edit_started_at.isoformat()
                except:
                    edit_started_at_str = str(self.edit_started_at)
                    
            if self.edit_finished_at:
                try:
                    edit_finished_at_str = self.edit_finished_at.isoformat()
                except:
                    edit_finished_at_str = str(self.edit_finished_at)
            
            return {
                'log_id': self.log_id,
                'session_id': self.session_id,
                'user_id': self.user_id,
                'device_id': self.device_id,
                'file_path': self.file_path,
                'edit_type': self.edit_type,
                'edit_started_at': edit_started_at_str,
                'edit_finished_at': edit_finished_at_str,
                'content_before': self.content_before,
                'content_after': self.content_after,
                'diff': self.diff
            }
        except Exception as e:
            print(f"Error in FileEditLog.to_dict: {str(e)}")
            return {
                'log_id': self.log_id,
                'session_id': self.session_id,
                'file_path': self.file_path,
                'edit_type': self.edit_type
            }