import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Download, Clock, FileText, ExternalLink } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

interface Transfer {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'completed' | 'pending' | 'failed';
  type: 'sent' | 'received';
  recipientEmail?: string;
  senderEmail?: string;
  createdAt: string;
  completedAt?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received'>('all');
  
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoading(true);
        // Fetch transfers from API endpoint
        // Replace this with your actual API implementation
        const response = await fetch('/api/transfers');
        
        if (!response.ok) {
          throw new Error('Failed to fetch transfers');
        }
        
        const data = await response.json();
        setTransfers(data);
      } catch (err) {
        setError('Failed to load transfer history');
        console.error('Error fetching transfers:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransfers();
  }, []);
  
  const filteredTransfers = transfers.filter(transfer => {
    if (activeTab === 'all') return true;
    if (activeTab === 'sent') return transfer.type === 'sent';
    if (activeTab === 'received') return transfer.type === 'received';
    return true;
  });
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('presentation')) return '📝';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '🗜️';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('video')) return '🎬';
    return '📁';
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-500">Completed</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-500">Pending</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-500">Failed</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.username}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/transfer">
            <Button leftIcon={<Send size={18} />}>
              Send Files
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 mr-4">
              <Send size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Files Sent</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {transfers.filter(t => t.type === 'sent').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400 mr-4">
              <Download size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Files Received</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {transfers.filter(t => t.type === 'received').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-400 mr-4">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Transfers</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {transfers.filter(t => t.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transfer History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transfer History
          </h2>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'all'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'sent'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('sent')}
          >
            Sent
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'received'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('received')}
          >
            Received
          </button>
        </div>
        
        {/* List */}
        <div>
          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">Loading transfers...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-error-600 dark:text-error-400">{error}</p>
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No transfers found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {activeTab === 'all'
                  ? "You haven't transferred any files yet."
                  : activeTab === 'sent'
                  ? "You haven't sent any files yet."
                  : "You haven't received any files yet."}
              </p>
              {activeTab !== 'received' && (
                <Link to="/transfer">
                  <Button size="sm" variant="outline" leftIcon={<Send size={16} />}>
                    Send your first file
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransfers.map((transfer) => (
                <li key={transfer.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-xl">
                        {getFileIcon(transfer.fileType)}
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <h3 className="text-base font-medium text-gray-900 dark:text-white mr-2">
                            {transfer.fileName}
                          </h3>
                          {getStatusBadge(transfer.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {transfer.type === 'sent' 
                            ? `To: ${transfer.recipientEmail}` 
                            : `From: ${transfer.senderEmail}`}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{formatFileSize(transfer.fileSize)}</span>
                          <span>•</span>
                          <span>{formatDate(transfer.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-3">
                      {transfer.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Download size={16} />}
                        >
                          Download
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<ExternalLink size={16} />}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;