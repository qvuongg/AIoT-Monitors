import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/Header.css';

const Header = ({ user, setIsAuthenticated, setUser }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        navigate('/login');
    };

    return (
        <header className="main-header">
            <div className="header-container">
                <div className="logo">
                    <h1>AIoT Monitors</h1>
                </div>
                <nav className="main-nav">
                    <ul className="nav-list">
                        {/* Tất cả các vai trò đều có Dashboard */}
                        <li className="nav-item">
                            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                Dashboard
                            </NavLink>
                        </li>
                        {/* Sessions link for all roles */}
                        <li className="nav-item">
                            <NavLink to="/sessions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                Sessions
                            </NavLink>
                        </li>
                        {/* Team Lead: Dashboard, Command Lists, Profiles, Profile Assignment */}
                        {user && user.role === 'team_lead' && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/command-lists" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                        Command Lists
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/profiles" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                        Create Profile
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/assign-profiles" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                        Assign Profile
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/create-device" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                        Create Device
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/create-device-group" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                        Create Device Group
                                    </NavLink>
                                </li>
                            </>
                        )}
                        {/* Admin: Dashboard, Quản lý tài khoản */}
                        {user && user.role === 'admin' && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/accounts" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                        Quản lý tài khoản
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/change-password" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                        Đổi mật khẩu
                                    </NavLink>
                                </li>
                            </>
                        )}
                        {/* Supervisor only */}
                        {user && user.role === 'supervisor' && (
                            <li className="nav-item">
                                <NavLink to="/supervisor" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                    Giám sát
                                </NavLink>
                            </li>
                        )}
                    </ul>
                </nav>
                <div className="user-controls">
                    <div className="user-info">
                        <span className="username">{user ? user.username : 'Guest'}</span>
                        {user && <span className={`user-role ${user.role}`}>{user.role}</span>}
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        Đăng xuất
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header; 