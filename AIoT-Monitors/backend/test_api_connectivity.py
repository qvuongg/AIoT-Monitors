import requests
import json
import os
from dotenv import load_dotenv
from app import create_app, db

# Load environment variables
load_dotenv()

def test_api_connectivity():
    """Kiểm tra các endpoints API để phục vụ frontend"""
    base_url = "http://localhost:8000"
    
    print(f"\n=== Kiểm tra kết nối API ({base_url}) ===\n")
    
    # Kiểm tra endpoint đăng nhập
    try:
        login_data = {
            "username": "admin_user",
            "password": "admin123"
        }
        print(f"1. Kiểm tra đăng nhập: POST {base_url}/api/auth/login")
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            print(f"   ✅ Đăng nhập thành công (Status code: {response.status_code})")
            token = response.json().get('access_token')
            
            # Thiết lập header authorization
            headers = {"Authorization": f"Bearer {token}"}
            
            # Kiểm tra endpoint profiles
            try:
                print(f"\n2. Kiểm tra danh sách profiles: GET {base_url}/api/profiles")
                profiles_response = requests.get(f"{base_url}/api/profiles", headers=headers)
                
                if profiles_response.status_code == 200:
                    profiles = profiles_response.json()
                    print(f"   ✅ Lấy danh sách profiles thành công (Status code: {profiles_response.status_code})")
                    print(f"   📊 Số lượng profiles: {len(profiles.get('profiles', []))}")
                else:
                    print(f"   ❌ Lỗi khi lấy danh sách profiles (Status code: {profiles_response.status_code})")
                    print(f"   📄 Response: {profiles_response.text}")
            except Exception as e:
                print(f"   ❌ Lỗi khi kết nối đến endpoint profiles: {str(e)}")
                
            # Kiểm tra danh sách người dùng
            try:
                print(f"\n3. Kiểm tra danh sách người dùng của profile đầu tiên")
                
                # Lấy ID của profile đầu tiên nếu có
                if profiles_response.status_code == 200:
                    profiles_data = profiles_response.json()
                    if profiles_data.get('profiles') and len(profiles_data.get('profiles')) > 0:
                        first_profile_id = profiles_data.get('profiles')[0].get('id')
                        
                        # Lấy danh sách người dùng của profile
                        print(f"   GET {base_url}/api/profiles/{first_profile_id}/users")
                        users_response = requests.get(f"{base_url}/api/profiles/{first_profile_id}/users", headers=headers)
                        
                        if users_response.status_code == 200:
                            users_data = users_response.json()
                            print(f"   ✅ Lấy danh sách người dùng thành công (Status code: {users_response.status_code})")
                            print(f"   👥 Số lượng người dùng được gán: {len(users_data.get('users', []))}")
                        else:
                            print(f"   ❌ Lỗi khi lấy danh sách người dùng (Status code: {users_response.status_code})")
                            print(f"   📄 Response: {users_response.text}")
                    else:
                        print("   ℹ️ Không có profile nào để kiểm tra")
            except Exception as e:
                print(f"   ❌ Lỗi khi kết nối đến endpoint users: {str(e)}")
        else:
            print(f"   ❌ Đăng nhập thất bại (Status code: {response.status_code})")
            print(f"   📄 Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Lỗi khi kết nối đến endpoint đăng nhập: {str(e)}")
    
    print("\n=== Kết thúc kiểm tra API ===")
    
    # Kiểm tra kết nối CORS từ Origin giả lập frontend
    try:
        print("\n=== Kiểm tra CORS ===")
        print(f"Kiểm tra từ Origin: http://localhost:3000 đến {base_url}/api/profiles")
        
        # Thiết lập header Origin giả lập từ frontend
        cors_headers = {
            "Origin": "http://localhost:3000",
            "Authorization": f"Bearer {token}" if 'token' in locals() else ""
        }
        
        options_response = requests.options(f"{base_url}/api/profiles", headers=cors_headers)
        
        if 'Access-Control-Allow-Origin' in options_response.headers:
            print(f"✅ CORS được cấu hình đúng!")
            print(f"Access-Control-Allow-Origin: {options_response.headers.get('Access-Control-Allow-Origin')}")
            if 'Access-Control-Allow-Credentials' in options_response.headers:
                print(f"Access-Control-Allow-Credentials: {options_response.headers.get('Access-Control-Allow-Credentials')}")
        else:
            print("❌ CORS không được cấu hình đúng!")
            print(f"Headers: {options_response.headers}")
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra CORS: {str(e)}")

if __name__ == "__main__":
    test_api_connectivity() 