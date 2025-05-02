import axios from 'axios';

// Create an axios instance with defaults
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized globally
    if (error.response && error.response.status === 401) {
      // Redirect to login or clear local auth state
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;