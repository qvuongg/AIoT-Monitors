from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
import os
from datetime import timedelta
from flask_cors import CORS

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
jwt = JWTManager()
migrate = Migrate()

def create_app(config=None):
    app = Flask(__name__)
    
    # Configure the app
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 'postgresql://postgres:postgres@localhost/aiot_monitors')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-dev-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    
    # Configure CORS to allow any origin
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    
    # Import and register blueprints
    from app.routes.auth import auth_bp
    from app.routes.devices import devices_bp
    from app.routes.commands import commands_bp
    from app.routes.sessions import sessions_bp
    from app.routes.profiles import profiles_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(devices_bp, url_prefix='/api/devices')
    app.register_blueprint(commands_bp, url_prefix='/api/commands')
    app.register_blueprint(sessions_bp, url_prefix='/api/sessions')
    app.register_blueprint(profiles_bp, url_prefix='/api/profiles')
    
    # Configure login_manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    
    @login_manager.user_loader
    def load_user(user_id):
        from app.models.user import User
        return User.query.get(int(user_id))
    
    # Create database tables if they don't exist
    if not os.environ.get('SKIP_DB_CREATE'):
        with app.app_context():
            db.create_all()
    
    return app 