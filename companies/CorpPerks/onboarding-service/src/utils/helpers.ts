import { randomBytes } from 'crypto';

/**
 * Generate a unique ID with prefix
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString('hex');
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Calculate business days between two dates
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Get days remaining until target date
 */
export function getDaysRemaining(targetDate: Date): number {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    not_started: '#9CA3AF',
    pending: '#F59E0B',
    in_progress: '#3B82F6',
    blocked: '#EF4444',
    completed: '#22C55E',
    skipped: '#6B7280',
    cancelled: '#991B1B'
  };
  return colors[status] || '#9CA3AF';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Paginate array
 */
export function paginate<T>(items: T[], page: number, limit: number): {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginatedItems = items.slice(start, start + limit);

  return {
    items: paginatedItems,
    total,
    page,
    limit,
    totalPages
  };
}
