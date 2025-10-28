// frontend/src/components/AdminSidebar.jsx - Refactored for Light Mode
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  ChartBarSquareIcon, // StatsIcon
  UsersIcon,          // UserIcon
  MegaphoneIcon,      // AnnounceIcon
  ShoppingCartIcon,   // MarketIcon
  UserGroupIcon,      // GroupIcon
  BuildingOfficeIcon  // CollegeIcon
} from '@heroicons/react/24/outline'; // Using outline Heroicons

function AdminSidebar() {
  const { user } = useAuth();
  const isAdmin =
    user && (user.role === "college_admin" || user.role === "platform_admin");
  const isPlatformAdmin = user && user.role === "platform_admin";

  // Return null if the user isn't an admin (though route should protect this)
  if (!isAdmin) return null;

  let navLinks = [];

  // Define icons mapping
  const icons = {
    StatsIcon: ChartBarSquareIcon,
    UserIcon: UsersIcon,
    AnnounceIcon: MegaphoneIcon,
    MarketIcon: ShoppingCartIcon,
    GroupIcon: UserGroupIcon,
    CollegeIcon: BuildingOfficeIcon,
  };

  // Define navigation links based on admin role
  if (isPlatformAdmin) {
    // PLATFORM ADMIN Links Only
    navLinks = [
      { name: "Platform Stats", path: "/platform/stats", icon: icons.StatsIcon },
      { name: "Manage Colleges", path: "/platform/colleges", icon: icons.CollegeIcon },
      { name: "Manage Admins", path: "/platform/admins", icon: icons.UserIcon },
      // Optional future global views could be added here
    ];
  } else {
    // COLLEGE ADMIN Links Only
    navLinks = [
      { name: "Dashboard", path: "/admin/dashboard", icon: icons.StatsIcon }, // Renamed for clarity
      { name: "Students", path: "/admin/students", icon: icons.UserIcon }, // Simplified name
      { name: "Announcements", path: "/admin/announcements", icon: icons.AnnounceIcon },
      { name: "Marketplace", path: "/admin/listings", icon: icons.MarketIcon }, // Simplified name
      { name: "Groups", path: "/admin/groups", icon: icons.GroupIcon }, // Simplified name
    ];
  }

  // Tailwind classes for NavLink styling
  const baseLinkClass =
    "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 group";
  const inactiveLinkClass =
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900"; // Light mode inactive/hover
  const activeLinkClass =
    "bg-indigo-50 text-indigo-600 font-semibold"; // Light mode active state (using indigo)

  return (
    // Sidebar container styling: white bg, border-r
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white hidden md:block">
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 h-16 flex flex-col justify-center">
          <h3 className="text-base font-semibold text-gray-800">
            {isPlatformAdmin ? "Platform Panel" : "College Panel"}
          </h3>
          {/* Display College Code only for College Admins */}
          {!isPlatformAdmin && user?.collegeCode && (
            <p className="text-xs text-gray-500">
              {user.collegeCode}
            </p>
          )}
        </div>
        {/* Navigation Area */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `${baseLinkClass} ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
            >
              <item.icon
                 className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    // Adjust icon color based on active state
                    NavLink.isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                 }`}
                 aria-hidden="true"
               />
              {item.name}
            </NavLink>
          ))}
        </nav>
        {/* Optional Footer can go here */}
      </div>
    </aside>
  );
}

export default AdminSidebar;