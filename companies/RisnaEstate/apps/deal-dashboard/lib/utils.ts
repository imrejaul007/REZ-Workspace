import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DealStage } from './api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
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

export const STAGE_CONFIG: Record<DealStage, { label: string; color: string; bgColor: string }> = {
  inquiry: { label: 'Inquiry', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  site_visit: { label: 'Site Visit', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  offer: { label: 'Offer', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  negotiation: { label: 'Negotiation', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  agreement: { label: 'Agreement', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  registry: { label: 'Registry', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  closed: { label: 'Closed', color: 'text-green-600', bgColor: 'bg-green-100' },
};

export const STAGE_ORDER: DealStage[] = [
  'inquiry',
  'site_visit',
  'offer',
  'negotiation',
  'agreement',
  'registry',
  'closed',
];

export function getStageConfig(stage: DealStage) {
  return STAGE_CONFIG[stage] || { label: stage, color: 'text-gray-600', bgColor: 'bg-gray-100' };
}

export function getNextStage(current: DealStage): DealStage | null {
  const currentIndex = STAGE_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[currentIndex + 1];
}

export function getPreviousStage(current: DealStage): DealStage | null {
  const currentIndex = STAGE_ORDER.indexOf(current);
  if (currentIndex <= 0) return null;
  return STAGE_ORDER[currentIndex - 1];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}
