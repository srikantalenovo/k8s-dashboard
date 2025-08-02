import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  /**
   * Login user
   */
  const login = async (credentials) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        credentials,
        { headers: { 'Content-Type': 'application/json' } }
      );

      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setError('');
      return res.data;
    } catch (err) {
     console.error('Login error:', err);
     setError(
       err.response?.data?.error?.message ||
       err.response?.data?.error ||
       'Login failed'
     );
      throw err;
    }
  };

  /**
   * Signup user
   */
  const signup = async (credentials) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/signup`,
        credentials,
        { headers: { 'Content-Type': 'application/json' } }
      );

      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setError('');
      return res.data;
    } catch (err) {
     console.error('Signup error:', err);
     setError(
       err.response?.data?.error?.message ||
       err.response?.data?.error ||
       'Signup failed'
     );
      throw err;
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, error, setError, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
