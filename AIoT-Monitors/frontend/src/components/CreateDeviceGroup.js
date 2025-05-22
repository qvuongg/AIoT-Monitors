import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper,
    Snackbar,
    Alert
} from '@mui/material';

const CreateDeviceGroup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [groupList, setGroupList] = useState([]);

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
            const response = await axios.post('/api/devices/groups', formData);
            setSuccess(true);
            setTimeout(() => {
                navigate('/device-groups');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create device group');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Lấy danh sách nhóm thiết bị
        axios.get('/api/devices/groups').then(res => {
            setGroupList(res.data.device_groups || res.data || []);
        });
    }, []);

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Tạo Nhóm Thiết Bị Mới
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        required
                        fullWidth
                        label="Tên Nhóm"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="Mô Tả"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        margin="normal"
                        multiline
                        rows={4}
                    />

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? 'Đang Tạo...' : 'Tạo Nhóm'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/device-groups')}
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
                        Nhóm thiết bị đã được tạo thành công!
                    </Alert>
                </Snackbar>
            </Paper>

            {/* Danh sách nhóm thiết bị */}
            <Paper elevation={1} sx={{ p: 2, mt: 4 }}>
                <Typography variant="h6" gutterBottom>Danh Sách Nhóm Thiết Bị</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Tên Nhóm</th>
                                <th>Mô Tả</th>
                                <th>Số Lượng Thiết Bị</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupList.length > 0 ? groupList.map(group => (
                                <tr key={group.id || group.group_id}>
                                    <td>{group.name || group.group_name}</td>
                                    <td>{group.description || '-'}</td>
                                    <td>{group.device_count || 0}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3} style={{ textAlign: 'center' }}>Không có nhóm thiết bị nào</td></tr>
                            )}
                        </tbody>
                    </table>
                </Box>
            </Paper>
        </Container>
    );
};

export default CreateDeviceGroup; 