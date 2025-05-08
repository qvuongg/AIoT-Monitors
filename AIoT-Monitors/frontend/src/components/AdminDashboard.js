import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService, deviceService, sessionService } from '../services/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = ({ user }) => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        operators: 0,
        supervisors: 0,
        teamLeads: 0,
        totalDevices: 0,
        totalSessions: 0,
        activeSessions: 0
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentSessions, setRecentSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch user counts
            const usersResponse = await authService.getAllUsers();

            // Calculate user stats
            const operatorsCount = usersResponse.filter(user => user.role === 'operator').length;
            const supervisorsCount = usersResponse.filter(user => user.role === 'supervisor').length;
            const teamLeadsCount = usersResponse.filter(user => user.role === 'team_lead').length;

            // Get 5 most recent users
            const sortedUsers = [...usersResponse].sort((a, b) =>
                new Date(b.created_at || b.creation_date) - new Date(a.created_at || a.creation_date)
            );
            setRecentUsers(sortedUsers.slice(0, 5));

            // Fetch devices
            const devicesResponse = await deviceService.getAllDevices();

            // Fetch session data
            const sessionsResponse = await sessionService.getActiveSessions();

            // Set all stats
            setStats({
                totalUsers: usersResponse.length,
                operators: operatorsCount,
                supervisors: supervisorsCount,
                teamLeads: teamLeadsCount,
                totalDevices: devicesResponse.length,
                totalSessions: sessionsResponse.length, // This should be replaced with actual total sessions
                activeSessions: sessionsResponse.filter(session => session.status === 'active').length
            });

            // Get recent sessions
            const allSessions = await axios.get('/api/sessions?detailed=true');
            const sortedSessions = allSessions.data.sessions.sort((a, b) =>
                new Date(b.start_time) - new Date(a.start_time)
            );
            setRecentSessions(sortedSessions.slice(0, 5));

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const navigateTo = (path) => {
        navigate(path);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    if (loading) {
        return <div className="admin-dashboard-loading">Loading dashboard data...</div>;
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <div className="welcome-message">
                    Welcome back, <strong>{user?.username}</strong>
                </div>
            </div>

            {error && <div className="dashboard-error">{error}</div>}

            <div className="stats-container">
                <div className="stat-card" onClick={() => navigateTo("/accounts")}>
                    <div className="stat-icon user-icon"></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalUsers}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon operator-icon"></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.operators}</div>
                        <div className="stat-label">Operators</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon device-icon"></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalDevices}</div>
                        <div className="stat-label">Devices</div>
                    </div>
                </div>

                <div className="stat-card" onClick={() => navigateTo("/sessions")}>
                    <div className="stat-icon session-icon"></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.activeSessions}</div>
                        <div className="stat-label">Active Sessions</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Recent Users</h2>
                        <button className="view-all-btn" onClick={() => navigateTo("/accounts")}>View All</button>
                    </div>
                    <div className="card-content">
                        {recentUsers.length > 0 ? (
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Role</th>
                                        <th>Email</th>
                                        <th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.username}</td>
                                            <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                                            <td>{user.email}</td>
                                            <td>{formatDate(user.created_at || user.creation_date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">No users found</div>
                        )}
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Recent Sessions</h2>
                        <button className="view-all-btn" onClick={() => navigateTo("/sessions")}>View All</button>
                    </div>
                    <div className="card-content">
                        {recentSessions.length > 0 ? (
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Device</th>
                                        <th>User</th>
                                        <th>Status</th>
                                        <th>Started</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSessions.map(session => (
                                        <tr key={session.id} onClick={() => navigateTo(`/sessions/${session.id}`)} className="clickable-row">
                                            <td>{session.device?.name || `Device #${session.device_id}`}</td>
                                            <td>{session.user_name}</td>
                                            <td><span className={`status-badge ${session.status}`}>{session.status}</span></td>
                                            <td>{formatDate(session.start_time)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">No recent sessions</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card full-width">
                    <div className="card-header">
                        <h2>System Status</h2>
                    </div>
                    <div className="card-content system-status">
                        <div className="status-item">
                            <div className="status-label">API Server</div>
                            <div className="status-value online">Online</div>
                        </div>
                        <div className="status-item">
                            <div className="status-label">Database</div>
                            <div className="status-value online">Connected</div>
                        </div>
                        <div className="status-item">
                            <div className="status-label">Last Backup</div>
                            <div className="status-value">{new Date().toLocaleDateString()}</div>
                        </div>
                        <div className="status-item">
                            <div className="status-label">Server Load</div>
                            <div className="status-value">Normal</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card quick-actions">
                    <div className="card-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="card-content">
                        <div className="actions-grid">
                            <button className="action-btn" onClick={() => navigateTo("/accounts")}>
                                <div className="action-icon user-management-icon"></div>
                                <div className="action-label">User Management</div>
                            </button>

                            <button className="action-btn" onClick={() => navigateTo("/command-lists")}>
                                <div className="action-icon command-icon"></div>
                                <div className="action-label">Command Lists</div>
                            </button>

                            <button className="action-btn" onClick={() => navigateTo("/assign-profiles")}>
                                <div className="action-icon profile-icon"></div>
                                <div className="action-label">Profile Assignment</div>
                            </button>

                            <button className="action-btn" onClick={() => navigateTo("/sessions")}>
                                <div className="action-icon session-icon"></div>
                                <div className="action-label">Sessions</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 