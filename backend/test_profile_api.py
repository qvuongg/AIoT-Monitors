import os
from dotenv import load_dotenv
import sys
from app import create_app, db
from app.models.profile import Profile
from app.models.user import User
from app.models.device import DeviceGroup
from app.models.command import CommandList
import json

# Load environment variables
load_dotenv()

def test_profiles_connection():
    """Test connection to PostgreSQL and interact with profiles table"""
    app = create_app()
    
    with app.app_context():
        # Kiểm tra kết nối đến database
        try:
            # Lấy tất cả profiles
            profiles = Profile.query.all()
            print(f"Đã kết nối thành công đến PostgreSQL! Tìm thấy {len(profiles)} profiles.")
            
            # Hiển thị thông tin chi tiết về các profiles
            print("\n=== DANH SÁCH PROFILES ===")
            for profile in profiles:
                print(f"ID: {profile.profile_id}")
                print(f"Tên: {profile.profile_name}")
                print(f"Mô tả: {profile.description}")
                print(f"Group ID: {profile.group_id}")
                print(f"List ID: {profile.list_id}")
                print(f"Trạng thái: {'Đang hoạt động' if profile.is_active else 'Không hoạt động'}")
                
                # Lấy thông tin về nhóm thiết bị
                if profile.device_group:
                    print(f"Nhóm thiết bị: {profile.device_group.group_name}")
                
                # Lấy thông tin về danh sách lệnh
                if profile.command_list:
                    print(f"Danh sách lệnh: {profile.command_list.list_name}")
                
                # Lấy thông tin về người tạo
                if profile.creator:
                    print(f"Người tạo: {profile.creator.username}")
                    
                # Lấy danh sách users được gán profile này
                users = profile.users
                if users:
                    print(f"Số người dùng được gán: {len(users)}")
                    print("Danh sách người dùng: " + ", ".join([user.username for user in users]))
                    
                print("----------------------------")
            
            # Lấy thông tin active profiles
            active_profiles = Profile.get_active_profiles()
            print(f"\nSố lượng profiles đang hoạt động: {len(active_profiles)}")
            
            # Kiểm tra chức năng tìm profile theo ID
            if profiles:
                first_profile_id = profiles[0].profile_id
                profile = Profile.get_profile_by_id(first_profile_id)
                print(f"\nTìm profile theo ID {first_profile_id}: {profile.profile_name if profile else 'Không tìm thấy'}")
                
                # Hiển thị dữ liệu profile dưới dạng JSON
                profile_dict = profile.to_dict()
                print("\nJSON data:")
                print(json.dumps(profile_dict, indent=2, ensure_ascii=False))
                
        except Exception as e:
            print(f"Lỗi kết nối đến database: {e}")
            return False
        
        return True

if __name__ == "__main__":
    if test_profiles_connection():
        print("\nKiểm tra kết nối thành công!")
    else:
        print("\nKiểm tra kết nối thất bại!") 