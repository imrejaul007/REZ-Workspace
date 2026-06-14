import { v4 as uuidv4 } from 'uuid';
import crypto, { randomInt } from 'crypto';

export function generateId(): string {
  return uuidv4();
}

export function generateShortId(): string {
  return crypto.randomBytes(6).toString('hex');
}

export function parseTemplate(
  template: string,
  variables: Record<string, string | number | boolean | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === null || value === undefined) {
      return match;
    }
    return String(value);
  });
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // E.164 format validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');
  if (!normalized.startsWith('+') && normalized.length > 10) {
    normalized = '+' + normalized;
  }
  return normalized;
}

export function calculateDelayMs(delayMinutes?: number, delayHours?: number, delayDays?: number): number {
  const minutes = delayMinutes || 0;
  const hours = delayHours || 0;
  const days = delayDays || 0;
  return (minutes * 60 * 1000) + (hours * 60 * 60 * 1000) + (days * 24 * 60 * 60 * 1000);
}

export function addDelayToDate(date: Date, delayMinutes?: number, delayHours?: number, delayDays?: number): Date {
  const delayMs = calculateDelayMs(delayMinutes, delayHours, delayDays);
  return new Date(date.getTime() + delayMs);
}

export function isScheduledTimeValid(scheduledTime: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(scheduledTime);
}

export function getNextScheduledTime(scheduledTime: string, fromDate: Date = new Date()): Date {
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const scheduled = new Date(fromDate);
  scheduled.setHours(hours, minutes, 0, 0);

  if (scheduled <= fromDate) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled;
}

export function generateUnsubscribeToken(email: string, channel: string): string {
  const data = `${email}:${channel}:${process.env.APP_SECRET || 'default-secret'}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

export function validateUnsubscribeToken(token: string, email: string, channel: string): boolean {
  const expectedToken = generateUnsubscribeToken(email, channel);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

export function formatPhoneForTwilio(phone: string): string {
  let formatted = phone.replace(/[^\d+]/g, '');
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  return formatted;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}

export function randomInRange(min: number, max: number): number {
  return randomInt(min, max);
}

export function shouldIncludeInSample(sampleSize: number): boolean {
  // Use crypto for boolean randomness
  const bytes = Buffer.alloc(1);
  crypto.randomFillSync(bytes);
  return (bytes[0] / 255) < sampleSize;
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: '#22c55e',
    paused: '#f59e0b',
    completed: '#3b82f6',
    draft: '#6b7280',
    archived: '#9ca3af',
    failed: '#ef4444',
    sent: '#22c55e',
    delivered: '#3b82f6',
    pending: '#f59e0b',
  };
  return colors[status] || '#6b7280';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'token'): string {
  switch (type) {
    case 'email': {
      const [local, domain] = data.split('@');
      if (!domain) return '***';
      const maskedLocal = local.substring(0, 2) + '***';
      return `${maskedLocal}@${domain}`;
    }
    case 'phone': {
      return data.substring(0, 3) + '***' + data.substring(data.length - 3);
    }
    case 'token': {
      return data.substring(0, 8) + '***';
    }
    default:
      return '***';
  }
}
