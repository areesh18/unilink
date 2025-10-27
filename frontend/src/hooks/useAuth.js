import { useContext } from 'react';
// Import the actual context, not the provider
import { AuthContext } from '../contexts/AuthContext'; // Adjust path if needed

// Create and export the custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
     // Check for undefined specifically, as null might be a valid initial state temporarily
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // If context is null initially but provider is wrapping, it might just be loading.
  // Depending on strictness, you might allow null briefly or handle loading state here.
  // For now, we assume if it's not undefined, the provider exists.
  return context;
};