import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom'; // Import Navigate
import axios from 'axios';
import { useAuth } from '../hooks/useAuth'; // Import the custom hook

function Login() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // Keep local error state for the form
  const [isLoading, setIsLoading] = useState(false); // Keep local loading state for the button
  const { login, user } = useAuth(); // Get the login function and user from context

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Call the login function from the context
      await login(studentId, password);
      // Navigation is now handled inside the context's login function
      // No need to call navigate() here anymore

    } catch (err) {
      // Handle potential Axios errors (same as before)
      let errorMessage = 'An error occurred during login.';
      if (axios.isAxiosError(err)) {
        if (err.response && err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
         errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Login error:', err);
      setIsLoading(false); // Stop loading only on error
    }
    // No finally block needed here if navigation happens on success
  };

  // If user is already logged in (e.g., they navigated back here), redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // --- JSX for the form remains largely the same ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back!</h2>
          <p className="text-gray-500 dark:text-gray-400">Log in to your UniLink account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Student ID
            </label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="e.g., 21BCE1001"
              disabled={isLoading} // Disable input while loading
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="••••••••"
               disabled={isLoading} // Disable input while loading
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
              {isLoading ? 'Logging In...' : 'Log In'}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;