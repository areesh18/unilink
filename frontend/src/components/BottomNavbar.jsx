// src/components/BottomNavbar.jsx (New File)
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  MegaphoneIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'; // Use outline icons

// Define navigation items for the bottom bar
const bottomNavLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Market', path: '/market', icon: BuildingStorefrontIcon },
  { name: 'Feed', path: '/feed', icon: MegaphoneIcon },
  { name: 'Chat', path: '/chat', icon: ChatBubbleLeftEllipsisIcon },
  { name: 'Friends', path: '/friends', icon: UsersIcon },
];

function BottomNavbar() {
  const { user } = useAuth();

  // Only show for logged-in students
  if (!user || user.role !== 'student') {
    return null;
  }

  // Base styling for each nav item link
  const baseLinkClass = "flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors duration-150";
  // Styling for inactive items
  const inactiveLinkClass = "text-gray-500 hover:text-indigo-600";
  // Styling for active items
  const activeLinkClass = "text-indigo-600 font-medium"; // Active color

  return (
    // Fixed position at bottom, full width, background, border, shadow, only visible below md breakpoint
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-lg flex md:hidden z-40">
      {bottomNavLinks.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          // Apply active/inactive classes based on NavLink's isActive prop
          className={({ isActive }) =>
            `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
          }
          // Prevent standard browser focus outline, rely on active state styling
          style={({ isActive }) => ({ outline: 'none' })}
        >
          {/* Render the icon component */}
          <item.icon className="w-5 h-5 mb-0.5" strokeWidth={2} />
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNavbar;