import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// API call function using axios
const registerUser = async (collegeCode, studentId, password) => {
  // Uses the relative path '/api/register', relying on the Vite proxy
  const response = await axios.post('/api/register', {
    collegeCode,
    studentId,
    password,
  });
  // Axios throws an error for non-2xx responses automatically
  return response.data; // Returns { message: "..." } on success
};

function Register() { // Renamed from RegisterPage
  const [collegeCode, setCollegeCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Basic frontend validation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    setIsLoading(true);

    try {
      const data = await registerUser(collegeCode, studentId, password);
      setSuccessMessage(data.message || 'Registration successful! Redirecting to login...');
      console.log('Registration successful:', data);

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000); // 2-second delay

    } catch (err) {
      let errorMessage = 'An error occurred during registration.';
       if (axios.isAxiosError(err)) {
         if (err.response && err.response.data && err.response.data.error) {
           errorMessage = err.response.data.error; // Use backend error message
         } else if (err.message) {
           errorMessage = err.message;
         }
       } else if (err instanceof Error) {
          errorMessage = err.message;
       }
      setError(errorMessage);
      console.error('Registration error:', err);
      setIsLoading(false); // Stop loading only on error
    }
    // Don't set isLoading to false on success immediately because we are navigating
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
          <p className="text-gray-500 dark:text-gray-400">Join the UniLink community</p>
        </div>

        {/* Display success message */}
        {successMessage && !error && (
            <div className="p-4 text-sm text-green-700 bg-green-100 rounded-md dark:bg-green-900 dark:text-green-300">
                {successMessage}
            </div>
        )}

        {/* Display error message */}
         {error && (
            <div className="p-4 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-300">
                {error}
            </div>
        )}

        {/* Hide form on success to prevent re-submission */}
        {!successMessage && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="collegeCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                College Code
              </label>
              <input
                id="collegeCode"
                name="collegeCode"
                type="text"
                required
                value={collegeCode}
                onChange={(e) => setCollegeCode(e.target.value.toUpperCase())} // Convert to uppercase
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="e.g., VIT, MIT"
              />
            </div>

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
                placeholder="Enter your official student ID"
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
                minLength="6" // Add minLength validation
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Min. 6 characters"
              />
            </div>

             <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Re-enter your password"
              />
            </div>


            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        )}

        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;