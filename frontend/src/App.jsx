// src/App.jsx - MODIFIED for Unified Layout Routing
import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout"; // Unified layout
// Import Pages
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/MarketPlace";
import CreateListingPage from "./pages/CreateListingPage";
import ListingDetailPage from "./pages/ListingDetailPage";
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
import ProtectedRoute from "./components/ProtectedRoute"; // General Auth check
import ProtectedAdminRoute from "./components/ProtectedAdminRoute"; // Admin Role check
// Removed: import AdminLayout from "./layouts/AdminLayout"; // No longer needed

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
        <Route element={<ProtectedRoute />}> {/* Checks if logged in */}
          <Route element={<AppLayout />}> {/* Use unified layout */}

            {/* == Student Specific Routes == */}
            {/* These might need an additional role check if admins shouldn't see them */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/market" element={<Marketplace />} />
            <Route path="/market/new" element={<CreateListingPage />} />
            {/* Listing detail might be shared? Check permissions if needed */}
            <Route path="/market/:id" element={<ListingDetailPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
            <Route path="/friends" element={<Friendspage />} />

            {/* == Shared Routes (Profile) == */}
            {/* Accessible by Students and Admins */}
            <Route path="/profile/me" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} /> {/* Student viewing others */}


            {/* == Admin Routes (Nested Role Protection) == */}
            {/* College Admin Routes */}
            <Route element={<ProtectedAdminRoute requiredRole="college_admin" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<AdminStudentListPage />} />
              <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
              <Route path="/admin/listings" element={<AdminMarketplacePage />} />
              <Route path="/admin/groups" element={<AdminGroupManagementPage />} />
              {/* Note: /admin/market/:id might need a separate route if behavior differs */}
            </Route>

            {/* Platform Admin Routes */}
            <Route element={<ProtectedAdminRoute requiredRole="platform_admin" />}>
              <Route path="/platform/stats" element={<PlatformStatsPage />} />
              <Route path="/platform/colleges" element={<PlatformCollegeManagementPage />} />
              <Route path="/platform/admins" element={<PlatformAdminManagementPage />} />
            </Route>

          </Route> {/* End AppLayout */}
        </Route> {/* End ProtectedRoute */}

        {/* --- Not Found --- */}
        {/* TODO: Create a proper Not Found page component */}
        <Route path="*" element={<div className="p-10 text-center"><h1>404 Not Found</h1><p>The page you requested could not be found.</p></div>} />
        {/* TODO: Create an Unauthorized page component for role mismatches */}
        <Route path="/unauthorized" element={<div className="p-10 text-center"><h1>403 Unauthorized</h1><p>You do not have permission to access this page.</p></div>} />

      </Routes>
    </div>
  );
}
export default App;