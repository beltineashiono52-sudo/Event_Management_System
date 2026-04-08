import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { getEvents, getUserRegistrations, registerForEvent, unregisterFromEvent, getNotifications, markNotificationRead } from '../services/api';

const StaffDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    const [events, setEvents] = useState([]);
    const [registeredIds, setRegisteredIds] = useState(new Set());
    const [notifications, setNotifications] = useState([]);
    const [loadingId, setLoadingId] = useState(null);
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            const [evRes, regRes, notifRes] = await Promise.all([
                getEvents(),
                getUserRegistrations(user.id),
                getNotifications(user.id)
            ]);

            // Show pending and approved events; hide rejected ones
            setEvents(evRes.data.filter(e => e.status !== 'rejected'));
            setRegisteredIds(new Set(regRes.data.map(id => parseInt(id))));
            setNotifications(notifRes.data.filter(n => !n.is_read));
        } catch (err) {
            console.error('Error loading dashboard data', err);
        }
    };

    const handleRegister = async (event) => {
        setLoadingId(event.id);
        try {
            if (registeredIds.has(event.id)) {
                await unregisterFromEvent(user.id, event.id);
                setRegisteredIds(prev => { const n = new Set(prev); n.delete(event.id); return n; });
                addToast(`Cancelled registration for "${event.title}"`, 'warning');
            } else {
                await registerForEvent(user.id, event.id);
                setRegisteredIds(prev => new Set([...prev, event.id]));
                addToast(`✅ Registered for "${event.title}"!`, 'success');
                loadNotifications();
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Action failed. Please try again.';
            addToast(msg, 'danger');
        } finally {
            setLoadingId(null);
        }
    };

    const loadNotifications = async () => {
        try {
            const res = await getNotifications(user.id);
            setNotifications(res.data.filter(n => !n.is_read));
        } catch (err) {/* silent */}
    };

    const dismissNotification = async (notif) => {
        try {
            await markNotificationRead(notif.id);
            setNotifications(prev => prev.filter(n => n.id !== notif.id));
        } catch (err) {/* silent */}
    };

    const addToast = (message, bg) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, bg }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const typeBadgeColour = { social: 'info', fundraiser: 'success', workshop: 'primary', other: 'secondary' };

    return (
        <Container className="py-4">
            {/* ── Toast Notifications ── */}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                {toasts.map(t => (
                    <Toast key={t.id} bg={t.bg} autohide show>
                        <Toast.Body className="text-white fw-semibold">{t.message}</Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>

            <h2 className="mb-1">🏢 Staff Dashboard</h2>
            <p className="text-muted mb-4">Browse and register for upcoming campus events.</p>

            {/* ── Notification Alerts ── */}
            {notifications.length > 0 && (
                <div className="mb-4">
                    <h5>🔔 Notifications ({notifications.length})</h5>
                    {notifications.map(n => (
                        <Alert
                            key={n.id}
                            variant="warning"
                            dismissible
                            onClose={() => dismissNotification(n)}
                            className="py-2"
                        >
                            <small className="text-muted d-block">{new Date(n.created_at).toLocaleString()}</small>
                            {n.message}
                        </Alert>
                    ))}
                </div>
            )}

            {/* ── Events Grid ── */}
            {events.length === 0 ? (
                <Alert variant="info">No approved events available at the moment. Check back soon!</Alert>
            ) : (
                <Row>
                    {events.map(event => {
                        const isRegistered = registeredIds.has(parseInt(event.id));
                        const isLoading = loadingId === event.id;
                        return (
                            <Col md={4} key={event.id} className="mb-4">
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="d-flex flex-column">
                                        <div className="mb-2">
                                            <Badge bg={typeBadgeColour[event.type] || 'secondary'} className="me-2">
                                                {event.type}
                                            </Badge>
                                            {event.status === 'pending' && (
                                                <Badge bg="warning" text="dark">⏳ Pending Approval</Badge>
                                            )}
                                            {event.status === 'approved' && isRegistered && (
                                                <Badge bg="success">✓ Registered</Badge>
                                            )}
                                        </div>
                                        <Card.Title>{event.title}</Card.Title>
                                        <Card.Subtitle className="mb-2 text-muted">
                                            📅 {new Date(event.start_time).toLocaleString()}
                                        </Card.Subtitle>
                                        <Card.Text className="flex-grow-1">
                                            {event.description
                                                ? <span>{event.description}</span>
                                                : <span className="text-muted fst-italic">No description provided.</span>
                                            }
                                            <br /><br />
                                            <strong>📍 Venue:</strong> {event.venue_name}
                                        </Card.Text>
                                        {event.status === 'approved' ? (
                                            <Button
                                                variant={isRegistered ? 'outline-danger' : 'success'}
                                                size="sm"
                                                disabled={isLoading}
                                                onClick={() => handleRegister(event)}
                                            >
                                                {isLoading
                                                    ? <><Spinner as="span" size="sm" animation="border" className="me-1" />Processing...</>
                                                    : isRegistered
                                                        ? '✓ Registered — Cancel?'
                                                        : 'Register'
                                                }
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" size="sm" disabled>
                                                ⏳ Awaiting Approval
                                            </Button>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Container>
    );
};

export default StaffDashboard;
