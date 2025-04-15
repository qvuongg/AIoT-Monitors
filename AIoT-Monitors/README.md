# AIoT Monitors - Hệ thống giám sát thiết bị IoT

## Giới thiệu

AIoT Monitors là một ứng dụng giám sát và quản lý thiết bị IoT, cho phép người dùng:
- Quản lý nhóm thiết bị và profiles
- Tạo và quản lý danh sách lệnh
- Gán profiles cho người dùng
- Giám sát và điều khiển thiết bị từ xa qua SSH
- Thực thi lệnh và chỉnh sửa file trên thiết bị

## Cài đặt và chạy dự án

### Yêu cầu
- Python 3.8 hoặc cao hơn
- Node.js 14 hoặc cao hơn
- PostgreSQL (đã cài đặt và đang chạy)

### Thiết lập cơ sở dữ liệu
1. Tạo cơ sở dữ liệu PostgreSQL tên `aiot_monitors`:
```bash
createdb aiot_monitors
```

2. Nhập dữ liệu mẫu từ file SQL:
```bash
psql aiot_monitors < DB/DB.sql
```

### Chạy dự án
Sử dụng script khởi động tự động:
```bash
cd AIoT-Monitors
chmod +x start.sh
./start.sh
```

Hoặc chạy riêng từng phần:

#### Backend
```bash
cd AIoT-Monitors/backend
python start_profiles_api.py
# python -m venv venv
# source venv/bin/activate  # Trên Windows: venv\Scripts\activate
# pip install -r requirements.txt
```

Backend API sẽ chạy tại: http://localhost:8000

#### Frontend
```bash
cd AIoT-Monitors/frontend
npm install
npm start
```

Frontend sẽ chạy tại: http://localhost:3000

## Kiểm tra kết nối API
Có hai cách để kiểm tra kết nối API:

### Script kiểm tra tự động
```bash
cd AIoT-Monitors/backend
python test_api_connectivity.py
```

### Kiểm tra toàn diện tất cả API endpoints
```bash
cd AIoT-Monitors/backend
python test_all_apis.py
```
Script này sẽ kiểm tra chi tiết các API endpoints của devices, commands, sessions và profiles.

## Đăng nhập

Sử dụng các tài khoản sau để đăng nhập:

| Tài khoản | Mật khẩu | Vai trò |
|-----------|----------|---------|
| admin_user | admin123 | Admin |
| team_lead1 | hash_lead_123 | Team Lead |
| supervisor1 | hash_sup_123 | Supervisor |
| operator1 | hash_op_123 | Operator |

## API Endpoints

### Authentication
- `POST /api/auth/login`: Đăng nhập và nhận JWT token
- `POST /api/auth/logout`: Đăng xuất (xóa token phía client)

### Profiles
- `GET /api/profiles`: Lấy danh sách tất cả profiles
- `GET /api/profiles/{profile_id}`: Lấy thông tin chi tiết profile
- `POST /api/profiles`: Tạo profile mới (Admin, Team Lead)
- `PUT /api/profiles/{profile_id}`: Cập nhật profile (Admin, Team Lead)
- `DELETE /api/profiles/{profile_id}`: Xóa profile (Admin)
- `GET /api/profiles/{profile_id}/users`: Lấy danh sách người dùng được gán profile
- `POST /api/profiles/{profile_id}/users`: Gán profile cho người dùng (Admin, Team Lead)
- `DELETE /api/profiles/{profile_id}/users/{user_id}`: Hủy gán profile (Admin, Team Lead)

### Devices
- `GET /api/devices`: Lấy danh sách tất cả thiết bị
- `GET /api/devices/{device_id}`: Lấy thông tin chi tiết thiết bị
- `POST /api/devices`: Tạo thiết bị mới (Chỉ Admin)
- `GET /api/devices/unassigned`: Lấy danh sách thiết bị chưa được gán (assigned_by = null)
- `GET /api/devices/groups`: Lấy danh sách nhóm thiết bị
- `GET /api/devices/groups/{group_id}`: Lấy thông tin chi tiết nhóm thiết bị
- `POST /api/devices/groups`: Tạo nhóm thiết bị mới (Chỉ Admin)
- `GET /api/devices/groups/{group_id}/devices`: Lấy danh sách thiết bị trong nhóm
- `POST /api/devices/groups/{group_id}/devices`: Gán thiết bị vào nhóm (Admin, Team Lead)

### Commands
- `GET /api/commands`: Lấy danh sách tất cả lệnh
- `GET /api/commands/{command_id}`: Lấy thông tin chi tiết lệnh
- `POST /api/commands`: Tạo lệnh mới (Admin, Team Lead)
- `GET /api/commands/lists`: Lấy danh sách command lists
- `GET /api/commands/lists/{list_id}`: Lấy thông tin chi tiết command list
- `POST /api/commands/lists`: Tạo command list mới (Admin, Team Lead)
- `GET /api/commands/lists/{list_id}/commands`: Lấy danh sách lệnh trong command list

### Sessions
- `GET /api/sessions`: Lấy danh sách tất cả phiên
- `GET /api/sessions?active_only=true`: Lấy danh sách phiên đang hoạt động
- `GET /api/sessions/{session_id}`: Lấy thông tin chi tiết phiên
- `POST /api/sessions`: Tạo phiên mới (yêu cầu device_id)
- `PUT /api/sessions/{session_id}`: Kết thúc phiên
- `GET /api/sessions/{session_id}/commands`: Lấy danh sách lệnh đã thực thi trong phiên
- `POST /api/sessions/{session_id}/commands`: Thực thi lệnh trong phiên
- `POST /api/sessions/{session_id}/edit-file`: Chỉnh sửa file trong phiên

## Xử lý lỗi

Hệ thống đã được cải tiến để xử lý các lỗi phổ biến:
- **Lỗi 401**: Tự động đăng xuất và chuyển hướng đến trang login
- **Lỗi 422**: Xử lý dữ liệu không hợp lệ, hiển thị các thông báo lỗi
- **Lỗi kết nối SSH**: Cung cấp các thông báo lỗi chi tiết và gợi ý giải pháp

## Cấu trúc dự án

```
AIoT-Monitors/
├── backend/              # Backend API bằng Flask
│   ├── app/              # Mã nguồn ứng dụng Flask
│   │   ├── models/       # Các model SQLAlchemy
│   │   ├── routes/       # API routes
│   │   └── utils/        # Các tiện ích
│   ├── requirements.txt  # Dependencies của Python
│   └── .env              # Biến môi trường backend
│
├── frontend/             # Frontend bằng React
│   ├── src/              # Mã nguồn React
│   │   ├── components/   # Các React components
│   │   ├── services/     # Các service API
│   │   └── App.js        # Component chính
│   ├── package.json      # Dependencies của Node.js
│   └── .env              # Biến môi trường frontend
│
├── DB/                   # Tập lệnh SQL và dữ liệu mẫu
│   └── DB.sql            # Tập lệnh SQL để khởi tạo database
│
└── start.sh              # Script khởi động tất cả các dịch vụ
```

## Tính năng bảo mật
- Hệ thống sử dụng JWT token để xác thực, thời gian hết hạn là 1 giờ
- Tài khoản bị khóa sẽ không thể đăng nhập
- CORS được cấu hình để cho phép kết nối từ frontend
- Xử lý lỗi khi token hết hạn

## Vai trò người dùng
- **Admin**: Quyền truy cập đầy đủ vào tất cả tính năng, bao gồm tạo mới thiết bị và tạo mới nhóm thiết bị
- **Team Lead**: Chỉ có thể gán thiết bị vào nhóm, quản lý lệnh và profiles
- **Supervisor**: Giám sát phiên làm việc và có thể kết thúc phiên của người khác
- **Operator**: Tạo phiên, thực thi lệnh và chỉnh sửa file

## Thông tin liên hệ
Nếu bạn gặp bất kỳ vấn đề nào khi sử dụng hệ thống, vui lòng liên hệ với đội phát triển. 

## Thay đổi mới nhất
- **Phân quyền thiết bị**: Chỉ Admin mới có thể tạo thiết bị mới và tạo nhóm thiết bị trong hệ thống
- **Gán thiết bị vào nhóm**: Team Lead chỉ có thể gán thiết bị vào nhóm, không thể thay đổi nhóm đã được gán
- **Dashboard cải tiến**: Hiển thị danh sách thiết bị chưa được gán (assigned_by = null) và nút "Thêm vào nhóm" cho Admin và Team Lead
- **Truy vết hành động**: Hệ thống lưu thông tin về người thực hiện gán thiết bị thông qua cột assigned_by
- **Thêm cột assigned_by**: Lưu trữ thông tin người gán thiết bị, khác với created_by (người tạo thiết bị) 