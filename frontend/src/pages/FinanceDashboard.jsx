import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Alert, Tabs, Tab } from 'react-bootstrap';
import { getBudgets, updateBudgetStatus, getEvents, updateBooking } from '../services/api';

const FinanceDashboard = () => {
    const [budgets, setBudgets] = useState([]);
    const [events, setEvents] = useState([]);
    const [msg, setMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        loadBudgets();
        loadEvents();
    }, []);

    const loadBudgets = async () => {
        try {
            const res = await getBudgets();
            setBudgets(res.data);
        } catch (error) {
            console.error("Error loading budgets", error);
        }
    };

    const loadEvents = async () => {
        try {
            const res = await getEvents();
            setEvents(res.data);
        } catch (error) {
            console.error("Error loading events", error);
        }
    };

    const handleBudgetStatusUpdate = async (id, status) => {
        try {
            await updateBudgetStatus(id, status);
            setMsg({ text: `Budget ${status}`, type: 'success' });
            loadBudgets();
        } catch (err) {
            setMsg({ text: `Failed to ${status} budget`, type: 'danger' });
        }
    };

    const handleEventStatusUpdate = async (id, status) => {
        try {
            // Send special status_update action to the bookings PUT endpoint
            await updateBooking({ id, action: 'status_update', status });
            setMsg({ text: `Event ${status} and global notifications sent!`, type: 'success' });
            loadEvents();
        } catch (err) {
            setMsg({ text: err.response?.data?.message || `Failed to ${status} event`, type: 'danger' });
        }
    };

    const statusBadge = (status) => {
        if (status === 'approved') return <Badge bg="success">Approved</Badge>;
        if (status === 'rejected') return <Badge bg="danger">Rejected</Badge>;
        return <Badge bg="warning" text="dark">Pending</Badge>;
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">💼 Finance Office Dashboard</h2>
            {msg.text && <Alert variant={msg.type} dismissible onClose={() => setMsg({})}>{msg.text}</Alert>}

            <Tabs defaultActiveKey="events" className="mb-3">
                {/* ── Events Approval Tab ── */}
                <Tab eventKey="events" title="📅 Event Approvals">
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>Event Title</th>
                                <th>Organizer</th>
                                <th>Venue</th>
                                <th>Date/Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(e => (
                                <tr key={e.id}>
                                    <td><strong>{e.title}</strong></td>
                                    <td>{e.organizer_name}</td>
                                    <td>{e.venue_name}</td>
                                    <td>
                                        <small>
                                            {new Date(e.start_time).toLocaleString()} <br/>
                                            to {new Date(e.end_time).toLocaleString()}
                                        </small>
                                    </td>
                                    <td>{statusBadge(e.status)}</td>
                                    <td>
                                        {e.status === 'pending' && (
                                            <>
                                                <Button 
                                                    variant="success" 
                                                    size="sm" 
                                                    className="me-2" 
                                                    onClick={() => handleEventStatusUpdate(e.id, 'approved')}
                                                >
                                                    ✅ Approve Event
                                                </Button>
                                                <Button 
                                                    variant="danger" 
                                                    size="sm" 
                                                    onClick={() => handleEventStatusUpdate(e.id, 'rejected')}
                                                >
                                                    ❌ Reject
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {events.length === 0 && <tr><td colSpan="6" className="text-center">No events found.</td></tr>}
                        </tbody>
                    </Table>
                </Tab>

                {/* ── Budget Approval Tab ── */}
                <Tab eventKey="budgets" title="💰 Budget Approvals">
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>Event</th>
                                <th>Organizer</th>
                                <th>Item</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budgets.map(b => (
                                <tr key={b.id}>
                                    <td>{b.event_title}</td>
                                    <td>{b.organizer_name}</td>
                                    <td>{b.item_name}</td>
                                    <td><strong>KES {b.amount}</strong></td>
                                    <td>{statusBadge(b.status)}</td>
                                    <td>
                                        {b.status === 'pending' && (
                                            <>
                                                <Button 
                                                    variant="success" 
                                                    size="sm" 
                                                    className="me-2" 
                                                    onClick={() => handleBudgetStatusUpdate(b.id, 'approved')}
                                                >
                                                    ✅ Approve
                                                </Button>
                                                <Button 
                                                    variant="danger" 
                                                    size="sm" 
                                                    onClick={() => handleBudgetStatusUpdate(b.id, 'rejected')}
                                                >
                                                    ❌ Reject
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {budgets.length === 0 && <tr><td colSpan="6" className="text-center">No budget requests found.</td></tr>}
                        </tbody>
                    </Table>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default FinanceDashboard;
