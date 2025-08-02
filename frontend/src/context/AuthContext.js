import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Set auth headers
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) return;
            
            try {
                const res = await axios.get('/api/auth/verify');
                setUser(res.data.user);
            } catch (err) {
                logout();
            }
        };
        verifyToken();
    }, [token]);

    const login = async (credentials) => {
        try {
            setError(null);
            const { data } = await axios.post('/api/auth/login', credentials);
            
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data.user);
            navigate('/dashboard');
            
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
            throw err;
        }
    };

    const signup = async (userData) => {
        try {
            setError(null);
            const { data } = await axios.post('/api/auth/signup', userData);
            
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data.user);
            navigate('/dashboard');
            
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                error,
                login,
                signup,
                logout,
                isAuthenticated: !!token
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}