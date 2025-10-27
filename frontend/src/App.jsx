import React from 'react'
import { Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
function App() {
  return (
    <div className="p-4"> 
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
         {/* Add more routes as needed */}
         <Route path="*" element={<h1>404 Not Found</h1>} /> {/* Catch-all route */}
      </Routes>
    </div>
  )
}

export default App
