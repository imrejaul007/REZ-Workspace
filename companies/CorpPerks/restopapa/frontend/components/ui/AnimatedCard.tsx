'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  gradient?: boolean
}

export function AnimatedCard({ 
  children, 
  className = '', 
  delay = 0,
  hover = true,
  gradient = false
}: AnimatedCardProps) {
  const baseClasses = `
    rounded-2xl p-6 
    ${gradient 
      ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' 
      : 'bg-white dark:bg-gray-800'
    }
    shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50
    border border-gray-100 dark:border-gray-700
    ${hover ? 'hover:shadow-2xl hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600' : ''}
    transition-all duration-300
  `

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={hover ? { 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : undefined}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedStatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = 'primary'
}: {
  title: string
  value: string | number
  icon: ReactNode
  trend?: 'up' | 'down'
  trendValue?: string
  color?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    danger: 'from-danger-500 to-danger-600'
  }

  return (
    <AnimatedCard hover gradient>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <motion.p 
            className="mt-2 text-3xl font-bold text-gray-900 dark:text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            {value}
          </motion.p>
          {trend && trendValue && (
            <motion.div 
              className="mt-2 flex items-center text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className={`
                ${trend === 'up' ? 'text-success-600' : 'text-danger-600'}
                flex items-center font-semibold
              `}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                vs last month
              </span>
            </motion.div>
          )}
        </div>
        <motion.div
          className={`
            p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]}
            text-white shadow-lg
          `}
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {icon}
        </motion.div>
      </div>
    </AnimatedCard>
  )
}