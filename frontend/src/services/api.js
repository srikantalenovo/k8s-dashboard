import axios from 'axios';

let baseURL;

// Detect environment and set API base URL
if (window.location.hostname === 'localhost') {
  // Local development
  baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
} else {
  // Production (K8s via Ingress) - same domain, /api path
  baseURL = process.env.REACT_APP_API_URL || '/api';
}

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth tokens
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default api;
