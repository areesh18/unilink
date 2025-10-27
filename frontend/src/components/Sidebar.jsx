import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // To potentially show profile link

// Example icons (replace with actual icons from a library like react-icons or heroicons)
const HomeIcon = () => <span>🏠</span>;
const MarketIcon = () => <span>🛒</span>;
const FeedIcon = () => <span>📢</span>;
const ChatIcon = () => <span>💬</span>;
const FriendsIcon = () => <span>👥</span>;
const ProfileIcon = () => <span>👤</span>;


function Sidebar() {
  const { user } = useAuth();

  const primaryNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Marketplace', path: '/market', icon: MarketIcon },
    { name: 'Feed', path: '/feed', icon: FeedIcon },
    { name: 'Chat', path: '/chat', icon: ChatIcon },
    { name: 'Friends', path: '/friends', icon: FriendsIcon },
  ];

  const secondaryNavLinks = [
     // We might use /profile/me or similar later
    { name: 'My Profile', path: `/profile/${user?.id || 'me'}`, icon: ProfileIcon },
    // Add Settings, etc. here later
  ];

   const baseLinkClass = "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150";
   const inactiveLinkClass = "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700";
   const activeLinkClass = "bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-indigo-300";


  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hidden md:block"> {/* Hidden on mobile */}
      <div className="flex flex-col h-full">
        {/* Can add Logo/Brand link here if Navbar doesn't have it */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {/* Primary Navigation */}
          {primaryNavLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
              }
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}

         {/* Divider */}
          <hr className="my-4 border-gray-200 dark:border-gray-600" />

          {/* Secondary Navigation */}
           {secondaryNavLinks.map((item) => (
             <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
              }
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        {/* Optional: Footer or User Info section at the bottom */}
      </div>
    </aside>
  );
}

export default Sidebar;