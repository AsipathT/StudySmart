import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin, Result } from 'antd';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading, token, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  // Check if authenticated
  const authOk = user || token || isAuthenticated;
  if (!authOk) {
    return <Navigate to="/login" />;
  }

  // Check if role is allowed (if roles specified)
  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle={`You don't have permission to access this page. Required role: ${roles.join(', ')}`}
      />
    );
  }

  return children;
};

export default PrivateRoute;