// frontend/src/components/Navbar.jsx - Refactored for Light Mode & Removed Desktop Nav
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'; // Using Heroicons

function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Role checks remain the same
  const isStudent = user && user.role === 'student';
  const isAdmin = user && (user.role === 'college_admin' || user.role === 'platform_admin');

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Marketplace', path: '/market' },
    { name: 'Feed', path: '/feed' },
    { name: 'Chat', path: '/chat' },
    { name: 'Friends', path: '/friends' },
  ];

  // Determine the correct dashboard link for the logo
  const homeLink = isStudent ? "/dashboard" : (isAdmin ? "/admin/dashboard" : "/");

  // Fallback avatar function
  const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&bold=true`;

  return (
    // Updated nav styling: white bg, subtle shadow and border
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to={homeLink}
            className="flex items-center space-x-2 flex-shrink-0"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="text-xl font-bold text-indigo-600 hidden sm:block">
              UniLink
            </span>
          </Link>

          {/* Desktop Navigation Section REMOVED */}
          {/* The div containing the desktop navLinks map was here */}

          {/* Right Side - User Menu - Updated Styling */}
          {/* This div now uses flex-grow and justify-end on medium screens+ to push items to the right */}
          <div className="flex items-center space-x-3 md:flex-grow md:justify-end">
            {user && (
              <>
                {/* User Info - Desktop */}
                <div className="hidden lg:flex items-center">
                  <Link
                    to="/profile/me"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors duration-150"
                  >
                    <img
                      src={user.profilePicture || fallbackAvatar(user.name)}
                      alt={user.name || 'User'}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {user.name ? user.name.split(' ')[0] : 'Profile'}
                    </span>
                  </Link>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                >
                  Logout
                </button>
              </>
            )}

            {/* Mobile Menu Button (Students Only) */}
            {isStudent && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-150"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu (Students Only) - Remains the same */}
      {isStudent && isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {/* User Profile Link - Mobile */}
            {user && (
              <Link
                to="/profile/me"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-3 rounded-md hover:bg-gray-100 transition-colors"
              >
                <img
                  src={user.profilePicture || fallbackAvatar(user.name)}
                  alt={user.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    View Profile
                  </p>
                </div>
              </Link>
            )}

            {/* Navigation Links - Mobile */}
            <div className="pt-2 space-y-1">
              {navLinks.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-3 rounded-md text-base font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;