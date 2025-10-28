// src/components/Navbar.jsx - MODIFIED
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'; // Added Logout Icon

function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isStudent = user && user.role === 'student';
  const isAdmin = user && (user.role === 'college_admin' || user.role === 'platform_admin');

  // REMOVED primary navLinks array - these are now in BottomNavbar for mobile

  const homeLink = isStudent ? "/dashboard" : (isAdmin ? "/admin/dashboard" : "/");
  const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&bold=true`;

  return (
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

          {/* Right Side - User Menu & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            {user && (
              <>
                {/* User Info / Profile Link - Desktop */}
                <div className="hidden md:flex items-center"> {/* Changed breakpoint to md */}
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

                {/* Logout Button - Desktop */}
                <button
                  onClick={logout}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-150" /* Adjusted desktop style */
                >
                   <ArrowRightOnRectangleIcon className="w-4 h-4"/> Logout
                </button>
              </>
            )}

            {/* Mobile Menu Button (Always show if user exists, content differs) */}
             {user && (
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

      {/* Mobile Menu (Simplified) */}
      {isMobileMenuOpen && user && (
        <div className="md:hidden border-t border-gray-200 bg-white absolute top-16 left-0 right-0 z-40 shadow-md"> {/* Make it absolute */}
          <div className="px-4 pt-4 pb-4 space-y-3"> {/* Added top padding */}
            {/* User Profile Link - Mobile */}
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

            {/* Separator */}
            <hr className="border-gray-100"/>

            {/* Logout Button - Mobile */}
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false); // Close menu on logout
              }}
              className="w-full flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5"/>
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;