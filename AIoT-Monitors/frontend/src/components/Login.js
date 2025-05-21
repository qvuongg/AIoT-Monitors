import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/Login.css';

const Login = ({ setIsAuthenticated, setUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const navigate = useNavigate();

    // Check if the username is admin when it changes
    useEffect(() => {
        // Simple check if username contains "admin" - this would be more sophisticated in production
        setIsAdminUser(username.toLowerCase().includes('admin'));
    }, [username]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const user = await authService.login(username, password);

            // Set authentication state
            setIsAuthenticated(true);
            setUser(user);

            // Always navigate to dashboard after login
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetAdminPassword = async () => {
        if (!username || !isAdminUser) {
            setError('Please enter a valid admin username');
            return;
        }

        setResetLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await authService.resetAdminPassword(username);
            setSuccessMessage(`Password for ${username} has been reset to "123456"`);
            setPassword('123456'); // Optional: Auto-fill the password field
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>AIoT Monitors</h2>
                <h3>Login</h3>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="primary-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="reset-password-section">
                    <h4>Reset Password</h4>
                    {isAdminUser ? (
                        <div>
                            <p>Reset admin password to default:</p>
                            <button
                                onClick={handleResetAdminPassword}
                                className="reset-button"
                                disabled={resetLoading || !username}
                            >
                                {resetLoading ? 'Resetting...' : 'Đặt password về mặc định'}
                            </button>
                        </div>
                    ) : (
                        <p>Enter an admin username to reset password</p>
                    )}
                </div>

                <div className="login-help">
                    <p>Default admin login: <code>admin_user</code> / <code>admin123</code></p>
                    <p>Các tài khoản khác: <code>team_lead1</code>, <code>supervisor1</code>, <code>operator1</code></p>
                    <p>Trong database mẫu, mật khẩu có thể theo định dạng: <code>hash_[role]_[number]</code></p>
                </div>
            </div>
        </div>
    );
};

export default Login; 