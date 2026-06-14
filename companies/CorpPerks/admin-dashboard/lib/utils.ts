import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(
  amount: number,
  currency: string = 'INR'
): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Employee status
    active: 'bg-success-100 text-success-700',
    inactive: 'bg-gray-100 text-gray-700',
    on_leave: 'bg-warning-100 text-warning-700',
    probation: 'bg-primary-100 text-primary-700',
    terminated: 'bg-danger-100 text-danger-700',
    // Service status
    up: 'bg-success-100 text-success-700',
    down: 'bg-danger-100 text-danger-700',
    degraded: 'bg-warning-100 text-warning-700',
    // Health status
    healthy: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    critical: 'bg-danger-100 text-danger-700',
    // Goal status
    on_track: 'bg-success-100 text-success-700',
    at_risk: 'bg-warning-100 text-warning-700',
    off_track: 'bg-danger-100 text-danger-700',
    completed: 'bg-primary-100 text-primary-700',
    // Certification status
    valid: 'bg-success-100 text-success-700',
    expired: 'bg-danger-100 text-danger-700',
    expiring_soon: 'bg-warning-100 text-warning-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-success-500',
    inactive: 'bg-gray-400',
    on_leave: 'bg-warning-500',
    probation: 'bg-primary-500',
    terminated: 'bg-danger-500',
  };
  return colors[status] || 'bg-gray-400';
}

export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
