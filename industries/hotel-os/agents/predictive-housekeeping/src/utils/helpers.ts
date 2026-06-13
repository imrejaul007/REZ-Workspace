import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique twin ID
 */
export function generateTwinId(type: 'guest' | 'room' | 'property' | 'staff', id: string): string {
  return `twin.hotel.${type}.${id}`;
}

/**
 * Generate a unique task ID
 */
export function generateTaskId(): string {
  return `task.${uuidv4()}`;
}

/**
 * Generate a unique schedule ID
 */
export function generateScheduleId(): string {
  return `schedule.${uuidv4()}`;
}

/**
 * Generate a unique staff ID
 */
export function generateStaffId(): string {
  return `staff.${uuidv4()}`;
}

/**
 * Parse twin ID to extract type and original ID
 */
export function parseTwinId(twinId: string): { type: string; id: string } | null {
  const match = twinId.match(/^twin\.hotel\.(\w+)\.(.+)$/);
  if (!match) return null;
  return { type: match[1], id: match[2] };
}

/**
 * Calculate estimated cleaning duration based on room type and task type
 */
export function calculateCleaningDuration(
  roomType: 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'accessible',
  taskType: 'checkout' | 'turndown' | 'daily' | 'deep_clean' | 'maintenance'
): number {
  const baseDurations: Record<string, number> = {
    standard: 20,
    deluxe: 25,
    suite: 35,
    penthouse: 45,
    accessible: 25,
  };

  const taskMultipliers: Record<string, number> = {
    checkout: 1.2,
    turndown: 0.5,
    daily: 1.0,
    deep_clean: 1.5,
    maintenance: 0.8,
  };

  const base = baseDurations[roomType] || 25;
  const multiplier = taskMultipliers[taskType] || 1.0;

  return Math.ceil(base * multiplier);
}

/**
 * Calculate efficiency score based on tasks completed and time used
 */
export function calculateEfficiencyScore(
  completedTasks: number,
  totalTasks: number,
  usedTimeMinutes: number,
  availableTimeMinutes: number
): number {
  if (totalTasks === 0) return 100;

  const completionRate = completedTasks / totalTasks;
  const timeEfficiency = Math.min(1, availableTimeMinutes / usedTimeMinutes);

  return Math.round((completionRate * 0.7 + timeEfficiency * 0.3) * 100);
}

/**
 * Determine priority based on room status and checkout time
 */
export function determineTaskPriority(
  status: string,
  checkoutTime?: string,
  isHighValueGuest: boolean = false
): 'high' | 'medium' | 'low' {
  if (isHighValueGuest) return 'high';

  switch (status) {
    case 'checkout':
      return 'high';
    case 'out_of_order':
      return 'high';
    case 'occupied':
      return 'low';
    default:
      if (checkoutTime) {
        const now = new Date();
        const checkout = new Date(checkoutTime);
        const hoursUntilCheckout = (checkout.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilCheckout <= 2) return 'high';
        if (hoursUntilCheckout <= 4) return 'medium';
      }
      return 'medium';
  }
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const totalMinutes = parseTimeToMinutes(time) + minutesToAdd;
  return minutesToTimeString(totalMinutes);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Get start of day for a given date
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day for a given date
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate confidence score based on data availability
 */
export function calculateConfidenceScore(
  historicalDataPoints: number,
  totalExpected: number
): number {
  if (totalExpected === 0) return 50;

  const coverage = historicalDataPoints / totalExpected;
  const confidence = Math.min(100, Math.round(coverage * 100));

  return confidence;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}