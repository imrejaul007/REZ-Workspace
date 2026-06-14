import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input, InputProps } from './input'
import { Label } from './label'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export interface FormFieldProps extends Omit<InputProps, 'error' | 'success'> {
  label?: string
  description?: string
  error?: string
  success?: string
  required?: boolean
  showErrorIcon?: boolean
  showSuccessIcon?: boolean
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({
    className,
    label,
    description,
    error,
    success,
    required,
    showErrorIcon = true,
    showSuccessIcon = true,
    id,
    ...props
  }, ref) => {
    const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error
    const hasSuccess = !!success && !hasError

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium leading-6',
              hasError && 'text-destructive',
              hasSuccess && 'text-success-700'
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}

        {description && !hasError && !hasSuccess && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        <div className="relative">
          <Input
            ref={ref}
            id={fieldId}
            error={hasError}
            success={hasSuccess}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${fieldId}-error` :
              hasSuccess ? `${fieldId}-success` :
              description ? `${fieldId}-description` : undefined
            }
            rightIcon={
              hasError && showErrorIcon ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : hasSuccess && showSuccessIcon ? (
                <CheckCircle2 className="h-4 w-4 text-success-500" />
              ) : props.rightIcon
            }
            {...props}
          />
        </div>

        {hasError && (
          <div
            id={`${fieldId}-error`}
            className="flex items-center space-x-2 text-sm text-destructive animate-fade-in-up"
          >
            {showErrorIcon && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            <span>{error}</span>
          </div>
        )}

        {hasSuccess && (
          <div
            id={`${fieldId}-success`}
            className="flex items-center space-x-2 text-sm text-success-700 animate-fade-in-up"
          >
            {showSuccessIcon && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
            <span>{success}</span>
          </div>
        )}

        {description && (hasError || hasSuccess) && (
          <p id={`${fieldId}-description`} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export { FormField }