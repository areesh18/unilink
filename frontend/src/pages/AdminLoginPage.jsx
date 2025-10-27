// frontend/src/pages/AdminLoginPage.jsx (New File)
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // We'll reuse/adapt useAuth

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth(); // Get user and login from context
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Call login from context with credentials object and type 'admin'
      await login({ email, password }, "admin");
      // Navigation is now handled by the context's login function
    } catch (err) {
      setError(err.message || "Admin login failed."); // Use err.message
      setIsLoading(false);
    }
  };

  // Basic check: If already logged in *as an admin*, redirect
  // This needs refinement based on how AuthContext handles roles
  if (
    user &&
    (user.role === "college_admin" || user.role === "platform_admin")
  ) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  else if (user && user.role === 'student') {
      return <Navigate to="/dashboard" replace />;
  }
  // If logged in as student, maybe redirect to student dash? Or show login anyway?
  // else if (user && user.role === 'student') {
  //   return <Navigate to="/dashboard" replace />;
  // }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Login
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Access UniLink Admin Panel
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email" // Use email type
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="admin@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isLoading ? "Logging In..." : "Log In as Admin"}
            </button>
          </div>
        </form>
        {/* Optional: Link back to student login or home */}
        {/* <p className="text-sm text-center text-gray-500 dark:text-gray-400">
           Not an admin? <Link to="/login" className="...">Student Login</Link>
         </p> */}
      </div>
    </div>
  );
}

export default AdminLoginPage;
