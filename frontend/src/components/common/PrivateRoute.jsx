import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { user, loading, token, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // allow access if we have either a user object or a valid token
  const authOk = user || token || isAuthenticated;
  return authOk ? children : <Navigate to="/login" />;
};

export default PrivateRoute;