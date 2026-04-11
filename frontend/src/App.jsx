import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { AuthProvider } from './context/AuthContext';
import { SessionThemeProvider, useSessionTheme } from './context/SessionThemeContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PrivateRoute from './components/common/PrivateRoute';

const SessionDarkWrapper = ({ children }) => {
  const { isDark } = useSessionTheme();
  return isDark
    ? <div style={{ background: '#020617', margin: '-24px', padding: 0, borderRadius: 8, overflow: 'hidden', minHeight: 'calc(100% + 48px)' }}>{children}</div>
    : <>{children}</>;
};

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

import CreateGroup from "./pages/CreateGroup";
import StudyBuddyDashboard from "./pages/StudyBuddyDashboard";
import FindBuddies from "./pages/FindBuddies";
import GroupChat from "./pages/GroupChat";


import StudySessionPage from "./pages/StudySessionPage";
import TrackingSummaryPage from "./pages/TrackingSummaryPage";
import QuizPage from "./pages/QuizPage";
import MaterialMasteryPage from "./pages/MaterialMasteryPage";
import CreateStudentsPage from "./pages/CreateStudentsPage";

import './App.css';

const { Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthProvider>
      <SessionThemeProvider>
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
  path="/buddy/dashboard"
  element={
    <PrivateRoute>
      <StudyBuddyDashboard />
    </PrivateRoute>
  }
/>

<Route
  path="/buddy/find"
  element={
    <PrivateRoute>
      <FindBuddies />
    </PrivateRoute>
  }
/>

<Route path="/buddy/chat/:groupId" element={<GroupChat />} />






<Route
  path="/study-tracker"
  element={
    <PrivateRoute>
      <SessionDarkWrapper>
        <StudySessionPage />
      </SessionDarkWrapper>
    </PrivateRoute>
  }
/>

<Route
  path="/quizzes"
  element={
    <PrivateRoute>
      <SessionDarkWrapper>
        <QuizPage />
      </SessionDarkWrapper>
    </PrivateRoute>
  }
/>

<Route
  path="/tracking-summary"
  element={
    <PrivateRoute>
      <SessionDarkWrapper>
        <TrackingSummaryPage />
      </SessionDarkWrapper>
    </PrivateRoute>
  }
/>

<Route
  path="/material-mastery"
  element={
    <PrivateRoute>
      <SessionDarkWrapper>
        <MaterialMasteryPage />
      </SessionDarkWrapper>
    </PrivateRoute>
  }
/>

<Route
  path="/create-students"
  element={
    <PrivateRoute roles={['admin']}>
      <SessionDarkWrapper>
        <CreateStudentsPage />
      </SessionDarkWrapper>
    </PrivateRoute>
  }
/>
                



              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
      </SessionThemeProvider>
    </AuthProvider>
  );
}

export default App;