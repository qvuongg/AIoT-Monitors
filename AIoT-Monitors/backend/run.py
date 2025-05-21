import os
from dotenv import load_dotenv
from app import create_app, db
from flask_sqlalchemy import SQLAlchemy

# Load environment variables
load_dotenv()

# Create a modified create_app function
def create_modified_app():
    """Create the Flask application without creating tables."""
    app = create_app()
    
    # Override the SQLAlchemy create_all method to do nothing
    original_create_all = SQLAlchemy.create_all
    SQLAlchemy.create_all = lambda *args, **kwargs: None
    
    return app

# Create the application
app = create_modified_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000))) 