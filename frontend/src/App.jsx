// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout'; // <-- Import layout
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/MarketPlace';
import ProtectedRoute from './components/ProtectedRoute'; // <-- Import protected route

function App() {
  return (
    <div>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}> {/* Authentication */}
          <Route element={<AppLayout />}> {/* Layout */}
            {/* Pages inside layout */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/market" element={<Marketplace />} /> 
            {/* Add other protected pages here */}
          </Route>
        </Route>

        {/* Not Found */}
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </div>
  );
}
export default App;