import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// --- Import actual pages ---
import HomePage from './pages/HomePage'; // Assuming you have HomePage.jsx
import Login from './pages/Login'; // Import the actual Login component
import Register from './pages/Register'; // Import the placeholder for now
import Dashboard from './pages/Dashboard'; // Import the placeholder for now
// --- End Imports ---


function App() {
  return (
    // Remove the outer p-4 div if pages handle their own layout/padding
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} /> {/* <-- Use actual Login component */}
        <Route path="/register" element={<Register />} /> {/* Use placeholder */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Use placeholder */}
         {/* Add more routes as needed */}
         <Route path="*" element={<h1 className="text-center text-red-500 mt-10">404 Not Found</h1>} /> {/* Catch-all route */}
      </Routes>
    </div>
  );
}

export default App;