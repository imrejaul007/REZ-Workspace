import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';

export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr);
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
};

export const formatISO = (date: Date | string): string => {
  return formatDate(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
};

export const getStartOfDay = (date: Date = new Date()): Date => startOfDay(date);

export const getEndOfDay = (date: Date = new Date()): Date => endOfDay(date);

export const getStartOfWeek = (date: Date = new Date()): Date => startOfWeek(date, { weekStartsOn: 1 });

export const getEndOfWeek = (date: Date = new Date()): Date => endOfWeek(date, { weekStartsOn: 1 });

export const getStartOfMonth = (date: Date = new Date()): Date => startOfMonth(date);

export const getEndOfMonth = (date: Date = new Date()): Date => endOfMonth(date);

export const addDaysToDate = (date: Date, days: number): Date => addDays(date, days);

export const subtractDaysFromDate = (date: Date, days: number): Date => subDays(date, days);

export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
};

export const getTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

export const toUTC = (date: Date): Date => {
  return new Date(date.toISOString());
};

export const fromUTC = (date: Date): Date => {
  return new Date(date);
};
