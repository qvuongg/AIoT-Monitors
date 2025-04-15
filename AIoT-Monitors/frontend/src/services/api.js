import axios from 'axios';

// Cấu hình mặc định cho axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Interceptor cho request
axios.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Interceptor cho response
axios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response) {
            // Lỗi từ server
            console.error('API Error:', error.response.data);

            // Xử lý lỗi 401 (Unauthorized)
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }

            // Xử lý lỗi 422 (Unprocessable Entity) - có thể hiển thị thông báo chi tiết
            if (error.response.status === 422) {
                console.warn('Validation Error:', error.response.data);
            }
        } else if (error.request) {
            // Lỗi không có response
            console.error('API Request Error:', error.request);
        } else {
            // Lỗi khác
            console.error('API Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// Service cho Devices
const deviceService = {
    getAllDevices: async () => {
        try {
            const response = await axios.get('/api/devices');
            return response.data.devices || [];
        } catch (error) {
            console.error('Error fetching devices:', error);
            return [];
        }
    },

    getDeviceById: async (id) => {
        try {
            const response = await axios.get(`/api/devices/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching device ${id}:`, error);
            return null;
        }
    },

    getAllGroups: async () => {
        try {
            const response = await axios.get('/api/devices/groups');
            return response.data.device_groups || [];
        } catch (error) {
            console.error('Error fetching device groups:', error);
            return [];
        }
    },

    getUnassignedDevices: async () => {
        try {
            const response = await axios.get('/api/devices/unassigned');
            return response.data.devices || [];
        } catch (error) {
            console.error('Error fetching unassigned devices:', error);
            return [];
        }
    },

    addDeviceToGroup: async (groupId, deviceId) => {
        try {
            const response = await axios.post(`/api/devices/groups/${groupId}/devices`, {
                device_id: deviceId
            });
            return response.data;
        } catch (error) {
            console.error(`Error adding device ${deviceId} to group ${groupId}:`, error);
            throw error;
        }
    }
};

// Service cho Sessions
const sessionService = {
    getActiveSessions: async () => {
        try {
            const response = await axios.get('/api/sessions?active_only=true');
            return response.data.sessions || [];
        } catch (error) {
            console.error('Error fetching active sessions:', error);
            return [];
        }
    },

    getAllSessions: async () => {
        try {
            const response = await axios.get('/api/sessions');
            return response.data.sessions || [];
        } catch (error) {
            console.error('Error fetching all sessions:', error);
            return [];
        }
    },

    getSessionById: async (id) => {
        try {
            const response = await axios.get(`/api/sessions/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching session ${id}:`, error);
            return null;
        }
    },

    createSession: async (deviceId) => {
        try {
            const response = await axios.post('/api/sessions', { device_id: deviceId });
            return response.data;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    },

    endSession: async (sessionId, status = 'completed') => {
        try {
            const response = await axios.put(`/api/sessions/${sessionId}`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error ending session ${sessionId}:`, error);
            throw error;
        }
    },

    executeCommand: async (sessionId, command, commandId = null) => {
        try {
            const payload = { command };
            if (commandId) {
                payload.command_id = commandId;
            }

            const response = await axios.post(`/api/sessions/${sessionId}/commands`, payload);
            return response.data;
        } catch (error) {
            console.error(`Error executing command in session ${sessionId}:`, error);
            throw error;
        }
    },

    getSessionCommands: async (sessionId) => {
        try {
            const response = await axios.get(`/api/sessions/${sessionId}/commands`);
            return response.data.commands || [];
        } catch (error) {
            console.error(`Error fetching commands for session ${sessionId}:`, error);
            return [];
        }
    }
};

// Service cho Profiles
const profileService = {
    getAllProfiles: async () => {
        try {
            const response = await axios.get('/api/profiles');
            return response.data.profiles || [];
        } catch (error) {
            console.error('Error fetching profiles:', error);
            return [];
        }
    },

    getProfileById: async (id) => {
        try {
            const response = await axios.get(`/api/profiles/${id}`);
            return response.data.profile;
        } catch (error) {
            console.error(`Error fetching profile ${id}:`, error);
            return null;
        }
    },

    getProfileUsers: async (profileId) => {
        try {
            const response = await axios.get(`/api/profiles/${profileId}/users`);
            return response.data.users || [];
        } catch (error) {
            console.error(`Error fetching users for profile ${profileId}:`, error);
            return [];
        }
    }
};

// Authentication service
const authService = {
    login: async (username, password) => {
        try {
            const response = await axios.post('/api/auth/login', { username, password });
            const { access_token, user } = response.data;

            // Lưu token và user vào localStorage
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));

            // Cấu hình header cho các request tiếp theo
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    },

    getCurrentUser: () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};

// Export các services
export {
    deviceService,
    sessionService,
    profileService,
    authService
}; 