# backend/app/routes/command_routes.py

from flask import Blueprint, request, jsonify
from uuid import uuid4

command_bp = Blueprint('command', __name__)

# Giả lập command list trong RAM (sau này có thể thay bằng DB)
command_list = []

@command_bp.route('/api/commands', methods=['POST'])
def create_command():
    data = request.get_json()
    command = {
        "id": str(uuid4()),
        "title": data.get("title"),
        "description": data.get("description"),
        "created_by": data.get("created_by")
    }
    command_list.append(command)
    return jsonify({"message": "Command created", "command": command}), 201
