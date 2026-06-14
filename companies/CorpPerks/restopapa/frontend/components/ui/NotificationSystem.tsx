'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, InfoIcon, XCircle, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationSystemProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function NotificationSystem({ 
  notifications, 
  onDismiss,
  position = 'top-right' 
}: NotificationSystemProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-4 max-w-sm w-full`}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function NotificationItem({ 
  notification, 
  onDismiss 
}: { 
  notification: Notification
  onDismiss: () => void 
}) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!notification.duration) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          onDismiss()
          return 0
        }
        return prev - (100 / (notification.duration! / 100))
      })
    }, 100)

    return () => clearInterval(interval)
  }, [notification.duration, onDismiss])

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <InfoIcon className="w-5 h-5" />
  }

  const colors = {
    success: 'bg-success-50 text-success-800 border-success-200',
    error: 'bg-danger-50 text-danger-800 border-danger-200',
    warning: 'bg-warning-50 text-warning-800 border-warning-200',
    info: 'bg-primary-50 text-primary-800 border-primary-200'
  }

  const progressColors = {
    success: 'bg-success-500',
    error: 'bg-danger-500',
    warning: 'bg-warning-500',
    info: 'bg-primary-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`
        relative overflow-hidden rounded-xl shadow-lg
        ${colors[notification.type]}
        border backdrop-blur-sm
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[notification.type]}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-semibold">
              {notification.title}
            </p>
            {notification.message && (
              <p className="mt-1 text-sm opacity-90">
                {notification.message}
              </p>
            )}
            {notification.action && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={notification.action.onClick}
                className="mt-2 text-sm font-semibold underline"
              >
                {notification.action.label}
              </motion.button>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDismiss}
            className="ml-4 flex-shrink-0 rounded-lg p-1 hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      
      {notification.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <motion.div
            className={`h-full ${progressColors[notification.type]}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}
    </motion.div>
  )
}

// Notification Bell with Badge
export function NotificationBell({ 
  count, 
  onClick 
}: { 
  count: number
  onClick: () => void 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </motion.button>
  )
}