import os
from dotenv import load_dotenv
from app import create_app
from app.routes.command_routes import command_bp

# Load environment variables
load_dotenv()

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000))) 

# backend/app/app.py
app.register_blueprint(command_bp)