import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SessionsList = ({ user }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeOnly, setActiveOnly] = useState(true);
    const navigate = useNavigate();

    const styles = {
        container: {
            padding: '30px',
            maxWidth: '1200px',
            margin: '0 auto'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
        },
        title: {
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0',
            color: '#343a40'
        },
        filterButton: {
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#00e5c6',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer'
        },
        sessionsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
        },
        sessionCard: {
            backgroundColor: '#343a40',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        sessionHeader: {
            padding: '20px',
            position: 'relative'
        },
        sessionTitle: {
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '5px',
            color: '#00e5c6'
        },
        sessionSubtitle: {
            fontSize: '14px',
            color: '#fff',
            opacity: '0.8'
        },
        sessionBody: {
            padding: '20px',
            backgroundColor: '#fff'
        },
        sessionDetail: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
        },
        sessionLabel: {
            color: '#666',
            fontSize: '14px'
        },
        sessionValue: {
            fontWeight: '500',
            fontSize: '14px',
            color: '#212529'
        },
        sessionFooter: {
            padding: '15px 20px',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        viewButton: {
            padding: '6px 12px',
            backgroundColor: '#00e5c6',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer'
        },
        statusBadge: {
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '5px 10px',
            borderRadius: '50px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: '#28a745',
            color: '#fff'
        },
        loading: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
            fontSize: '18px',
            color: '#6c757d'
        },
        error: {
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
        },
        noSessions: {
            backgroundColor: '#e9ecef',
            padding: '40px 30px',
            borderRadius: '8px',
            textAlign: 'center'
        },
        noSessionsText: {
            color: '#6c757d',
            fontSize: '18px',
            marginBottom: '20px'
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [activeOnly]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.get('/api/sessions', {
                params: {
                    active_only: activeOnly,
                    detailed: true
                }
            });

            setSessions(response.data.sessions || []);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError('Failed to load sessions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (sessionId) => {
        navigate(`/sessions/${sessionId}`);
    };

    const toggleActiveOnly = () => {
        setActiveOnly(!activeOnly);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);

        // Format as "HH:MM:SS DD/MM/YYYY"
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>
                    <div>Loading sessions...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Sessions</h1>
                <button
                    style={styles.filterButton}
                    onClick={toggleActiveOnly}
                >
                    {activeOnly ? 'Active Only' : 'All Sessions'}
                </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {sessions.length === 0 ? (
                <div style={styles.noSessions}>
                    <div style={styles.noSessionsText}>
                        {activeOnly
                            ? "You don't have any active sessions."
                            : "You don't have any sessions yet."}
                    </div>
                </div>
            ) : (
                <div style={styles.sessionsGrid}>
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            style={styles.sessionCard}
                            onClick={() => handleCardClick(session.id)}
                        >
                            <div style={styles.sessionHeader}>
                                <div style={styles.sessionTitle}>
                                    {session.device?.name || `Device #${session.device_id}`}
                                </div>
                                <div style={styles.sessionSubtitle}>
                                    Session #{session.id}
                                </div>
                                {session.status === 'active' && (
                                    <div style={styles.statusBadge}>active</div>
                                )}
                            </div>
                            <div style={styles.sessionBody}>
                                <div style={styles.sessionDetail}>
                                    <span style={styles.sessionLabel}>Start Time</span>
                                    <span style={styles.sessionValue}>{formatDate(session.start_time)}</span>
                                </div>
                                <div style={styles.sessionDetail}>
                                    <span style={styles.sessionLabel}>IP Address</span>
                                    <span style={styles.sessionValue}>{session.device?.ip_address || session.ip_address || 'N/A'}</span>
                                </div>
                                <div style={styles.sessionDetail}>
                                    <span style={styles.sessionLabel}>Type</span>
                                    <span style={styles.sessionValue}>{session.device?.device_type || 'N/A'}</span>
                                </div>
                            </div>
                            <div style={styles.sessionFooter}>
                                <span>{session.command_count || 0} commands</span>
                                <button style={styles.viewButton}>View</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SessionsList; 