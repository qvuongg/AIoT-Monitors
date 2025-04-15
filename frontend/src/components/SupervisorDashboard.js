import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SupervisorDashboard = ({ user }) => {
    const [activeSessions, setActiveSessions] = useState([]);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('active'); // 'active' or 'history'
    const navigate = useNavigate();

    useEffect(() => {
        fetchSessions();

        // Set up polling to refresh active sessions every 30 seconds
        const interval = setInterval(() => {
            if (viewMode === 'active') {
                fetchActiveSessions();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [viewMode]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError('');

            // Get active sessions
            const activeResponse = await axios.get('/api/sessions?active_only=true');
            setActiveSessions(activeResponse.data.sessions);

            // Get session history
            const historyResponse = await axios.get('/api/sessions?active_only=false');
            setSessionHistory(historyResponse.data.sessions);
        } catch (err) {
            setError('Failed to load sessions. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveSessions = async () => {
        try {
            const response = await axios.get('/api/sessions?active_only=true');
            setActiveSessions(response.data.sessions);
        } catch (err) {
            console.error('Failed to refresh active sessions:', err);
        }
    };

    const handleViewSession = (sessionId) => {
        navigate(`/sessions/${sessionId}/monitor`);
    };

    const handleTerminateSession = async (sessionId) => {
        try {
            await axios.put(`/api/sessions/${sessionId}`, {
                status: 'terminated'
            });

            // Refresh the sessions list
            fetchActiveSessions();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to terminate session. Please try again.');
        }
    };

    if (loading && activeSessions.length === 0 && sessionHistory.length === 0) {
        return <div className="dashboard-loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <div className="sidebar">
                <h2>AIoT Monitors</h2>
                <div className="user-info">
                    <p>Welcome, {user.username}</p>
                    <p>Role: {user.role}</p>
                </div>
                <ul className="nav-menu">
                    <li className="active">Dashboard</li>
                    <li>Operators</li>
                    <li>Devices</li>
                    <li>Reports</li>
                    <li
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }}
                    >
                        Logout
                    </li>
                </ul>
            </div>
            <div className="main-content">
                <h1>Supervisor Dashboard</h1>

                {error && <div className="error-message">{error}</div>}

                <div className="view-tabs">
                    <button
                        className={`tab-btn ${viewMode === 'active' ? 'active' : ''}`}
                        onClick={() => setViewMode('active')}
                    >
                        Active Sessions
                    </button>
                    <button
                        className={`tab-btn ${viewMode === 'history' ? 'active' : ''}`}
                        onClick={() => setViewMode('history')}
                    >
                        Session History
                    </button>
                </div>

                {viewMode === 'active' ? (
                    <div className="dashboard-section">
                        <h2>Active Sessions</h2>
                        <div className="table-container">
                            {activeSessions.length > 0 ? (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Operator</th>
                                            <th>Device</th>
                                            <th>Started</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeSessions.map(session => (
                                            <tr key={session.id}>
                                                <td>{session.id}</td>
                                                <td>{session.user_name}</td>
                                                <td>{session.device_name}</td>
                                                <td>{new Date(session.start_time).toLocaleString()}</td>
                                                <td>{session.status}</td>
                                                <td className="action-buttons">
                                                    <button
                                                        className="action-btn primary-btn"
                                                        onClick={() => handleViewSession(session.id)}
                                                    >
                                                        Monitor
                                                    </button>
                                                    <button
                                                        className="action-btn danger-btn"
                                                        onClick={() => handleTerminateSession(session.id)}
                                                    >
                                                        Terminate
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No active sessions found.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="dashboard-section">
                        <h2>Session History</h2>
                        <div className="table-container">
                            {sessionHistory.length > 0 ? (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Operator</th>
                                            <th>Device</th>
                                            <th>Started</th>
                                            <th>Ended</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessionHistory.map(session => (
                                            <tr key={session.id}>
                                                <td>{session.id}</td>
                                                <td>{session.user_name}</td>
                                                <td>{session.device_name}</td>
                                                <td>{new Date(session.start_time).toLocaleString()}</td>
                                                <td>{session.end_time ? new Date(session.end_time).toLocaleString() : '-'}</td>
                                                <td>{session.status}</td>
                                                <td>
                                                    <button
                                                        className="action-btn primary-btn"
                                                        onClick={() => handleViewSession(session.id)}
                                                    >
                                                        View Log
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No session history found.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupervisorDashboard; 