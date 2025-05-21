#!/bin/bash

# Thiết lập màu cho terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Khởi động AIoT Monitoring System ===${NC}"

# Kiểm tra Python và Node.js
echo -e "${BLUE}Kiểm tra các yêu cầu hệ thống...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python 3 không được tìm thấy. Vui lòng cài đặt Python 3.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js không được tìm thấy. Vui lòng cài đặt Node.js.${NC}"
    exit 1
fi

# Khởi động Backend
echo -e "${BLUE}Khởi động Backend API (http://localhost:8000)...${NC}"
cd backend

# Kiểm tra và cài đặt python-dotenv trước khi chạy
echo -e "${BLUE}Kiểm tra và cài đặt các gói phụ thuộc cần thiết...${NC}"
python3 -m pip install python-dotenv

# Cài đặt dependencies từ requirements.txt
echo -e "${BLUE}Cài đặt các gói phụ thuộc backend...${NC}"
python3 -m pip install -r requirements.txt

# Chạy backend trong background
echo -e "${BLUE}Chạy backend...${NC}"
python3 start_profiles_api.py &
BACKEND_PID=$!
echo -e "${GREEN}Backend đang chạy với PID: $BACKEND_PID${NC}"

# Khởi động Frontend
echo -e "${BLUE}Khởi động Frontend (http://localhost:3000)...${NC}"
cd ../frontend

# Cài đặt dependencies
echo -e "${BLUE}Cài đặt các gói phụ thuộc frontend...${NC}"
npm install

# Chạy frontend
echo -e "${BLUE}Chạy frontend...${NC}"
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend đang chạy với PID: $FRONTEND_PID${NC}"

echo -e "${GREEN}=== Hệ thống đã khởi động thành công ===${NC}"
echo -e "${GREEN}Backend API: http://localhost:8000${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}Nhấn Ctrl+C để dừng cả hai tiến trình${NC}"

# Hàm xử lý dừng các tiến trình khi nhấn Ctrl+C
function cleanup {
    echo -e "\n${BLUE}Đang dừng các tiến trình...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Đã dừng tất cả tiến trình. Tạm biệt!${NC}"
    exit 0
}

# Đăng ký hàm cleanup cho sự kiện SIGINT (Ctrl+C)
trap cleanup SIGINT

# Giữ script chạy
wait