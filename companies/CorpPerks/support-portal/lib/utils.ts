import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, differenceInHours, differenceInMinutes } from 'date-fns';
import { TicketStatus, TicketPriority, TicketCategory, ChatStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDateTime(date: Date): string {
  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getSlaStatus(deadline: Date | undefined): 'breached' | 'at_risk' | 'healthy' | 'none' {
  if (!deadline) return 'none';

  const now = new Date();
  const hoursRemaining = differenceInHours(deadline, now);
  const minutesRemaining = differenceInMinutes(deadline, now);

  if (minutesRemaining < 0) return 'breached';
  if (hoursRemaining < 2) return 'at_risk';
  return 'healthy';
}

export function getSlaTimeRemaining(deadline: Date | undefined): string {
  if (!deadline) return 'No SLA';

  const now = new Date();
  const hoursRemaining = differenceInHours(deadline, now);
  const minutesRemaining = differenceInMinutes(deadline, now);

  if (minutesRemaining < 0) {
    const overdue = Math.abs(minutesRemaining);
    return `Overdue by ${formatDuration(overdue)}`;
  }

  if (hoursRemaining < 1) {
    return `${minutesRemaining}m remaining`;
  }

  return `${hoursRemaining}h ${minutesRemaining % 60}m remaining`;
}

export const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
  open: { label: 'Open', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  pending: { label: 'Pending', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  resolved: { label: 'Resolved', color: 'text-green-700', bgColor: 'bg-green-100' },
  closed: { label: 'Closed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export const priorityConfig: Record<TicketPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  medium: { label: 'Medium', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  high: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  urgent: { label: 'Urgent', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const categoryConfig: Record<TicketCategory, { label: string; icon: string }> = {
  hr_policy: { label: 'HR Policy', icon: '📋' },
  payroll: { label: 'Payroll', icon: '💰' },
  benefits: { label: 'Benefits', icon: '🏥' },
  leave: { label: 'Leave', icon: '📅' },
  onboarding: { label: 'Onboarding', icon: '👋' },
  performance: { label: 'Performance', icon: '📊' },
  other: { label: 'Other', icon: '📝' },
};

export const chatStatusConfig: Record<ChatStatus, { label: string; color: string }> = {
  online: { label: 'Online', color: 'bg-green-500' },
  offline: { label: 'Offline', color: 'bg-gray-400' },
  busy: { label: 'Busy', color: 'bg-red-500' },
};

export function generateTicketId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `TKT-${num}`;
}
