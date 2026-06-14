// ==========================================
// CorpPerks Client App - Design System
// ==========================================

export const Colors = {
  // Primary Colors (Client Teal)
  primary: '#14B8A6',
  primaryLight: '#5EEAD4',
  primaryDark: '#0D9488',

  // Secondary Colors
  secondary: '#6366F1',
  secondaryLight: '#818CF8',
  secondaryDark: '#4F46E5',

  // Status Colors
  success: '#22C55E',
  successLight: '#4ADE80',
  successDark: '#16A34A',

  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',

  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',

  // Background Colors
  background: '#F8FAFC',
  backgroundDark: '#F1F5F9',
  card: '#FFFFFF',

  // Text Colors
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Border Colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Special Colors
  info: '#3B82F6',
  teal: '#14B8A6',
  purple: '#8B5CF6',
  orange: '#F97316',
  pink: '#EC4899',

  // Chart Colors
  chartPrimary: '#14B8A6',
  chartSecondary: '#6366F1',
  chartTertiary: '#5EEAD4',
  chartSuccess: '#22C55E',
  chartWarning: '#F59E0B',
  chartDanger: '#EF4444',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Status Color Helpers
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'in_progress':
    case 'completed':
    case 'paid':
    case 'on_track':
      return Colors.success;
    case 'on_hold':
    case 'pending':
    case 'processing':
    case 'review':
      return Colors.warning;
    case 'cancelled':
    case 'overdue':
    case 'rejected':
    case 'failed':
      return Colors.error;
    case 'draft':
    case 'inactive':
      return Colors.textMuted;
    case 'approved':
    case 'verified':
      return Colors.primary;
    default:
      return Colors.textMuted;
  }
};

export const getProjectStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
      return Colors.success;
    case 'in_progress':
      return Colors.primary;
    case 'review':
      return Colors.warning;
    case 'completed':
      return Colors.success;
    case 'on_hold':
      return Colors.warning;
    case 'cancelled':
      return Colors.error;
    default:
      return Colors.textMuted;
  }
};

export const getInvoiceStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'settled':
      return Colors.success;
    case 'sent':
    case 'pending':
      return Colors.warning;
    case 'overdue':
    case 'past_due':
      return Colors.error;
    case 'draft':
    case 'cancelled':
      return Colors.textMuted;
    default:
      return Colors.textMuted;
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'urgent':
    case 'critical':
      return Colors.error;
    case 'high':
      return Colors.warning;
    case 'medium':
      return Colors.secondary;
    case 'low':
      return Colors.textMuted;
    default:
      return Colors.textMuted;
  }
};

// Format Helpers
export const formatCurrency = (amount: number, decimals = 0): string => {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const formatDate = (
  dateString: string,
  format: 'short' | 'long' | 'relative' | 'time' = 'short'
): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (format === 'relative') {
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        if (minutes === 0) return 'Just now';
        return `${minutes}m ago`;
      }
      return `${hours}h ago`;
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  }

  if (format === 'long') {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (format === 'time') {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (timeString: string): string => {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const getDaysUntil = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const getProgressPercentage = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

// Export all
export default {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
  getStatusColor,
  getProjectStatusColor,
  getInvoiceStatusColor,
  getPriorityColor,
  formatCurrency,
  formatDate,
  formatTime,
  getTimeOfDay,
  getDaysUntil,
  getProgressPercentage,
};
