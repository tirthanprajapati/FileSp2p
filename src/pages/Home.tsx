import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Shield, Lock, Users, Server, Wifi } from 'lucide-react';
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
                Secure File Transfer Solution
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Transfer files securely with end-to-end encryption.
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
                <Server size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Reliable Server-Assisted Transfer
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our current implementation uses a secure server to facilitate transfers, ensuring reliable connections even through firewalls and NATs.
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

      {/* Transfer methods section - NEW */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Transfer Methods
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-300 mr-4">
                  <Server size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Server-Assisted Transfer <span className="text-sm font-normal text-success-500 ml-2">(Current)</span>
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Our current implementation uses a secure server to relay file chunks between sender and receiver.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-success-500 mr-2">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">Reliable connection in almost all network environments</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success-500 mr-2">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">Works with all browsers and devices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success-500 mr-2">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">End-to-end encrypted for security</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-300 mr-4">
                  <Wifi size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  WebRTC Peer-to-Peer <span className="text-sm font-normal text-gray-500 ml-2">(Coming Soon)</span>
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Direct browser-to-browser transfer using WebRTC technology for maximum speed and privacy.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-success-500 mr-2">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">Faster transfer speeds for large files</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success-500 mr-2">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">Server only helps establish connection, doesn't see file data</span>
                </li>
                <li className="flex items-start text-gray-400 dark:text-gray-500">
                  <span className="mr-2">⚠</span>
                  <span>May not work behind some firewalls or NAT configurations</span>
                </li>
              </ul>
              <div className="mt-4">
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  In Development
                </span>
              </div>
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
            Experience secure file transfers today with our current server-assisted implementation.
            Stay tuned for direct peer-to-peer capabilities coming soon!
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