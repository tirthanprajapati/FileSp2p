import React from 'react';
import { CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { TransferProgress as TransferProgressType } from '../../utils/webrtc';
import Button from '../ui/Button';

interface TransferProgressProps {
  transfer: TransferProgressType;
  onRetry?: () => void;
  onCancel?: () => void;
}

const TransferProgress: React.FC<TransferProgressProps> = ({
  transfer,
  onRetry,
  onCancel,
}) => {
  const { sentChunks, totalChunks, receivedChunks, status, metadata } = transfer;
  
  // Calculate percentage for sender or receiver based on available data
  const percentage = status === 'waiting' || status === 'connecting'
    ? 0
    : sentChunks > 0
      ? Math.round((sentChunks / totalChunks) * 100)
      : Math.round((receivedChunks / totalChunks) * 100);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Status icon and color
  const getStatusInfo = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-6 w-6 text-success-500" />,
          text: 'Completed',
          color: 'bg-success-500',
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-error-500" />,
          text: 'Error',
          color: 'bg-error-500',
        };
      case 'waiting':
        return {
          icon: <Clock className="h-6 w-6 text-warning-500" />,
          text: 'Waiting for connection',
          color: 'bg-warning-500',
        };
      case 'connecting':
        return {
          icon: <RefreshCw className="h-6 w-6 text-primary-500 animate-spin" />,
          text: 'Establishing connection',
          color: 'bg-primary-500',
        };
      case 'paused':
        return {
          icon: <Clock className="h-6 w-6 text-secondary-500" />,
          text: 'Paused',
          color: 'bg-secondary-500',
        };
      default:
        return {
          icon: <RefreshCw className="h-6 w-6 text-primary-500 animate-spin" />,
          text: 'Transferring',
          color: 'bg-primary-500',
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {statusInfo.icon}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {metadata?.name}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {metadata && formatFileSize(metadata.size)}
        </span>
      </div>
      
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span>{statusInfo.text}</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${statusInfo.color} transition-all duration-300 ease-in-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      
      {status === 'error' && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-error-600 dark:text-error-400">
            {transfer.error || 'Transfer failed'}
          </span>
          <div className="flex space-x-2">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                leftIcon={<RefreshCw size={14} />}
              >
                Retry
              </Button>
            )}
            {onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferProgress;