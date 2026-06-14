import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Project status
    planning: 'bg-blue-100 text-blue-700 border-blue-200',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
    review: 'bg-purple-100 text-purple-700 border-purple-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    paused: 'bg-gray-100 text-gray-700 border-gray-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    // Invoice status
    paid: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    overdue: 'bg-red-100 text-red-700 border-red-200',
    // Milestone status
    active: 'bg-amber-100 text-amber-700 border-amber-200',
    delayed: 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    planning: 'bg-blue-500',
    in_progress: 'bg-amber-500',
    review: 'bg-purple-500',
    completed: 'bg-green-500',
    active: 'bg-amber-500',
    delayed: 'bg-red-500',
    paid: 'bg-green-500',
    pending: 'bg-amber-500',
    overdue: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
