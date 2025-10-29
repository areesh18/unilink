// frontend/src/components/AdminBottomNavbar.jsx (New File)
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAdminNavLinks } from './adminNavConfig'; // Import the link generator

function AdminBottomNavbar() {
  const { user } = useAuth();
  const isAdmin = user && (user.role === 'college_admin' || user.role === 'platform_admin');

  // Only show for logged-in admins
  if (!isAdmin) {
    return null;
  }

  // Get the correct links based on the specific admin role
  const adminNavLinks = getAdminNavLinks(user.role);

  // Styling (similar to BottomNavbar)
  const baseLinkClass = "relative flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors duration-150";
  const inactiveLinkClass = "text-gray-500 hover:text-indigo-600";
  const activeLinkClass = "text-indigo-600 font-medium";

  return (
    // Fixed position at bottom, full width, background, border, shadow
    // Use md:hidden to show ONLY on mobile/small screens
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-lg flex md:hidden z-40">
      {adminNavLinks.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
          }
          style={({ isActive }) => ({ outline: 'none' })}
          end // Use 'end' prop for dashboard/stats link to prevent matching nested routes
        >
          {/* Render the icon component */}
          <item.icon className="w-5 h-5 mb-0.5" strokeWidth={2} />
          {item.name}
          {/* No unread indicators needed for admin bar currently */}
        </NavLink>
      ))}
    </nav>
  );
}

export default AdminBottomNavbar;