// src/App.jsx - MODIFIED for Unified Layout Routing
import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
// Import Pages
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/MarketPlace";
import CreateListingPage from "./pages/CreateListingPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import MyListingsPage from "./pages/MyListingsPage";
import MyReservationsPage from "./pages/MyReservationsPage"; // *** IMPORT NEW PAGE ***
import FeedPage from "./pages/FeedPage";
import Friendspage from "./pages/Friendspage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import AdminLoginPage from "./pages/AdminLoginPage";
// Import Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnnouncementsPage from "./pages/AdminAnnouncementsPage";
import AdminStudentListPage from "./pages/AdminStudentListPage";
import AdminMarketplacePage from "./pages/AdminMarketplacePage";
import AdminGroupManagementPage from "./pages/AdminGroupManagementPage";
import PlatformStatsPage from "./pages/PlatformStatsPage";
import PlatformCollegeManagementPage from "./pages/PlatformCollegeManagementPage";
import PlatformAdminManagementPage from "./pages/PlatformAdminManagementPage";
// Import Route Protectors
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

function App() {
  return (
    <div>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* --- Protected Routes (All Roles - using AppLayout) --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            {/* == Student Specific Routes == */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/market" element={<Marketplace />} />
            <Route path="/market/new" element={<CreateListingPage />} />
            <Route path="/market/my-listings" element={<MyListingsPage />} />
            <Route path="/market/my-reservations" element={<MyReservationsPage />} /> {/* *** ADD NEW ROUTE *** */}
            <Route path="/market/:id" element={<ListingDetailPage />} /> {/* Keep this after /new, /my-listings, /my-reservations */}
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
            <Route path="/friends" element={<Friendspage />} />

            {/* == Shared Routes (Profile) == */}
            <Route path="/profile/me" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />


            {/* == Admin Routes (Nested Role Protection) == */}
            {/* ... (Admin Routes remain the same) ... */}
            <Route element={<ProtectedAdminRoute requiredRole="college_admin" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<AdminStudentListPage />} />
              <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
              <Route path="/admin/listings" element={<AdminMarketplacePage />} />
              <Route path="/admin/groups" element={<AdminGroupManagementPage />} />
            </Route>
            <Route element={<ProtectedAdminRoute requiredRole="platform_admin" />}>
              <Route path="/platform/stats" element={<PlatformStatsPage />} />
              <Route path="/platform/colleges" element={<PlatformCollegeManagementPage />} />
              <Route path="/platform/admins" element={<PlatformAdminManagementPage />} />
            </Route>

          </Route>
        </Route>

        {/* --- Not Found & Unauthorized --- */}
        <Route path="*" element={<div className="p-10 text-center"><h1>404 Not Found</h1><p>The page you requested could not be found.</p></div>} />
        <Route path="/unauthorized" element={<div className="p-10 text-center"><h1>403 Unauthorized</h1><p>You do not have permission to access this page.</p></div>} />

      </Routes>
    </div>
  );
}
export default App;