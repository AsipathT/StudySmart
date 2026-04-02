import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PrivateRoute from './components/common/PrivateRoute';

// Pages
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PredictionPage from './pages/PredictionPage';
import ChatbotPage from './pages/ChatbotPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';

import MyGroups from "./pages/MyGroups";
import JoinedGroups from "./pages/JoinedGroups";
import AllGroups from "./pages/AllGroups";
import CreateGroup from "./pages/CreateGroup";

import './App.css';

const { Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true }}>
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <Layout 
            className="site-layout" 
            style={{ 
              marginLeft: collapsed ? 80 : 250, 
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <Header collapsed={collapsed} setCollapsed={setCollapsed} />
            <Content 
              style={{ 
                margin: '24px 16px', 
                padding: 24, 
                minHeight: 280,
                background: '#fff',
                borderRadius: 8,
              }}
            >
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                
                {/* Admin Route */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <PrivateRoute roles={['admin']}>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />
                
                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/upload"
                  element={
                    <PrivateRoute>
                      <UploadPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <PrivateRoute>
                      <AnalyticsPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/predictions"
                  element={
                    <PrivateRoute>
                      <PredictionPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/chatbot"
                  element={
                    <PrivateRoute>
                      <ChatbotPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <PrivateRoute roles={['admin']}>
                      <HistoryPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <SettingsPage />
                    </PrivateRoute>
                  }
                />

                <Route
  path="/buddy/my-groups"
  element={
    <PrivateRoute>
      <MyGroups />
    </PrivateRoute>
  }
/>

<Route
  path="/buddy/joined"
  element={
    <PrivateRoute>
      <JoinedGroups />
    </PrivateRoute>
  }
/>



<Route
  path="/buddy/create"
  element={
    <PrivateRoute>
      <CreateGroup />
    </PrivateRoute>
  }
/>

<Route
  path="/buddy/all-groups"
  element={
    <PrivateRoute>
      <AllGroups />
    </PrivateRoute>
  }
/>
                



              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;