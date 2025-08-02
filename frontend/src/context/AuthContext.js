import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [error, setError] = useState('');

  const login = async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);

      // 🔹 Ensure permissions always exist
      const normalizedUser = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        permissions: data.user.permissions || [] // 🔹 FIX
      };

      setUser(normalizedUser);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('token', data.token);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    }
  };

  const signup = async (credentials) => {
    try {
      const { data } = await api.post('/auth/signup', credentials);

      // 🔹 Ensure permissions always exist
      const normalizedUser = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        permissions: data.user.permissions || [] // 🔹 FIX
      };

      setUser(normalizedUser);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('token', data.token);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, error, setError, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
