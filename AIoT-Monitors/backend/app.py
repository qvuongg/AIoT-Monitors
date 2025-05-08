import os
from dotenv import load_dotenv
from app import create_app
from app.routes.auth import auth_bp
from app.routes.profiles import profiles_bp
from app.routes.devices import devices_bp
from app.routes.commands import commands_bp
from app.routes.sessions import sessions_bp
from app.routes.user_profiles import user_profiles_bp

# Load environment variables
load_dotenv()

app = create_app()

app.register_blueprint(auth_bp)
app.register_blueprint(profiles_bp)
app.register_blueprint(devices_bp)
app.register_blueprint(commands_bp)
app.register_blueprint(sessions_bp)
app.register_blueprint(user_profiles_bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
