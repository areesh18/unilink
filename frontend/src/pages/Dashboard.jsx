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
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      orange: 'bg-amber-50 text-amber-600 border-amber-100',
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
    };

    const hoverClasses = {
      indigo: 'hover:border-indigo-200',
      green: 'hover:border-emerald-200',
      orange: 'hover:border-amber-200',
      blue: 'hover:border-blue-200',
    };

    return (
      <div className={`bg-white rounded-lg border-2 ${colorClasses[color].split(' ')[2]} ${hoverClasses[color]} transition-all duration-200 hover:shadow-md`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${colorClasses[color].split(' ')[0]} flex items-center justify-center text-2xl`}>
              {icon}
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-2 text-gray-900">
            {title}
          </h2>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {description}
          </p>
          <Link
            to={linkTo}
            className={`inline-flex items-center text-sm font-medium ${colorClasses[color].split(' ')[1]} hover:opacity-70 transition-opacity duration-200`}
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

  // Quick Stats Component
  const QuickStat = ({ label, value, icon }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl opacity-40">{icon}</div>
      </div>
    </div>
  );

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-semibold mb-1">
              Welcome back, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-indigo-100 text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end space-y-0.5 text-sm text-indigo-50">
            <p className="font-medium">{user?.collegeName}</p>
            <p>{user?.department}</p>
            <p>Semester {user?.semester}</p>
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
          label="Requests" 
          value={data.pendingRequests.length} 
          icon="✨" 
        />
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Feed Widget */}
        <WidgetCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          }
          title="Announcements"
          description="Stay updated with the latest news and announcements from your college administration."
          linkText="View All"
          linkTo="/feed"
          color="indigo"
        />

        {/* Marketplace Widget */}
        <WidgetCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="Marketplace"
          description="Browse items for sale by your fellow students. Find great deals on books, electronics, and more."
          linkText="Browse Items"
          linkTo="/market"
          color="green"
        />

        {/* Friends Widget */}
        <WidgetCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="Friends"
          description="Find and connect with students in your department and semester. Build your campus network."
          linkText="Find Friends"
          linkTo="/friends"
          color="orange"
        />

        {/* Chat Widget */}
        <WidgetCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          title="Messages"
          description="Chat with friends and participate in group discussions. Stay connected with your campus community."
          linkText="Open Chat"
          linkTo="/chat"
          color="blue"
        />

        {/* Profile Widget */}
        <WidgetCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="Your Profile"
          description="Update your profile, add a bio, and customize how others see you on the platform."
          linkText="Edit Profile"
          linkTo="/profile/me"
          color="indigo"
        />

        {/* Coming Soon Widget */}
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200">
          <div className="p-6 flex flex-col items-center justify-center h-full text-center min-h-[200px]">
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              More Features Coming Soon
            </h3>
            <p className="text-sm text-gray-500">
              Events, Study Groups, and more exciting features are on the way!
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Recent Updates
        </h2>
        <div className="space-y-3">
          {data.announcements.slice(0, 3).map(announcement => (
            <div key={announcement.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
              <p className="font-medium text-gray-900 text-sm mb-0.5">
                {announcement.title}
              </p>
              <p className="text-xs text-gray-500">
                Posted by {announcement.authorName}
              </p>
            </div>
          ))}
          {data.announcements.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No recent announcements</p>
          )}
          {data.announcements.length > 0 && (
            <Link 
              to="/feed" 
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200 mt-2"
            >
              View all announcements
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;