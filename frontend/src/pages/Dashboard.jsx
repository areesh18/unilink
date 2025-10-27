// frontend/src/pages/Dashboard.jsx - FULLY RESPONSIVE
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { fetchFeed } from '../api/announcements';
// import { fetchMyListings } from '../api/listings';
import { fetchFriends, fetchPendingRequests } from '../api/friends';
import { fetchConversations } from '../api/messages';

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    announcements: [],
    listings: [],
    friends: [],
    pendingRequests: [],
    conversations: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [
          announcements,
          // listings,  // Comment out this line
          friends,
          requests,
          conversations
        ] = await Promise.all([
          fetchFeed(),
          // fetchMyListings(),  // Comment out this line
          fetchFriends(),
          fetchPendingRequests(),
          fetchConversations()
        ]);

        setData({
          announcements,
          listings: [], // Set to empty array for now
          friends,
          pendingRequests: requests,
          conversations,
          isLoading: false,
          error: null
        });
      } catch (err) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load dashboard data'
        }));
      }
    };

    loadDashboardData();
  }, []);

  // Widget Card Component
  const WidgetCard = ({ icon, title, description, linkText, linkTo, color = 'indigo' }) => {
    const colorClasses = {
      indigo: 'from-indigo-500 to-purple-600',
      green: 'from-green-500 to-teal-600',
      orange: 'from-orange-500 to-red-600',
      blue: 'from-blue-500 to-cyan-600',
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 group">
        <div className={`h-2 bg-gradient-to-r ${colorClasses[color]}`}></div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {description}
          </p>
          <Link
            to={linkTo}
            className={`inline-flex items-center text-sm font-semibold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
          >
            {linkText}
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  };

  // Quick Stats Component (now with real data)
  const QuickStat = ({ label, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="text-3xl opacity-50">{icon}</div>
      </div>
    </div>
  );

  if (data.isLoading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, {user?.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-indigo-100 text-sm md:text-base">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end space-y-1">
            <p className="text-sm text-indigo-100">{user?.collegeName}</p>
            <p className="text-sm text-indigo-100">{user?.department}</p>
            <p className="text-sm font-semibold">Semester {user?.semester}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <QuickStat 
          label="Friends" 
          value={data.friends.length} 
          icon="👥" 
        />
        <QuickStat 
          label="Messages" 
          value={data.conversations.length} 
          icon="💬" 
        />
        <QuickStat 
          label="My Listings" 
          value={data.listings.length} 
          icon="🛍️" 
        />
        <QuickStat 
          label="Friend Requests" 
          value={data.pendingRequests.length} 
          icon="✨" 
        />
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Feed Widget */}
        <WidgetCard
          icon="📢"
          title="Recent Announcements"
          description="Stay updated with the latest news and announcements from your college administration."
          linkText="View All Announcements"
          linkTo="/feed"
          color="indigo"
        />

        {/* Marketplace Widget */}
        <WidgetCard
          icon="🛒"
          title="Marketplace"
          description="Browse items for sale by your fellow students. Find great deals on books, electronics, and more."
          linkText="Browse Marketplace"
          linkTo="/market"
          color="green"
        />

        {/* Friends Widget */}
        <WidgetCard
          icon="👥"
          title="Connect with Friends"
          description="Find and connect with students in your department and semester. Build your campus network."
          linkText="Find Friends"
          linkTo="/friends"
          color="orange"
        />

        {/* Chat Widget */}
        <WidgetCard
          icon="💬"
          title="Messages"
          description="Chat with friends and participate in group discussions. Stay connected with your campus community."
          linkText="Open Chat"
          linkTo="/chat"
          color="blue"
        />

        {/* Profile Widget */}
        <WidgetCard
          icon="✨"
          title="Your Profile"
          description="Update your profile, add a bio, and customize how others see you on the platform."
          linkText="Edit Profile"
          linkTo="/profile/me"
          color="indigo"
        />

        {/* Coming Soon Widget */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-sm overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="p-6 flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              More Features Coming Soon
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Events, Study Groups, and more exciting features are on the way!
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Recent Updates
        </h2>
        <div className="space-y-4">
          {data.announcements.slice(0, 3).map(announcement => (
            <div key={announcement.id} className="p-3 border-b dark:border-gray-700">
              <p className="font-medium text-gray-900 dark:text-white">
                {announcement.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Posted by {announcement.authorName}
              </p>
            </div>
          ))}
          <Link 
            to="/feed" 
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View all announcements →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;