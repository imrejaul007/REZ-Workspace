/**
 * KDS Mobile Utility Functions
 */

import { format, formatDistanceToNow, differenceInSeconds, parseISO } from 'date-fns';
import { OrderPriority, OrderStatus, KitchenStation, ItemStatus } from '../types';
import { PRIORITY_COLORS, STATUS_COLORS, STATION_COLORS, TIMER_THRESHOLDS } from './constants';

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format time elapsed since order was placed
 */
export function formatTimeElapsed(dateString: string): string {
  const date = parseISO(dateString);
  return formatDistanceToNow(date, { addSuffix: false });
}

/**
 * Get elapsed seconds since order
 */
export function getElapsedSeconds(dateString: string): number {
  const date = parseISO(dateString);
  return differenceInSeconds(new Date(), date);
}

/**
 * Get timer color based on elapsed time
 */
export function getTimerColor(elapsedSeconds: number): string {
  if (elapsedSeconds >= TIMER_THRESHOLDS.CRITICAL) {
    return '#F44336'; // Red
  }
  if (elapsedSeconds >= TIMER_THRESHOLDS.WARNING) {
    return '#FF9800'; // Orange
  }
  if (elapsedSeconds >= TIMER_THRESHOLDS.NORMAL) {
    return '#FFC107'; // Yellow
  }
  return '#4CAF50'; // Green
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: OrderPriority): string {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS[OrderPriority.NORMAL];
}

/**
 * Get status color
 */
export function getStatusColor(status: OrderStatus): string {
  return STATUS_COLORS[status] || STATUS_COLORS[OrderStatus.PENDING];
}

/**
 * Get station color
 */
export function getStationColor(station: KitchenStation): string {
  return STATION_COLORS[station] || STATION_COLORS[KitchenStation.ALL];
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: OrderPriority): string {
  const labels: Record<OrderPriority, string> = {
    [OrderPriority.LOW]: 'Low',
    [OrderPriority.NORMAL]: 'Normal',
    [OrderPriority.HIGH]: 'High',
    [OrderPriority.URGENT]: 'Urgent',
  };
  return labels[priority] || 'Normal';
}

/**
 * Get status label
 */
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Pending',
    [OrderStatus.ACKNOWLEDGED]: 'Acknowledged',
    [OrderStatus.IN_PROGRESS]: 'In Progress',
    [OrderStatus.READY]: 'Ready',
    [OrderStatus.COMPLETED]: 'Completed',
    [OrderStatus.CANCELLED]: 'Cancelled',
  };
  return labels[status] || 'Unknown';
}

/**
 * Get station label
 */
export function getStationLabel(station: KitchenStation): string {
  const labels: Record<KitchenStation, string> = {
    [KitchenStation.GRILL]: 'Grill',
    [KitchenStation.FRY]: 'Fry',
    [KitchenStation.SALAD]: 'Salad',
    [KitchenStation.DESSERT]: 'Dessert',
    [KitchenStation.BEVERAGE]: 'Beverage',
    [KitchenStation.APPETIZER]: 'Appetizer',
    [KitchenStation.MAIN]: 'Main Kitchen',
    [KitchenStation.ALL]: 'All Stations',
  };
  return labels[station] || 'Unknown';
}

/**
 * Get item status label
 */
export function getItemStatusLabel(status: ItemStatus): string {
  const labels: Record<ItemStatus, string> = {
    [ItemStatus.PENDING]: 'Pending',
    [ItemStatus.PREPARING]: 'Preparing',
    [ItemStatus.DONE]: 'Done',
    [ItemStatus.CANCELLED]: 'Cancelled',
    [ItemStatus.SUBSTITUTED]: 'Substituted',
  };
  return labels[status] || 'Unknown';
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, formatStr = 'MMM dd, yyyy'): string {
  return format(parseISO(dateString), formatStr);
}

/**
 * Format time for display
 */
export function formatTime(dateString: string, formatStr = 'HH:mm'): string {
  return format(parseISO(dateString), formatStr);
}

/**
 * Format date and time
 */
export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), 'MMM dd, HH:mm');
}

/**
 * Get order summary text
 */
export function getOrderSummary(items: Array<{ name: string; quantity: number }>): string {
  if (items.length === 0) return '';
  if (items.length === 1) {
    return `${items[0].quantity}x ${items[0].name}`;
  }
  if (items.length === 2) {
    return `${items[0].quantity}x ${items[0].name}, ${items[1].quantity}x ${items[1].name}`;
  }
  const first = items[0];
  return `${first.quantity}x ${first.name} + ${items.length - 1} more items`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate order display number
 */
export function generateDisplayNumber(orderNumber: string, source: string): string {
  const prefix = source.charAt(0).toUpperCase();
  return `${prefix}${orderNumber}`;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Calculate estimated ready time
 */
export function calculateEstimatedReadyTime(
  createdAt: string,
  cookingTimeMinutes?: number
): string {
  const baseTime = cookingTimeMinutes || 15; // Default 15 minutes
  const date = parseISO(createdAt);
  date.setMinutes(date.getMinutes() + baseTime);
  return format(date, 'HH:mm');
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Group orders by status
 */
export function groupOrdersByStatus<T extends { status: OrderStatus }>(
  orders: T[]
): Record<OrderStatus, T[]> {
  return orders.reduce(
    (acc, order) => {
      if (!acc[order.status]) {
        acc[order.status] = [];
      }
      acc[order.status].push(order);
      return acc;
    },
    {} as Record<OrderStatus, T[]>
  );
}

/**
 * Filter orders by station
 */
export function filterOrdersByStation<T extends { station: KitchenStation | KitchenStation[] }>(
  orders: T[],
  station: KitchenStation
): T[] {
  return orders.filter((order) => {
    if (Array.isArray(order.station)) {
      return order.station.includes(station);
    }
    return order.station === station || order.station === KitchenStation.ALL;
  });
}

/**
 * Sort orders by priority and time
 */
export function sortOrders<T extends { priority: OrderPriority; createdAt: string }>(
  orders: T[],
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  const priorityOrder: Record<OrderPriority, number> = {
    [OrderPriority.URGENT]: 4,
    [OrderPriority.HIGH]: 3,
    [OrderPriority.NORMAL]: 2,
    [OrderPriority.LOW]: 1,
  };

  return [...orders].sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return direction === 'desc' ? priorityDiff : -priorityDiff;

    // Then by time (newer first by default)
    const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return direction === 'desc' ? timeDiff : -timeDiff;
  });
}

/**
 * Validate order can be bumped
 */
export function canBumpOrder(status: OrderStatus): boolean {
  return [
    OrderStatus.ACKNOWLEDGED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.READY,
  ].includes(status);
}

/**
 * Get next status for order bump
 */
export function getNextBumpStatus(currentStatus: OrderStatus): OrderStatus | null {
  const bumpFlow: Partial<Record<OrderStatus, OrderStatus>> = {
    [OrderStatus.PENDING]: OrderStatus.ACKNOWLEDGED,
    [OrderStatus.ACKNOWLEDGED]: OrderStatus.IN_PROGRESS,
    [OrderStatus.IN_PROGRESS]: OrderStatus.READY,
    [OrderStatus.READY]: OrderStatus.COMPLETED,
  };
  return bumpFlow[currentStatus] || null;
}
