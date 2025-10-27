import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// This component checks if the user is authenticated
// If yes, it renders the child routes (using Outlet)
// If no, it redirects the user to the login page
const ProtectedRoute = () => {
  const token = localStorage.getItem('authToken'); // Check if the token exists

  // If no token, redirect to login
  if (!token) {
    // You can pass the intended location to redirect back after login
    // For simplicity, we just redirect to /login for now
    return <Navigate to="/login" replace />;
  }

  // If token exists, render the nested child route element
  return <Outlet />;
};

export default ProtectedRoute;