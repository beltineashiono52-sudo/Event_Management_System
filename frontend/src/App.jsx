import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Router>
            <Navbar />
            <div className="container mt-4">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route
                        path="/student/*"
                        element={
                            <ProtectedRoute allowedRoles={['student']}>
                                <StudentDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/organizer/*"
                        element={
                            <ProtectedRoute allowedRoles={['organizer']}>
                                <OrganizerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/*"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/finance/*"
                        element={
                            <ProtectedRoute allowedRoles={['finance']}>
                                <FinanceDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/*"
                        element={
                            <ProtectedRoute allowedRoles={['staff']}>
                                <StaffDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
