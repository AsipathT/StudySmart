import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await axios.get('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data.data.user);
          setToken(storedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      console.log('Login response:', response.data);
      
      // Handle response structure: { success: true, data: { user, token }, message: ... }
      const newToken = response.data.data?.token;
      const userData = response.data.data?.user;
      
      if (!newToken || !userData) {
        console.error('Missing token or user in response:', response.data);
        return { success: false, error: 'Invalid response from server' };
      }
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error details:', error.response?.data);
      // Extract error message from backend response
      const errorMsg = error.response?.data?.error?.message || 
                       error.response?.data?.message || 
                       'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const demoLogin = (demoUser) => {
    const demoToken = `demo-${Date.now()}`;
    localStorage.setItem('token', demoToken);
    setToken(demoToken);
    setUser(demoUser);
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      console.log('Register response:', response.data);
      
      // Handle response structure: { success: true, data: { user, token }, message: ... }
      const newToken = response.data.data?.token;
      const regUser = response.data.data?.user;
      
      if (!newToken || !regUser) {
        console.error('Missing token or user in register response:', response.data);
        return { success: false, error: 'Invalid response from server' };
      }
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(regUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true, user: regUser };
    } catch (error) {
      console.error('Register error details:', error.response?.data);
      // Extract error message from backend response
      const errorMsg = error.response?.data?.error?.message || 
                       error.response?.data?.message || 
                       'Registration failed';
      return { success: false, error: errorMsg };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, demoLogin, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;