import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const login = (email, password) => api.post('/login.php', { email, password });
export const register = (username, email, password, role) => api.post('/register.php', { username, email, password, role });

export const getEvents = (venueId = null) => api.get(`/bookings.php${venueId ? `?venue_id=${venueId}` : ''}`);
export const createBooking = (data) => api.post('/bookings.php', data);
export const updateBooking = (data) => api.put('/bookings.php', data);

export const getBudgets = (eventId = null) => api.get(`/budgets.php${eventId ? `?event_id=${eventId}` : ''}`);
export const submitBudget = (data) => api.post('/budgets.php', data);
export const updateBudgetStatus = (id, status) => api.put('/budgets.php', { id, status });

export const getNotifications = (userId) => api.get(`/notifications.php?user_id=${userId}`);
export const markNotificationRead = (id) => api.put('/notifications.php', { id });

export const getReports = () => api.get('/reports.php');

// Venues
export const getVenues = () => api.get('/venues.php');
export const addVenue = (data) => api.post('/venues.php', data);
export const deleteVenue = (id) => api.delete('/venues.php', { data: { id } });

// Users (Admin)
export const getUsers = () => api.get('/users.php');
export const addUser = (data) => api.post('/users.php', data);
export const updateUser = (data) => api.put('/users.php', data);
export const deleteUser = (id) => api.delete('/users.php', { data: { id } });

// Event Registrations (attendees)
export const getUserRegistrations = (userId) => api.get(`/registrations.php?user_id=${userId}`);
export const getEventRegistrations = (eventId) => api.get(`/registrations.php?event_id=${eventId}`);
export const registerForEvent = (userId, eventId) => api.post('/registrations.php', { user_id: userId, event_id: eventId });
export const unregisterFromEvent = (userId, eventId) => api.delete('/registrations.php', { data: { user_id: userId, event_id: eventId } });

export default api;
