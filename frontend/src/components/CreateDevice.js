import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    MenuItem,
    Paper,
    Snackbar,
    Alert
} from '@mui/material';

const CreateDevice = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        ip_address: '',
        device_type: '',
        ssh_port: 22,
        username: '',
        authentication_method: 'key',
        location: '',
        customer_id: ''
    });
    const [deviceList, setDeviceList] = useState([]);
    const [groupList, setGroupList] = useState([]);
    const [assigning, setAssigning] = useState({}); // {deviceId: groupId}
    const [assignLoading, setAssignLoading] = useState({}); // {deviceId: boolean}

    const deviceTypes = [
        'router',
        'switch',
        'firewall',
        'server',
        'workstation',
        'printer',
        'camera',
        'sensor',
        'gateway',
        'other'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/devices', formData);
            setSuccess(true);
            setTimeout(() => {
                navigate('/devices');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create device');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Lấy danh sách thiết bị
        axios.get('/api/devices').then(res => {
            setDeviceList(res.data.devices || res.data || []);
        });
        // Lấy danh sách nhóm thiết bị
        axios.get('/api/devices/groups').then(res => {
            setGroupList(res.data.device_groups || res.data || []);
        });
    }, []);

    const handleAssignChange = (deviceId, groupId) => {
        setAssigning(prev => ({ ...prev, [deviceId]: groupId }));
    };

    const handleAssignGroup = async (deviceId) => {
        const groupId = assigning[deviceId];
        if (!groupId) return;
        setAssignLoading(prev => ({ ...prev, [deviceId]: true }));
        try {
            await axios.post(`/api/devices/groups/${groupId}/devices`, { device_id: deviceId });
            // Cập nhật lại danh sách thiết bị
            const res = await axios.get('/api/devices');
            setDeviceList(res.data.devices || res.data || []);
            setAssigning(prev => ({ ...prev, [deviceId]: undefined }));
        } catch (err) {
            alert('Gán thiết bị vào nhóm thất bại!');
        } finally {
            setAssignLoading(prev => ({ ...prev, [deviceId]: false }));
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Tạo Thiết Bị Mới
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        required
                        fullWidth
                        label="Tên Thiết Bị"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                    />

                    <TextField
                        required
                        fullWidth
                        label="Địa Chỉ IP"
                        name="ip_address"
                        value={formData.ip_address}
                        onChange={handleChange}
                        margin="normal"
                    />

                    <TextField
                        required
                        fullWidth
                        select
                        label="Loại Thiết Bị"
                        name="device_type"
                        value={formData.device_type}
                        onChange={handleChange}
                        margin="normal"
                    >
                        {deviceTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        fullWidth
                        label="Cổng SSH"
                        name="ssh_port"
                        type="number"
                        value={formData.ssh_port}
                        onChange={handleChange}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="Tên Đăng Nhập"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        select
                        label="Phương Thức Xác Thực"
                        name="authentication_method"
                        value={formData.authentication_method}
                        onChange={handleChange}
                        margin="normal"
                    >
                        <MenuItem value="key">SSH Key</MenuItem>
                        <MenuItem value="password">Password</MenuItem>
                    </TextField>

                    <TextField
                        fullWidth
                        label="Vị Trí"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="Mã Khách Hàng"
                        name="customer_id"
                        value={formData.customer_id}
                        onChange={handleChange}
                        margin="normal"
                    />

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? 'Đang Tạo...' : 'Tạo Thiết Bị'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/devices')}
                            fullWidth
                        >
                            Hủy
                        </Button>
                    </Box>
                </Box>

                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={() => setError('')}
                >
                    <Alert severity="error" onClose={() => setError('')}>
                        {error}
                    </Alert>
                </Snackbar>

                <Snackbar
                    open={success}
                    autoHideDuration={2000}
                    onClose={() => setSuccess(false)}
                >
                    <Alert severity="success">
                        Thiết bị đã được tạo thành công!
                    </Alert>
                </Snackbar>
            </Paper>

            {/* Danh sách thiết bị */}
            <Paper elevation={1} sx={{ p: 2, mt: 4 }}>
                <Typography variant="h6" gutterBottom>Danh Sách Thiết Bị</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Tên Thiết Bị</th>
                                <th>Địa Chỉ IP</th>
                                <th>Loại Thiết Bị</th>
                                <th>Nhóm</th>
                                <th>Vị Trí</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deviceList.length > 0 ? deviceList.map(device => (
                                <tr key={device.id || device.device_id}>
                                    <td>{device.name || device.device_name}</td>
                                    <td>{device.ip_address}</td>
                                    <td>{device.device_type}</td>
                                    <td>
                                        {device.group_name || device.group_id ? (
                                            device.group_name || device.group_id
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <select
                                                    value={assigning[device.id || device.device_id] || ''}
                                                    onChange={e => handleAssignChange(device.id || device.device_id, e.target.value)}
                                                >
                                                    <option value="">Chọn nhóm</option>
                                                    {groupList.map(group => (
                                                        <option key={group.id || group.group_id} value={group.id || group.group_id}>
                                                            {group.name || group.group_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    disabled={!assigning[device.id || device.device_id] || assignLoading[device.id || device.device_id]}
                                                    onClick={() => handleAssignGroup(device.id || device.device_id)}
                                                >
                                                    {assignLoading[device.id || device.device_id] ? 'Đang gán...' : 'Gán'}
                                                </Button>
                                            </Box>
                                        )}
                                    </td>
                                    <td>{device.location || '-'}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Không có thiết bị nào</td></tr>
                            )}
                        </tbody>
                    </table>
                </Box>
            </Paper>
        </Container>
    );
};

export default CreateDevice; 