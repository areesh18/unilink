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

import AdminLoginPage from './pages/AdminLoginPage';

import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute'; // <-- Import Admin Protection
import AdminLayout from './layouts/AdminLayout'; // <-- Import Admin Layout
import AdminDashboard from './pages/AdminDashboard';

import AdminAnnouncementsPage from './pages/AdminAnnouncementsPage';
import AdminStudentListPage from './pages/AdminStudentListPage';
import AdminMarketplacePage from './pages/AdminMarketplacePage';
import AdminGroupManagementPage from './pages/AdminGroupManagementPage';
function App() {
  return (
    <div>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
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

            
            {/* Add other protected pages here */}
          </Route>
        </Route>
        {/* --- PROTECTED ADMIN ROUTES --- */}
        {/* All Admin pages use the AdminLayout and are protected by role */}
        <Route element={<ProtectedAdminRoute requiredRole="college_admin" />}>
          <Route element={<AdminLayout />}>
             {/* Admin Dashboard (Accessed by both College and Platform Admins) */}
             <Route path="/admin/dashboard" element={<AdminDashboard />} />

             {/* College Admin Pages (will create content for these next) */}
             <Route path="/admin/students" element={<AdminStudentListPage />} />
             <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
             <Route path="/admin/listings" element={<AdminMarketplacePage />} />
             <Route path="/admin/groups" element={<AdminGroupManagementPage />} />
          </Route>
        </Route>

        {/* Not Found */}
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </div>
  );
}
export default App;