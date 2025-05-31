-- AIoT Monitor Database Schema for PostgreSQL

-- User Roles
CREATE TYPE user_role AS ENUM ('admin', 'team_lead', 'supervisor', 'operator');

-- Session Status
CREATE TYPE session_status AS ENUM ('active', 'completed', 'terminated');

-- Command Status
CREATE TYPE command_status AS ENUM ('success', 'failed', 'pending');

-- Create Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create Device Groups Table
CREATE TABLE device_groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create Devices Table
CREATE TABLE devices (
    device_id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES device_groups(group_id) DEFERRABLE INITIALLY DEFERRED,
    device_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    ssh_port INTEGER DEFAULT 22,
    username VARCHAR(50),
    authentication_method VARCHAR(20) DEFAULT 'key', -- key, password
    last_checked_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'unknown', -- online, offline, unknown
    location VARCHAR(100),
    customer_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_by INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED
);

-- Create Command Lists Table
CREATE TABLE command_lists (
    list_id SERIAL PRIMARY KEY,
    list_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create Commands Table
CREATE TABLE commands (
    command_id SERIAL PRIMARY KEY,
    list_id INTEGER REFERENCES command_lists(list_id) DEFERRABLE INITIALLY DEFERRED,
    command_text TEXT NOT NULL,
    description VARCHAR(255),
    is_dangerous BOOLEAN DEFAULT FALSE,
    requires_confirmation BOOLEAN DEFAULT FALSE,
    is_file_edit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED
);

-- Create Profiles Table (combines command list and device group)
CREATE TABLE profiles (
    profile_id SERIAL PRIMARY KEY,
    profile_name VARCHAR(100) NOT NULL,
    list_id INTEGER REFERENCES command_lists(list_id) DEFERRABLE INITIALLY DEFERRED,
    group_id INTEGER REFERENCES device_groups(group_id) DEFERRABLE INITIALLY DEFERRED,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create User Profile Assignments Table
CREATE TABLE user_profiles (
    assignment_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    profile_id INTEGER REFERENCES profiles(profile_id) DEFERRABLE INITIALLY DEFERRED,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create Sessions Table
CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    device_id INTEGER REFERENCES devices(device_id) DEFERRABLE INITIALLY DEFERRED,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status session_status DEFAULT 'active',
    terminated_by INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Create Command Execution Log Table
CREATE TABLE command_logs (
    log_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(session_id) DEFERRABLE INITIALLY DEFERRED,
    user_id INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    device_id INTEGER REFERENCES devices(device_id) DEFERRABLE INITIALLY DEFERRED,
    command_text TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status command_status,
    output TEXT,
    execution_time INTEGER, -- in milliseconds
    is_approved BOOLEAN
);

-- Create File Edit Log Table
CREATE TABLE file_edit_logs (
    log_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(session_id) DEFERRABLE INITIALLY DEFERRED,
    user_id INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    device_id INTEGER REFERENCES devices(device_id) DEFERRABLE INITIALLY DEFERRED,
    file_path TEXT NOT NULL,
    edit_type VARCHAR(20) NOT NULL, -- create, modify, delete
    edit_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edit_finished_at TIMESTAMP WITH TIME ZONE,
    content_before TEXT,
    content_after TEXT,
    diff TEXT
);

-- Create Scheduled Monitoring Table
CREATE TABLE scheduled_monitoring (
    schedule_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    device_id INTEGER REFERENCES devices(device_id) DEFERRABLE INITIALLY DEFERRED,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Audit Log Table
CREATE TABLE audit_logs (
    audit_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    action_type VARCHAR(50) NOT NULL,
    action_details TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    success BOOLEAN DEFAULT TRUE
);

-- Create Alerts Table
CREATE TABLE alerts (
    alert_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED,
    device_id INTEGER REFERENCES devices(device_id) DEFERRABLE INITIALLY DEFERRED,
    alert_type VARCHAR(50) NOT NULL,
    alert_message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) NOT NULL, -- critical, warning, info
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED
);

-- Create Views

-- Active Sessions View
CREATE VIEW active_sessions_view AS
SELECT 
    s.session_id,
    u.username AS operator_name,
    d.device_name,
    d.ip_address,
    s.start_time,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.start_time))/60 AS duration_minutes,
    s.status
FROM 
    sessions s
JOIN 
    users u ON s.user_id = u.user_id
JOIN 
    devices d ON s.device_id = d.device_id
WHERE 
    s.status = 'active';

-- Historical Sessions View
CREATE VIEW historical_sessions_view AS
SELECT 
    s.session_id,
    u.username AS operator_name,
    d.device_name,
    d.ip_address,
    s.start_time,
    s.end_time,
    EXTRACT(EPOCH FROM (s.end_time - s.start_time))/60 AS duration_minutes,
    s.status,
    u2.username AS terminated_by_user
FROM 
    sessions s
JOIN 
    users u ON s.user_id = u.user_id
JOIN 
    devices d ON s.device_id = d.device_id
LEFT JOIN 
    users u2 ON s.terminated_by = u2.user_id
WHERE 
    s.status != 'active';

-- Command History View
CREATE VIEW command_history_view AS
SELECT 
    cl.log_id,
    u.username,
    d.device_name,
    cl.command_text,
    cl.executed_at,
    cl.status,
    cl.execution_time,
    cl.is_approved
FROM 
    command_logs cl
JOIN 
    users u ON cl.user_id = u.user_id
JOIN 
    devices d ON cl.device_id = d.device_id
ORDER BY 
    cl.executed_at DESC;

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_device_id ON sessions(device_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_command_logs_session_id ON command_logs(session_id);
CREATE INDEX idx_command_logs_user_id ON command_logs(user_id);
CREATE INDEX idx_command_logs_device_id ON command_logs(device_id);
CREATE INDEX idx_command_logs_executed_at ON command_logs(executed_at);
CREATE INDEX idx_devices_group_id ON devices(group_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_devices_assigned_by ON devices(assigned_by);

-- Self-reference foreign key for users.created_by (add after table is created)
ALTER TABLE users ADD CONSTRAINT users_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(user_id) DEFERRABLE INITIALLY DEFERRED;

-- Dữ liệu mẫu cho bảng users
-- AIoT Monitor Sample Data

BEGIN;

-- Users (must come first due to foreign key references)
INSERT INTO users (username, password_hash, role, email, phone, created_by, is_active) VALUES
('admin_user', 'hash_admin_123', 'admin', 'admin@example.com', '0123456789', NULL, TRUE);

-- Insert additional users now that admin_user exists with ID 1
INSERT INTO users (username, password_hash, role, email, phone, created_by, is_active) VALUES
('team_lead1', 'hash_lead_123', 'team_lead', 'lead1@example.com', '0123456790', 1, TRUE),
('team_lead2', 'hash_lead_456', 'team_lead', 'lead2@example.com', '0123456791', 1, TRUE);

-- Insert supervisors now that team leads exist
INSERT INTO users (username, password_hash, role, email, phone, created_by, is_active) VALUES
('supervisor1', 'hash_sup_123', 'supervisor', 'supervisor1@example.com', '0123456792', 2, TRUE),
('supervisor2', 'hash_sup_456', 'supervisor', 'supervisor2@example.com', '0123456793', 2, TRUE);

-- Insert operators now that supervisors exist
INSERT INTO users (username, password_hash, role, email, phone, created_by, is_active) VALUES
('operator1', 'hash_op_123', 'operator', 'operator1@example.com', '0123456794', 3, TRUE),
('operator2', 'hash_op_456', 'operator', 'operator2@example.com', '0123456795', 3, TRUE),
('operator3', 'hash_op_789', 'operator', 'operator3@example.com', '0123456796', 4, TRUE),
('inactive_user', 'hash_inactive', 'operator', 'inactive@example.com', '0123456797', 1, FALSE);

-- Device Groups
INSERT INTO device_groups (group_name, description, created_by, is_active) VALUES
('Factory Floor Devices', 'IoT devices on the factory production floor', 1, TRUE),
('Office Building', 'Smart devices in the main office building', 1, TRUE),
('Warehouse Sensors', 'Temperature and humidity sensors in the warehouse', 2, TRUE),
('Remote Monitoring', 'Remote field monitoring devices', 2, TRUE),
('Development Testing', 'Devices used for testing and development', 1, FALSE);

-- Devices
INSERT INTO devices (group_id, device_name, ip_address, device_type, ssh_port, username, authentication_method, last_checked_at, status, location, customer_id, created_by, is_active, assigned_by) VALUES
(1, 'Factory Temp Sensor 1', '10.0.1.1', 'temperature_sensor', 22, 'device_user', 'key', NOW() - INTERVAL '1 hour', 'online', 'North Wing', 'CUST001', 1, TRUE, 1),
(1, 'Factory Humidity Sensor 1', '192.168.1.102', 'humidity_sensor', 22, 'device_user', 'key', NOW() - INTERVAL '2 hour', 'online', 'North Wing', 'CUST001', 1, TRUE, 1),
(1, 'Factory Controller 1', '10.0.1.2', 'controller', 22, 'admin_device', 'password', NOW() - INTERVAL '30 minutes', 'online', 'Control Room', 'CUST001', 1, TRUE, 1),
(2, 'Office HVAC Controller', '192.168.2.101', 'hvac_controller', 22, 'hvac_admin', 'key', NOW() - INTERVAL '45 minutes', 'online', 'Main Office', 'CUST002', 2, TRUE, 2),
(2, 'Reception Area Monitor', '192.168.2.102', 'environment_monitor', 22, 'monitor_user', 'key', NOW() - INTERVAL '3 hours', 'offline', 'Reception', 'CUST002', 2, TRUE, 2),
(3, 'Warehouse Temp 1', '192.168.3.101', 'temperature_sensor', 22, 'warehouse_user', 'key', NOW() - INTERVAL '15 minutes', 'online', 'Warehouse A', 'CUST003', 3, TRUE, 3),
(3, 'Warehouse Temp 2', '192.168.3.102', 'temperature_sensor', 22, 'warehouse_user', 'key', NOW() - INTERVAL '15 minutes', 'online', 'Warehouse B', 'CUST003', 3, TRUE, 3),
(4, 'Field Sensor Alpha', '10.0.0.101', 'field_monitor', 22, 'field_user', 'key', NOW() - INTERVAL '1 day', 'unknown', 'Field Site 1', 'CUST004', 4, TRUE, 4),
(5, 'Test Device 1', '10.10.10.101', 'test_device', 22, 'test_user', 'password', NOW() - INTERVAL '5 days', 'offline', 'Lab', 'INTERNAL', 1, FALSE, 1);

-- Command Lists
INSERT INTO command_lists (list_name, description, created_by, is_active) VALUES
('System Diagnostics', 'Basic system diagnostic commands', 1, TRUE),
('Network Checks', 'Network connectivity check commands', 1, TRUE),
('Temperature Controls', 'Commands for temperature device management', 2, TRUE),
('Maintenance Tasks', 'System maintenance and cleanup commands', 2, TRUE),
('Advanced Operations', 'Advanced system operation commands', 1, TRUE);

-- Commands
INSERT INTO commands (list_id, command_text, description, is_dangerous, requires_confirmation, is_file_edit, created_by) VALUES
-- List 1: System Diagnostics
(1, 'mkdir -p /tmp/aiot_test', 'Tạo thư mục cha /tmp/aiot_test', FALSE, FALSE, TRUE, 1),
(1, 'touch /tmp/aiot_test/test1.txt', 'Tạo file test1.txt', FALSE, FALSE, TRUE, 1),
(1, 'echo "Hello AIoT" > /tmp/aiot_test/test1.txt', 'Ghi nội dung vào test1.txt', FALSE, FALSE, TRUE, 1),
(1, 'cat /tmp/aiot_test/test1.txt', 'Xem nội dung test1.txt', FALSE, FALSE, TRUE, 1),

-- List 2: Network Checks
(2, 'mkdir -p /tmp/aiot_test', 'Tạo thư mục cha /tmp/aiot_test', FALSE, FALSE, TRUE, 1),
(2, 'touch /tmp/aiot_test/network.txt', 'Tạo file network.txt', FALSE, FALSE, TRUE, 1),
(2, 'echo "Network config" > /tmp/aiot_test/network.txt', 'Ghi nội dung vào network.txt', FALSE, FALSE, TRUE, 1),
(2, 'cat /tmp/aiot_test/network.txt', 'Xem nội dung network.txt', FALSE, FALSE, TRUE, 1),

-- List 3: Temperature Controls
(3, 'mkdir -p /tmp/aiot_test', 'Tạo thư mục cha /tmp/aiot_test', FALSE, FALSE, TRUE, 1),
(3, 'touch /tmp/aiot_test/temp.txt', 'Tạo file temp.txt', FALSE, FALSE, TRUE, 1),
(3, 'echo "Temperature: 25C" > /tmp/aiot_test/temp.txt', 'Ghi nhiệt độ vào temp.txt', FALSE, FALSE, TRUE, 1),
(3, 'cat /tmp/aiot_test/temp.txt', 'Xem nội dung temp.txt', FALSE, FALSE, TRUE, 1),

-- List 4: Maintenance Tasks
(4, 'mkdir -p /tmp/aiot_test', 'Tạo thư mục cha /tmp/aiot_test', FALSE, FALSE, TRUE, 1),
(4, 'touch /tmp/aiot_test/maintain.txt', 'Tạo file maintain.txt', FALSE, FALSE, TRUE, 1),
(4, 'echo "Maintenance log" > /tmp/aiot_test/maintain.txt', 'Ghi log bảo trì vào maintain.txt', FALSE, FALSE, TRUE, 1),
(4, 'cat /tmp/aiot_test/maintain.txt', 'Xem nội dung maintain.txt', FALSE, FALSE, TRUE, 1),

-- List 5: Advanced Operations
(5, 'mkdir -p /tmp/aiot_test', 'Tạo thư mục cha /tmp/aiot_test', FALSE, FALSE, TRUE, 1),
(5, 'touch /tmp/aiot_test/advanced.txt', 'Tạo file advanced.txt', FALSE, FALSE, TRUE, 1),
(5, 'echo "Advanced operation" > /tmp/aiot_test/advanced.txt', 'Ghi nội dung vào advanced.txt', FALSE, FALSE, TRUE, 1),
(5, 'cat /tmp/aiot_test/advanced.txt', 'Xem nội dung advanced.txt', FALSE, FALSE, TRUE, 1);

-- Profiles
INSERT INTO profiles (profile_name, list_id, group_id, description, created_by, is_active) VALUES
('Factory Operations', 1, 1, 'Basic factory floor device operations', 1, TRUE),
('Office Maintenance', 4, 2, 'Office device maintenance', 2, TRUE),
('Warehouse Monitoring', 3, 3, 'Temperature monitoring for warehouse', 2, TRUE),
('Remote Diagnostics', 2, 4, 'Network diagnostics for remote devices', 1, TRUE),
('Advanced Factory Control', 5, 1, 'Advanced operations for factory devices', 1, TRUE);

-- User Profile Assignments
INSERT INTO user_profiles (user_id, profile_id, assigned_by, is_active) VALUES
(1, 1, 1, TRUE),
(1, 5, 1, TRUE),
(2, 1, 1, TRUE),
(2, 2, 1, TRUE),
(3, 3, 1, TRUE),
(3, 4, 1, TRUE),
(4, 1, 2, TRUE),
(5, 2, 2, TRUE),
(6, 1, 3, TRUE),
(7, 3, 3, TRUE),
(8, 4, 4, TRUE);

-- Sessions
INSERT INTO sessions (user_id, device_id, start_time, end_time, status, terminated_by, ip_address, user_agent) VALUES
(6, 1, NOW() - INTERVAL '2 hour', NOW() - INTERVAL '1 hour 30 minutes', 'completed', NULL, '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/90.0.4430.212'),
(7, 6, NOW() - INTERVAL '3 hour', NOW() - INTERVAL '2 hour 45 minutes', 'completed', NULL, '10.0.0.51', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/88.0'),
(4, 3, NOW() - INTERVAL '1 hour', NULL, 'active', NULL, '10.0.0.52', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'),
(6, 2, NOW() - INTERVAL '30 minutes', NULL, 'active', NULL, '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/90.0.4430.212'),
(8, 8, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours', 'completed', NULL, '10.0.0.53', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/90.0.864.48'),
(5, 4, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 50 minutes', 'terminated', 2, '10.0.0.54', 'Mozilla/5.0 (Linux; Android 11) Chrome/90.0.4430.210');

-- Command Execution Logs
INSERT INTO command_logs (session_id, user_id, device_id, command_text, executed_at, status, output, execution_time, is_approved) VALUES
(1, 6, 1, 'uptime', NOW() - INTERVAL '1 hour 45 minutes', 'success', '14:23:18 up 23 days, 5:17, 2 users, load average: 0.09, 0.04, 0.02', 120, TRUE),
(1, 6, 1, 'df -h', NOW() - INTERVAL '1 hour 40 minutes', 'success', 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       30G   15G   15G  50% /', 95, TRUE),
(2, 7, 6, 'cat /sys/class/thermal/thermal_zone0/temp', NOW() - INTERVAL '2 hour 50 minutes', 'success', '45600', 85, TRUE),
(3, 4, 3, 'service nginx status', NOW() - INTERVAL '45 minutes', 'success', 'nginx is running', 150, TRUE),
(4, 6, 2, 'free -m', NOW() - INTERVAL '25 minutes', 'success', '              total        used        free      shared  buff/cache   available\nMem:           7982        3521        2196         356        2265        4104\nSwap:          2047           0        2047', 110, TRUE),
(4, 6, 2, 'ping -c 4 google.com', NOW() - INTERVAL '20 minutes', 'success', 'PING google.com (142.250.74.78): 56 data bytes\n64 bytes from 142.250.74.78: icmp_seq=0 ttl=116 time=15.321 ms\n64 bytes from 142.250.74.78: icmp_seq=1 ttl=116 time=14.873 ms\n64 bytes from 142.250.74.78: icmp_seq=2 ttl=116 time=15.058 ms\n64 bytes from 142.250.74.78: icmp_seq=3 ttl=116 time=14.692 ms\n\n--- google.com ping statistics ---\n4 packets transmitted, 4 packets received, 0.0% packet loss\nround-trip min/avg/max/stddev = 14.692/14.986/15.321/0.236 ms', 4200, TRUE),
(5, 8, 8, 'ifconfig', NOW() - INTERVAL '3 hours 30 minutes', 'success', 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 10.0.0.101  netmask 255.255.255.0  broadcast 10.0.0.255\n        inet6 fe80::215:5dff:fe01:1a1a  prefixlen 64  scopeid 0x20<link>\n        ether 00:15:5d:01:1a:1a  txqueuelen 1000  (Ethernet)\n        RX packets 12872  bytes 13487654 (13.4 MB)\n        RX errors 0  dropped 0  overruns 0  frame 0\n        TX packets 8284  bytes 1070440 (1.0 MB)\n        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0', 130, TRUE),
(6, 5, 4, 'echo "1" > /sys/devices/system/cpu/cpufreq/boost', NOW() - INTERVAL '5 hours', 'failed', 'Permission denied', 75, FALSE);

-- File Edit Logs
INSERT INTO file_edit_logs (session_id, user_id, device_id, file_path, edit_type, edit_started_at, edit_finished_at, content_before, content_after, diff) VALUES
(1, 6, 1, '/etc/nginx/nginx.conf', 'modify', NOW() - INTERVAL '1 hour 35 minutes', NOW() - INTERVAL '1 hour 33 minutes', 'worker_processes 1;', 'worker_processes 2;', '@@ -1 +1 @@\n-worker_processes 1;\n+worker_processes 2;'),
(3, 4, 3, '/etc/hosts', 'modify', NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '39 minutes', '127.0.0.1 localhost', '127.0.0.1 localhost\n192.168.1.105 new-device', '@@ -1 +1,2 @@\n 127.0.0.1 localhost\n+192.168.1.105 new-device'),
(5, 8, 8, '/var/www/html/index.html', 'create', NOW() - INTERVAL '3 hours 40 minutes', NOW() - INTERVAL '3 hours 38 minutes', NULL, '<!DOCTYPE html>\n<html>\n<head>\n<title>Welcome</title>\n</head>\n<body>\n<h1>Welcome to IoT Monitor</h1>\n</body>\n</html>', NULL);

-- Scheduled Monitoring
INSERT INTO scheduled_monitoring (user_id, device_id, scheduled_time, completed, completed_at, notes, created_by, created_at) VALUES
(4, 1, NOW() + INTERVAL '1 day', FALSE, NULL, 'Regular weekly check', 2, NOW() - INTERVAL '2 days'),
(5, 4, NOW() + INTERVAL '2 days', FALSE, NULL, 'Check HVAC system after reported issues', 2, NOW() - INTERVAL '1 day'),
(6, 6, NOW() - INTERVAL '1 day', TRUE, NOW() - INTERVAL '23 hours', 'Temperature anomaly investigation', 3, NOW() - INTERVAL '2 days'),
(7, 3, NOW() + INTERVAL '3 days', FALSE, NULL, 'Routine maintenance', 3, NOW() - INTERVAL '12 hours');

-- Audit Logs
INSERT INTO audit_logs (user_id, action_type, action_details, performed_at, ip_address, success) VALUES
(1, 'user_create', 'Created user: operator3', NOW() - INTERVAL '10 days', '10.0.0.10', TRUE),
(1, 'device_group_create', 'Created device group: Factory Floor Devices', NOW() - INTERVAL '15 days', '10.0.0.10', TRUE),
(2, 'device_add', 'Added device: Factory Temp Sensor 1', NOW() - INTERVAL '14 days', '10.0.0.11', TRUE),
(1, 'user_role_change', 'Changed user role for supervisor1 from operator to supervisor', NOW() - INTERVAL '5 days', '10.0.0.10', TRUE),
(3, 'login_attempt', 'Login attempt', NOW() - INTERVAL '2 days', '10.0.0.12', TRUE),
(7, 'login_attempt', 'Login attempt', NOW() - INTERVAL '1 day', '10.0.0.13', FALSE),
(4, 'device_status_update', 'Updated status for device: Office HVAC Controller', NOW() - INTERVAL '12 hours', '10.0.0.52', TRUE);

-- Alerts
INSERT INTO alerts (user_id, device_id, alert_type, alert_message, created_at, severity, is_resolved, resolved_at, resolved_by) VALUES
(NULL, 2, 'connection_lost', 'Connection to Factory Humidity Sensor 1 lost', NOW() - INTERVAL '5 hours', 'warning', TRUE, NOW() - INTERVAL '4 hours', 4),
(NULL, 5, 'connection_lost', 'Connection to Reception Area Monitor lost', NOW() - INTERVAL '3 hours', 'warning', FALSE, NULL, NULL),
(NULL, 6, 'high_temperature', 'Temperature exceeded threshold: 32°C', NOW() - INTERVAL '6 hours', 'critical', TRUE, NOW() - INTERVAL '5 hours 30 minutes', 7),
(NULL, 3, 'disk_space_low', 'Disk space below 15%', NOW() - INTERVAL '2 days', 'warning', TRUE, NOW() - INTERVAL '1 day', 4),
(NULL, 8, 'battery_low', 'Battery level below 20%', NOW() - INTERVAL '4 hours', 'info', FALSE, NULL, NULL);

COMMIT;

-- Cập nhật devices đã tồn tại với giá trị null (chưa được gán)
COMMENT ON COLUMN devices.assigned_by IS 'ID người dùng đã gán thiết bị vào nhóm, khác với created_by là người tạo thiết bị'; 

