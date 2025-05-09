import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/ChangePassword.css';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPasswords({
            ...passwords,
            [name]: value
        });
    };

    const validateForm = () => {
        if (!passwords.currentPassword) {
            setError('Vui lòng nhập mật khẩu hiện tại');
            return false;
        }

        if (!passwords.newPassword) {
            setError('Vui lòng nhập mật khẩu mới');
            return false;
        }

        if (passwords.newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return false;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            await authService.changePassword(
                passwords.currentPassword,
                passwords.newPassword
            );

            setSuccess('Đổi mật khẩu thành công!');
            setPasswords({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }, 2000);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Có lỗi xảy ra khi đổi mật khẩu';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-container">
            <h1 className="page-title">Đổi mật khẩu</h1>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="card">
                <form onSubmit={handleSubmit} className="change-password-form">
                    <div className="form-group">
                        <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={passwords.currentPassword}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">Mật khẩu mới</label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword; 