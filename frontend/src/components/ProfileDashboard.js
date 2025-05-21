import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ProfileDashboard = () => {
  const [profiles, setProfiles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_id: '',
    list_id: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch profiles on component mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/profiles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Profiles data:', data); // Debug log
      if (data.success) {
        setProfiles(data.profiles);
      }
    } catch (error) {
      showSnackbar('Failed to fetch profiles', 'error');
    }
  };

  const handleOpenDialog = (profile = null) => {
    if (profile) {
      console.log('Selected profile:', profile); // Debug log
      setSelectedProfile(profile);
      setFormData({
        name: profile.name || '',
        description: profile.description || '',
        group_id: profile.group_id || '',
        list_id: profile.list_id || '',
      });
    } else {
      setSelectedProfile(null);
      setFormData({
        name: '',
        description: '',
        group_id: '',
        list_id: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProfile(null);
    setFormData({
      name: '',
      description: '',
      group_id: '',
      list_id: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedProfile
        ? `http://localhost:8000/api/profiles/${selectedProfile.profile_id}`
        : 'http://localhost:8000/api/profiles';
      const method = selectedProfile ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          device_group_id: parseInt(formData.group_id),
          command_list_id: parseInt(formData.list_id),
        }),
      });

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      if (data.success) {
        showSnackbar(
          `Profile ${selectedProfile ? 'updated' : 'created'} successfully`,
          'success'
        );
        fetchProfiles();
        handleCloseDialog();
      } else {
        showSnackbar(data.error || 'Failed to save profile', 'error');
      }
    } catch (error) {
      console.error('Error:', error); // Debug log
      showSnackbar('An error occurred', 'error');
    }
  };

  const handleDelete = async (profileId) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:8000/api/profiles/${profileId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          showSnackbar('Profile deleted successfully', 'success');
          fetchProfiles();
        } else {
          showSnackbar(data.error, 'error');
        }
      } catch (error) {
        showSnackbar('Failed to delete profile', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Profile Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Profile
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Device Group</TableCell>
              <TableCell>Command List</TableCell>
              {/* <TableCell>Actions</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.profile_id}>
                <TableCell>{profile.name}</TableCell>
                <TableCell>{profile.description}</TableCell>
                <TableCell>{profile.group_id}</TableCell>
                <TableCell>{profile.list_id}</TableCell>
                {/* <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(profile)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(profile.profile_id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProfile ? 'Edit Profile' : 'Create New Profile'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="name"
              label="Profile Name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              name="group_id"
              label="Device Group ID"
              value={formData.group_id}
              onChange={handleInputChange}
              fullWidth
              required
              type="number"
            />
            <TextField
              name="list_id"
              label="Command List ID"
              value={formData.list_id}
              onChange={handleInputChange}
              fullWidth
              required
              type="number"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedProfile ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfileDashboard; 