import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { deviceService, profileService, commandService } from '../services/api';
import '../styles/TeamLeadDashboard.css';

const TeamLeadDashboard = ({ user }) => {
    const [stats, setStats] = useState({
        totalProfiles: 0,
        totalCommandLists: 0,
        totalDevices: 0,
        devicesInGroups: 0,
        operators: []
    });
    const [profiles, setProfiles] = useState([]);
    const [deviceGroups, setDeviceGroups] = useState([]);
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

            // Fetch profiles
            const profilesResponse = await axios.get('/api/profiles');
            const allProfiles = profilesResponse.data.profiles || [];
            setProfiles(allProfiles.slice(0, 5)); // Get 5 most recent profiles

            // Fetch device groups
            const groupsResponse = await deviceService.getAllGroups();
            setDeviceGroups(groupsResponse);

            // Fetch devices
            const devicesResponse = await deviceService.getAllDevices();
            const devicesInGroups = devicesResponse.filter(device => device.group_id).length;

            // Fetch command lists
            const commandLists = await commandService.getAllCommandLists();

            // Fetch operators with profiles
            const operatorsResponse = await axios.get('/api/users?role=operator');
            const operators = operatorsResponse.data.users || [];

            // Set stats
            setStats({
                totalProfiles: allProfiles.length,
                totalCommandLists: commandLists.length,
                totalDevices: devicesResponse.length,
                devicesInGroups,
                operators: operators.slice(0, 5) // Get 5 operators
            });

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('');
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
        return <div className="team-lead-dashboard-loading">Loading dashboard data...</div>;
    }

    return (
        <div className="team-lead-dashboard">
            <div className="dashboard-header">
                <h1>Team Lead Dashboard</h1>
                <div className="welcome-message">
                    Welcome back, <strong>{user?.username}</strong>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Recent Profiles</h2>
                        <button className="view-all-btn" onClick={() => navigateTo("/profiles")}>View All</button>
                    </div>
                    <div className="card-content">
                        {profiles.length > 0 ? (
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Device Group</th>
                                        <th>Command List</th>
                                        <th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profiles.map(profile => (
                                        <tr key={profile.id || profile.profile_id}>
                                            <td>{profile.name}</td>
                                            <td>{profile.group_name || profile.group_id}</td>
                                            <td>{profile.list_name || profile.list_id}</td>
                                            <td>{formatDate(profile.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">No profiles found</div>
                        )}
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Device Groups</h2>
                        <button className="view-all-btn">Manage Groups</button>
                    </div>
                    <div className="card-content">
                        {deviceGroups.length > 0 ? (
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Group Name</th>
                                        <th>Description</th>
                                        <th>Devices</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deviceGroups.map(group => (
                                        <tr key={group.id}>
                                            <td>{group.name}</td>
                                            <td>{group.description || 'N/A'}</td>
                                            <td>{group.device_count || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">No device groups found</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Team Operators</h2>
                    </div>
                    <div className="card-content">
                        {stats.operators.length > 0 ? (
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Profiles</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.operators.map(operator => (
                                        <tr key={operator.id}>
                                            <td>{operator.username}</td>
                                            <td>{operator.email}</td>
                                            <td>{operator.profile_count || '0'}</td>
                                            <td>
                                                <span className={`status-badge ${operator.active ? 'active' : 'inactive'}`}>
                                                    {operator.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">No operators found</div>
                        )}
                    </div>
                </div>

                <div className="dashboard-card quick-actions">
                    <div className="card-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="card-content">
                        <div className="actions-grid">
                            <button className="action-btn" onClick={() => navigateTo("/profiles")}>
                                <div className="action-icon create-profile-icon"></div>
                                <div className="action-label">Create Profile</div>
                            </button>

                            <button className="action-btn" onClick={() => navigateTo("/command-lists")}>
                                <div className="action-icon create-command-icon"></div>
                                <div className="action-label">Create Command List</div>
                            </button>

                            <button className="action-btn" onClick={() => navigateTo("/assign-profiles")}>
                                <div className="action-icon assign-profile-icon"></div>
                                <div className="action-label">Assign Profile</div>
                            </button>

                            <button className="action-btn" onClick={() => navigateTo("/sessions")}>
                                <div className="action-icon view-session-icon"></div>
                                <div className="action-label">View Sessions</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamLeadDashboard; 