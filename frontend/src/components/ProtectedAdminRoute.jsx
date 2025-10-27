// frontend/src/components/ProtectedAdminRoute.jsx (New File)
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// This component checks if the user is authenticated AND has an admin role
const ProtectedAdminRoute = ({ requiredRole = 'college_admin' }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Wait for auth context to load from localStorage
    return <div className="text-center py-20 dark:text-gray-400">Loading admin permissions...</div>;
  }

  // 1. Check if user is logged in at all (token exists)
  if (!user) {
    // Redirect to admin login if not authenticated
    return <Navigate to="/admin/login" replace />;
  }

  const userRole = user.role;

  // 2. Check if the user has the required admin role
  if (requiredRole === 'platform_admin' && userRole === 'platform_admin') {
      // Platform admin check (only platform_admin role passes)
      return <Outlet />;
  } else if (requiredRole === 'college_admin' && (userRole === 'college_admin' || userRole === 'platform_admin')) {
      // College admin check (both college_admin and platform_admin roles pass)
      return <Outlet />;
  }


  // Fallback: If logged in but doesn't have the right role, redirect to their dashboard
  if (userRole === 'student') {
      return <Navigate to="/dashboard" replace />;
  }

  // Final catch-all for forbidden access
  return <Navigate to="/unauthorized" replace />;
};

export default ProtectedAdminRoute;