import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import './styles/theme-light.css';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PredictionPage from './pages/PredictionPage';
import ChatbotPage from './pages/ChatbotPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/common/PrivateRoute';
import './App.css';

const StudentRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const CreateStudentPage    = React.lazy(() => import('./pages/CreateStudentPage'));
const TrackingSummaryPage  = React.lazy(() => import('./pages/TrackingSummaryPage'));
const QuizPage             = React.lazy(() => import('./pages/QuizPage'));
const StudySessionPage     = React.lazy(() => import('./pages/StudySessionPage'));
const MaterialMasteryPage  = React.lazy(() => import('./pages/MaterialMasteryPage'));
const LoginPage            = React.lazy(() => import('./pages/LoginPage'));

const { Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ThemeProvider>
    <AuthProvider>
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}>
            <Header collapsed={collapsed} setCollapsed={setCollapsed} />
            <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
              <Suspense fallback={<div style={{ padding: 50, textAlign: 'center' }}>Loading...</div>}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
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
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <ProfilePage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/create-students"
                    element={
                      <PrivateRoute>
                        <CreateStudentPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/quizzes"
                    element={
                      <PrivateRoute>
                        <StudentRoute>
                          <QuizPage />
                        </StudentRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/tracking-summary"
                    element={
                      <PrivateRoute>
                        <StudentRoute>
                          <TrackingSummaryPage />
                        </StudentRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/study-tracker"
                    element={
                      <PrivateRoute>
                        <StudySessionPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/material-mastery"
                    element={
                      <PrivateRoute>
                        <StudentRoute>
                          <MaterialMasteryPage />
                        </StudentRoute>
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;