import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Table, Tabs, Tab,
    Form, Button, Alert, Badge, Modal, InputGroup
} from 'react-bootstrap';
import { getReports, getUsers, addUser, updateUser, deleteUser, getVenues, addVenue, deleteVenue } from '../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);

    // User management state
    const [users, setUsers] = useState([]);
    const [userMsg, setUserMsg] = useState({ text: '', type: '' });
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'organizer' });
    const [editUser, setEditUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ role: '', password: '' });

    // Venue management state
    const [venues, setVenues] = useState([]);
    const [venueMsg, setVenueMsg] = useState({ text: '', type: '' });
    const [newVenue, setNewVenue] = useState({ name: '', capacity: '', location: '', description: '' });

    useEffect(() => {
        loadStats();
        loadUsers();
        loadVenues();
    }, []);

    const loadStats = async () => {
        try {
            const res = await getReports();
            setStats(res.data);
        } catch (error) {
            console.error('Error loading reports', error);
        }
    };

    // ── User Management ──────────────────────────────────────────────
    const loadUsers = async () => {
        try {
            const res = await getUsers();
            setUsers(res.data);
        } catch (err) {
            console.error('Error loading users', err);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await addUser(newUser);
            setUserMsg({ text: 'User created successfully!', type: 'success' });
            setNewUser({ username: '', email: '', password: '', role: 'organizer' });
            loadUsers();
        } catch (err) {
            setUserMsg({ text: err.response?.data?.message || 'Failed to create user', type: 'danger' });
        }
    };

    const openEditModal = (user) => {
        setEditUser(user);
        setEditData({ role: user.role, password: '' });
        setShowEditModal(true);
    };

    const handleUpdateUser = async () => {
        try {
            const payload = { id: editUser.id, role: editData.role };
            if (editData.password.trim()) payload.password = editData.password;
            await updateUser(payload);
            setUserMsg({ text: `User "${editUser.username}" updated!`, type: 'success' });
            setShowEditModal(false);
            loadUsers();
        } catch (err) {
            setUserMsg({ text: err.response?.data?.message || 'Failed to update user', type: 'danger' });
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to delete user "${user.username}"? This cannot be undone.`)) return;
        try {
            await deleteUser(user.id);
            setUserMsg({ text: `User "${user.username}" deleted.`, type: 'success' });
            loadUsers();
        } catch (err) {
            setUserMsg({ text: err.response?.data?.message || 'Failed to delete user', type: 'danger' });
        }
    };

    const roleBadge = (role) => {
        const colours = { admin: 'danger', finance: 'warning', organizer: 'primary', staff: 'info', student: 'secondary' };
        return <Badge bg={colours[role] || 'secondary'}>{role}</Badge>;
    };

    // ── Venue Management ────────────────────────────────────────────
    const loadVenues = async () => {
        try {
            const res = await getVenues();
            setVenues(res.data);
        } catch (err) {
            console.error('Error loading venues', err);
        }
    };

    const handleAddVenue = async (e) => {
        e.preventDefault();
        try {
            await addVenue(newVenue);
            setVenueMsg({ text: 'Venue added successfully!', type: 'success' });
            setNewVenue({ name: '', capacity: '', location: '', description: '' });
            loadVenues();
        } catch (err) {
            setVenueMsg({ text: err.response?.data?.message || 'Failed to add venue', type: 'danger' });
        }
    };

    const handleDeleteVenue = async (venue) => {
        if (parseInt(venue.event_count) > 0) {
            alert(`⚠️ Cannot delete "${venue.name}" — it is linked to ${venue.event_count} event(s). Please reassign or remove those events first.`);
            return;
        }
        if (!window.confirm(`Delete venue "${venue.name}"? This cannot be undone.`)) return;
        try {
            await deleteVenue(venue.id);
            setVenueMsg({ text: `Venue "${venue.name}" deleted.`, type: 'success' });
            loadVenues();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to delete venue';
            setVenueMsg({ text: msg, type: 'danger' });
        }
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">🎛️ Admin Dashboard</h2>

            <Tabs defaultActiveKey="overview" className="mb-3">

                {/* ── Overview Tab ── */}
                <Tab eventKey="overview" title="📊 Overview">
                    {stats ? (
                        <>
                            <Row className="mb-4">
                                <Col md={3}>
                                    <Card className="text-center text-white bg-primary mb-3">
                                        <Card.Header>Total Events</Card.Header>
                                        <Card.Body><Card.Title as="h1">{stats.total_events}</Card.Title></Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center text-white bg-warning mb-3">
                                        <Card.Header>Pending Events</Card.Header>
                                        <Card.Body><Card.Title as="h1">{stats.pending_events}</Card.Title></Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center text-white bg-success mb-3">
                                        <Card.Header>Approved Budget</Card.Header>
                                        <Card.Body><Card.Title as="h1">KES {stats.total_budget}</Card.Title></Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center text-white bg-info mb-3">
                                        <Card.Header>Active Users</Card.Header>
                                        <Card.Body><Card.Title as="h1">{stats.total_users}</Card.Title></Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <h5>Venue Utilization</h5>
                            <Table striped bordered className="mt-2">
                                <thead>
                                    <tr><th>Venue Name</th><th>Total Events</th></tr>
                                </thead>
                                <tbody>
                                    {stats.venue_stats.map((v, idx) => (
                                        <tr key={idx}>
                                            <td>{v.name}</td>
                                            <td>{v.event_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    ) : (
                        <p>Loading analytics...</p>
                    )}
                </Tab>

                {/* ── User Management Tab ── */}
                <Tab eventKey="users" title="👥 User Management">
                    {userMsg.text && (
                        <Alert variant={userMsg.type} dismissible onClose={() => setUserMsg({})}>
                            {userMsg.text}
                        </Alert>
                    )}

                    {/* Add New User Form */}
                    <Card className="mb-4">
                        <Card.Header><strong>➕ Add New User</strong></Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleAddUser}>
                                <Row>
                                    <Col md={3}>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Username</Form.Label>
                                            <Form.Control
                                                value={newUser.username}
                                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={newUser.email}
                                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={newUser.password}
                                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Role</Form.Label>
                                            <Form.Select
                                                value={newUser.role}
                                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                            >
                                                <option value="organizer">Event Organizer</option>
                                                <option value="admin">Administrator</option>
                                                <option value="finance">Finance Office</option>
                                                <option value="staff">Staff</option>
                                                <option value="student">Student</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2} className="d-flex align-items-end">
                                        <Button type="submit" variant="success" className="mb-2 w-100">Add User</Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* All Users Table */}
                    <h5>All Users ({users.length})</h5>
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, idx) => (
                                <tr key={u.id}>
                                    <td>{idx + 1}</td>
                                    <td>{u.username}</td>
                                    <td>{u.email}</td>
                                    <td>{roleBadge(u.role)}</td>
                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            className="me-2"
                                            onClick={() => openEditModal(u)}
                                        >
                                            ✏️ Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => handleDeleteUser(u)}
                                        >
                                            🗑️ Remove
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Tab>

                {/* ── Venue Management Tab ── */}
                <Tab eventKey="venues" title="🏛️ Venue Management">
                    {venueMsg.text && (
                        <Alert variant={venueMsg.type} dismissible onClose={() => setVenueMsg({})}>
                            {venueMsg.text}
                        </Alert>
                    )}

                    {/* Add Venue Form */}
                    <Card className="mb-4">
                        <Card.Header><strong>➕ Add New Venue</strong></Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleAddVenue}>
                                <Row>
                                    <Col md={3}>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Venue Name</Form.Label>
                                            <Form.Control
                                                value={newVenue.name}
                                                onChange={e => setNewVenue({ ...newVenue, name: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Capacity</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="1"
                                                value={newVenue.capacity}
                                                onChange={e => setNewVenue({ ...newVenue, capacity: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Location</Form.Label>
                                            <Form.Control
                                                value={newVenue.location}
                                                onChange={e => setNewVenue({ ...newVenue, location: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Description <small className="text-muted">(optional)</small></Form.Label>
                                            <Form.Control
                                                value={newVenue.description}
                                                onChange={e => setNewVenue({ ...newVenue, description: e.target.value })}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={1} className="d-flex align-items-end">
                                        <Button type="submit" variant="success" className="mb-2 w-100">Add</Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* Venues Table */}
                    <h5>All Venues ({venues.length})</h5>
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Capacity</th>
                                <th>Location</th>
                                <th>Description</th>
                                <th>Events</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {venues.map((v, idx) => (
                                <tr key={v.id}>
                                    <td>{idx + 1}</td>
                                    <td><strong>{v.name}</strong></td>
                                    <td>{v.capacity}</td>
                                    <td>{v.location}</td>
                                    <td><small>{v.description || '—'}</small></td>
                                    <td>
                                        {parseInt(v.event_count) > 0
                                            ? <Badge bg="warning" text="dark">{v.event_count} event(s)</Badge>
                                            : <Badge bg="success">Available</Badge>
                                        }
                                    </td>
                                    <td>
                                        <Button
                                            size="sm"
                                            variant={parseInt(v.event_count) > 0 ? 'secondary' : 'outline-danger'}
                                            onClick={() => handleDeleteVenue(v)}
                                            title={parseInt(v.event_count) > 0 ? 'Cannot delete — venue has active events' : 'Delete venue'}
                                        >
                                            🗑️ {parseInt(v.event_count) > 0 ? 'In Use' : 'Delete'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Tab>

            </Tabs>

            {/* ── Edit User Modal ── */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>✏️ Edit User: {editUser?.username}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Change Role</Form.Label>
                        <Form.Select
                            value={editData.role}
                            onChange={e => setEditData({ ...editData, role: e.target.value })}
                        >
                            <option value="organizer">Event Organizer</option>
                            <option value="admin">Administrator</option>
                            <option value="finance">Finance Office</option>
                            <option value="staff">Staff</option>
                            <option value="student">Student</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Reset Password <small className="text-muted">(leave blank to keep current)</small></Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="New password..."
                            value={editData.password}
                            onChange={e => setEditData({ ...editData, password: e.target.value })}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleUpdateUser}>Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminDashboard;
