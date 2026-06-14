import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const generateId = (): string => uuidv4();

export const formatCurrency = (amount: number, currency: 'INR' | 'USD' = 'INR'): string => {
  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const calculateTotals = (items: { quantity: number; unitPrice: number; tax?: number }[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = items.reduce((sum, item) => sum + item.quantity * (item.tax || 0), 0);
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

export const parseFilters = <T extends z.ZodType>(
  schema: T,
  query: Record<string, unknown>
): z.infer<T> | { error: string } => {
  try {
    return schema.parse(query);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: err.errors.map((e) => e.message).join(', ') };
    }
    return { error: 'Invalid filters' };
  }
};

export const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getMonthRange = (months: number): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  return { start, end };
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDateTime = (date: Date): string => {
  return date.toISOString();
};

export const getDateRangeForPeriod = (period: string): { from: Date; to: Date } => {
  const to = new Date();
  const from = new Date();

  switch (period) {
    case 'week':
      from.setDate(from.getDate() - 7);
      break;
    case 'month':
      from.setMonth(from.getMonth() - 1);
      break;
    case 'quarter':
      from.setMonth(from.getMonth() - 3);
      break;
    case 'year':
      from.setFullYear(from.getFullYear() - 1);
      break;
    default:
      from.setMonth(from.getMonth() - 12);
  }

  return { from, to };
};
