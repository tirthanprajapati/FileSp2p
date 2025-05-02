import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

const AuthLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-xl">
            <Send size={24} />
            <span>SecureShare</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      
      <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} SecureShare. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;