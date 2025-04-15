import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Header = ({ user, setIsAuthenticated, setUser }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Xóa token JWT và thông tin người dùng từ localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Xóa header Authorization
        delete axios.defaults.headers.common['Authorization'];

        // Cập nhật state
        setIsAuthenticated(false);
        setUser(null);

        // Chuyển hướng về trang đăng nhập
        navigate('/login');
    };

    return (
        <header className="app-header">
            <div className="header-left">
                <h1>AIoT Monitors</h1>
            </div>
            <div className="header-center">
                <nav className="main-nav">
                    <ul>
                        <li>
                            <Link to="/dashboard">Dashboard</Link>
                        </li>
                        {user && ['admin', 'team_lead', 'supervisor'].includes(user.role) && (
                            <li>
                                <Link to="/profiles">Profiles</Link>
                            </li>
                        )}
                        {user && ['admin', 'supervisor'].includes(user.role) && (
                            <li>
                                <Link to="/supervisor">Supervisor</Link>
                            </li>
                        )}
                        {user && user.role === 'admin' && (
                            <li>
                                <Link to="/admin">Admin</Link>
                            </li>
                        )}
                    </ul>
                </nav>
            </div>
            <div className="header-right">
                {user && (
                    <div className="user-info">
                        <span className="username">{user.username}</span>
                        <span className="role-badge">{user.role}</span>
                        <button className="logout-button" onClick={handleLogout}>
                            Đăng xuất
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header; 