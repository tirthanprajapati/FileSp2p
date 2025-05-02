import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <AlertCircle size={80} className="mx-auto text-primary-500 dark:text-primary-400" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved to another URL.
        </p>
        
        <Link to="/">
          <Button leftIcon={<Home size={18} />}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;