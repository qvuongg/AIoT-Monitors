import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { deviceService, sessionService, profileService } from '../services/api';

const Dashboard = ({ user }) => {
    const [devices, setDevices] = useState([]);
    const [unassignedDevices, setUnassignedDevices] = useState([]);
    const [deviceGroups, setDeviceGroups] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [userProfiles, setUserProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [fileEdits, setFileEdits] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;
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

                // Get user profiles
                if (user && user.id && user.role === 'operator') {
                    const fetchedProfiles = await profileService.getUserProfiles(user.id);
                    setUserProfiles(fetchedProfiles);
                } else {
                    setUserProfiles({ profiles: [], active_sessions: [] });
                }

                if (user.is_supervisor) {
                    fetchFileEdits();
                }
            } catch (err) {
                console.error('Dashboard data error:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

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

    const fetchFileEdits = async () => {
        try {
            setLoading(true);
            const offset = (page - 1) * limit;
            const response = await axios.get(`/api/sessions/file-edits?limit=${limit}&offset=${offset}`);
            setFileEdits(response.data.file_edits);
            setTotalPages(Math.ceil(response.data.total / limit));
            setError(null);
        } catch (err) {
            setError('Failed to fetch file edit logs');
            console.error('Error fetching file edits:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderFileEdits = () => {
        if (loading) return <div>Loading file edit logs...</div>;
        if (error) return <div className="error">{error}</div>;
        if (fileEdits.length === 0) return <div>No file edits found</div>;

        return (
            <div className="file-edits-section">
                <h2>File Edit Logs</h2>
                <div className="table-container">
                    <table className="file-edits-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Device</th>
                                <th>File Path</th>
                                <th>Edit Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fileEdits.map(edit => (
                                <tr key={edit.id}>
                                    <td>{new Date(edit.edit_started_at).toLocaleString()}</td>
                                    <td>{edit.user}</td>
                                    <td>{edit.device?.name || 'Unknown'}</td>
                                    <td>{edit.file_path}</td>
                                    <td>{edit.edit_type}</td>
                                    <td>
                                        <button
                                            onClick={() => showFileEditDetails(edit)}
                                            className="btn btn-info btn-sm"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const showFileEditDetails = (edit) => {
        // Hiển thị modal với chi tiết của file edit
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>File Edit Details</h3>
                <p><strong>Time:</strong> ${new Date(edit.edit_started_at).toLocaleString()}</p>
                <p><strong>User:</strong> ${edit.user}</p>
                <p><strong>Device:</strong> ${edit.device?.name || 'Unknown'}</p>
                <p><strong>File Path:</strong> ${edit.file_path}</p>
                <p><strong>Edit Type:</strong> ${edit.edit_type}</p>
                <div class="file-content">
                    <div class="content-before">
                        <h4>Before</h4>
                        <pre>${edit.content_before || 'No content'}</pre>
                    </div>
                    <div class="content-after">
                        <h4>After</h4>
                        <pre>${edit.content_after || 'No content'}</pre>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    };

    // Inline CSS cho dashboard thiết bị
    const deviceGridStyles = {
        deviceGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px',
            marginTop: '10px'
        },
        deviceContainer: {
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            backgroundColor: '#f9f9f9'
        },
        deviceGroupTitle: {
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '10px',
            borderBottom: '1px solid #eee',
            paddingBottom: '8px'
        },
        deviceCards: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '10px'
        },
        deviceCard: {
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #eee'
        },
        deviceCardOnline: {
            borderLeft: '4px solid #4CAF50'
        },
        deviceCardOffline: {
            borderLeft: '4px solid #F44336'
        },
        deviceCardUnknown: {
            borderLeft: '4px solid #9E9E9E'
        },
        deviceName: {
            fontWeight: 'bold',
            marginBottom: '5px'
        },
        deviceIp: {
            fontSize: '13px',
            color: '#666'
        },
        deviceStatus: {
            position: 'absolute',
            top: '8px',
            right: '8px',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: 'bold'
        },
        statusOnline: {
            backgroundColor: '#E8F5E9',
            color: '#4CAF50'
        },
        statusOffline: {
            backgroundColor: '#FFEBEE',
            color: '#F44336'
        },
        statusUnknown: {
            backgroundColor: '#EEEEEE',
            color: '#9E9E9E'
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

            {user?.role === 'operator' ? (
                <div className="dashboard-section">
                    <h2>Profiles của bạn</h2>
                    <div className="card">
                        {userProfiles.profiles && userProfiles.profiles.length > 0 ? (
                            <div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Tên Profile</th>
                                            <th>Mô tả</th>
                                            <th>Nhóm thiết bị</th>
                                            <th>Danh sách lệnh</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userProfiles.profiles.map(profile => (
                                            <tr key={profile.id}>
                                                <td>{profile.name}</td>
                                                <td>{profile.description || 'N/A'}</td>
                                                <td>{profile.group_name || profile.group_id}</td>
                                                <td>{profile.list_name || profile.list_id}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Hiển thị thiết bị cho mỗi profile */}
                                {userProfiles.profiles.some(profile => profile.devices && profile.devices.length > 0) && (
                                    <div className="mt-4">
                                        <h3 className="dashboard-subtitle">Thiết bị trong Profile</h3>
                                        <div style={deviceGridStyles.deviceGrid}>
                                            {userProfiles.profiles.map(profile => (
                                                profile.devices && profile.devices.length > 0 && (
                                                    <div key={`devices-${profile.id}`} style={deviceGridStyles.deviceContainer}>
                                                        <div style={deviceGridStyles.deviceGroupTitle}>{profile.group_name}</div>
                                                        <div style={deviceGridStyles.deviceCards}>
                                                            {profile.devices.map(device => (
                                                                <div
                                                                    key={device.id}
                                                                    style={{
                                                                        ...deviceGridStyles.deviceCard,
                                                                        ...(device.status === 'online'
                                                                            ? deviceGridStyles.deviceCardOnline
                                                                            : device.status === 'offline'
                                                                                ? deviceGridStyles.deviceCardOffline
                                                                                : deviceGridStyles.deviceCardUnknown)
                                                                    }}
                                                                >
                                                                    <div style={deviceGridStyles.deviceName}>{device.name || device.device_name}</div>
                                                                    <div style={deviceGridStyles.deviceIp}>{device.ip_address}</div>
                                                                    <div
                                                                        style={{
                                                                            ...deviceGridStyles.deviceStatus,
                                                                            ...(device.status === 'online'
                                                                                ? deviceGridStyles.statusOnline
                                                                                : device.status === 'offline'
                                                                                    ? deviceGridStyles.statusOffline
                                                                                    : deviceGridStyles.statusUnknown)
                                                                        }}
                                                                    >
                                                                        {device.status}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>Bạn chưa được gán profile nào.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Thêm phần hiển thị phiên hoạt động nếu có */}
            {userProfiles.active_sessions && userProfiles.active_sessions.length > 0 && (
                <div className="dashboard-section">
                    <h2>Phiên Đang Hoạt Động</h2>
                    <div className="card">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Thiết bị</th>
                                    <th>Địa chỉ IP</th>
                                    <th>Bắt đầu</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userProfiles.active_sessions.map(session => (
                                    <tr key={session.id}>
                                        <td>{session.id}</td>
                                        <td>{session.device_name}</td>
                                        <td>{session.ip_address}</td>
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
                    </div>
                </div>
            )}

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

            {/* File Edit Logs section for supervisors */}
            {user.is_supervisor && renderFileEdits()}
        </div>
    );
};

export default Dashboard; 