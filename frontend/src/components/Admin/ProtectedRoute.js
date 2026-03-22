import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { userProfile, loading } = useAuth();
    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!userProfile) {
        return <Navigate to="/login" replace />;
    }

    // Super Admin has access to everything
    if (userProfile.Role === 'Super Admin') {
        return children;
    }

    if (allowedRoles && !allowedRoles.includes(userProfile.Role)) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to access this section.</p>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
