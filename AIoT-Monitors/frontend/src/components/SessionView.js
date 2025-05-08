import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionService, commandService } from '../services/api';
import axios from 'axios';

const SessionView = ({ user }) => {
    // Modern styles with better colors and layout
    const styles = {
        container: {
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            height: 'calc(100vh - 60px)',
            backgroundColor: '#f8f9fa',
        },
        sidebar: {
            backgroundColor: '#343a40',
            color: '#fff',
            padding: '20px',
            boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column'
        },
        main: {
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'hidden'
        },
        deviceInfo: {
            backgroundColor: '#212529',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
        },
        deviceName: {
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '10px',
            color: '#1ee3cf'
        },
        deviceDetail: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #495057'
        },
        detailLabel: {
            color: '#adb5bd'
        },
        detailValue: {
            color: '#e9ecef'
        },
        terminal: {
            backgroundColor: '#212529',
            color: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },
        outputContainer: {
            overflow: 'auto',
            flexGrow: 1,
            fontFamily: 'monospace',
            fontSize: '14px',
            padding: '15px',
            backgroundColor: '#2c3034',
            borderRadius: '4px',
            marginBottom: '15px'
        },
        commandForm: {
            display: 'flex',
            backgroundColor: '#343a40',
            borderRadius: '4px',
            overflow: 'hidden'
        },
        commandPrefix: {
            padding: '10px 15px',
            backgroundColor: '#1ee3cf',
            color: '#212529',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center'
        },
        commandInput: {
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            padding: '10px 15px',
            flexGrow: 1,
            fontFamily: 'monospace',
            fontSize: '14px',
            outline: 'none'
        },
        commandItem: {
            margin: '10px 0',
            borderLeft: '3px solid #1ee3cf',
            paddingLeft: '10px'
        },
        commandText: {
            color: '#1ee3cf',
            fontWeight: 'bold',
            marginBottom: '5px'
        },
        commandTime: {
            color: '#6c757d',
            fontSize: '12px',
            marginBottom: '5px'
        },
        commandOutput: {
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
        },
        allowedCommands: {
            marginTop: '20px',
            maxHeight: '40%',
            overflow: 'auto'
        },
        allowedCommandsTitle: {
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '10px',
            color: '#1ee3cf',
            borderBottom: '1px solid #495057',
            paddingBottom: '10px'
        },
        allowedCommandsList: {
            padding: '0',
            margin: '0',
            listStyle: 'none'
        },
        allowedCommandItem: {
            padding: '10px',
            margin: '5px 0',
            backgroundColor: '#2c3034',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderLeft: '3px solid transparent'
        },
        allowedCommandItemHover: {
            borderLeft: '3px solid #1ee3cf',
            backgroundColor: '#343a40'
        },
        commandDescription: {
            fontSize: '12px',
            color: '#adb5bd',
            marginTop: '5px'
        },
        statusBadge: {
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'inline-block',
            marginBottom: '10px'
        },
        statusActive: {
            backgroundColor: '#28a745',
            color: '#fff'
        },
        statusCompleted: {
            backgroundColor: '#6c757d',
            color: '#fff'
        },
        profileInfo: {
            backgroundColor: '#2c3034',
            borderRadius: '4px',
            padding: '10px 15px',
            marginBottom: '15px'
        },
        profileName: {
            color: '#1ee3cf',
            fontWeight: 'bold'
        },
        profileDescription: {
            color: '#adb5bd',
            fontSize: '12px'
        },
        endButton: {
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: 'auto',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
        },
        endButtonHover: {
            backgroundColor: '#c82333'
        },
        error: {
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px 15px',
            borderRadius: '4px',
            marginBottom: '15px'
        }
    };

    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [device, setDevice] = useState(null);
    const [commandHistory, setCommandHistory] = useState([]);
    const [allowedCommands, setAllowedCommands] = useState([]);
    const [currentCommand, setCurrentCommand] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hoveredCommand, setHoveredCommand] = useState(null);
    const [activeProfile, setActiveProfile] = useState(null);
    const outputContainerRef = useRef(null);
    const [buttonHover, setButtonHover] = useState(false);

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                setLoading(true);
                setError('');

                // Get session details with all related data
                const response = await axios.get(`/api/sessions/${sessionId}`);
                const sessionData = response.data.session;

                setSession(sessionData);
                setDevice(sessionData.device);
                setCommandHistory(sessionData.commands || []);

                // Set active profile if device has associated profiles
                if (sessionData.device_profiles && sessionData.device_profiles.length > 0) {
                    const profile = sessionData.device_profiles[0];
                    setActiveProfile(profile);

                    // Fetch allowed commands directly from the command list
                    if (profile.list_id) {
                        try {
                            const commandsResponse = await axios.get(`/api/commands/lists/${profile.list_id}/commands`);
                            if (commandsResponse.data && commandsResponse.data.commands) {
                                setAllowedCommands(commandsResponse.data.commands.map(cmd => ({
                                    id: cmd.id,
                                    command: cmd.command, // This will contain the command_text from backend
                                    description: cmd.description
                                })));
                            }
                        } catch (cmdErr) {
                            console.error('Error fetching commands:', cmdErr);
                        }
                    }
                }
            } catch (err) {
                setError('Failed to load session data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessionData();
    }, [sessionId]);

    useEffect(() => {
        // Scroll to bottom of command output
        if (outputContainerRef.current) {
            outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
        }
    }, [commandHistory]);

    const handleCommandSubmit = async (e) => {
        e.preventDefault();

        if (!currentCommand.trim()) return;

        try {
            // Add command to history immediately with pending status
            const tempCommand = {
                command_text: currentCommand,
                output: 'Executing command...',
                status: 'pending',
                executed_at: new Date().toISOString()
            };

            setCommandHistory(prev => [...prev, tempCommand]);

            // Execute command
            const response = await axios.post(`/api/sessions/${sessionId}/commands`, {
                command: currentCommand
            });

            // Update command history with result
            if (response.data.success) {
                setCommandHistory(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = response.data.command_log;
                    return updated;
                });
                setError('');
            }

            // Clear input
            setCurrentCommand('');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to execute command. Please try again.';
            setError(errorMessage);

            // Update command history with error
            setCommandHistory(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                    updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        output: `Error: ${errorMessage}`,
                        status: 'failed'
                    };
                }
                return updated;
            });
        }
    };

    const handleSelectCommand = (command) => {
        setCurrentCommand(command.command);
    };

    const handleEndSession = async () => {
        try {
            await sessionService.endSession(sessionId);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to end session. Please try again.');
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(100vh - 60px)',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner"></div>
                    <div style={{ marginTop: '20px', fontSize: '18px', color: '#343a40' }}>
                        Loading session...
                    </div>
                </div>
            </div>
        );
    }

    if (!session || !device) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(100vh - 60px)',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    maxWidth: '500px'
                }}>
                    <h3>Session not found or access denied</h3>
                    <p>You may not have permission to view this session or it no longer exists.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            backgroundColor: '#6c757d',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 15px',
                            borderRadius: '4px',
                            marginTop: '15px',
                            cursor: 'pointer'
                        }}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <div style={styles.sidebar}>
                <h2 style={{ marginBottom: '30px', color: '#1ee3cf' }}>Session #{sessionId}</h2>

                {/* Device information */}
                <div style={styles.deviceInfo}>
                    <div style={styles.deviceName}>{device.name}</div>

                    <span style={{
                        ...styles.statusBadge,
                        ...(session.status === 'active' ? styles.statusActive : styles.statusCompleted)
                    }}>
                        {session.status}
                    </span>

                    <div style={styles.deviceDetail}>
                        <span style={styles.detailLabel}>Type</span>
                        <span style={styles.detailValue}>{device.device_type}</span>
                    </div>
                    <div style={styles.deviceDetail}>
                        <span style={styles.detailLabel}>IP Address</span>
                        <span style={styles.detailValue}>{device.ip_address}</span>
                    </div>
                    <div style={styles.deviceDetail}>
                        <span style={styles.detailLabel}>SSH Port</span>
                        <span style={styles.detailValue}>{device.ssh_port || 22}</span>
                    </div>
                    {device.group && (
                        <div style={styles.deviceDetail}>
                            <span style={styles.detailLabel}>Group</span>
                            <span style={styles.detailValue}>{device.group.name}</span>
                        </div>
                    )}
                    <div style={styles.deviceDetail}>
                        <span style={styles.detailLabel}>Session start</span>
                        <span style={styles.detailValue}>
                            {new Date(session.start_time).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Profile information */}
                {activeProfile && (
                    <div style={styles.profileInfo}>
                        <div style={styles.profileName}>{activeProfile.name}</div>
                        <div style={styles.profileDescription}>{activeProfile.description}</div>
                    </div>
                )}

                {/* Allowed commands */}
                <div style={styles.allowedCommands}>
                    <div style={styles.allowedCommandsTitle}>Allowed Commands</div>
                    {allowedCommands.length > 0 ? (
                        <ul style={styles.allowedCommandsList}>
                            {allowedCommands.map((cmd, index) => (
                                <li
                                    key={index}
                                    style={{
                                        ...styles.allowedCommandItem,
                                        ...(hoveredCommand === index ? styles.allowedCommandItemHover : {})
                                    }}
                                    onMouseEnter={() => setHoveredCommand(index)}
                                    onMouseLeave={() => setHoveredCommand(null)}
                                    onClick={() => handleSelectCommand(cmd)}
                                >
                                    <div style={{ fontFamily: 'monospace' }}>
                                        {cmd.command}
                                    </div>
                                    {cmd.description && (
                                        <div style={styles.commandDescription}>
                                            {cmd.description}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{ color: '#adb5bd', fontStyle: 'italic' }}>
                            No commands have been assigned to your profile.
                        </div>
                    )}
                </div>

                {/* End session button */}
                <button
                    style={{
                        ...styles.endButton,
                        ...(buttonHover ? styles.endButtonHover : {})
                    }}
                    onMouseEnter={() => setButtonHover(true)}
                    onMouseLeave={() => setButtonHover(false)}
                    onClick={handleEndSession}
                    disabled={session.status !== 'active'}
                >
                    End Session
                </button>
            </div>

            {/* Main content */}
            <div style={styles.main}>
                {/* Error message if any */}
                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}

                {/* Terminal */}
                <div style={styles.terminal}>
                    <div style={styles.outputContainer} ref={outputContainerRef}>
                        {commandHistory.length > 0 ? (
                            commandHistory.map((cmd, index) => (
                                <div key={index} style={styles.commandItem}>
                                    <div style={styles.commandText}>
                                        $ {cmd.command_text}
                                    </div>
                                    <div style={styles.commandTime}>
                                        {new Date(cmd.executed_at).toLocaleString()}
                                    </div>
                                    <div style={styles.commandOutput}>
                                        {cmd.output}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                No commands executed yet. Use the input below to run commands.
                            </div>
                        )}
                    </div>

                    {/* Command input */}
                    {session.status === 'active' && (
                        <form onSubmit={handleCommandSubmit} style={styles.commandForm}>
                            <div style={styles.commandPrefix}>$</div>
                            <input
                                type="text"
                                value={currentCommand}
                                onChange={(e) => setCurrentCommand(e.target.value)}
                                style={styles.commandInput}
                                placeholder="Enter command..."
                                autoFocus
                            />
                        </form>
                    )}

                    {session.status !== 'active' && (
                        <div style={{
                            backgroundColor: '#6c757d',
                            color: '#fff',
                            padding: '10px 15px',
                            borderRadius: '4px',
                            textAlign: 'center'
                        }}>
                            This session is {session.status}. No further commands can be executed.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionView;