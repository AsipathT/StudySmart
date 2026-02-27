import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import PrivateRoute from "./components/PrivateRoute";

import StudentSearch from "./components/StudentSearch";
import StudyGroupBrowser from "./components/StudyGroupBrowser";
import MyGroups from "./components/MyGroups";



function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
         <Route
            path="/find-buddies"
            element={
              <PrivateRoute>
                <StudentSearch />
              </PrivateRoute>
            }
          />
          <Route
           path="/study-groups"
           element={
              <PrivateRoute>
                <StudyGroupBrowser />
                </PrivateRoute>
           }
          
          
          />
          <Route
           path="/my-groups"
           element={
              <PrivateRoute>
                <MyGroups />
                </PrivateRoute>
           }
          
          
          />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

