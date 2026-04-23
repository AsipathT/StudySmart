import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../../hooks/useAuth';

/** Protected RL app routes; unauthenticated users go to main app login (RL login is sidebar-only). */
const ResourceLibraryPrivateRoute = ({ children }) => {
  const { user, loading, token, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const authOk = Boolean(user || token || isAuthenticated || (storedToken && storedToken.length > 0));
  if (!authOk) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ResourceLibraryPrivateRoute;
