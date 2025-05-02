import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileIcon, X } from 'lucide-react';
import Button from '../ui/Button';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // in MB
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  maxSize = 1024, // Default to 1GB
  multiple = true,
  accept,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );
  
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const validateFiles = useCallback(
    (files: File[]): boolean => {
      setError(null);
      
      // Check file size
      const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError(`Some files exceed the maximum size of ${maxSize}MB`);
        return false;
      }
      
      // Check file type if accept is specified
      if (accept) {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const invalidFiles = files.filter(file => {
          // Check if the file's type matches any of the accepted types
          return !acceptedTypes.some(type => {
            if (type.startsWith('.')) {
              // Extension check
              return file.name.endsWith(type);
            } else if (type.includes('*')) {
              // Wildcard MIME type check (e.g., "image/*")
              const [category] = type.split('/');
              return file.type.startsWith(`${category}/`);
            } else {
              // Exact MIME type check
              return file.type === type;
            }
          });
        });
        
        if (invalidFiles.length > 0) {
          setError('Some files have invalid types');
          return false;
        }
      }
      
      return true;
    },
    [maxSize, accept]
  );
  
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (disabled) return;
      
      const droppedFiles = Array.from(e.dataTransfer.files);
      const filesToProcess = multiple ? droppedFiles : droppedFiles.slice(0, 1);
      
      if (validateFiles(filesToProcess)) {
        setSelectedFiles(filesToProcess);
        onFilesSelected(filesToProcess);
      }
    },
    [disabled, multiple, validateFiles, onFilesSelected]
  );
  
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files?.length) return;
      
      const selectedInputFiles = Array.from(e.target.files);
      const filesToProcess = multiple ? selectedInputFiles : selectedInputFiles.slice(0, 1);
      
      if (validateFiles(filesToProcess)) {
        setSelectedFiles(filesToProcess);
        onFilesSelected(filesToProcess);
      }
      
      // Reset the input
      e.target.value = '';
    },
    [disabled, multiple, validateFiles, onFilesSelected]
  );
  
  const removeFile = useCallback(
    (index: number) => {
      const updatedFiles = [...selectedFiles];
      updatedFiles.splice(index, 1);
      setSelectedFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    },
    [selectedFiles, onFilesSelected]
  );
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="w-full">
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 transition-colors duration-200
          ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-300 dark:border-gray-700'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}       // <— trigger dialog on click
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload
            className={`h-12 w-12 mb-4 ${isDragging ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'}`}
            aria-hidden="true"
          />
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {isDragging ? 'Drop files here' : 'Drag and drop your files'}
          </h3>
          
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            or
          </p>
          
          <div className="mt-4">
            <input
              ref={fileInputRef}                                         // <— attach ref
              id="file-upload"
              type="file"
              multiple={multiple}
              accept={accept}
              onChange={handleFileInputChange}
              disabled={disabled}
              className="sr-only"
              // webkitdirectory="true"                                      // <— enable folder select
              // directory="true"                                             // <— enable folder select
            />
            <label htmlFor="file-upload">
              <Button
                  type="button"
                  disabled={disabled}
                  variant="outline"
                >
                  Browse files
                </Button>
            </label>
          </div>
          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Maximum file size: {maxSize}MB
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-error-600 dark:text-error-400">
          {error}
        </div>
      )}
      
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selected files:
          </h4>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <FileIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-error-500 dark:hover:text-error-400"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;