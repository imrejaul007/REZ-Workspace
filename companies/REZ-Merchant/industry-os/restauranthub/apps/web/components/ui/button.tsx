import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0',
        destructive:
          'bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive/80 text-destructive-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        outline:
          'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:-translate-y-0.5 shadow-sm hover:shadow-md',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md hover:-translate-y-0.5',
        ghost:
          'hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5',
        link:
          'text-primary underline-offset-4 hover:underline',
        success:
          'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        warning:
          'bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        gradient:
          'bg-gradient-to-r from-primary via-brand-500 to-brand-600 hover:from-primary/90 hover:via-brand-500/90 hover:to-brand-600/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0',
        glass:
          'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
      },
      size: {
        sm: 'h-9 px-4 py-2 text-xs rounded-lg',
        default: 'h-11 px-6 py-2.5',
        lg: 'h-12 px-8 py-3 text-base',
        xl: 'h-14 px-10 py-4 text-lg rounded-2xl',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9 rounded-lg',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    disabled,
    children,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && 'cursor-not-allowed'
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="mr-2 flex-shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="ml-2 flex-shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };