import * as React from "react"
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-xl border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      size: {
        sm: "h-9 px-3 py-2 text-xs rounded-lg",
        default: "h-12 px-4 py-3 text-sm",
        lg: "h-14 px-5 py-4 text-base",
      },
      variant: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-success-500 focus-visible:ring-success-500",
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, variant, leftIcon, rightIcon, error, success, ...props }, ref) => {
    const computedVariant = error ? 'error' : success ? 'success' : variant;

    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ size, variant: computedVariant }),
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ size, variant: computedVariant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }