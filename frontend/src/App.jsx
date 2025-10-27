import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// --- Import actual pages ---
import HomePage from './pages/HomePage'; // Assuming you have HomePage.jsx
import Login from './pages/Login'; // Import the actual Login component
import Register from './pages/Register'; // Import the placeholder for now
import Dashboard from './pages/Dashboard'; // Import the placeholder for now
import ProtectedRoute from './components/ProtectedRoute';
// --- End Imports ---


function App() {
  return (
    // Remove the outer p-4 div if pages handle their own layout/padding
    <div>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}> {/* Wrap protected routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Add other protected routes here later (e.g., /profile, /settings) */}
          {/* Example: <Route path="/profile" element={<ProfilePage />} /> */}
        </Route>

        {/* Catch-all Not Found Route */}
        <Route path="*" element={<h1 className="text-center text-red-500 mt-10">404 Not Found</h1>} />
      </Routes>
    </div>
  );
}

export default App;