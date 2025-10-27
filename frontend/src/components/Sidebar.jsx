// frontend/src/components/Sidebar.jsx - FULLY RESPONSIVE
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Icon components (using emoji for simplicity, can replace with react-icons)
const Icons = {
  Home: () => <span className="text-xl">🏠</span>,
  Market: () => <span className="text-xl">🛒</span>,
  Feed: () => <span className="text-xl">📢</span>,
  Chat: () => <span className="text-xl">💬</span>,
  Friends: () => <span className="text-xl">👥</span>,
  Profile: () => <span className="text-xl">👤</span>,
};

function Sidebar() {
  const { user } = useAuth();

  const primaryNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Icons.Home },
    { name: 'Marketplace', path: '/market', icon: Icons.Market },
    { name: 'Feed', path: '/feed', icon: Icons.Feed },
    { name: 'Chat', path: '/chat', icon: Icons.Chat },
    { name: 'Friends', path: '/friends', icon: Icons.Friends },
  ];

  const secondaryNavLinks = [
    { name: 'My Profile', path: '/profile/me', icon: Icons.Profile },
  ];

  const baseLinkClass = "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group";
  const inactiveLinkClass = "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:pl-5";
  const activeLinkClass = "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-400 shadow-sm";

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hidden md:flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img
            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.studentId}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Primary Navigation */}
        <div className="space-y-1">
          {primaryNavLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
              }
            >
              <item.icon />
              <span className="ml-3">{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {secondaryNavLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
              }
            >
              <item.icon />
              <span className="ml-3">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p className="font-medium text-gray-700 dark:text-gray-300">
            {user?.collegeName}
          </p>
          <p>{user?.department}</p>
          <p>Semester {user?.semester}</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;