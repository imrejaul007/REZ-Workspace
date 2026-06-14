'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface AccessibleFormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string;
  required?: boolean;
}

export const AccessibleFormGroup = forwardRef<HTMLDivElement, AccessibleFormGroupProps>(
  ({ className, error, required, children, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-2',
          hasError && 'relative',
          className
        )}
        aria-invalid={hasError}
        {...props}
      >
        {children}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="text-sm text-red-600 font-medium"
          >
            {error}
          </div>
        )}
      </div>
    );
  }
);
AccessibleFormGroup.displayName = 'AccessibleFormGroup';

interface AccessibleLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  helpText?: string;
}

export const AccessibleLabel = forwardRef<HTMLLabelElement, AccessibleLabelProps>(
  ({ className, children, required, helpText, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label
          ref={ref}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            className
          )}
          {...props}
        >
          {children}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        {helpText && (
          <p className="text-xs text-muted-foreground">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);
AccessibleLabel.displayName = 'AccessibleLabel';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helpText?: string;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ className, type, error, helpText, id, ...props }, ref) => {
    const hasError = Boolean(error);
    const helpTextId = helpText ? `${id}-help` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    const describedBy = [helpTextId, errorId].filter(Boolean).join(' ');

    return (
      <div className="space-y-1">
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          id={id}
          aria-describedby={describedBy || undefined}
          aria-invalid={hasError}
          {...props}
        />
        {helpText && (
          <p id={helpTextId} className="text-xs text-muted-foreground">
            {helpText}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);
AccessibleInput.displayName = 'AccessibleInput';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  loadingText?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'default',
    loading = false,
    loadingText = 'Loading...',
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...(loading && { 'aria-describedby': `${props.id || 'button'}-loading` })}
        {...props}
      >
        {loading ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            <span className="sr-only">Loading, please wait</span>
            {loadingText}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
AccessibleButton.displayName = 'AccessibleButton';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {children}
    </a>
  );
};

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, active = true }) => {
  const trapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!active || !trapRef.current) return;

    const focusableElements = trapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [active]);

  return (
    <div ref={trapRef}>
      {children}
    </div>
  );
};

interface AnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export const LiveAnnouncement: React.FC<AnnouncementProps> = ({
  message,
  priority = 'polite'
}) => {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};