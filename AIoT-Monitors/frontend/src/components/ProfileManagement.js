import { useState, useEffect } from 'react';
import axios from 'axios';

function ProfileManagement() {
    const [profiles, setProfiles] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [loading, setLoading] = useState(true);
    const [profileUsers, setProfileUsers] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Fetch profiles
            const profilesResponse = await axios.get('http://localhost:8000/api/commands/profiles', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Fetch users (only operators)
            const usersResponse = await axios.get('http://localhost:8000/api/auth/users', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter users to only show operators
            const operatorUsers = usersResponse.data.filter(user =>
                user.role === 'operator'
            );

            setProfiles(profilesResponse.data.profiles || []);
            setUsers(operatorUsers);

            if (profilesResponse.data.profiles && profilesResponse.data.profiles.length > 0) {
                setSelectedProfile(profilesResponse.data.profiles[0].id);
                // Fetch users for the first profile
                fetchProfileUsers(profilesResponse.data.profiles[0].id);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfileUsers = async (profileId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8000/api/commands/profiles/${profileId}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfileUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching profile users:', error);
            setProfileUsers([]);
        }
    };

    const handleProfileChange = (e) => {
        const profileId = e.target.value;
        setSelectedProfile(profileId);
        fetchProfileUsers(profileId);
    };

    const assignUserToProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8000/api/commands/profiles/${selectedProfile}/users`,
                { user_id: selectedUser },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Người dùng đã được gán cho profile thành công!');
            fetchProfileUsers(selectedProfile);
        } catch (error) {
            console.error('Error assigning user to profile:', error);
            alert('Lỗi khi gán người dùng: ' + (error.response?.data?.error || error.message));
        }
    };

    const removeUserFromProfile = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/commands/profiles/${selectedProfile}/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Đã xóa người dùng khỏi profile thành công!');
            fetchProfileUsers(selectedProfile);
        } catch (error) {
            console.error('Error removing user from profile:', error);
            alert('Lỗi khi xóa người dùng: ' + (error.response?.data?.error || error.message));
        }
    };

    if (loading) {
        return <div>Đang tải...</div>;
    }

    return (
        <div className="profile-management" style={{ padding: '1rem' }}>
            <h1>Gán profile cho Operator</h1>

            {profiles.length === 0 ? (
                <p>Chưa có profiles nào. Vui lòng tạo profile trước.</p>
            ) : (
                <div>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2>Chọn profile</h2>
                        <select
                            value={selectedProfile}
                            onChange={handleProfileChange}
                            style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                        >
                            {profiles.map(profile => (
                                <option key={profile.id} value={profile.id}>
                                    {profile.name} ({profile.group_name} - {profile.list_name})
                                </option>
                            ))}
                        </select>

                        <h3>Gán Operator cho profile này</h3>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                style={{ flex: 1, padding: '0.5rem' }}
                            >
                                <option value="">-- Chọn Operator --</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.username} (Operator)
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={assignUserToProfile}
                                disabled={!selectedUser}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: !selectedUser ? '#ccc' : '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: !selectedUser ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Gán Operator
                            </button>
                        </div>
                    </div>

                    <div>
                        <h2>Operators đã được gán</h2>
                        {profileUsers.length === 0 ? (
                            <p>Chưa có Operator nào được gán cho profile này.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {profileUsers.map(user => (
                                    <li
                                        key={user.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.5rem',
                                            borderBottom: '1px solid #eee',
                                            marginBottom: '0.5rem'
                                        }}
                                    >
                                        <div>
                                            <strong>{user.username}</strong> (Operator)
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.email}</div>
                                        </div>
                                        <button
                                            onClick={() => removeUserFromProfile(user.id)}
                                            style={{
                                                padding: '0.3rem 0.5rem',
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfileManagement; 