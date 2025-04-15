import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const SessionView = ({ user }) => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [device, setDevice] = useState(null);
    const [commands, setCommands] = useState([]);
    const [allowedCommands, setAllowedCommands] = useState([]);
    const [currentCommand, setCurrentCommand] = useState('');
    const [commandOutput, setCommandOutput] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('command'); // 'command' or 'edit'
    const [filePath, setFilePath] = useState('');
    const [fileContent, setFileContent] = useState('');
    const commandOutputRef = useRef(null);

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                setLoading(true);
                setError('');

                // Get session details
                const sessionResponse = await axios.get(`/api/sessions/${sessionId}`);
                setSession(sessionResponse.data);

                // Get device details
                const deviceResponse = await axios.get(`/api/devices/${sessionResponse.data.device_id}`);
                setDevice(deviceResponse.data);

                // Get command history
                const commandsResponse = await axios.get(`/api/sessions/${sessionId}/commands`);
                setCommands(commandsResponse.data.commands);

                // Get allowed commands for this user
                if (user && user.role !== 'admin' && user.role !== 'supervisor') {
                    const allowedCommandsResponse = await axios.get('/api/commands/allowed');
                    setAllowedCommands(allowedCommandsResponse.data.commands);
                }

                // Set command outputs from history
                setCommandOutput(
                    commandsResponse.data.commands.map(cmd => ({
                        command: cmd.raw_command,
                        output: cmd.output,
                        time: new Date(cmd.executed_at).toLocaleString()
                    }))
                );
            } catch (err) {
                setError('Failed to load session data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessionData();
    }, [sessionId, user]);

    useEffect(() => {
        // Scroll to bottom of command output
        if (commandOutputRef.current) {
            commandOutputRef.current.scrollTop = commandOutputRef.current.scrollHeight;
        }
    }, [commandOutput]);

    const handleCommandSubmit = async (e) => {
        e.preventDefault();

        if (!currentCommand.trim()) return;

        try {
            // Add command to output immediately
            setCommandOutput(prev => [
                ...prev,
                {
                    command: currentCommand,
                    output: 'Executing...',
                    time: new Date().toLocaleString()
                }
            ]);

            // Execute command
            const response = await axios.post(`/api/sessions/${sessionId}/commands`, {
                command: currentCommand
            });

            // Update output with result
            setCommandOutput(prev => {
                const newOutput = [...prev];
                newOutput[newOutput.length - 1] = {
                    command: currentCommand,
                    output: response.data.command_log.output,
                    time: new Date().toLocaleString()
                };
                return newOutput;
            });

            // Clear input
            setCurrentCommand('');

            // Update commands history
            setCommands(prev => [...prev, response.data.command_log]);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to execute command. Please try again.');

            // Update output with error
            setCommandOutput(prev => {
                const newOutput = [...prev];
                newOutput[newOutput.length - 1] = {
                    command: currentCommand,
                    output: `Error: ${err.response?.data?.error || 'Failed to execute command'}`,
                    time: new Date().toLocaleString()
                };
                return newOutput;
            });
        }
    };

    const handleFileEdit = async (e) => {
        e.preventDefault();

        if (!filePath.trim() || !fileContent.trim()) return;

        try {
            // Execute file edit
            const response = await axios.post(`/api/sessions/${sessionId}/edit-file`, {
                file_path: filePath,
                content: fileContent
            });

            // Add to command output
            setCommandOutput(prev => [
                ...prev,
                {
                    command: `Edit file: ${filePath}`,
                    output: response.data.command_log.output,
                    time: new Date().toLocaleString()
                }
            ]);

            // Clear input
            setFilePath('');
            setFileContent('');

            // Switch back to command mode
            setMode('command');

            // Update commands history
            setCommands(prev => [...prev, response.data.command_log]);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to edit file. Please try again.');
        }
    };

    const handleEndSession = async () => {
        try {
            await axios.put(`/api/sessions/${sessionId}`, {
                status: 'completed'
            });

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to end session. Please try again.');
        }
    };

    if (loading) {
        return <div className="session-loading">Loading session...</div>;
    }

    if (!session || !device) {
        return <div className="error-message">Session not found or access denied.</div>;
    }

    return (
        <div className="dashboard">
            <div className="sidebar">
                <h2>AIoT Monitors</h2>
                <div className="user-info">
                    <p>Welcome, {user.username}</p>
                    <p>Role: {user.role}</p>
                </div>
                <div className="device-info">
                    <h3>Connected Device</h3>
                    <p><strong>Name:</strong> {device.name}</p>
                    <p><strong>Type:</strong> {device.device_type}</p>
                    <p><strong>IP:</strong> {device.ip_address}</p>
                </div>
                <div className="session-actions">
                    <button
                        className={`mode-btn ${mode === 'command' ? 'active' : ''}`}
                        onClick={() => setMode('command')}
                    >
                        Command Mode
                    </button>
                    <button
                        className={`mode-btn ${mode === 'edit' ? 'active' : ''}`}
                        onClick={() => setMode('edit')}
                    >
                        File Edit Mode
                    </button>
                    <button
                        className="end-session-btn"
                        onClick={handleEndSession}
                    >
                        End Session
                    </button>
                </div>
                <div className="allowed-commands">
                    <h3>Allowed Commands</h3>
                    <ul>
                        {allowedCommands.map(cmd => (
                            <li
                                key={cmd.id}
                                onClick={() => setCurrentCommand(cmd.command)}
                            >
                                {cmd.name}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="main-content">
                <h1>Session: {device.name}</h1>

                {error && <div className="error-message">{error}</div>}

                <div className="command-output" ref={commandOutputRef}>
                    {commandOutput.map((cmd, index) => (
                        <div key={index} className="command-item">
                            <div className="command-header">
                                <span className="command-text">$ {cmd.command}</span>
                                <span className="command-time">{cmd.time}</span>
                            </div>
                            <pre className="command-result">{cmd.output}</pre>
                        </div>
                    ))}
                </div>

                {mode === 'command' ? (
                    <form onSubmit={handleCommandSubmit} className="command-form">
                        <div className="input-group">
                            <span className="input-prefix">$</span>
                            <input
                                type="text"
                                value={currentCommand}
                                onChange={(e) => setCurrentCommand(e.target.value)}
                                placeholder="Enter command..."
                                autoFocus
                            />
                        </div>
                        <button type="submit">Execute</button>
                    </form>
                ) : (
                    <form onSubmit={handleFileEdit} className="file-edit-form">
                        <div className="form-group">
                            <label htmlFor="filePath">File Path</label>
                            <input
                                type="text"
                                id="filePath"
                                value={filePath}
                                onChange={(e) => setFilePath(e.target.value)}
                                placeholder="/path/to/file.txt"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fileContent">File Content</label>
                            <textarea
                                id="fileContent"
                                value={fileContent}
                                onChange={(e) => setFileContent(e.target.value)}
                                rows={10}
                                required
                            />
                        </div>
                        <button type="submit">Save File</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SessionView; 