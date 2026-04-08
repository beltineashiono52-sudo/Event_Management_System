import React, { useState, useEffect } from 'react';
import { Navbar, Container, Nav, Button, Badge, Offcanvas, ListGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead } from '../services/api';

const Navigation = () => {
    const navigate = useNavigate();
    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;

    const [notifications, setNotifications] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        if (user) {
            loadNotifications();
            // Polling every 30 seconds for live updates
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            const res = await getNotifications(user.id);
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to load notifications');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
            );
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.is_read);
        for (const n of unread) {
            await markNotificationRead(n.id);
        }
        loadNotifications();
    };

    if (!user) return null;

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand as={Link} to={`/${user.role}`}>🎓 UniEvents</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link as={Link} to={`/${user.role}`}>Dashboard</Nav.Link>
                        </Nav>
                        <Nav className="align-items-center">
                            {/* Notification Bell */}
                            <Button 
                                variant="link" 
                                className="text-light p-0 me-4 position-relative text-decoration-none"
                                onClick={() => setShowSidebar(true)}
                                style={{ fontSize: '1.2rem' }}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <Badge 
                                        pill 
                                        bg="danger" 
                                        className="position-absolute top-0 start-100 translate-middle"
                                        style={{ fontSize: '0.6rem' }}
                                    >
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Button>

                            <Navbar.Text className="me-3 text-light">
                                Signed in as: <strong>{user.username}</strong>
                                <Badge bg="secondary" className="ms-2">{user.role}</Badge>
                            </Navbar.Text>
                            <Button variant="outline-light" size="sm" onClick={handleLogout}>Logout</Button>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Notification Sidebar */}
            <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="end">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>🔔 Notifications</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    {unreadCount > 0 && (
                        <div className="p-2 border-bottom text-end bg-light">
                            <Button variant="link" size="sm" onClick={handleMarkAllRead} className="text-decoration-none">
                                Mark all as read
                            </Button>
                        </div>
                    )}
                    <ListGroup variant="flush">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-muted">You're all caught up!</div>
                        ) : (
                            notifications.map(n => (
                                <ListGroup.Item 
                                    key={n.id} 
                                    className={n.is_read ? 'text-muted bg-light' : 'fw-bold'}
                                    style={{ cursor: n.is_read ? 'default' : 'pointer', borderLeft: n.is_read ? 'none' : '4px solid #0d6efd' }}
                                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                                >
                                    <div className="d-flex justify-content-between">
                                        <small className="text-secondary">{new Date(n.created_at).toLocaleString()}</small>
                                        {!n.is_read && <Badge bg="primary" pill>New</Badge>}
                                    </div>
                                    <div className="mt-1" style={{ fontSize: '0.9rem' }}>{n.message}</div>
                                </ListGroup.Item>
                            ))
                        )}
                    </ListGroup>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default Navigation;