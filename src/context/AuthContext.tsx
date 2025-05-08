import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (token) {
          // Validate token with backend
          const response = await api.get('/auth/verify');
          if (response.status === 200) {
            setUser(response.data.user);
          }
        }
      } catch (err) {
        // Not authenticated, silently handle this without redirects
        console.log('Not authenticated, continuing as guest user');
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      setUser(response.data.user);
      localStorage.setItem('authToken', response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post('/auth/register', { username, email, password });
      setUser(response.data.user);
      localStorage.setItem('authToken', response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      setError(null);
      api.post('/auth/logout').catch(err => {
        console.error('Error during logout API call:', err);
      });
      localStorage.removeItem('authToken');
      setUser(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      loading, 
      login, 
      register, 
      logout, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};