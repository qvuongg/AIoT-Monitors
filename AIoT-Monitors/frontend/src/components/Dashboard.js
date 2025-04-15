import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { deviceService, sessionService } from '../services/api';

const Dashboard = ({ user }) => {
    const [devices, setDevices] = useState([]);
    const [unassignedDevices, setUnassignedDevices] = useState([]);
    const [deviceGroups, setDeviceGroups] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch devices, groups, unassigned devices and active sessions for the user
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                // Get devices
                const fetchedDevices = await deviceService.getAllDevices();
                setDevices(fetchedDevices);

                // Get device groups
                const fetchedGroups = await deviceService.getAllGroups();
                setDeviceGroups(fetchedGroups);

                // Get unassigned devices
                const fetchedUnassigned = await deviceService.getUnassignedDevices();
                setUnassignedDevices(fetchedUnassigned);

                // Get active sessions
                const fetchedSessions = await sessionService.getActiveSessions();
                setSessions(fetchedSessions);
            } catch (err) {
                console.error('Dashboard data error:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreateSession = async (deviceId) => {
        try {
            const response = await sessionService.createSession(deviceId);

            if (response.session) {
                // Redirect to session page
                navigate(`/sessions/${response.session.id}`);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create session. Please try again.');
        }
    };

    const handleContinueSession = (sessionId) => {
        navigate(`/sessions/${sessionId}`);
    };

    const handleAddToGroup = async (deviceId) => {
        if (!selectedGroup) {
            setError('Vui lòng chọn một nhóm trước khi gán thiết bị');
            return;
        }

        try {
            setError(''); // Xóa thông báo lỗi trước đó
            const response = await deviceService.addDeviceToGroup(selectedGroup, deviceId);

            // Hiển thị thông báo thành công
            setError(`Thành công: ${response.message}`);

            // Refresh data
            const fetchedDevices = await deviceService.getAllDevices();
            setDevices(fetchedDevices);

            const fetchedUnassigned = await deviceService.getUnassignedDevices();
            setUnassignedDevices(fetchedUnassigned);

            // Xóa group đã chọn sau khi gán thành công
            setSelectedGroup('');
        } catch (err) {
            console.error('Error adding device to group:', err);
            let errorMessage = 'Không thể gán thiết bị vào nhóm. Vui lòng thử lại.';

            // Hiển thị thông báo lỗi từ server nếu có
            if (err.response) {
                if (err.response.status === 403) {
                    errorMessage = `Không được phép: ${err.response.data.error || 'Bạn không có quyền thực hiện thao tác này.'}`;
                } else if (err.response.data && err.response.data.error) {
                    errorMessage = err.response.data.error;
                }
            }

            setError(errorMessage);
        }
    };

    if (loading) {
        return <div className="loading-container">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
                <div className="welcome-message">
                    Chào mừng, <strong>{user?.username}</strong>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="dashboard-section">
                <h2>Phiên Đang Hoạt Động</h2>
                <div className="card">
                    {sessions.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Thiết bị</th>
                                    <th>Bắt đầu</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map(session => (
                                    <tr key={session.id}>
                                        <td>{session.id}</td>
                                        <td>{session.device_name}</td>
                                        <td>{new Date(session.start_time).toLocaleString()}</td>
                                        <td>
                                            <span className={`status-badge ${session.status}`}>
                                                {session.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleContinueSession(session.id)}
                                            >
                                                Tiếp tục
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>Không có phiên hoạt động nào.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-section">
                <h2>Thiết bị Có Sẵn</h2>
                <div className="card">
                    {devices.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tên</th>
                                    <th>Loại</th>
                                    <th>Địa chỉ IP</th>
                                    <th>Nhóm</th>
                                    <th>Người gán</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {devices.map(device => (
                                    <tr key={device.id}>
                                        <td>{device.name}</td>
                                        <td>{device.device_type}</td>
                                        <td>{device.ip_address}</td>
                                        <td>{device.group_name || 'Chưa gán nhóm'}</td>
                                        <td>{device.assigned_by || '—'}</td>
                                        <td>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleCreateSession(device.id)}
                                            >
                                                Kết nối
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>Không có thiết bị nào.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chỉ hiển thị phần này nếu là admin hoặc team_lead và có thiết bị chưa được gán (assigned_by là NULL) */}
            {(user?.role === 'admin' || user?.role === 'team_lead') && unassignedDevices.length > 0 && (
                <div className="dashboard-section">
                    <h2>Thiết bị Chưa Được Gán</h2>

                    {/* Dropdown chọn nhóm */}
                    <div className="form-group my-3">
                        <label htmlFor="groupSelect">Chọn nhóm để gán:</label>
                        <select
                            id="groupSelect"
                            className="form-control"
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                        >
                            <option value="">-- Chọn nhóm --</option>
                            {deviceGroups.map(group => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="card">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tên</th>
                                    <th>Loại</th>
                                    <th>Địa chỉ IP</th>
                                    <th>Nhóm</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unassignedDevices.map(device => (
                                    <tr key={device.id}>
                                        <td>{device.name}</td>
                                        <td>{device.device_type}</td>
                                        <td>{device.ip_address}</td>
                                        <td>{device.group_id ? deviceGroups.find(g => g.id === device.group_id)?.name || 'Loading...' : 'Chưa gán nhóm'}</td>
                                        <td>
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleAddToGroup(device.id)}
                                                disabled={!selectedGroup}
                                            >
                                                {device.group_id ? 'Cập nhật nhóm' : 'Thêm vào nhóm'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard; 