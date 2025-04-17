from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from uuid import uuid4
import secrets

router = APIRouter()
users_db = {}  # DB giả lập

# ------------ Model Dữ Liệu ------------
class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    role: str  # operator / supervisor / team_lead

class UpdatePasswordRequest(BaseModel):
    user_id: str
    new_password: str

class ResetPasswordRequest(BaseModel):
    user_id: str

class LoginRequest(BaseModel):
    username: str
    password: str

# ------------ API Admin ------------
@router.post("/create-user")
def create_user(req: CreateUserRequest):
    if req.role not in ["operator", "supervisor", "team_lead"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user_id = str(uuid4())
    password = secrets.token_hex(8)
    users_db[user_id] = {
        "username": req.username,
        "email": req.email,
        "role": req.role,
        "password": password
    }
    return {
        "user_id": user_id,
        "message": f"{req.role} created",
        "password": password
    }

@router.put("/update-password")
def update_password(req: UpdatePasswordRequest):
    user = users_db.get(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["password"] = req.new_password
    return { "message": "Password updated successfully" }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    user = users_db.get(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_password = secrets.token_hex(6)
    user["password"] = new_password
    return {
        "message": "Password reset successfully",
        "new_password": new_password,
        "note": f"Password should be sent to user email: {user['email']}"
    }

@router.post("/login")
def login(req: LoginRequest):
    for user_id, user in users_db.items():
        if user["username"] == req.username and user["password"] == req.password:
            return {
                "message": "Login successful",
                "user_id": user_id,
                "role": user["role"]
            }
    raise HTTPException(status_code=401, detail="Invalid username or password")
