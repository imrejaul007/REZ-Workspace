// ==========================================
// CorpPerks Manager App - Design System
// ==========================================

export const Colors = {
  // Primary Colors (Manager Purple)
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',

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
  purple: '#8B5CF6',
  orange: '#F97316',
  pink: '#EC4899',

  // Chart Colors
  chartPrimary: '#8B5CF6',
  chartSecondary: '#6366F1',
  chartTertiary: '#A78BFA',
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

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Status Color Helpers
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'present':
    case 'approved':
    case 'active':
    case 'completed':
    case 'paid':
    case 'on-time':
      return Colors.success;
    case 'absent':
    case 'rejected':
    case 'cancelled':
    case 'overdue':
      return Colors.error;
    case 'late':
    case 'pending':
    case 'processing':
    case 'half-day':
    case 'in_progress':
      return Colors.warning;
    case 'wfh':
    case 'week-off':
    case 'holiday':
    case 'on_leave':
      return Colors.info;
    case 'probation':
    case 'inactive':
      return Colors.textMuted;
    default:
      return Colors.textMuted;
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'urgent':
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

export const getLeaveTypeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'sick':
      return Colors.error;
    case 'casual':
      return Colors.success;
    case 'earned':
      return Colors.primary;
    case 'wfh':
      return Colors.info;
    case 'parental':
      return Colors.pink;
    case 'bereavement':
      return Colors.textMuted;
    default:
      return Colors.textSecondary;
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
  IconSize,
  getStatusColor,
  getPriorityColor,
  getLeaveTypeColor,
  formatCurrency,
  formatDate,
  formatTime,
  getTimeOfDay,
  getDaysUntil,
  getProgressPercentage,
};
