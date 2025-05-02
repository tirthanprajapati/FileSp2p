import React, { useState } from 'react';
import { User, Mail, Lock, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  // Account settings
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [accountUpdateSuccess, setAccountUpdateSuccess] = useState(false);
  
  // Password settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingAccount(true);
    
    // This would be a real API call in a production app
    // try {
    //   await api.put('/users/profile', { username, email });
    //   setAccountUpdateSuccess(true);
    // } catch (err) {
    //   console.error('Failed to update profile', err);
    // }
    
    // Simulate API call
    setTimeout(() => {
      setAccountUpdateSuccess(true);
      setIsUpdatingAccount(false);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setAccountUpdateSuccess(false);
      }, 3000);
    }, 1000);
  };
  
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    setIsUpdatingPassword(true);
    
    // This would be a real API call in a production app
    // try {
    //   await api.put('/users/password', { currentPassword, newPassword });
    //   setPasswordUpdateSuccess(true);
    //   setCurrentPassword('');
    //   setNewPassword('');
    //   setConfirmPassword('');
    // } catch (err) {
    //   console.error('Failed to update password', err);
    //   setPasswordError('Current password is incorrect');
    // }
    
    // Simulate API call
    setTimeout(() => {
      setPasswordUpdateSuccess(true);
      setIsUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setPasswordUpdateSuccess(false);
      }, 3000);
    }, 1000);
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Profile Settings
      </h1>
      
      {/* Account Settings */}
      <div className="mb-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Account Settings
        </h2>
        
        <form onSubmit={handleAccountUpdate}>
          <div className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<User size={18} />}
              fullWidth
            />
            
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              fullWidth
            />
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <Button
              type="submit"
              isLoading={isUpdatingAccount}
              leftIcon={<Save size={18} />}
            >
              Update Profile
            </Button>
            
            {accountUpdateSuccess && (
              <p className="text-success-600 dark:text-success-400">
                Profile updated successfully!
              </p>
            )}
          </div>
        </form>
      </div>
      
      {/* Password Settings */}
      <div className="mb-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Change Password
        </h2>
        
        {passwordError && (
          <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 rounded-md text-sm">
            {passwordError}
          </div>
        )}
        
        <form onSubmit={handlePasswordUpdate}>
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              fullWidth
            />
            
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              fullWidth
              helperText="Password must be at least 8 characters"
            />
            
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              fullWidth
            />
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <Button
              type="submit"
              variant="outline"
              isLoading={isUpdatingPassword}
              leftIcon={<Lock size={18} />}
            >
              Update Password
            </Button>
            
            {passwordUpdateSuccess && (
              <p className="text-success-600 dark:text-success-400">
                Password updated successfully!
              </p>
            )}
          </div>
        </form>
      </div>
      
      {/* Security Settings */}
      <div className="mb-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Security Settings
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              Set Up
            </Button>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Login Activity
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review your recent login sessions
              </p>
            </div>
            <Button variant="outline" size="sm">
              View
            </Button>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Delete Account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="danger" size="sm">
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;