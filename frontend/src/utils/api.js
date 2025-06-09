// src/utils/api.js
// Reusable API client with Axios, handling authentication and errors
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://whichfood-backend-g7d4fjbth7gbgubz.centralindia-01.azurewebsites.net/', // Update to production URL if needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
