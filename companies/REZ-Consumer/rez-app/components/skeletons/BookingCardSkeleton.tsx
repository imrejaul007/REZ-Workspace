/**
 * BookingCardSkeleton - Skeleton for booking/appointment cards
 *
 * Used in:
 * - My Bookings tab
 * - Upcoming appointments list
 * - Reservation history
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { spacing, colors } from '@/constants/theme';

// eslint-disable-next-line react/display-name
export const BookingCardSkeleton = React.memo(() => (
  <View
    style={styles.container}
    accessible={true}
    accessibilityRole="none"
    accessibilityLabel="Loading booking card"
  >
    {/* Avatar and store name row */}
    <View style={styles.headerRow}>
      <SkeletonLoader
        width={56}
        height={56}
        borderRadius={28}
        variant="circle"
        style={styles.avatar}
      />
      <View style={styles.headerText}>
        <SkeletonLoader
          width="60%"
          height={16}
          borderRadius={4}
          style={styles.storeName}
        />
        <SkeletonLoader
          width="40%"
          height={13}
          borderRadius={4}
        />
      </View>
    </View>

    {/* Booking date/time */}
    <SkeletonLoader
      width="80%"
      height={13}
      borderRadius={4}
      style={styles.dateTime}
    />

    {/* Booking status */}
    <SkeletonLoader
      width="50%"
      height={13}
      borderRadius={4}
      style={styles.status}
    />
  </View>
));

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  avatar: {
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  storeName: {
    marginBottom: spacing.sm,
  },
  dateTime: {
    marginBottom: spacing.sm,
  },
  status: {
    marginBottom: 0,
  },
});

export default BookingCardSkeleton;
