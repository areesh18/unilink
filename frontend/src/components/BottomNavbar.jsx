// frontend/src/components/BottomNavbar.jsx - Updated Links
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  // MegaphoneIcon, // Removed Feed Icon
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  UserCircleIcon, // *** IMPORT Profile Icon ***
} from '@heroicons/react/24/outline';

// *** UPDATED bottomNavLinks array ***
const bottomNavLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Market', path: '/market', icon: BuildingStorefrontIcon },
  // { name: 'Feed', path: '/feed', icon: MegaphoneIcon }, // Removed Feed
  { name: 'Chat', path: '/chat', icon: ChatBubbleLeftEllipsisIcon },
  { name: 'Friends', path: '/friends', icon: UsersIcon },
  { name: 'Profile', path: '/profile/me', icon: UserCircleIcon }, // Added Profile
];
// *** END UPDATED array ***

function BottomNavbar() {
  // Get pendingRequestCount from context
  const { user, totalUnreadCount, /* hasUnreadAnnouncements, */ pendingRequestCount } = useAuth(); // Removed hasUnreadAnnouncements as Feed is gone

  // console.log("BottomNavbar Render - pendingRequestCount:", pendingRequestCount);


  if (!user || user.role !== 'student') {
    return null;
  }

  const baseLinkClass = "relative flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors duration-150";
  const inactiveLinkClass = "text-gray-500 hover:text-indigo-600";
  const activeLinkClass = "text-indigo-600 font-medium";

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-lg flex md:hidden z-40">
      {bottomNavLinks.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
          }
          style={({ isActive }) => ({ outline: 'none' })}
          // Add end prop for Dashboard and Market to prevent matching sub-routes
          end={item.path === '/dashboard' || item.path === '/market' || item.path === '/profile/me'}
        >
          <item.icon className="w-5 h-5 mb-0.5" strokeWidth={2} />
          {item.name}

          {/* Chat Badge */}
          {item.name === 'Chat' && totalUnreadCount > 0 && (
            <span className="absolute top-1 right-1/2 translate-x-[18px] inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}

          {/* *** REMOVED Feed Indicator *** */}
          {/*
          {item.name === 'Feed' && hasUnreadAnnouncements && (
             <span className="absolute top-1 right-1/2 translate-x-[16px] h-2 w-2 bg-blue-500 rounded-full ring-2 ring-white">
                 <span className="sr-only">New announcements</span>
             </span>
          )}
          */}

          {/* Friend Request Badge */}
          {item.name === 'Friends' && pendingRequestCount > 0 && (
              <span className="absolute top-1 right-1/2 translate-x-[18px] inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-100 bg-amber-600 rounded-full">
                  {pendingRequestCount > 9 ? '9+' : pendingRequestCount}
              </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNavbar;