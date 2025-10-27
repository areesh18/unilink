import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Import useAuth to get user info and logout
// Import icons if you have an icon library (e.g., react-icons)
// import { MenuIcon, XIcon } from '@heroicons/react/outline'; // Example using Heroicons

function Navbar() {
  const { user, logout } = useAuth(); // Get user and logout function
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Placeholder for navigation links - we'll expand this later
  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Marketplace', path: '/market' }, // Example future link
    { name: 'Feed', path: '/feed' },           // Example future link
    { name: 'Chat', path: '/chat' },           // Example future link
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side: Logo and Desktop Nav */}
          <div className="flex items-center">
            {/* Logo Placeholder */}
            <Link to="/dashboard" className="shrink-0 flex items-center text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {/* You can replace this text with an <img> tag for your logo */}
              UniLink
            </Link>

            {/* Desktop Navigation Links (Hidden on small screens) */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:border-gray-700'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right side: User Menu and Mobile Menu Button */}
          <div className="flex items-center">
            {/* User Info & Logout Button */}
            {user ? (
              <div className="flex items-center space-x-3">
                 <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">
                  Hi, {user.name.split(' ')[0]} {/* Display first name */}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  Logout
                </button>
              </div>
            ) : (
                // Optional: Show Login/Register links if implementing a public navbar later
                 <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">Login</Link>
            )}

            {/* Mobile Menu Button (Hidden on larger screens) */}
            <div className="ml-4 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <span className="sr-only">Open main menu</span>
                {/* Basic hamburger/close icons using divs (replace with actual icons) */}
                {isMobileMenuOpen ? (
                   <div className="block h-6 w-6" aria-hidden="true"> {/* Basic X icon */}
                        <div className="absolute h-0.5 w-5 bg-current transform rotate-45"></div>
                        <div className="absolute h-0.5 w-5 bg-current transform -rotate-45"></div>
                   </div>
                ) : (
                  <div className="block h-6 w-6" aria-hidden="true"> {/* Basic Hamburger icon */}
                    <div className="h-0.5 w-5 bg-current mb-1"></div>
                    <div className="h-0.5 w-5 bg-current mb-1"></div>
                    <div className="h-0.5 w-5 bg-current"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Conditionally Rendered) */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                 onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                 className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-gray-900 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;