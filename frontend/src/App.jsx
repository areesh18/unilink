// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout'; // <-- Import layout
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/MarketPlace';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailPage from './pages/ListingDetailPage';
import FeedPage from './pages/FeedPage';
import Friendspage from './pages/Friendspage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
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
            {/* Marketplace Routes */}
            <Route path="/market" element={<Marketplace />} /> 
            <Route path="/market/new" element={<CreateListingPage />} /> 
            <Route path="/market/:id" element={<ListingDetailPage />} />
            {/* Feed Route */}
            <Route path="/feed" element={<FeedPage />} />
            {/* Friends Route */}
            <Route path="/friends" element={<Friendspage />} />
            {/* Profile Routes */}
            <Route path="/profile/me" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />

            {/* Chat Route */}
             <Route path="/chat" element={<ChatPage />} /> {/* <-- 2. Add Chat route */}
            {/* Optional: Route for specific chat? <Route path="/chat/:conversationId" element={<ChatPage />} /> */}
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