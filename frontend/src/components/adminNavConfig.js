// frontend/src/components/adminNavConfig.js (New File)
import {
  ChartBarSquareIcon, // StatsIcon
  UsersIcon,          // UserIcon
  MegaphoneIcon,      // AnnounceIcon
  ShoppingCartIcon,   // MarketIcon
  UserGroupIcon,      // GroupIcon
  BuildingOfficeIcon  // CollegeIcon
} from '@heroicons/react/24/outline';

// Define icons mapping (can be shared)
const icons = {
  StatsIcon: ChartBarSquareIcon,
  UserIcon: UsersIcon,
  AnnounceIcon: MegaphoneIcon,
  MarketIcon: ShoppingCartIcon,
  GroupIcon: UserGroupIcon,
  CollegeIcon: BuildingOfficeIcon,
};

// Function to get links based on role
export const getAdminNavLinks = (userRole) => {
  if (userRole === "platform_admin") {
    // PLATFORM ADMIN Links
    return [
      { name: "Stats", path: "/platform/stats", icon: icons.StatsIcon }, // Shortened Name for Bottom Nav
      { name: "Colleges", path: "/platform/colleges", icon: icons.CollegeIcon }, // Shortened Name
      { name: "Admins", path: "/platform/admins", icon: icons.UserIcon }, // Shortened Name
      // Add profile link if desired for consistency
      // { name: "Profile", path: "/profile/me", icon: icons.ProfileOutline },
    ];
  } else if (userRole === "college_admin") {
    // COLLEGE ADMIN Links
    return [
      { name: "Dash", path: "/admin/dashboard", icon: icons.StatsIcon }, // Shortened Name
      { name: "Students", path: "/admin/students", icon: icons.UserIcon },
      { name: "Announce", path: "/admin/announcements", icon: icons.AnnounceIcon }, // Shortened Name
      { name: "Market", path: "/admin/listings", icon: icons.MarketIcon }, // Shortened Name
      { name: "Groups", path: "/admin/groups", icon: icons.GroupIcon },
    ];
  }
  return []; // Return empty if not an admin role
};