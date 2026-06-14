import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to readable string
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Deep clone an object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Check if two arrays are equal
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

// Get workflow status color
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    draft: {
      bg: 'bg-gray-500/10',
      text: 'text-gray-400',
      border: 'border-gray-500/50',
    },
    active: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/50',
    },
    paused: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/50',
    },
    archived: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/50',
    },
  };
  return colors[status] || colors.draft;
}

// Validate workflow structure
export function validateWorkflow(workflow: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check metadata
  if (!workflow.metadata?.name) {
    errors.push('Workflow name is required');
  }

  // Check nodes exist
  if (!workflow.nodes || workflow.nodes.length === 0) {
    errors.push('Workflow must have at least one node');
  }

  // Check for trigger node
  const hasTrigger = workflow.nodes?.some((n: any) => n.type === 'trigger');
  if (!hasTrigger) {
    errors.push('Workflow must have at least one trigger node');
  }

  // Check for orphaned nodes (not connected)
  const connectedNodeIds = new Set<string>();
  workflow.edges?.forEach((edge: any) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  workflow.nodes?.forEach((node: any) => {
    if (node.type !== 'trigger' && !connectedNodeIds.has(node.id)) {
      errors.push(`Node "${node.data?.label || node.id}" is not connected`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export workflow as JSON file
export function exportWorkflow(workflow: any, filename?: string): void {
  const json = JSON.stringify(workflow, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${workflow.metadata?.name || 'workflow'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Keyboard shortcut helper
export function isShortcut(
  event: KeyboardEvent,
  key: string,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
): boolean {
  const { ctrl = false, shift = false, alt = false } = options;

  const ctrlMatch = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
  const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
  const altMatch = alt ? event.altKey : !event.altKey;

  return (
    event.key.toLowerCase() === key.toLowerCase() &&
    ctrlMatch &&
    shiftMatch &&
    altMatch
  );
}