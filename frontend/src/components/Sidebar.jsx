// src/components/Sidebar.jsx - VERIFIED (Minor Styling Adjustments)
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HomeIcon as HomeOutline,
  BuildingStorefrontIcon as MarketOutline,
  MegaphoneIcon as FeedOutline,
  ChatBubbleLeftEllipsisIcon as ChatOutline,
  UsersIcon as FriendsOutline,
  UserCircleIcon as ProfileOutline,
} from '@heroicons/react/24/outline';


function Sidebar() {
  const { user } = useAuth();

  const Icons = {
    Home: HomeOutline,
    Market: MarketOutline,
    Feed: FeedOutline,
    Chat: ChatOutline,
    Friends: FriendsOutline,
    Profile: ProfileOutline,
  };


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

  const baseLinkClass = "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group";
  const inactiveLinkClass = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const activeLinkClass = "bg-indigo-50 text-indigo-600 font-semibold";


  const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&bold=true`;


  return (
    // Uses `hidden md:flex` to hide on mobile
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white hidden md:flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 h-16 flex items-center">
        <div className="flex items-center space-x-3 w-full">
          <img
            src={user?.profilePicture || fallbackAvatar(user?.name)}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-100"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate" title={user?.name}>
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate" title={user?.studentId}>
              {user?.studentId}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Primary Navigation */}
        <div className="space-y-0.5">
          {primaryNavLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
              }
            >
              <item.icon
                className={`w-5 h-5 mr-3 flex-shrink-0 ${ NavLink.isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`}
                strokeWidth={2}
               />
              <span className="ml-1">{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Divider & Secondary Navigation */}
        <div className="pt-4 mt-4 space-y-1 border-t border-gray-200">
           {secondaryNavLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
              }
            >
               <item.icon
                 className={`w-5 h-5 mr-3 flex-shrink-0 ${ NavLink.isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`}
                 strokeWidth={2}
               />
              <span className="ml-1">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-0.5">
          <p className="font-semibold text-gray-700 mb-1 truncate" title={user?.collegeName}>
            {user?.collegeName}
          </p>
          <p className="text-gray-600 truncate" title={user?.department}>{user?.department}</p>
          <p className="text-gray-600">Semester {user?.semester}</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;