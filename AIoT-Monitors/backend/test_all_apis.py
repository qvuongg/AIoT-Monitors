import requests
import json
import os
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_all_apis():
    """Kiểm tra tất cả các endpoints API chính của hệ thống"""
    base_url = "http://localhost:8000"
    token = None
    
    print(f"\n=== KIỂM TRA TẤT CẢ CÁC API ({base_url}) ===\n")
    
    # Phần 1: Đăng nhập và lấy token
    try:
        login_data = {
            "username": "admin_user",
            "password": "admin123"
        }
        print(f"1. Kiểm tra đăng nhập: POST {base_url}/api/auth/login")
        response = requests.post(f"{base_url}/api/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            print(f"   ✅ Đăng nhập thành công (Status code: {response.status_code})")
            token = response.json().get('access_token')
            
            if not token:
                print("   ❌ Token không được trả về, không thể tiếp tục kiểm tra")
                return
                
            print(f"   🔑 Token: {token[:20]}...")
        else:
            print(f"   ❌ Đăng nhập thất bại (Status code: {response.status_code})")
            print(f"   📄 Response: {response.text}")
            return  # Không có token, không thể tiếp tục
    except Exception as e:
        print(f"   ❌ Lỗi khi kết nối đến endpoint đăng nhập: {str(e)}")
        return
        
    # Thiết lập header với token
    headers = {"Authorization": f"Bearer {token}"}
    
    # Phần 2: Kiểm tra API Devices
    print("\n=== KIỂM TRA API DEVICES ===")
    
    # 2.1 Lấy danh sách thiết bị
    try:
        print(f"\n2.1 Lấy danh sách thiết bị: GET {base_url}/api/devices")
        response = requests.get(f"{base_url}/api/devices", headers=headers, timeout=10)
        
        if response.status_code == 200:
            devices = response.json().get('devices', [])
            print(f"   ✅ Lấy danh sách thiết bị thành công (Status code: {response.status_code})")
            print(f"   📊 Số lượng thiết bị: {len(devices)}")
            
            # Lưu lại id của thiết bị đầu tiên để sử dụng trong các kiểm tra sau
            if devices:
                first_device_id = devices[0].get('id')
                print(f"   ℹ️ ID thiết bị đầu tiên: {first_device_id}")
            else:
                print("   ⚠️ Không có thiết bị nào trong danh sách")
                first_device_id = None
        else:
            print(f"   ❌ Lỗi khi lấy danh sách thiết bị (Status code: {response.status_code})")
            print(f"   📄 Response: {response.text}")
            first_device_id = None
    except Exception as e:
        print(f"   ❌ Lỗi khi kết nối đến endpoint devices: {str(e)}")
        first_device_id = None
    
    # 2.2 Lấy thông tin chi tiết thiết bị
    if first_device_id:
        try:
            print(f"\n2.2 Lấy thông tin chi tiết thiết bị: GET {base_url}/api/devices/{first_device_id}")
            response = requests.get(f"{base_url}/api/devices/{first_device_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                device = response.json()
                print(f"   ✅ Lấy thông tin thiết bị thành công (Status code: {response.status_code})")
                print(f"   📱 Tên thiết bị: {device.get('name')}")
                print(f"   🖥️  IP: {device.get('ip_address')}")
                print(f"   📋 Loại: {device.get('device_type')}")
            else:
                print(f"   ❌ Lỗi khi lấy thông tin thiết bị (Status code: {response.status_code})")
                print(f"   📄 Response: {response.text}")
        except Exception as e:
            print(f"   ❌ Lỗi khi kết nối đến endpoint device detail: {str(e)}")
    
    # 2.3 Lấy danh sách nhóm thiết bị
    try:
        print(f"\n2.3 Lấy danh sách nhóm thiết bị: GET {base_url}/api/devices/groups")
        response = requests.get(f"{base_url}/api/devices/groups", headers=headers, timeout=10)
        
        if response.status_code == 200:
            device_groups = response.json().get('device_groups', [])
            print(f"   ✅ Lấy danh sách nhóm thiết bị thành công (Status code: {response.status_code})")
            print(f"   📊 Số lượng nhóm: {len(device_groups)}")
            
            # Lưu lại id của nhóm đầu tiên để sử dụng trong các kiểm tra sau
            if device_groups:
                first_group_id = device_groups[0].get('id')
                print(f"   ℹ️ ID nhóm đầu tiên: {first_group_id}")
            else:
                print("   ⚠️ Không có nhóm thiết bị nào trong danh sách")
                first_group_id = None
        else:
            print(f"   ❌ Lỗi khi lấy danh sách nhóm thiết bị (Status code: {response.status_code})")
            print(f"   📄 Response: {response.text}")
            first_group_id = None
    except Exception as e:
        print(f"   ❌ Lỗi khi kết nối đến endpoint device groups: {str(e)}")
        first_group_id = None
    
    # Phần 3: Kiểm tra API Commands
    print("\n=== KIỂM TRA API COMMANDS ===")
    
    # 3.1 Lấy danh sách lệnh
    try:
        print(f"\n3.1 Lấy danh sách lệnh: GET {base_url}/api/commands")
        response = requests.get(f"{base_url}/api/commands", headers=headers, timeout=10)
        
        if response.status_code == 200:
            commands = response.json().get('commands', [])
            print(f"   ✅ Lấy danh sách lệnh thành công (Status code: {response.status_code})")
            print(f"   📊 Số lượng lệnh: {len(commands)}")
            
            # Lưu lại id của lệnh đầu tiên để sử dụng trong các kiểm tra sau
            if commands:
                first_command_id = commands[0].get('id')
                print(f"   ℹ️ ID lệnh đầu tiên: {first_command_id}")
            else:
                print("   ⚠️ Không có lệnh nào trong danh sách")
                first_command_id = None
        else:
            print(f"   ❌ Lỗi khi lấy danh sách lệnh (Status code: {response.status_code})")
            print(f"   📄 Response: {response.text}")
            first_command_id = None
    except Exception as e:
        print(f"   ❌ Lỗi khi kết nối đến endpoint commands: {str(e)}")
        first_command_id = None
    
    # 3.2 Lấy danh sách command lists
    try:
        print(f"\n3.2 Lấy danh sách command lists: GET {base_url}/api/commands/lists")
        response = requests.get(f"{base_url}/api/commands/lists", headers=headers, timeout=10)
        
        if response.status_code == 200:
            command_lists = response.json().get('command_lists', [])
            print(f"   ✅ Lấy danh sách command lists thành công (Status code: {response.status_code})")
            print(f"   📊 Số lượng command lists: {len(command_lists)}")
            
            # Lưu lại id của command list đầu tiên để sử dụng trong các kiểm tra sau
            if command_lists:
                first_list_id = command_lists[0].get('id')
                print(f"   ℹ️ ID command list đầu tiên: {first_list_id}")
            else:
                print("   ⚠️ Không có command list nào trong danh sách")
                first_list_id = None
        else:
            print(f"   ❌ Lỗi khi lấy danh sách command lists (Status code: {response.status_code})")
            print(f"   📄 Response: {response.text}")
            first_list_id = None
    except Exception as e:
        print(f"   ❌ Lỗi khi kết nối đến endpoint command lists: {str(e)}")
        first_list_id = None
    
    # Phần 4: Kiểm tra API Sessions
    print("\n=== KIỂM TRA API SESSIONS ===")
    
    # 4.1 Lấy danh sách phiên
    try:
        print(f"\n4.1 Lấy danh sách phiên: GET {base_url}/api/sessions")
        response = requests.get(f"{base_url}/api/sessions", headers=headers, timeout=10)
        
        if response.status_code == 200:
            sessions = response.json().get('sessions', [])
            print(f"   ✅ Lấy danh sách phiên thành công (Status code: {response.status_code})")
            print(f"   📊 Số lượng phiên: {len(sessions)}")
            
            # Lưu lại id của phiên đầu tiên để sử dụng trong các kiểm tra sau
            if sessions:
                first_session_id = sessions[0].get('id')
                print(f"   ℹ️ ID phiên đầu tiên: {first_session_id}")
            else:
                print("   ⚠️ Không có phiên nào trong danh sách")
                first_session_id = None
        else:
            print(f"   ❌ Lỗi khi lấy danh sách phiên (Status code: {response.status_code})")
            print(f"   📄 Response: {response.text}")
            first_session_id = None
    except Exception as e:
        print(f"   ❌ Lỗi khi kết nối đến endpoint sessions: {str(e)}")
        first_session_id = None
    
    # 4.2 Lấy phiên đang hoạt động
    try:
        print(f"\n4.2 Lấy danh sách phiên đang hoạt động: GET {base_url}/api/sessions?active_only=true")
        response = requests.get(f"{base_url}/api/sessions?active_only=true", headers=headers, timeout=10)
        
        if response.status_code == 200:
            active_sessions = response.json().get('sessions', [])
            print(f"   ✅ Lấy danh sách phiên đang hoạt động thành công (Status code: {response.status_code})")
            print(f"   📊 Số lượng phiên đang hoạt động: {len(active_sessions)}")
            
            # Lưu lại id của phiên hoạt động đầu tiên để sử dụng trong các kiểm tra sau
            if active_sessions:
                active_session_id = active_sessions[0].get('id')
                print(f"   ℹ️ ID phiên đang hoạt động đầu tiên: {active_session_id}")
            else:
                print("   ⚠️ Không có phiên đang hoạt động nào")
                active_session_id = None
        else:
            print(f"   ❌ Lỗi khi lấy danh sách phiên đang hoạt động (Status code: {response.status_code})")
            print(f"   📄 Response: {response.text}")
            active_session_id = None
    except Exception as e:
        print(f"   ❌ Lỗi khi kết nối đến endpoint active sessions: {str(e)}")
        active_session_id = None
    
    # 4.3 Tạo phiên mới (chỉ thực hiện nếu có thiết bị)
    if first_device_id:
        try:
            print(f"\n4.3 Tạo phiên mới: POST {base_url}/api/sessions")
            session_data = {
                "device_id": first_device_id
            }
            response = requests.post(f"{base_url}/api/sessions", headers=headers, json=session_data, timeout=10)
            
            if response.status_code == 201:
                new_session = response.json().get('session', {})
                print(f"   ✅ Tạo phiên mới thành công (Status code: {response.status_code})")
                print(f"   🆔 ID phiên mới: {new_session.get('id')}")
                new_session_id = new_session.get('id')
            else:
                print(f"   ❌ Lỗi khi tạo phiên mới (Status code: {response.status_code})")
                print(f"   📄 Response: {response.text}")
                new_session_id = None
        except Exception as e:
            print(f"   ❌ Lỗi khi kết nối đến endpoint create session: {str(e)}")
            new_session_id = None
        
        # 4.4 Lấy thông tin phiên vừa tạo (nếu tạo thành công)
        if new_session_id:
            try:
                print(f"\n4.4 Lấy thông tin phiên vừa tạo: GET {base_url}/api/sessions/{new_session_id}")
                response = requests.get(f"{base_url}/api/sessions/{new_session_id}", headers=headers, timeout=10)
                
                if response.status_code == 200:
                    session_detail = response.json()
                    print(f"   ✅ Lấy thông tin phiên thành công (Status code: {response.status_code})")
                    print(f"   👤 User ID: {session_detail.get('user_id')}")
                    print(f"   📱 Device ID: {session_detail.get('device_id')}")
                    print(f"   🕒 Trạng thái: {session_detail.get('status')}")
                else:
                    print(f"   ❌ Lỗi khi lấy thông tin phiên (Status code: {response.status_code})")
                    print(f"   📄 Response: {response.text}")
            except Exception as e:
                print(f"   ❌ Lỗi khi kết nối đến endpoint session detail: {str(e)}")
            
            # 4.5 Kết thúc phiên vừa tạo
            try:
                print(f"\n4.5 Kết thúc phiên vừa tạo: PUT {base_url}/api/sessions/{new_session_id}")
                end_data = {
                    "status": "completed"
                }
                response = requests.put(f"{base_url}/api/sessions/{new_session_id}", headers=headers, json=end_data, timeout=10)
                
                if response.status_code == 200:
                    print(f"   ✅ Kết thúc phiên thành công (Status code: {response.status_code})")
                    print(f"   📄 Trạng thái mới: {response.json().get('session', {}).get('status')}")
                else:
                    print(f"   ❌ Lỗi khi kết thúc phiên (Status code: {response.status_code})")
                    print(f"   📄 Response: {response.text}")
            except Exception as e:
                print(f"   ❌ Lỗi khi kết nối đến endpoint end session: {str(e)}")
    
    # Phần 5: Kiểm tra API Profiles
    print("\n=== KIỂM TRA API PROFILES ===")
    
    # 5.1 Lấy danh sách profiles
    try:
        print(f"\n5.1 Lấy danh sách profiles: GET {base_url}/api/profiles")
        response = requests.get(f"{base_url}/api/profiles", headers=headers, timeout=10)
        
        if response.status_code == 200:
            profiles = response.json().get('profiles', [])
            print(f"   ✅ Lấy danh sách profiles thành công (Status code: {response.status_code})")
            print(f"   📊 Số lượng profiles: {len(profiles)}")
            
            # Lưu lại id của profile đầu tiên để sử dụng trong các kiểm tra sau
            if profiles:
                first_profile_id = profiles[0].get('id')
                print(f"   ℹ️ ID profile đầu tiên: {first_profile_id}")
            else:
                print("   ⚠️ Không có profile nào trong danh sách")
                first_profile_id = None
        else:
            print(f"   ❌ Lỗi khi lấy danh sách profiles (Status code: {response.status_code})")
            print(f"   📄 Response: {response.text}")
            first_profile_id = None
    except Exception as e:
        print(f"   ❌ Lỗi khi kết nối đến endpoint profiles: {str(e)}")
        first_profile_id = None
    
    # 5.2 Lấy người dùng được gán cho profile đầu tiên
    if first_profile_id:
        try:
            print(f"\n5.2 Lấy người dùng được gán cho profile: GET {base_url}/api/profiles/{first_profile_id}/users")
            response = requests.get(f"{base_url}/api/profiles/{first_profile_id}/users", headers=headers, timeout=10)
            
            if response.status_code == 200:
                users = response.json().get('users', [])
                print(f"   ✅ Lấy danh sách người dùng thành công (Status code: {response.status_code})")
                print(f"   👥 Số lượng người dùng: {len(users)}")
            else:
                print(f"   ❌ Lỗi khi lấy danh sách người dùng (Status code: {response.status_code})")
                print(f"   📄 Response: {response.text}")
        except Exception as e:
            print(f"   ❌ Lỗi khi kết nối đến endpoint profile users: {str(e)}")
    
    # Phần 6: Kiểm tra CORS
    try:
        print("\n=== KIỂM TRA CORS ===")
        print(f"Kiểm tra từ Origin: http://localhost:3000 đến {base_url}/api/profiles")
        
        # Thiết lập header Origin giả lập từ frontend
        cors_headers = {
            "Origin": "http://localhost:3000",
            "Authorization": f"Bearer {token}"
        }
        
        options_response = requests.options(f"{base_url}/api/profiles", headers=cors_headers, timeout=10)
        
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
    
    print("\n=== KẾT THÚC KIỂM TRA TẤT CẢ CÁC API ===")

if __name__ == "__main__":
    test_all_apis() 