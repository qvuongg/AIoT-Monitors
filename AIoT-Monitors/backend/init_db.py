import os
from dotenv import load_dotenv
from app import create_app, db

# Load environment variables
load_dotenv()

app = create_app()

with app.app_context():
    # Create tables (will not replace existing ones)
    print("Creating missing database tables...")
    db.create_all()
    print("Database initialization complete!") 