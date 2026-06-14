import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      {text && (
        <span className="ml-2 text-sm text-gray-600" aria-live="polite">
          {text}
        </span>
      )}
    </div>
  );
};

export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ isLoading, children, onClick, disabled, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      aria-disabled={disabled || isLoading}
    >
      {isLoading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      <span className={isLoading ? 'opacity-75' : ''}>
        {children}
      </span>
    </button>
  );
};

export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
}> = ({ isLoading, text = 'Loading...', children }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" text={text} />
        </div>
      )}
    </div>
  );
};