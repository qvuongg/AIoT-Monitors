import React, { useState, useEffect } from 'react';
import { authService, profileService } from '../services/api';
import '../styles/AccountManagement.css';

const AccountManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userProfiles, setUserProfiles] = useState([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);

    // Form state cho việc tạo tài khoản mới
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        phone: '',
        selectedRole: 'operator' // default role
    });

    // State cho reset password modal
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPasswordData, setResetPasswordData] = useState({
        userId: null,
        username: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');

    // Fetch danh sách users khi component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const users = await authService.getAllUsers();
            setUsers(users);
            setError('');
        } catch (err) {
            setError('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfiles = async (userId) => {
        try {
            setLoadingProfiles(true);
            const profiles = await profileService.getUserProfiles(userId);
            setUserProfiles(profiles);
        } catch (err) {
            console.error('Error fetching user profiles:', err);
            setUserProfiles({ profiles: [], active_sessions: [] });
        } finally {
            setLoadingProfiles(false);
        }
    };

    const handleViewUserProfiles = (user) => {
        setSelectedUser(user);

        // Chỉ operators mới được gán profile
        if (user.role !== 'operator') {
            setLoadingProfiles(false);
            setUserProfiles([]);
            // Thông báo sẽ được hiển thị trong modal
            return;
        }

        fetchUserProfiles(user.id);
    };

    const closeUserProfilesView = () => {
        setSelectedUser(null);
        setUserProfiles([]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser({
            ...newUser,
            [name]: value
        });
    };

    const handleResetInputChange = (e) => {
        const { name, value } = e.target;
        setResetPasswordData({
            ...resetPasswordData,
            [name]: value
        });
    };

    const validateForm = () => {
        if (!newUser.username || !newUser.email || !newUser.password) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc: tên đăng nhập, email và mật khẩu.');
            return false;
        }

        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(newUser.email)) {
            setError('Email không hợp lệ. Vui lòng kiểm tra lại.');
            return false;
        }

        if (newUser.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự.');
            return false;
        }

        return true;
    };

    const validateResetForm = () => {
        if (!resetPasswordData.newPassword) {
            setResetError('Vui lòng nhập mật khẩu mới.');
            return false;
        }

        if (resetPasswordData.newPassword.length < 6) {
            setResetError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return false;
        }

        if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
            setResetError('Mật khẩu xác nhận không khớp.');
            return false;
        }

        return true;
    };

    const clearForm = () => {
        setNewUser({
            username: '',
            email: '',
            password: '',
            phone: '',
            selectedRole: 'operator'
        });
    };

    const openResetPasswordModal = (user) => {
        setResetPasswordData({
            userId: user.id,
            username: user.username,
            newPassword: '',
            confirmPassword: ''
        });
        setResetError('');
        setShowResetModal(true);
    };

    const closeResetPasswordModal = () => {
        setShowResetModal(false);
        setResetPasswordData({
            userId: null,
            username: '',
            newPassword: '',
            confirmPassword: ''
        });
        setResetError('');
    };

    const createUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const userData = {
                username: newUser.username,
                email: newUser.email,
                password: newUser.password,
                phone: newUser.phone || undefined
            };

            let response;

            // Gọi API tương ứng theo vai trò
            switch (newUser.selectedRole) {
                case 'operator':
                    response = await authService.createOperator(userData);
                    break;
                case 'supervisor':
                    response = await authService.createSupervisor(userData);
                    break;
                case 'team_lead':
                    response = await authService.createTeamLead(userData);
                    break;
                default:
                    setError('Vai trò không hợp lệ.');
                    setLoading(false);
                    return;
            }

            setSuccessMessage(`Tạo tài khoản ${newUser.selectedRole} thành công!`);
            clearForm();

            // Làm mới danh sách người dùng
            await fetchUsers();
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.';
            setError(errorMessage);
            console.error('Error creating user:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetError('');

        if (!validateResetForm()) {
            return;
        }

        try {
            setResetLoading(true);
            await authService.resetPassword(
                resetPasswordData.userId,
                resetPasswordData.newPassword
            );

            setSuccessMessage(`Đã đặt lại mật khẩu cho tài khoản ${resetPasswordData.username} thành công!`);
            closeResetPasswordModal();
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.';
            setResetError(errorMessage);
            console.error('Error resetting password:', err);
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="account-management-container">
            <h1 className="page-title">Quản lý tài khoản</h1>

            {/* Form tạo tài khoản */}
            <div className="account-form-container">
                <h2>Tạo tài khoản mới</h2>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <form onSubmit={createUser} className="account-form">
                    <div className="form-group">
                        <label htmlFor="username">Tên đăng nhập *</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={newUser.username}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={newUser.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={newUser.password}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Số điện thoại</label>
                        <input
                            type="text"
                            id="phone"
                            name="phone"
                            value={newUser.phone}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="selectedRole">Vai trò *</label>
                        <select
                            id="selectedRole"
                            name="selectedRole"
                            value={newUser.selectedRole}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="operator">Operator</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="team_lead">Team Lead</option>
                        </select>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={clearForm}
                            disabled={loading}
                        >
                            Xóa form
                        </button>
                    </div>
                </form>
            </div>

            {/* Danh sách tài khoản */}
            <div className="users-table-container">
                <h2>Danh sách người dùng</h2>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên người dùng</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                            {user.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary me-1"
                                            onClick={() => openResetPasswordModal(user)}
                                        >
                                            Đổi mật khẩu
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-info"
                                            onClick={() => handleViewUserProfiles(user)}
                                        >
                                            Xem profiles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Profiles Modal */}
            {selectedUser && (
                <div className="modal show-modal" style={{ display: 'block' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Profiles của {selectedUser.username}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeUserProfilesView}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {loadingProfiles ? (
                                    <div className="text-center my-3">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : selectedUser.role !== 'operator' ? (
                                    <div className="alert alert-warning">
                                        Chỉ người dùng có vai trò 'operator' mới được gán profile. Người dùng này có vai trò '{selectedUser.role}'.
                                    </div>
                                ) : userProfiles.length === 0 ? (
                                    <div className="alert alert-info">
                                        Người dùng này chưa được gán profile nào.
                                    </div>
                                ) : (
                                    <div>
                                        {/* Phiên hoạt động */}
                                        {userProfiles.active_sessions && userProfiles.active_sessions.length > 0 && (
                                            <div className="mb-4">
                                                <h6 className="border-bottom pb-2 mb-3">Phiên đang hoạt động</h6>
                                                <div className="table-responsive">
                                                    <table className="table table-sm table-striped">
                                                        <thead>
                                                            <tr>
                                                                <th>ID</th>
                                                                <th>Thiết bị</th>
                                                                <th>Địa chỉ IP</th>
                                                                <th>Bắt đầu</th>
                                                                <th>Trạng thái</th>
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
                                                                        <span className="badge bg-success">{session.status}</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Profiles */}
                                        <h6 className="border-bottom pb-2 mb-3">Profiles được gán</h6>
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Tên profile</th>
                                                        <th>Mô tả</th>
                                                        <th>Nhóm thiết bị</th>
                                                        <th>Danh sách lệnh</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {userProfiles.profiles.map(profile => (
                                                        <tr key={profile.id}>
                                                            <td>{profile.id}</td>
                                                            <td>{profile.name}</td>
                                                            <td>{profile.description || 'N/A'}</td>
                                                            <td>{profile.group_name || profile.group_id}</td>
                                                            <td>{profile.list_name || profile.list_id}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Hiển thị thiết bị cho mỗi profile */}
                                        {userProfiles.profiles.map(profile => (
                                            profile.devices && profile.devices.length > 0 && (
                                                <div key={`devices-${profile.id}`} className="mt-4">
                                                    <h6 className="border-bottom pb-2 mb-3">
                                                        Thiết bị trong nhóm "{profile.group_name}"
                                                    </h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-striped">
                                                            <thead>
                                                                <tr>
                                                                    <th>ID</th>
                                                                    <th>Tên thiết bị</th>
                                                                    <th>Địa chỉ IP</th>
                                                                    <th>Trạng thái</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {profile.devices.map(device => (
                                                                    <tr key={device.id}>
                                                                        <td>{device.id}</td>
                                                                        <td>{device.name}</td>
                                                                        <td>{device.ip_address}</td>
                                                                        <td>
                                                                            <span className={`badge ${device.status === 'online' ? 'bg-success' : device.status === 'offline' ? 'bg-danger' : 'bg-secondary'}`}>
                                                                                {device.status}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeUserProfilesView}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal đặt lại mật khẩu */}
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>Đặt lại mật khẩu cho {resetPasswordData.username}</h3>
                            <button className="modal-close" onClick={closeResetPasswordModal}>&times;</button>
                        </div>

                        <div className="modal-content">
                            {resetError && <div className="error-message">{resetError}</div>}

                            <form onSubmit={handleResetPassword}>
                                <div className="form-group">
                                    <label htmlFor="newPassword">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={resetPasswordData.newPassword}
                                        onChange={handleResetInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={resetPasswordData.confirmPassword}
                                        onChange={handleResetInputChange}
                                        required
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeResetPasswordModal}
                                        disabled={resetLoading}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={resetLoading}
                                    >
                                        {resetLoading ? 'Đang xử lý...' : 'Xác nhận'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountManagement; 