import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage (synchronous)
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }

    // Set loading false immediately after localStorage check
    // This ensures PrivateRoute doesn't unmount/remount children
    setLoading(false);
  }, []);

  // Separate effect to fetch profile image in the background
  // This does NOT affect loading state, so it won't cause component remounts
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      fetch('http://localhost:5000/api/profile', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(profileData => {
          if (profileData && profileData.profileImage) {
            const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const updatedUser = { ...parsedUser, profileImage: profileData.profileImage };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        })
        .catch(() => { });
    }
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

    // Fetch profile image after login (background, no loading state change)
    fetch('http://localhost:5000/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(profileData => {
        if (profileData && profileData.profileImage) {
          const updatedUser = { ...userData, profileImage: profileData.profileImage };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      })
      .catch(() => { });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
