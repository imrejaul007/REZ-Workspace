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
 * Calculate notice period in business days
 */
export function calculateNoticePeriod(endDate: Date, startDate?: Date): number {
  const end = new Date(endDate);
  const start = startDate ? new Date(startDate) : new Date();
  let businessDays = 0;
  const current = new Date(start);

  while (current < end) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) businessDays++;
  }

  return businessDays;
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
 * Get exit type label
 */
export function getExitTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    resignation: 'Resignation',
    termination: 'Termination',
    retirement: 'Retirement',
    contract_end: 'Contract End'
  };
  return labels[type] || type;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: '#3B82F6',
    pending: '#F59E0B',
    in_progress: '#8B5CF6',
    completed: '#22C55E',
    cancelled: '#6B7280',
    no_show: '#EF4444',
    not_started: '#9CA3AF',
    blocked: '#EF4444'
  };
  return colors[status] || '#9CA3AF';
}

/**
 * Analyze sentiment from text
 */
export function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'fantastic', 'wonderful', 'helpful', 'supportive', 'enjoyed', 'grateful'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'poor', 'disappointed', 'frustrated', 'difficult', 'unhappy', 'worst'];

  const lowerText = text.toLowerCase();
  let score = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score--;
  });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
