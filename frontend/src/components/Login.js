import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Login = ({ setIsAuthenticated, setUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const user = await authService.login(username, password);

            // Set authentication state
            setIsAuthenticated(true);
            setUser(user);

            // Redirect based on user role
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'team_lead') {
                navigate('/team-lead');
            } else if (user.role === 'supervisor') {
                navigate('/supervisor');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>AIoT Monitors</h2>
                <h3>Login</h3>

                {error && <div className="error-message">{error}</div>}

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

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

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