import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SessionView from './components/SessionView';
import SupervisorDashboard from './components/SupervisorDashboard';
import ProfileDashboard from './components/ProfileDashboard';
import Header from './components/Header';

// Import services
import { authService } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = () => {
      if (authService.isAuthenticated()) {
        setIsAuthenticated(true);
        const userData = authService.getCurrentUser();
        if (userData) {
          setUser(userData);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children, roles }) => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    if (roles && !roles.includes(user.role)) {
      return <div>Access Denied: You do not have permission to view this page.</div>;
    }

    return (
      <>
        <Header user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
        <div className="content-container">
          {children}
        </div>
      </>
    );
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ?
                <Navigate to="/dashboard" /> :
                <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {user && user.role === 'supervisor' ? (
                  <SupervisorDashboard user={user} />
                ) : (
                  <Dashboard user={user} />
                )}
              </ProtectedRoute>
            }
          />

          <Route
            path="/sessions/:sessionId"
            element={
              <ProtectedRoute>
                <SessionView user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <div>Admin Page (To be implemented)</div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/team-lead"
            element={
              <ProtectedRoute roles={['admin', 'team_lead']}>
                <CreateCommandList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor"
            element={
              <ProtectedRoute roles={['admin', 'supervisor']}>
                <SupervisorDashboard user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profiles"
            element={
              <ProtectedRoute roles={['team_lead']}>
                <ProfileDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default route */}
          <Route
            path="*"
            element={
              isAuthenticated ?
                <Navigate to="/dashboard" /> :
                <Navigate to="/login" />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
