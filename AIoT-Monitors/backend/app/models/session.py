from app import db
from datetime import datetime, timedelta

class SessionStatus:
    ACTIVE = 'active'
    COMPLETED = 'completed'
    TERMINATED = 'terminated'
    FAILED = 'failed'
    
    @classmethod
    def all_statuses(cls):
        return [cls.ACTIVE, cls.COMPLETED, cls.TERMINATED, cls.FAILED]

class Session(db.Model):
    __tablename__ = 'sessions'
    
    session_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    device_id = db.Column(db.Integer, db.ForeignKey('devices.device_id'), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    status = db.Column(db.String(20), nullable=False, default=SessionStatus.ACTIVE)
    terminated_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    
    # Relationships
    command_logs = db.relationship('CommandLog', backref='session', lazy='dynamic')
    
    def __init__(self, user_id, device_id, ip_address=None, user_agent=None):
        self.user_id = user_id
        self.device_id = device_id
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.status = SessionStatus.ACTIVE
        self.start_time = datetime.utcnow()
    
    def end_session(self, status=SessionStatus.COMPLETED, terminated_by=None):
        self.status = status
        self.end_time = datetime.utcnow()
        self.terminated_by = terminated_by
    
    def to_dict(self):
        try:
            # Lấy thông tin user và device một cách an toàn
            user_name = None
            try:
                if hasattr(self, 'user') and self.user:
                    user_name = self.user.username
            except Exception as e:
                print(f"Error getting username for session {self.session_id}: {str(e)}")
                
            device_name = None
            try:
                if hasattr(self, 'device') and self.device:
                    device_name = self.device.device_name
            except Exception as e:
                print(f"Error getting device_name for session {self.session_id}: {str(e)}")
                
            # Xử lý thời gian một cách an toàn
            start_time_str = None
            if self.start_time:
                try:
                    start_time_str = self.start_time.isoformat()
                except:
                    start_time_str = str(self.start_time)
                    
            end_time_str = None
            duration_str = None
            if self.end_time:
                try:
                    end_time_str = self.end_time.isoformat()
                    duration_str = str(self.end_time - self.start_time)
                except:
                    end_time_str = str(self.end_time)
                    
            # Đếm số lượng lệnh nếu có
            command_count = 0
            try:
                if hasattr(self, 'command_logs'):
                    command_count = self.command_logs.count()
            except Exception as e:
                print(f"Error counting commands for session {self.session_id}: {str(e)}")
            
            return {
                'id': self.session_id,
                'user_id': self.user_id,
                'user_name': user_name,
                'device_id': self.device_id,
                'device_name': device_name,
                'status': self.status,
                'start_time': start_time_str,
                'end_time': end_time_str,
                'duration': duration_str,
                'ip_address': self.ip_address,
                'command_count': command_count
            }
        except Exception as e:
            print(f"Error in Session.to_dict: {str(e)}")
            # Trả về dữ liệu tối thiểu trong trường hợp có lỗi
            return {
                'id': self.session_id,
                'user_id': self.user_id,
                'device_id': self.device_id,
                'status': self.status
            }

class CommandLog(db.Model):
    __tablename__ = 'command_logs'
    
    log_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('sessions.session_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    device_id = db.Column(db.Integer, db.ForeignKey('devices.device_id'))
    command_text = db.Column(db.Text, nullable=False)
    executed_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20))
    output = db.Column(db.Text)
    execution_time = db.Column(db.Integer)
    is_approved = db.Column(db.Boolean)
    
    def __init__(self, session_id, command_text, user_id=None, device_id=None, 
                output=None, status=None, execution_time=None, is_approved=None):
        self.session_id = session_id
        self.command_text = command_text
        self.user_id = user_id
        self.device_id = device_id
        self.output = output
        self.status = status
        self.execution_time = execution_time
        self.is_approved = is_approved
        self.executed_at = datetime.utcnow()
    
    def to_dict(self):
        try:
            executed_at_str = None
            if self.executed_at:
                try:
                    executed_at_str = self.executed_at.isoformat()
                except:
                    executed_at_str = str(self.executed_at)
                    
            return {
                'id': self.log_id,
                'session_id': self.session_id,
                'user_id': self.user_id,
                'device_id': self.device_id,
                'command_text': self.command_text,
                'output': self.output,
                'status': self.status,
                'execution_time': self.execution_time,
                'is_approved': self.is_approved,
                'executed_at': executed_at_str
            }
        except Exception as e:
            print(f"Error in CommandLog.to_dict: {str(e)}")
            return {
                'id': self.log_id, 
                'session_id': self.session_id,
                'command_text': self.command_text
            } 