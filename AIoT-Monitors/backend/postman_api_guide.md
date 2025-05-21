# Profiles API Guide

## Cấu hình môi trường Postman

1. Tạo môi trường mới trong Postman
2. Thêm các biến sau:
   - `base_url`: http://localhost:8000
   - `token`: (để trống, sẽ được thiết lập sau khi đăng nhập)

## Xác thực
Trước khi sử dụng API của Profiles, bạn cần đăng nhập để lấy token JWT.

### Đăng nhập

**Request**
```
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "username": "admin_user",
  "password": "admin123"
}
```

**Response**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "admin@example.com",
    "id": 1,
    "role": "admin",
    "username": "admin_user"
  }
}
```

**Sau khi đăng nhập thành công:**
1. Sao chép giá trị `access_token` từ response
2. Lưu giá trị này vào biến môi trường `token` trong Postman

## API Endpoints

Đối với tất cả các API dưới đây, bạn cần thiết lập header:
```
Authorization: Bearer {{token}}
```

### 1. Lấy danh sách tất cả profiles

**Request**
```
GET {{base_url}}/api/profiles
```

**Query Params (tùy chọn)**
- `active=true` - Chỉ lấy các profiles đang hoạt động

**Response**
```json
{
  "success": true,
  "count": 5,
  "profiles": [
    {
      "id": 1,
      "name": "Factory Operations",
      "description": "Basic factory floor device operations",
      "group_id": 1,
      "group_name": "Factory Floor Devices",
      "list_id": 1,
      "list_name": "System Diagnostics",
      "created_at": "2023-10-01T12:00:00+00:00",
      "created_by": "admin_user",
      "is_active": true
    },
    // Các profiles khác
  ]
}
```

### 2. Lấy chi tiết profile theo ID

**Request**
```
GET {{base_url}}/api/profiles/1
```

**Response**
```json
{
  "success": true,
  "profile": {
    "id": 1,
    "name": "Factory Operations",
    "description": "Basic factory floor device operations",
    "group_id": 1,
    "group_name": "Factory Floor Devices",
    "list_id": 1,
    "list_name": "System Diagnostics",
    "created_at": "2023-10-01T12:00:00+00:00",
    "created_by": "admin_user",
    "is_active": true
  }
}
```

### 3. Tạo profile mới (Chỉ Admin và Team Lead)

**Request**
```
POST {{base_url}}/api/profiles
Content-Type: application/json

{
  "name": "New Profile",
  "device_group_id": 1,
  "command_list_id": 2,
  "description": "Mô tả về profile mới"
}
```

**Response**
```json
{
  "success": true,
  "message": "Tạo profile thành công",
  "profile": {
    "id": 6,
    "name": "New Profile",
    "description": "Mô tả về profile mới",
    "group_id": 1,
    "group_name": "Factory Floor Devices",
    "list_id": 2,
    "list_name": "Network Checks",
    "created_at": "2023-10-05T15:30:00+00:00",
    "created_by": "admin_user",
    "is_active": true
  }
}
```

### 4. Cập nhật profile (Chỉ Admin và Team Lead)

**Request**
```
PUT {{base_url}}/api/profiles/6
Content-Type: application/json

{
  "name": "Updated Profile Name",
  "description": "Mô tả đã được cập nhật",
  "is_active": true
}
```

**Response**
```json
{
  "success": true,
  "message": "Cập nhật profile thành công",
  "profile": {
    "id": 6,
    "name": "Updated Profile Name",
    "description": "Mô tả đã được cập nhật",
    "group_id": 1,
    "group_name": "Factory Floor Devices",
    "list_id": 2,
    "list_name": "Network Checks",
    "created_at": "2023-10-05T15:30:00+00:00",
    "created_by": "admin_user",
    "is_active": true
  }
}
```

### 5. Xóa profile (Chỉ Admin)

**Request**
```
DELETE {{base_url}}/api/profiles/6
```

**Response**
```json
{
  "success": true,
  "message": "Đã xóa profile thành công"
}
```

### 6. Lấy danh sách người dùng được gán profile

**Request**
```
GET {{base_url}}/api/profiles/1/users
```

**Response**
```json
{
  "success": true,
  "count": 3,
  "users": [
    {
      "id": 1,
      "username": "admin_user",
      "email": "admin@example.com",
      "role": "admin",
      "is_active": true
    },
    // Các users khác
  ]
}
```

### 7. Gán profile cho người dùng (Chỉ Admin và Team Lead)

**Request**
```
POST {{base_url}}/api/profiles/1/users
Content-Type: application/json

{
  "user_id": 3
}
```

**Response**
```json
{
  "success": true,
  "message": "Gán profile cho người dùng thành công"
}
```

### 8. Hủy gán profile cho người dùng (Chỉ Admin và Team Lead)

**Request**
```
DELETE {{base_url}}/api/profiles/1/users/3
```

**Response**
```json
{
  "success": true,
  "message": "Hủy gán profile cho người dùng thành công"
}
```

## Mã lỗi

- **400** - Bad Request: Dữ liệu đầu vào không hợp lệ
- **403** - Forbidden: Không có quyền thực hiện thao tác
- **404** - Not Found: Không tìm thấy tài nguyên
- **500** - Internal Server Error: Lỗi máy chủ

## Lưu ý khi sử dụng
- Đảm bảo rằng token JWT chưa hết hạn (1 giờ)
- Chỉ Admin và Team Lead mới có quyền tạo, cập nhật profile và quản lý user-profile
- Chỉ Admin mới có quyền xóa profile
- Không thể xóa profile nếu đang được gán cho người dùng (sẽ chuyển thành trạng thái không hoạt động) 