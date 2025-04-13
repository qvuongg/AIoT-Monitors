import os
from dotenv import load_dotenv
from app import create_app

# Load environment variables
load_dotenv()

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"Starting server on port {port}...")
    print(f"PostgreSQL: {os.environ.get('DATABASE_URL')}")
    print("Available API endpoints:")
    
    # Profiles API endpoints
    print("\n=== PROFILES API ===")
    print("- GET    /api/profiles")
    print("- GET    /api/profiles/<id>")
    print("- POST   /api/profiles")
    print("- PUT    /api/profiles/<id>")
    print("- DELETE /api/profiles/<id>")
    print("- GET    /api/profiles/<id>/users")
    print("- POST   /api/profiles/<id>/users")
    print("- DELETE /api/profiles/<id>/users/<user_id>")
    
    # Devices API endpoints
    print("\n=== DEVICES API ===")
    print("- GET    /api/devices")
    print("- GET    /api/devices/<id>")
    print("- POST   /api/devices")
    print("- GET    /api/devices/groups")
    print("- GET    /api/devices/groups/<id>")
    print("- POST   /api/devices/groups")
    print("- GET    /api/devices/groups/<id>/devices")
    print("- POST   /api/devices/groups/<id>/devices")
    
    # Commands API endpoints
    print("\n=== COMMANDS API ===")
    print("- GET    /api/commands")
    print("- GET    /api/commands/<id>")
    print("- POST   /api/commands")
    print("- GET    /api/commands/lists")
    print("- GET    /api/commands/lists/<id>")
    print("- POST   /api/commands/lists")
    print("- GET    /api/commands/lists/<id>/commands")
    print("- POST   /api/commands/lists/<id>/commands")
    
    # Sessions API endpoints
    print("\n=== SESSIONS API ===")
    print("- GET    /api/sessions")
    print("- GET    /api/sessions/<id>")
    print("- POST   /api/sessions")
    print("- PUT    /api/sessions/<id>")
    print("- GET    /api/sessions/<id>/commands")
    print("- POST   /api/sessions/<id>/commands")
    print("- POST   /api/sessions/<id>/edit-file")
    
    print("\nOpen Postman and follow instructions in postman_api_guide.md, or run test_all_apis.py")
    app.run(debug=True, host='0.0.0.0', port=port) 