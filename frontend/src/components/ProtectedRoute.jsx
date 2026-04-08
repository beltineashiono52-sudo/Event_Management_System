import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
   const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />; // Or unauthorized page
    }

    return children;
};

export default ProtectedRoute;
