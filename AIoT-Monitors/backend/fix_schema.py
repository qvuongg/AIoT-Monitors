import os
from dotenv import load_dotenv
from app import create_app, db
from sqlalchemy import text, inspect

# Load environment variables
load_dotenv()

app = create_app()

def inspect_table(inspector, table_name):
    try:
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        pk = inspector.get_pk_constraint(table_name)
        fks = inspector.get_foreign_keys(table_name)
        
        print(f"Table: {table_name}")
        print(f"Columns: {columns}")
        print(f"Primary keys: {pk}")
        print(f"Foreign keys: {fks}")
        print("="*50)
        
        return columns, pk, fks
    except Exception as e:
        print(f"Error inspecting {table_name}: {e}")
        return None, None, None

with app.app_context():
    # Use SQLAlchemy inspector
    inspector = inspect(db.engine)
    
    # Get all tables
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")
    print("="*50)
    
    # Inspect key tables
    for table in ['users', 'device_groups', 'devices', 'sessions']:
        if table in tables:
            inspect_table(inspector, table)
    
    print("Schema inspection completed")
    
    # Create or update Flask-SQLAlchemy models to match existing schema
    try:
        print("Updating models to match database schema...")
        # This doesn't modify the database, just creates missing tables
        # that don't conflict with existing ones
        db.create_all()
        print("Model update completed")
    except Exception as e:
        print(f"Error updating models: {e}") 