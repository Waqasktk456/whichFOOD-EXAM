import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // In a real app, this would check for authentication token in localStorage or context
  const isAuthenticated = true; // Mock authentication for demonstration
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default ProtectedRoute;
