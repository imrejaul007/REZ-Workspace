'use client'

import { motion } from 'framer-motion'
import { ReactNode, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
  rounded?: boolean
  glow?: boolean
  children: ReactNode
}

export function EnhancedButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  rounded = false,
  glow = false,
  children,
  className = '',
  disabled,
  ...props
}: EnhancedButtonProps) {
  const baseClasses = `
    relative inline-flex items-center justify-center
    font-semibold tracking-wide
    transition-all duration-300 transform
    focus:outline-none focus:ring-4 focus:ring-opacity-50
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
    ${rounded ? 'rounded-full' : 'rounded-xl'}
  `

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
    xl: 'px-10 py-5 text-xl gap-3'
  }

  const variantClasses = {
    primary: `
      bg-primary-600 text-white
      hover:bg-primary-700 
      focus:ring-primary-500
      ${glow ? 'shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40' : ''}
    `,
    secondary: `
      bg-gray-100 text-gray-900
      dark:bg-gray-700 dark:text-gray-100
      hover:bg-gray-200 dark:hover:bg-gray-600
      focus:ring-gray-500
    `,
    success: `
      bg-success-600 text-white
      hover:bg-success-700
      focus:ring-success-500
      ${glow ? 'shadow-lg shadow-success-500/25 hover:shadow-xl hover:shadow-success-500/40' : ''}
    `,
    danger: `
      bg-danger-600 text-white
      hover:bg-danger-700
      focus:ring-danger-500
      ${glow ? 'shadow-lg shadow-danger-500/25 hover:shadow-xl hover:shadow-danger-500/40' : ''}
    `,
    ghost: `
      bg-transparent text-gray-700
      dark:text-gray-300
      hover:bg-gray-100 dark:hover:bg-gray-800
      focus:ring-gray-500
    `,
    gradient: `
      bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700
      text-white
      hover:from-primary-600 hover:via-primary-700 hover:to-primary-800
      focus:ring-primary-500
      ${glow ? 'shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40' : ''}
    `
  }

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute"
        >
          <Loader2 className="w-5 h-5" />
        </motion.div>
      )}
      
      <span className={`flex items-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {icon && iconPosition === 'left' && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {icon}
          </motion.span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {icon}
          </motion.span>
        )}
      </span>

      {variant === 'gradient' && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 opacity-0 hover:opacity-20"
          initial={false}
          animate={{ opacity: 0 }}
          whileHover={{ opacity: 0.2 }}
        />
      )}
    </motion.button>
  )
}

// Floating Action Button
export function FloatingActionButton({
  icon,
  onClick,
  position = 'bottom-right',
  color = 'primary'
}: {
  icon: ReactNode
  onClick: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  color?: 'primary' | 'success' | 'danger'
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  const colorClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30',
    success: 'bg-success-600 hover:bg-success-700 shadow-success-500/30',
    danger: 'bg-danger-600 hover:bg-danger-700 shadow-danger-500/30'
  }

  return (
    <motion.button
      className={`
        fixed ${positionClasses[position]} z-50
        w-14 h-14 rounded-full
        ${colorClasses[color]}
        text-white shadow-2xl
        flex items-center justify-center
        transition-all duration-300
      `}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {icon}
    </motion.button>
  )
}