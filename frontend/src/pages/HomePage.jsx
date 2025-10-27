import React from 'react'
import { Routes, Route, Link } from 'react-router-dom';
function HomePage() {
  return (
    <div>
      <h1>Home Page</h1>
      <nav className="flex gap-4">
        <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard (Protected)</Link>
      </nav>
    </div>
  )
}

export default HomePage
