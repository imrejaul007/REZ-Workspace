import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ride } from '../types';
import { formatDistance, formatDuration, formatCurrency, formatSmartDate, getRideStatusLabel, getRideStatusColor } from '../utils';
import Card from './Card';

interface RideCardProps {
  ride: Ride;
  onPress: () => void;
  variant?: 'compact' | 'full';
}

// Ride type icons
const getRideTypeIcon = (type: string): string => {
  switch (type) {
    case 'standard':
      return '🚕';
    case 'premium':
      return '🚙';
    case 'suv':
      return '🚐';
    case 'economy':
      return '🚗';
    case 'pool':
      return '👥';
    default:
      return '🚕';
  }
};

// Ride type names
const getRideTypeName = (type: string): string => {
  switch (type) {
    case 'standard':
      return 'Standard';
    case 'premium':
      return 'Premium';
    case 'suv':
      return 'SUV';
    case 'economy':
      return 'Economy';
    case 'pool':
      return 'Pool';
    default:
      return 'Ride';
  }
};

export const RideCard: React.FC<RideCardProps> = ({
  ride,
  onPress,
  variant = 'compact',
}) => {
  const isCompact = variant === 'compact';
  const statusColor = getRideStatusColor(ride.status);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeIcon}>{getRideTypeIcon(ride.rideType)}</Text>
              <Text style={styles.typeName}>{getRideTypeName(ride.rideType)}</Text>
            </View>
            <Text style={styles.bookingId}>{ride.bookingId}</Text>
            <Text style={styles.time}>
              {formatSmartDate(ride.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getRideStatusLabel(ride.status)}
            </Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={[styles.dot, { backgroundColor: '#007AFF' }]} />
            <View style={[styles.routeLine, { backgroundColor: '#E5E5EA' }]} />
            <View style={[styles.dot, { backgroundColor: '#34C759' }]} />
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.routeLocation}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationName} numberOfLines={1}>
                {ride.pickupLocation.address}
              </Text>
            </View>
            <View style={styles.routeLocation}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.locationName} numberOfLines={1}>
                {ride.dropoffLocation.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDistance(ride.distance)}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDuration(ride.duration)}</Text>
              <Text style={styles.statLabel}>Est. Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValueEarnings}>
                {formatCurrency(ride.estimatedEarnings)}
              </Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>

          {!isCompact && (
            <View style={styles.passengerInfo}>
              {ride.passengerCount && ride.passengerCount > 0 && (
                <Text style={styles.passengerText}>
                  {ride.passengerCount} passenger{ride.passengerCount > 1 ? 's' : ''}
                </Text>
              )}
              {ride.flightNumber && (
                <Text style={styles.flightText}>
                  Flight: {ride.flightNumber}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Surge indicator */}
        {ride.surgeMultiplier && ride.surgeMultiplier > 1 && (
          <View style={styles.surgeBadge}>
            <Text style={styles.surgeText}>
              Surge {ride.surgeMultiplier.toFixed(1)}x
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  typeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFC107',
  },
  bookingId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routePoint: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  routeLocation: {
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statValueEarnings: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34C759',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  },
  passengerInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passengerText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  flightText: {
    fontSize: 13,
    color: '#007AFF',
  },
  surgeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFC10715',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  surgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFC107',
  },
});

export default RideCard;
