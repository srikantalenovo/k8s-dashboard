import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null); // Added user state
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Clear auth state helper
  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setError(null);
  }, []);

  const signup = async (username, email, password) => {
    try {
      setError(null);
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        username,
        email,
        password
      }, {
        validateStatus: (status) => status < 500 // Consider 4xx as not errors
      });

      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setCurrentUser(response.data.user); // Store user data
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Registration failed. Please try again.';
      setError(errorMessage);
      clearAuth(); // Clear any partial auth state
      throw new Error(errorMessage);
    }
  };

  const login = async (formData) => {
    try {
      setError(null);
      const response = await axios.post('http://localhost:5000/api/auth/login', formData, {
        validateStatus: (status) => status < 500
      });

      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setCurrentUser(response.data.user); // Store user data
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Login failed. Please check your credentials.';
      setError(errorMessage);
      clearAuth(); // Clear any partial auth state
      throw new Error(errorMessage);
    }
  };

  const logout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  // Verify token on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCurrentUser(response.data.user);
        } catch (err) {
          clearAuth();
        }
      }
    };
    verifyToken();
  }, [token, clearAuth]);

  return (
    <AuthContext.Provider value={{ 
      token, 
      currentUser, // Expose user data
      isAuthenticated: !!token, // Convenience boolean
      signup, 
      login, 
      logout, 
      error, 
      setError 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
