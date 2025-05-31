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
  IconButton,
  Snackbar,
  Alert,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';

const SupervisorDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [nonActiveSessions, setNonActiveSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [killDialogOpen, setKillDialogOpen] = useState(false);
  const [commands, setCommands] = useState([]);
  const [fileEditLogs, setFileEditLogs] = useState([]);
  const [sessionTabValue, setSessionTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (response.ok) {
        let allSessions = [];
        if (Array.isArray(data)) {
          allSessions = data;
        } else if (data.sessions && Array.isArray(data.sessions)) {
          allSessions = data.sessions;
        } else {
          console.error('Unexpected data format:', data);
          showSnackbar('Invalid data format received from server', 'error');
          return;
        }

        // Split sessions into active and non-active
        const activeSessions = allSessions.filter(session => session.status.toLowerCase() === 'active');
        const nonActive = allSessions.filter(session => session.status.toLowerCase() !== 'active');
        setSessions(activeSessions);
        setNonActiveSessions(nonActive);
      } else {
        console.error('API Error:', data);
        showSnackbar(data.message || data.error || 'Failed to fetch sessions', 'error');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      showSnackbar('Network error while fetching sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommands = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/sessions/${sessionId}/commands`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCommands(data.commands || []);
      } else {
        showSnackbar(data.message || data.error || 'Failed to fetch commands', 'error');
      }
    } catch (error) {
      console.error('Error fetching commands:', error);
      showSnackbar('Network error while fetching commands', 'error');
    }
  };

  const fetchFileEditLogs = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/sessions/file-edits?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setFileEditLogs(data.file_edits || []);
      } else {
        showSnackbar(data.message || data.error || 'Failed to fetch file edit logs', 'error');
      }
    } catch (error) {
      console.error('Error fetching file edit logs:', error);
      showSnackbar('Network error while fetching file edit logs', 'error');
    }
  };

  const handleViewSession = async (session) => {
    setSelectedSession(session);
    setDialogOpen(true);
    await Promise.all([
      fetchCommands(session.id),
      fetchFileEditLogs(session.id)
    ]);
  };

  const handleKillSession = async () => {
    try {
      const token = localStorage.getItem('token');
      // Get current user ID from token
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = tokenPayload.sub;

      const response = await fetch(`http://localhost:8000/api/sessions/${selectedSession.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'terminated',
          terminated_by: currentUserId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSnackbar('Session terminated successfully', 'success');
        setDialogOpen(false);
        setKillDialogOpen(false);
        fetchSessions(); // Refresh the sessions list
      } else {
        showSnackbar(data.message || data.error || 'Failed to terminate session', 'error');
      }
    } catch (error) {
      console.error('Error terminating session:', error);
      showSnackbar('Network error while terminating session', 'error');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSession(null);
  };

  const handleCloseKillDialog = () => {
    setKillDialogOpen(false);
  };

  const handleOpenKillDialog = () => {
    setKillDialogOpen(true);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'terminated':
        return 'error';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString();
    } catch (error) {
      return dateTimeStr;
    }
  };

  const formatDuration = (durationStr) => {
    if (!durationStr) return 'N/A';
    try {
      // Remove milliseconds if present
      return durationStr.replace(/\.\d+/, '');
    } catch (error) {
      return 'N/A';
    }
  };

  const handleSessionTabChange = (event, newValue) => {
    setSessionTabValue(newValue);
  };

  const renderSessionsTable = (sessionsList, isActive) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Session ID</TableCell>
            <TableCell>Operator</TableCell>
            <TableCell>Device</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessionsList.map((session) => (
            <TableRow key={session.id}>
              <TableCell>{session.id}</TableCell>
              <TableCell>{session.user_name || 'N/A'}</TableCell>
              <TableCell>{session.device_name || 'N/A'}</TableCell>
              <TableCell>{formatDateTime(session.start_time)}</TableCell>
              <TableCell>{formatDuration(session.duration)}</TableCell>
              <TableCell>
                <Chip
                  label={session.status}
                  color={getStatusColor(session.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton
                  color="primary"
                  onClick={() => handleViewSession(session)}
                  title="View Session Details"
                >
                  <VisibilityIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {sessionsList.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={8} align="center">
                No {isActive ? 'active' : 'non-active'} sessions found
              </TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell colSpan={8} align="center">
                Loading sessions...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sessions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={fetchSessions}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={sessionTabValue} onChange={handleSessionTabChange}>
          <Tab label="Active Sessions" />
          <Tab label="Non-Active Sessions" />
        </Tabs>
      </Box>

      {sessionTabValue === 0 ? renderSessionsTable(sessions, true) : renderSessionsTable(nonActiveSessions, false)}

      {/* Session Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Session Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs value={sessionTabValue} onChange={handleSessionTabChange} sx={{ mb: 2 }}>
            <Tab label="Session Info" />
            <Tab label="Commands" />
            <Tab label="File Edits" />
          </Tabs>

          {sessionTabValue === 0 && selectedSession && (
            <List>
              <ListItem>
                <ListItemText
                  primary="Session ID"
                  secondary={selectedSession.id}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Operator"
                  secondary={selectedSession.user_name || 'N/A'}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Device"
                  secondary={selectedSession.device_name || 'N/A'}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Start Time"
                  secondary={formatDateTime(selectedSession.start_time)}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Duration"
                  secondary={formatDuration(selectedSession.duration)}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Status"
                  secondary={
                    <Chip
                      label={selectedSession.status}
                      color={getStatusColor(selectedSession.status)}
                      size="small"
                    />
                  }
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="IP Address"
                  secondary={selectedSession.ip_address || 'N/A'}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Command Count"
                  secondary={selectedSession.command_count || 0}
                />
              </ListItem>
            </List>
          )}

          {sessionTabValue === 1 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Command</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commands.length > 0 ? (
                    commands.map((command) => (
                      <TableRow key={command.id}>
                        <TableCell>{formatDateTime(command.executed_at)}</TableCell>
                        <TableCell>
                          <Tooltip title={command.command_text}>
                            <Typography noWrap sx={{ maxWidth: 300 }}>
                              {command.command_text}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={command.status}
                            color={command.status === 'success' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>

                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No commands found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {sessionTabValue === 2 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>File Path</TableCell>
                    <TableCell>Edit Type</TableCell>
                    <TableCell>Changes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fileEditLogs.length > 0 ? (
                    fileEditLogs.map((log) => (
                      <TableRow key={log.log_id}>
                        <TableCell>{formatDateTime(log.edit_started_at)}</TableCell>
                        <TableCell>
                          <Tooltip title={log.file_path}>
                            <Typography noWrap sx={{ maxWidth: 300 }}>
                              {log.file_path}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.edit_type}
                            color={log.edit_type === 'create' ? 'success' : log.edit_type === 'modify' ? 'info' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={log.diff || 'No changes recorded'}>
                            <Typography noWrap sx={{ maxWidth: 300 }}>
                              {log.diff || 'No changes recorded'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No file edits found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          {selectedSession?.status.toLowerCase() === 'active' && (
            <Button
              variant="contained"
              color="error"
              startIcon={<WarningIcon />}
              onClick={handleOpenKillDialog}
            >
              Terminate Session
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Kill Session Confirmation Dialog */}
      <Dialog
        open={killDialogOpen}
        onClose={handleCloseKillDialog}
      >
        <DialogTitle>Confirm Termination</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to terminate this session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseKillDialog}>Cancel</Button>
          <Button
            onClick={handleKillSession}
            color="error"
            variant="contained"
          >
            Terminate
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

export default SupervisorDashboard;
