import React, { useCallback, useState } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  required?: boolean;
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = '*/*',
  maxSize = 10,
  required = false,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    return null;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        const validationError = validateFile(file);
        if (validationError) {
          setUploadStatus('error');
          return;
        }
        onChange(file);
        setUploadStatus('uploading');
        // Simulate upload progress
        simulateUpload();
      }
    },
    [disabled, maxSize, onChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        const validationError = validateFile(file);
        if (validationError) {
          setUploadStatus('error');
          return;
        }
        onChange(file);
        setUploadStatus('uploading');
        simulateUpload();
      }
    },
    [disabled, maxSize, onChange]
  );

  const simulateUpload = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploadStatus('success');
        setUploadProgress(null);
      }
    }, 200);
  };

  const removeFile = () => {
    onChange(null);
    setUploadStatus('idle');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Upload className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'}
          ${error ? 'border-red-500' : ''}
          ${value ? 'border-green-500 bg-green-50' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {value ? (
          <div className="flex items-center justify-center gap-4">
            <File className="w-10 h-10 text-gray-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">{value.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(value.size)}</p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {getStatusIcon()}
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Drag and drop a file here, or <span className="text-blue-500">browse</span>
              </p>
              <p className="text-xs text-gray-500">
                Max file size: {maxSize}MB
              </p>
            </div>

            {uploadStatus === 'uploading' && uploadProgress !== null && (
              <div className="w-full max-w-xs mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{uploadProgress}% uploaded</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
