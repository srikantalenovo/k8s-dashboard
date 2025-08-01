import axios from 'axios';

//const api = axios.create({
//  baseURL: process.env.REACT_APP_API_URL || 'http://10.0.0.50:5000/api',
//    ? '/api',  // Production (uses same domain via proxy)
//    : 'http://10.0.0.50:5000/api', // Development
//  timeout: 10000,
//  headers: {
//    'Content-Type': 'application/json',
//  }
//});
//
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://10.0.0.50:5000/api',
  timeout: 10000
});

// Add request interceptor for auth tokens
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;
