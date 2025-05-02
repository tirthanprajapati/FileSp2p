import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../ui/Navbar';
import Footer from '../ui/Footer';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;