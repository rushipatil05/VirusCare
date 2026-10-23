import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('viruscare_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('viruscare_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('viruscare_token');
      if (storedToken) {
        try {
          const res = await axiosClient.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('viruscare_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem('viruscare_token', receivedToken);
    localStorage.setItem('viruscare_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const demoLogin = async (role) => {
    const res = await axiosClient.post('/auth/demo-login', { role });
    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem('viruscare_token', receivedToken);
    localStorage.setItem('viruscare_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('viruscare_token');
    localStorage.removeItem('viruscare_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    role: user ? user.role : null,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    demoLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
