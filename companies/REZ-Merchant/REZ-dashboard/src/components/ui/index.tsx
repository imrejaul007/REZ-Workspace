// Simple UI components to fix missing imports
import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
}

const badgeStyles = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700'
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const buttonStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  ghost: 'text-gray-600 hover:bg-gray-100'
}

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyles[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
}

export function Tabs({ defaultValue, children }: TabsProps) {
  return <div data-state={defaultValue}>{children}</div>
}

export function TabsList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      data-state="active"
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:shadow-sm ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  return <div data-state={value}>{children}</div>
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-4 bg-gray-200 rounded animate-pulse ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 space-y-4 ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
      <SkeletonText lines={2} />
      <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
    </div>
  )
}

export function Progress({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
