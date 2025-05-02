import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Send, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-xl">
            <Send size={24} />
            <span>SecureShare</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              Home
            </Link>
            
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  Dashboard
                </Link>
                <Link to="/transfer" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  Transfer Files
                </Link>
              </>
            )}
            
            {!isAuthenticated && (
              <>
                <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  Login
                </Link>
                <Link to="/register" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* User and Theme Controls */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            
            {isAuthenticated && user && (
              <div className="relative group">
                <button className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  <User size={20} />
                  <span>{user.username}</span>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <button
              onClick={toggleMenu}
              className="ml-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                Home
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link to="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                    Dashboard
                  </Link>
                  <Link to="/transfer" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                    Transfer Files
                  </Link>
                  <Link to="/profile" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Logout
                  </button>
                </>
              )}
              
              {!isAuthenticated && (
                <>
                  <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                    Login
                  </Link>
                  <Link to="/register" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;