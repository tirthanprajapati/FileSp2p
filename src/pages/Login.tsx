import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error } = useAuth();
  const navigate = useNavigate();
  
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    let isValid = true;
    
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled in AuthContext and displayed below
      console.error('Login failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
      <div className="flex justify-center mb-6">
        <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary-100 dark:bg-primary-900">
          <Send className="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Welcome back
      </h1>
      
      {error && (
        <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={formErrors.email}
            leftIcon={<Mail size={18} />}
            fullWidth
            placeholder="your@email.com"
            autoComplete="email"
          />
          
          <Input
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={formErrors.password}
            leftIcon={<Lock size={18} />}
            fullWidth
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        
        <div className="mt-6">
          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
          >
            Sign in
          </Button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default Login;