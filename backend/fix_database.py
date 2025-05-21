import os
import psycopg2
from dotenv import load_dotenv
from sqlalchemy import text

# Load environment variables
load_dotenv()

# Get database URL from environment
database_url = os.environ.get('DATABASE_URL')

# First, drop the database if it exists
try:
    # Parse the database URL to get connection details
    db_parts = database_url.split('/')
    db_name = db_parts[-1]
    connection_string = '/'.join(db_parts[:-1]) + '/postgres'
    
    # Connect to postgres database to drop and recreate target database
    conn = psycopg2.connect(connection_string)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Terminate active connections to the database
    cursor.execute(f"""
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '{db_name}'
    AND pid <> pg_backend_pid();
    """)
    
    # Drop the database if it exists
    cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
    print(f"Dropped database {db_name}")
    
    # Create the database
    cursor.execute(f"CREATE DATABASE {db_name}")
    print(f"Created database {db_name}")
    
    cursor.close()
    conn.close()
    
    print("Database reset complete.")
except Exception as e:
    print(f"Error resetting database: {e}")

# Now import Flask app and initialize models
from app import create_app, db
from app.models.user import User, UserRole

# Create the Flask app
app = create_app()

with app.app_context():
    # Create tables
    print("Creating database tables...")
    db.create_all()
    
    # Create admin user
    print("Creating admin user...")
    admin = User(
        username=os.environ.get('ADMIN_USERNAME', 'admin'),
        email=os.environ.get('ADMIN_EMAIL', 'admin@aiotmonitors.com'),
        password=os.environ.get('ADMIN_PASSWORD', 'admin123'),
        role=UserRole.ADMIN
    )
    db.session.add(admin)
    
    # Create test users
    print("Creating test users...")
    test_users = [
        {
            "username": "teamlead",
            "email": "teamlead@aiotmonitors.com",
            "password": "password123",
            "role": UserRole.TEAM_LEAD
        },
        {
            "username": "supervisor",
            "email": "supervisor@aiotmonitors.com",
            "password": "password123",
            "role": UserRole.SUPERVISOR
        },
        {
            "username": "operator1",
            "email": "operator1@aiotmonitors.com",
            "password": "password123",
            "role": UserRole.OPERATOR
        }
    ]
    
    for user_data in test_users:
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            password=user_data["password"],
            role=user_data["role"]
        )
        db.session.add(user)
    
    db.session.commit()
    print("Users created successfully!")
    
    print("Database initialization complete!") 