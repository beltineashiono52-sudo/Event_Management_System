import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Form, Button, Alert, Table, Modal, Badge } from 'react-bootstrap';
import { createBooking, getEvents, submitBudget, getBudgets, getVenues, updateBooking, getEventRegistrations } from '../services/api';

const OrganizerDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    const [events, setEvents] = useState([]);
    const [venues, setVenues] = useState([]);
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [attendeeCounts, setAttendeeCounts] = useState({}); // { event_id: count }
    const [showAttendeesId, setShowAttendeesId] = useState(null); // event_id for modal
    const [attendeeList, setAttendeeList] = useState([]);

    // New event state
    const [bookingData, setBookingData] = useState({
        title: '',
        description: '',
        venue_id: '',
        start_time: '',
        end_time: '',
        type: 'social',
        organizer_id: user.id
    });

    // Budget state
    const [budgetData, setBudgetData] = useState({ event_id: '', item_name: '', amount: '' });

    // Edit event state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editEvent, setEditEvent] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        loadEvents();
        loadVenues();
    }, []);

    const loadAttendeeCounts = async (eventList) => {
        if (!eventList || eventList.length === 0) return;
        try {
            const counts = {};
            await Promise.all(eventList.map(async (e) => {
                const res = await getEventRegistrations(e.id);
                counts[e.id] = res.data.count || 0;
            }));
            setAttendeeCounts(counts);
        } catch (err) {
            console.error('Error loading attendee counts', err);
        }
    };

    const loadEvents = async () => {
        try {
            const res = await getEvents();
            const myEvents = res.data.filter(e => e.organizer_id === user.id);
            setEvents(myEvents);
            loadAttendeeCounts(myEvents);
        } catch (err) {
            console.error('Error loading events', err);
        }
    };

    const loadVenues = async () => {
        try {
            const res = await getVenues();
            setVenues(res.data);
            // Set default venue_id to first venue
            if (res.data.length > 0) {
                setBookingData(prev => ({ ...prev, venue_id: res.data[0].id }));
            }
        } catch (err) {
            console.error('Error loading venues', err);
        }
    };

    // ── Create Event ──────────────────────────────────────────────
    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        try {
            await createBooking(bookingData);
            setMsg({ text: '✅ Event request submitted successfully!', type: 'success' });
            setBookingData({
                title: '',
                description: '',
                venue_id: venues.length > 0 ? venues[0].id : '',
                start_time: '',
                end_time: '',
                type: 'social',
                organizer_id: user.id
            });
            loadEvents();
        } catch (err) {
            setMsg({ text: err.response?.data?.message || '❌ Booking failed', type: 'danger' });
        }
    };

    // ── Budget ────────────────────────────────────────────────────
    const handleBudgetSubmit = async (e) => {
        e.preventDefault();
        try {
            await submitBudget(budgetData);
            setMsg({ text: '✅ Budget item submitted!', type: 'success' });
            setBudgetData({ event_id: '', item_name: '', amount: '' });
        } catch (err) {
            setMsg({ text: '❌ Budget submission failed', type: 'danger' });
        }
    };

    // ── Edit Event ────────────────────────────────────────────────
    const openEditModal = (event) => {
        setEditEvent(event);
        setEditData({
            id: event.id,
            title: event.title,
            description: event.description || '',
            venue_id: event.venue_id,
            start_time: event.start_time?.slice(0, 16),   // format for datetime-local
            end_time: event.end_time?.slice(0, 16),
            type: event.type
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateBooking(editData);
            setMsg({ text: '✅ Event updated! Attendees have been notified.', type: 'success' });
            setShowEditModal(false);
            loadEvents();
        } catch (err) {
            setMsg({ text: err.response?.data?.message || '❌ Failed to update event', type: 'danger' });
        }
    };

    const statusBadge = (status) => {
        const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
        return <Badge bg={map[status] || 'secondary'} text={status === 'pending' ? 'dark' : undefined}>{status}</Badge>;
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">🗂️ Organizer Dashboard</h2>
            {msg.text && (
                <Alert variant={msg.type} dismissible onClose={() => setMsg({})}>
                    {msg.text}
                </Alert>
            )}

            <Tabs defaultActiveKey="events" className="mb-3">

                {/* ── My Events ── */}
                <Tab eventKey="events" title="📋 My Events">
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Venue</th>
                                <th>👥 Attendees</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.length === 0 ? (
                                <tr><td colSpan={8} className="text-center text-muted">No events yet. Create one below.</td></tr>
                            ) : events.map(e => (
                                <tr key={e.id}>
                                    <td><strong>{e.title}</strong></td>
                                    <td><small>{e.description || '—'}</small></td>
                                    <td>{new Date(e.start_time).toLocaleString()}</td>
                                    <td>{new Date(e.end_time).toLocaleString()}</td>
                                    <td>{e.venue_name}</td>
                                    <td className="text-center">
                                        <Button
                                            size="sm"
                                            variant="outline-info"
                                            onClick={async () => {
                                                const res = await getEventRegistrations(e.id);
                                                setAttendeeList(res.data.attendees || []);
                                                setShowAttendeesId(e.id);
                                            }}
                                        >
                                            👥 {attendeeCounts[e.id] ?? '…'}
                                        </Button>
                                    </td>
                                    <td>{statusBadge(e.status)}</td>
                                    <td>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            onClick={() => openEditModal(e)}
                                        >
                                            ✏️ Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {/* Attendee List Modal */}
                    {showAttendeesId && (
                        <div className="mt-3 border rounded p-3 bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0">👥 Registered Attendees for Event #{showAttendeesId}</h6>
                                <Button size="sm" variant="outline-secondary" onClick={() => setShowAttendeesId(null)}>✕ Close</Button>
                            </div>
                            {attendeeList.length === 0 ? (
                                <p className="text-muted mb-0">No attendees registered yet.</p>
                            ) : (
                                <Table size="sm" striped bordered className="mb-0">
                                    <thead>
                                        <tr><th>#</th><th>Username</th><th>Email</th><th>Role</th><th>Registered At</th></tr>
                                    </thead>
                                    <tbody>
                                        {attendeeList.map((a, i) => (
                                            <tr key={i}>
                                                <td>{i + 1}</td>
                                                <td>{a.username}</td>
                                                <td>{a.email}</td>
                                                <td><Badge bg="secondary">{a.role}</Badge></td>
                                                <td><small>{new Date(a.registered_at).toLocaleString()}</small></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </div>
                    )}
                </Tab>

                {/* ── Add Event ── */}
                <Tab eventKey="booking" title="➕ Add Event">
                    <Form onSubmit={handleBookingSubmit} style={{ maxWidth: 600 }}>
                        <Form.Group className="mb-3">
                            <Form.Label>Event Title <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                value={bookingData.title}
                                onChange={e => setBookingData({ ...bookingData, title: e.target.value })}
                                placeholder="e.g. Annual Science Fair"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={bookingData.description}
                                onChange={e => setBookingData({ ...bookingData, description: e.target.value })}
                                placeholder="Briefly describe what this event is about..."
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Event Type <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                                value={bookingData.type}
                                onChange={e => setBookingData({ ...bookingData, type: e.target.value })}
                            >
                                <option value="social">Social</option>
                                <option value="fundraiser">Fundraiser</option>
                                <option value="workshop">Workshop</option>
                                <option value="other">Other</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Venue <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                                value={bookingData.venue_id}
                                onChange={e => setBookingData({ ...bookingData, venue_id: e.target.value })}
                                required
                            >
                                {venues.length === 0
                                    ? <option disabled>Loading venues...</option>
                                    : venues.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} — Capacity: {v.capacity} ({v.location})
                                        </option>
                                    ))
                                }
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Start Time <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={bookingData.start_time}
                                onChange={e => setBookingData({ ...bookingData, start_time: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>End Time <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={bookingData.end_time}
                                onChange={e => setBookingData({ ...bookingData, end_time: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Button type="submit" variant="primary">📅 Submit Event Request</Button>
                    </Form>
                </Tab>

                {/* ── Submit Budget ── */}
                <Tab eventKey="budget" title="💰 Submit Budget">
                    <Form onSubmit={handleBudgetSubmit} style={{ maxWidth: 500 }}>
                        <Form.Group className="mb-3">
                            <Form.Label>Select Event <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                                value={budgetData.event_id}
                                onChange={e => setBudgetData({ ...budgetData, event_id: e.target.value })}
                                required
                            >
                                <option value="">Select Event...</option>
                                {events.map(e => (
                                    <option key={e.id} value={e.id}>{e.title}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Item Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                value={budgetData.item_name}
                                onChange={e => setBudgetData({ ...budgetData, item_name: e.target.value })}
                                placeholder="e.g. Catering, Sound System"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Amount (KES) <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                value={budgetData.amount}
                                onChange={e => setBudgetData({ ...budgetData, amount: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="success">Submit Budget Item</Button>
                    </Form>
                </Tab>

            </Tabs>

            {/* ── Edit Event Modal ── */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>✏️ Edit Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info" className="py-2">
                        <small>⚠️ Saving changes will send a notification to all registered attendees.</small>
                    </Alert>
                    {editData && (
                        <Form onSubmit={handleEditSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Event Title</Form.Label>
                                <Form.Control
                                    value={editData.title || ''}
                                    onChange={e => setEditData({ ...editData, title: e.target.value })}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={editData.description || ''}
                                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Event Type</Form.Label>
                                <Form.Select
                                    value={editData.type || 'social'}
                                    onChange={e => setEditData({ ...editData, type: e.target.value })}
                                >
                                    <option value="social">Social</option>
                                    <option value="fundraiser">Fundraiser</option>
                                    <option value="workshop">Workshop</option>
                                    <option value="other">Other</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Venue</Form.Label>
                                <Form.Select
                                    value={editData.venue_id || ''}
                                    onChange={e => setEditData({ ...editData, venue_id: e.target.value })}
                                >
                                    {venues.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} — Capacity: {v.capacity} ({v.location})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Start Time</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={editData.start_time || ''}
                                    onChange={e => setEditData({ ...editData, start_time: e.target.value })}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>End Time</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={editData.end_time || ''}
                                    onChange={e => setEditData({ ...editData, end_time: e.target.value })}
                                    required
                                />
                            </Form.Group>

                            <Modal.Footer className="px-0 pb-0">
                                <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">💾 Save Changes & Notify Attendees</Button>
                            </Modal.Footer>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default OrganizerDashboard;
