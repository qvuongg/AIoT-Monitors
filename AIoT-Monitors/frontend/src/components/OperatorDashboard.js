import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService, deviceService, sessionService, commandService } from '../services/api';

const OperatorDashboard = ({ user }) => {
    const [assignedProfiles, setAssignedProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [devices, setDevices] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [commands, setCommands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch assigned profiles for the current operator
    useEffect(() => {
        const fetchAssignedProfiles = async () => {
            try {
                setLoading(true);
                setError('');

                // Sử dụng profileService để lấy profiles được gán cho user hiện tại
                const profiles = await profileService.getUserProfiles(user.id);
                setAssignedProfiles(profiles);
            } catch (err) {
                console.error('Error fetching assigned profiles:', err);
                setError('Không thể tải danh sách profiles. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        if (user && user.id) {
            fetchAssignedProfiles();
        }
    }, [user]);

    // Fetch devices, sessions, and commands when a profile is selected
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!selectedProfile) return;

            try {
                setLoading(true);
                setError('');

                // 1. Fetch devices in the device groups of the selected profile
                const deviceGroupId = selectedProfile.group_id;
                const fetchedDevices = await deviceService.getGroupDevices(deviceGroupId);
                setDevices(fetchedDevices);

                // 2. Fetch active sessions for these devices
                const allSessions = await sessionService.getActiveSessions();
                const relevantSessions = allSessions.filter(session =>
                    fetchedDevices.some(device => device.id === session.device_id)
                );
                setSessions(relevantSessions);

                // 3. Fetch commands from command lists of the selected profile
                const commandListId = selectedProfile.list_id;
                const commandsResponse = await commandService.getListCommands(commandListId);
                setCommands(commandsResponse);

            } catch (err) {
                console.error('Error fetching profile data:', err);
                setError('Không thể tải dữ liệu profile. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [selectedProfile]);

    const handleProfileSelect = (profile) => {
        setSelectedProfile(profile);
    };

    const handleSessionClick = (sessionId) => {
        navigate(`/sessions/${sessionId}`);
    };

    const handleCreateSession = async (deviceId) => {
        try {
            const response = await sessionService.createSession(deviceId);
            if (response.session) {
                navigate(`/sessions/${response.session.id}`);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Không thể tạo phiên. Vui lòng thử lại.');
        }
    };

    if (loading && !selectedProfile) {
        return <div className="loading">Đang tải...</div>;
    }

    return (
        <div className="operator-dashboard">
            <h1>Operator Dashboard</h1>

            {error && <div className="error-message">{error}</div>}

            <div className="dashboard-container">
                <div className="profiles-section">
                    <h2>Profiles được gán</h2>
                    {assignedProfiles.length === 0 ? (
                        <p>Không có profile nào được gán cho bạn.</p>
                    ) : (
                        <ul className="profile-list">
                            {assignedProfiles.map(profile => (
                                <li
                                    key={profile.id}
                                    className={selectedProfile && selectedProfile.id === profile.id ? 'selected' : ''}
                                    onClick={() => handleProfileSelect(profile)}
                                >
                                    <h3>{profile.name}</h3>
                                    <p>{profile.description}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {selectedProfile && (
                    <div className="profile-details">
                        <h2>Chi tiết Profile: {selectedProfile.name}</h2>

                        <div className="devices-section">
                            <h3>Thiết bị</h3>
                            {devices.length === 0 ? (
                                <p>Không có thiết bị nào trong nhóm này.</p>
                            ) : (
                                <table className="devices-table">
                                    <thead>
                                        <tr>
                                            <th>Tên thiết bị</th>
                                            <th>IP</th>
                                            <th>Trạng thái</th>
                                            <th>Phiên hiện tại</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {devices.map(device => {
                                            const deviceSession = sessions.find(s => s.device_id === device.id);
                                            return (
                                                <tr key={device.id}>
                                                    <td>{device.name || device.device_name}</td>
                                                    <td>{device.ip_address}</td>
                                                    <td>{device.status || 'Unknown'}</td>
                                                    <td>
                                                        {deviceSession ? (
                                                            <button
                                                                className="session-button active"
                                                                onClick={() => handleSessionClick(deviceSession.id)}
                                                            >
                                                                Phiên #{deviceSession.id}
                                                            </button>
                                                        ) : 'Không có phiên'}
                                                    </td>
                                                    <td>
                                                        {!deviceSession && (
                                                            <button
                                                                className="create-session-button"
                                                                onClick={() => handleCreateSession(device.id)}
                                                            >
                                                                Tạo phiên mới
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="commands-section">
                            <h3>Lệnh được phép</h3>
                            {commands.length === 0 ? (
                                <p>Không có lệnh nào trong danh sách này.</p>
                            ) : (
                                <ul className="command-list">
                                    {commands.map(command => (
                                        <li key={command.id} className="command-item">
                                            <code>{command.command}</code>
                                            <p>{command.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperatorDashboard;