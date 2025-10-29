// frontend/src/components/AdminSidebar.jsx - Refactored for Light Mode & Responsiveness
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAdminNavLinks } from './adminNavConfig'; // <-- Import link generator

function AdminSidebar() {
  const { user } = useAuth();
  const isAdmin = user && (user.role === "college_admin" || user.role === "platform_admin");
  const isPlatformAdmin = user && user.role === "platform_admin";

  // Return null if the user isn't an admin
  if (!isAdmin) return null;

  // Get the correct links using the shared function
  const navLinks = getAdminNavLinks(user.role);

  // Use the full names for the sidebar display if needed, adjust getAdminNavLinks if necessary
  // Or keep shortened names for consistency across mobile/desktop

  // Tailwind classes for NavLink styling (remain the same)
  const baseLinkClass =
    "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 group";
  const inactiveLinkClass =
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const activeLinkClass =
    "bg-indigo-50 text-indigo-600 font-semibold";

  return (
    // Sidebar container styling: white bg, border-r
    // ADDED: hidden md:flex to hide on mobile, show on medium and up
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white hidden md:flex md:flex-col">
      {/* <div className="flex flex-col h-full"> */} {/* Removed extra div */}
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 h-16 flex flex-col justify-center flex-shrink-0"> {/* Added flex-shrink-0 */}
          <h3 className="text-base font-semibold text-gray-800">
            {isPlatformAdmin ? "Platform Panel" : "College Panel"}
          </h3>
          {!isPlatformAdmin && user?.collegeCode && (
            <p className="text-xs text-gray-500">
              {user.collegeCode}
            </p>
          )}
        </div>
        {/* Navigation Area */}
        {/* Added flex-1 and overflow-y-auto */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => (
            <NavLink
              key={item.name} // Use name which should be unique per role set
              to={item.path}
              className={({ isActive }) =>
                `${baseLinkClass} ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              end // Use 'end' prop for dashboard/stats link
            >
              <item.icon
                 className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    // Using NavLink className should handle active state, verify CSS if needed
                     'text-gray-400 group-hover:text-gray-500' // Base inactive color
                     // Active color comes from activeLinkClass text color potentially
                 }`}
                 // Applying active color directly might be needed if inheritance fails:
                 // className={({ isActive }) => `mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`}
                 aria-hidden="true"
               />
              {/* Use the name defined in getAdminNavLinks */}
              {item.name === 'Dash' ? 'Dashboard' : item.name === 'Stats' ? 'Platform Stats' : item.name === 'Announce' ? 'Announcements' : item.name === 'Market' ? 'Marketplace' : item.name} {/* Optionally expand names here */}
            </NavLink>
          ))}
        </nav>
        {/* Optional Footer can go here */}
      {/* </div> */} {/* Removed extra div */}
    </aside>
  );
}

export default AdminSidebar;