import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, error } = useAuth();
  const navigate = useNavigate();
  
  const validateForm = (): boolean => {
    const errors: {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    let isValid = true;
    
    if (!username) {
      errors.username = 'Username is required';
      isValid = false;
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
      isValid = false;
    }
    
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
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled in AuthContext and displayed below
      console.error('Registration failed:', err);
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
        Create your account
      </h1>
      
      {error && (
        <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="Username"
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={formErrors.username}
            leftIcon={<User size={18} />}
            fullWidth
            placeholder="johndoe"
            autoComplete="username"
          />
          
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
            autoComplete="new-password"
            helperText="Password must be at least 8 characters"
          />
          
          <Input
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={formErrors.confirmPassword}
            leftIcon={<Lock size={18} />}
            fullWidth
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        
        <div className="mt-6">
          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
          >
            Sign up
          </Button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;