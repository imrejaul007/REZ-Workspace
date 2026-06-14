/**
 * BookingCard Component - Displays salon booking information
 *
 * Features:
 * - Shows booking details (customer, service, time)
 * - Status badge with color coding
 * - Action buttons based on status
 * - Compact mode for lists
 */

import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { SalonBooking } from '@/services/api/salon';

interface BookingCardProps {
  booking: SalonBooking;
  onPress: () => void;
  onAction: (action: string) => void;
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  in_progress: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444',
  no_show: '#DC2626',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-Show',
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  compactCard: {
    padding: 12,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactCardHeader: {
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  serviceType: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  cardBody: {
    gap: 8,
  },
  compactCardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  compactInfoText: {
    fontSize: 13,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  durationBadge: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  compactActionRow: {
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactActionBtn: {
    paddingVertical: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  compactActionBtnText: {
    fontSize: 13,
  },
  secondaryActionBtn: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: 'transparent',
  },
  secondaryActionBtnText: {
    color: Colors.light.text,
  },
  warningContainer: {
    backgroundColor: Colors.light.warningLight,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    fontWeight: '500',
  },
});

export const BookingCard = React.memo(
  ({ booking, onPress, onAction, compact = false }: BookingCardProps) => {
    const statusColor = STATUS_COLORS[booking.status] || '#6B7280';

    const needsPatchTestWarning = useCallback((serviceType: string) => {
      const colourKeywords = ['colour', 'color', 'tint', 'bleach', 'highlight', 'balayage'];
      return colourKeywords.some((k) => serviceType?.toLowerCase().includes(k));
    }, []);

    const isAppointmentPassed = useCallback(() => {
      if (!booking.appointmentDate) return false;
      const apptTime = new Date(`${booking.appointmentDate}T${booking.appointmentTime}`);
      return apptTime < new Date();
    }, [booking.appointmentDate, booking.appointmentTime]);

    const actionButtons = useMemo(() => {
      switch (booking.status) {
        case 'pending':
          return (
            <View style={[styles.actionRow, compact && styles.compactActionRow]}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#3B82F6' }, compact && styles.compactActionBtn]}
                onPress={() => onAction('confirm')}
              >
                <ThemedText style={[styles.actionBtnText, compact && styles.compactActionBtnText]}>
                  Confirm
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.secondaryActionBtn, compact && styles.compactActionBtn]}
                onPress={() => onAction('cancel')}
              >
                <ThemedText style={[styles.actionBtnText, styles.secondaryActionBtnText]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            </View>
          );
        case 'confirmed':
          return (
            <View style={[styles.actionRow, compact && styles.compactActionRow]}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }, compact && styles.compactActionBtn]}
                onPress={() => onAction('start')}
              >
                <ThemedText style={[styles.actionBtnText, compact && styles.compactActionBtnText]}>
                  Start
                </ThemedText>
              </TouchableOpacity>
              {isAppointmentPassed() && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.secondaryActionBtn, compact && styles.compactActionBtn]}
                  onPress={() => onAction('no_show')}
                >
                  <ThemedText style={[styles.actionBtnText, styles.secondaryActionBtnText]}>
                    No-Show
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          );
        case 'in_progress':
          return (
            <View style={[styles.actionRow, compact && styles.compactActionRow]}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#10B981' }, compact && styles.compactActionBtn]}
                onPress={() => onAction('complete')}
              >
                <ThemedText style={[styles.actionBtnText, compact && styles.compactActionBtnText]}>
                  Complete
                </ThemedText>
              </TouchableOpacity>
            </View>
          );
        default:
          return null;
      }
    }, [booking.status, onAction, compact, isAppointmentPassed]);

    const cardStyle = compact ? [styles.card, styles.compactCard] : styles.card;
    const headerStyle = compact ? styles.compactCardHeader : undefined;
    const bodyStyle = compact ? [styles.cardBody, styles.compactCardBody] : styles.cardBody;

    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.cardHeader, headerStyle]}>
          <View style={styles.cardHeaderLeft}>
            <ThemedText style={styles.bookingNumber}>#{booking.appointmentNumber || booking._id.slice(-6)}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <ThemedText style={styles.statusText}>
                {STATUS_LABELS[booking.status] || booking.status}
              </ThemedText>
            </View>
          </View>
          {booking.serviceType && (
            <ThemedText style={styles.serviceType}>{booking.serviceType}</ThemedText>
          )}
        </View>

        <View style={bodyStyle}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={Colors.light.textSecondary} />
            <ThemedText style={[styles.infoText, compact && styles.compactInfoText]}>
              {booking.customerName}
            </ThemedText>
          </View>
          {booking.customerPhone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={Colors.light.textSecondary} />
              <ThemedText style={[styles.infoText, compact && styles.compactInfoText]}>
                {booking.customerPhone}
              </ThemedText>
            </View>
          )}
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
            <ThemedText style={[styles.timeText, compact && styles.compactInfoText]}>
              {booking.appointmentTime}
            </ThemedText>
            {booking.duration && (
              <View style={styles.durationBadge}>
                <ThemedText style={styles.durationText}>{booking.duration} min</ThemedText>
              </View>
            )}
          </View>
          {booking.staffName && (
            <View style={styles.infoRow}>
              <Ionicons name="cut-outline" size={16} color={Colors.light.textSecondary} />
              <ThemedText style={[styles.infoText, compact && styles.compactInfoText]}>
                Stylist: {booking.staffName}
              </ThemedText>
            </View>
          )}
        </View>

        {needsPatchTestWarning(booking.serviceType || '') && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning-outline" size={16} color="#92400E" />
            <ThemedText style={styles.warningText}>
              Patch test required - verify with client before service
            </ThemedText>
          </View>
        )}

        {actionButtons}
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.booking._id === nextProps.booking._id &&
      prevProps.booking.status === nextProps.booking.status &&
      prevProps.compact === nextProps.compact
    );
  }
);

BookingCard.displayName = 'BookingCard';
