// frontend/src/components/AdminSidebar.jsx (New File)
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Placeholder Icons (replace with actual icons)
const StatsIcon = () => <span></span>;
const UserIcon = () => <span></span>;
const AnnounceIcon = () => <span></span>;
const MarketIcon = () => <span></span>;
const GroupIcon = () => <span></span>;
const CollegeIcon = () => <span></span>;

function AdminSidebar() {
  const { user } = useAuth();
  const isAdmin =
    user && (user.role === "college_admin" || user.role === "platform_admin");
  const isPlatformAdmin = user && user.role === "platform_admin";

  if (!isAdmin) return null; // Should be protected by route, but safe guard here

  let navLinks = [];

  if (isPlatformAdmin) {
    // PLATFORM ADMIN Links Only
    navLinks = [
      // { name: 'Platform Dashboard', path: '/platform/dashboard', icon: StatsIcon }, // Optional separate dashboard
      { name: "Platform Stats", path: "/platform/stats", icon: StatsIcon },
      {
        name: "Manage Colleges",
        path: "/platform/colleges",
        icon: CollegeIcon,
      },
      { name: "Manage Admins", path: "/platform/admins", icon: UserIcon },
      // Optional: Global Views (Need dedicated pages)
      // { name: 'All Students', path: '/platform/students', icon: UserIcon },
      // { name: 'All Listings', path: '/platform/listings', icon: MarketIcon },
    ];
  } else {
    // COLLEGE ADMIN Links Only
    navLinks = [
      { name: "College Dashboard", path: "/admin/dashboard", icon: StatsIcon },
      { name: "Student List", path: "/admin/students", icon: UserIcon },
      {
        name: "Announcements",
        path: "/admin/announcements",
        icon: AnnounceIcon,
      },
      { name: "Marketplace Mgt", path: "/admin/listings", icon: MarketIcon },
      { name: "Group Mgt", path: "/admin/groups", icon: GroupIcon },
    ];
  }

  const baseLinkClass =
    "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150";
  const inactiveLinkClass =
    "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700";
  const activeLinkClass =
    "bg-red-100 text-red-700 dark:bg-gray-700 dark:text-red-300"; // Use a distinct color for Admin

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hidden md:block">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isPlatformAdmin ? "Platform Panel" : "College Panel"}
          </h3>
          {/* Display College Code only for College Admins */}
          {!isPlatformAdmin && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.collegeCode}
            </p>
          )}
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => (
            // ... (NavLink rendering remains the same) ...
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `${baseLinkClass} ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default AdminSidebar;
