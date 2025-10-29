// frontend/src/components/Sidebar.jsx
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
  ArchiveBoxIcon as MyListingsOutline,
  ClockIcon as MyReservationsOutline, // *** IMPORT NEW ICON ***
} from '@heroicons/react/24/outline';


function Sidebar() {
  const { user, totalUnreadCount, hasUnreadAnnouncements, pendingRequestCount } = useAuth(); 

  const Icons = {
    Home: HomeOutline,
    Market: MarketOutline,
    Feed: FeedOutline,
    Chat: ChatOutline,
    Friends: FriendsOutline,
    Profile: ProfileOutline,
    MyListings: MyListingsOutline,
    MyReservations: MyReservationsOutline, // *** ADD ICON ***
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
    { name: 'My Listings', path: '/market/my-listings', icon: Icons.MyListings },
    { name: 'My Reservations', path: '/market/my-reservations', icon: Icons.MyReservations }, // *** ADD LINK ***
  ];

  // ... (rest of the component remains the same) ...
  const baseLinkClass = "relative flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group";
  const inactiveLinkClass = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const activeLinkClass = "bg-indigo-50 text-indigo-600 font-semibold";


  const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&bold=true`;


  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white hidden md:flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 h-16 flex items-center">
        {/* ... (header JSX) ... */}
         <div className="flex items-center space-x-3 w-full">
          <img
            src={user?.profilePicture || fallbackAvatar(user?.name)}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-100"
            onError={(e) => { e.target.onerror = null; e.target.src = fallbackAvatar(user?.name); }}
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
          {primaryNavLinks.map((item) => {
             const linkClasses = ({ isActive }) =>
               `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`;
             const iconClasses = ({ isActive }) =>
               `w-5 h-5 mr-3 flex-shrink-0 ${
                 isActive
                   ? 'text-indigo-600'
                   : 'text-gray-400 group-hover:text-gray-500'
               }`;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={linkClasses}
                end={item.path === '/dashboard' || item.path === '/market'} 
              >
                 {({ isActive }) => (
                    <>
                        <item.icon
                            className={iconClasses({ isActive })}
                            strokeWidth={2}
                        />
                        <span className="ml-1">{item.name}</span>

                        {/* Badges */}
                        {item.name === 'Chat' && totalUnreadCount > 0 && (
                             <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                             </span>
                        )}
                        {item.name === 'Feed' && hasUnreadAnnouncements && (
                             <span className="absolute top-1 right-1 h-2 w-2 bg-blue-500 rounded-full transform translate-x-1/2 -translate-y-1/2 ring-2 ring-white">
                                <span className="sr-only">New announcements</span>
                             </span>
                        )}
                        {item.name === 'Friends' && pendingRequestCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-amber-100 bg-amber-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                                {pendingRequestCount > 9 ? '9+' : pendingRequestCount}
                            </span>
                        )}
                    </>
                 )}
              </NavLink>
            );
          })}
        </div>

        {/* Divider & Secondary Navigation */}
        <div className="pt-4 mt-4 space-y-1 border-t border-gray-200">
           {secondaryNavLinks.map((item) => {
             const linkClasses = ({ isActive }) =>
               `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`;
             const iconClasses = ({ isActive }) =>
               `w-5 h-5 mr-3 flex-shrink-0 ${
                 isActive
                   ? 'text-indigo-600'
                   : 'text-gray-400 group-hover:text-gray-500'
               }`;

             return (
               <NavLink
                 key={item.name}
                 to={item.path}
                 className={linkClasses}
                 end={item.path === '/profile/me'}
               >
                 {({ isActive }) => (
                   <>
                     <item.icon className={iconClasses({ isActive })} strokeWidth={2} />
                     <span className="ml-1">{item.name}</span>
                   </>
                 )}
               </NavLink>
             );
           })}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {/* ... (footer JSX) ... */}
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