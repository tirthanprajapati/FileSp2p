import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Shield, Zap, Lock, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Secure Peer-to-Peer File Transfer
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Transfer files directly between devices with end-to-end encryption.
                No cloud storage, no size limits, maximum privacy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={isAuthenticated ? "/transfer" : "/register"}>
                  <Button 
                    size="lg" 
                    leftIcon={<Send size={18} />}
                  >
                    {isAuthenticated ? "Transfer Files" : "Get Started"}
                  </Button>
                </Link>
                <Link to="/receive/guest">
                  <Button 
                    size="lg" 
                    variant="outline"
                  >
                    Receive Files
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="w-full max-w-md rounded-lg bg-gradient-to-tr from-primary-500 to-accent-500 p-1 shadow-lg">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center mb-4">
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 mr-8">
                        <Send size={28} />
                      </div>
                      <div className="w-24 h-2 bg-primary-200 dark:bg-primary-700 rounded-full animate-pulse-slow"></div>
                      <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 ml-8">
                        <Users size={28} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="w-24 h-8 bg-primary-100 dark:bg-primary-900 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose SecureShare?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-300 mb-4">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                End-to-End Encryption
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your files are encrypted during transfer and never stored on our servers, ensuring maximum privacy and security.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center text-secondary-600 dark:text-secondary-300 mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Direct Connection
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Transfer files directly between devices, resulting in faster speeds without intermediary servers.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center text-accent-600 dark:text-accent-300 mb-4">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                No Size Limits
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Transfer files of any size with our chunking technology that handles large files efficiently and reliably.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-300 mx-auto mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                Sign Up
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create a free account to start sending files securely
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-300 mx-auto mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                Select Files
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose the files you want to transfer
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-300 mx-auto mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                Generate Link
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create a secure link to share with the recipient
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-300 mx-auto mb-4">
                <span className="text-xl font-bold">4</span>
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                Secure Transfer
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Files transfer directly with end-to-end encryption
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to try SecureShare?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Experience the security and speed of peer-to-peer file transfers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isAuthenticated ? "/transfer" : "/register"}>
              <Button 
                size="lg" 
                variant="secondary"
              >
                {isAuthenticated ? "Transfer Files" : "Get Started for Free"}
              </Button>
            </Link>
            <Link to="/receive/guest">
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:bg-opacity-10"
              >
                Receive Files
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;