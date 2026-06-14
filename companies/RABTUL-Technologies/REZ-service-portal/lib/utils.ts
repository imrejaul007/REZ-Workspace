import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUptime(uptime: number): string {
  return `${uptime.toFixed(2)}%`;
}

export function formatResponseTime(ms: number): string {
  return `${ms}ms`;
}

export function formatRequestsPerMinute(rpm: number): string {
  if (rpm >= 1000) {
    return `${(rpm / 1000).toFixed(1)}k`;
  }
  return rpm.toString();
}

export function formatErrorRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    infrastructure: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    payments: 'bg-green-500/20 text-green-400 border-green-500/30',
    identity: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    analytics: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    commerce: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    marketing: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    media: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    intelligence: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    support: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  };
  return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export function getCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
