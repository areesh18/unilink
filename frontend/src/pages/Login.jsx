// frontend/src/pages/Login.jsx - Refactored for Light Mode
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();

  // handleLogin logic remains the same
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Assuming 'student' login type by default
      await login({ studentId, password }, 'student');
      // Navigation is handled by the AuthContext
    } catch (err) {
      let errorMessage = 'An error occurred during login.';
      // Improved error message extraction
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.error || err.message || errorMessage;
      } else if (err instanceof Error) {
         errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Login error:', err);
      setIsLoading(false); // Stop loading only on error
    }
  };

  // Redirect logic remains the same
  if (user && user.role === 'student') {
      return <Navigate to="/dashboard" replace />;
  }
  else if (user && (user.role === 'college_admin' || user.role === 'platform_admin')) {
      return <Navigate to="/admin/dashboard" replace />;
  }

  // Base input class
  const inputBaseClass = "w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white placeholder-gray-400 disabled:opacity-50";


  return (
    // Main container styling: light gray bg, center content
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-12">
      {/* Form Card Styling: white bg, rounded, shadow, border */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header */}
        <div className="text-center">
            {/* Optional: Add Logo here */}
            {/* <img className="mx-auto h-12 w-auto" src="/path/to/logo.svg" alt="UniLink Logo" /> */}
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Welcome Back!</h2>
          <p className="mt-1 text-sm text-gray-600">Log in to your UniLink account</p>
        </div>

        {/* Error Message */}
        {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                {error}
            </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Student ID Input */}
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
              Student ID
            </label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={inputBaseClass} // Use base class
              placeholder="e.g., 21BCE1001"
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputBaseClass} // Use base class
              placeholder="••••••••"
              disabled={isLoading}
            />
            {/* Optional: Add Forgot Password link */}
            {/* <div className="text-right mt-1">
              <a href="#" className="text-xs text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </a>
            </div> */}
          </div>


          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-150"
            >
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              {isLoading ? 'Logging In...' : 'Log In'}
            </button>
          </div>
        </form>

        {/* Link to Register */}
        <p className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;