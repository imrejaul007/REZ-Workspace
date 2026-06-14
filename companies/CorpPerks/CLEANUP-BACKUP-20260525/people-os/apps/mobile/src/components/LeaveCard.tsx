import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/config';
import { LeaveRequest } from '../types';
import { format } from 'date-fns';

interface LeaveCardProps {
  request: LeaveRequest;
  onPress?: () => void;
}

const getStatusColor = (status: LeaveRequest['status']) => {
  switch (status) {
    case 'approved': return COLORS.success;
    case 'rejected': return COLORS.error;
    case 'submitted': return COLORS.warning;
    default: return COLORS.textMuted;
  }
};

const getLeaveTypeLabel = (type: LeaveRequest['leaveType']) => {
  const labels: Record<string, string> = {
    annual: 'Annual Leave',
    sick: 'Sick Leave',
    casual: 'Casual Leave',
    unpaid: 'Unpaid Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    bereavement: 'Bereavement Leave',
  };
  return labels[type] || type;
};

export const LeaveCard: React.FC<LeaveCardProps> = ({ request, onPress }) => {
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={styles.type}>{getLeaveTypeLabel(request.leaveType)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.requestNumber}>{request.requestNumber}</Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.dateLabel}>Duration</Text>
        <Text style={styles.dateValue}>
          {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.days}>{request.totalDays} {request.totalDays === 1 ? 'day' : 'days'}</Text>
        {request.isHalfDay && (
          <View style={styles.halfDayBadge}>
            <Text style={styles.halfDayText}>Half Day</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    marginBottom: SPACING.md,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  type: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  requestNumber: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  dateContainer: {
    marginBottom: SPACING.md,
  },
  dateLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  dateValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  days: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  halfDayBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  halfDayText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default LeaveCard;
