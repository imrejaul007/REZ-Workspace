import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Delivery, DeliveryType } from '../types';
import { formatDistance, formatDuration, formatCurrency, formatSmartDate, getDeliveryTypeColor, getDeliveryTypeName } from '../utils';
import Card from './Card';
import StatusBadge from './StatusBadge';

interface DeliveryCardProps {
  delivery: Delivery;
  onPress: () => void;
  variant?: 'compact' | 'full';
}

// Delivery type icons (using text symbols as fallback)
const getDeliveryTypeIcon = (type: DeliveryType): string => {
  switch (type) {
    case 'food':
      return '🍔';
    case 'grocery':
      return '🛒';
    case 'medicine':
      return '💊';
    case 'courier':
      return '📦';
    case 'furniture':
      return '🪑';
    case 'cab':
      return '🚕';
    case 'ride_share':
      return '🚗';
    default:
      return '📦';
  }
};

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  onPress,
  variant = 'compact',
}) => {
  const isCompact = variant === 'compact';
  const typeColor = getDeliveryTypeColor(delivery.deliveryType);
  const typeName = getDeliveryTypeName(delivery.deliveryType);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeIcon}>{getDeliveryTypeIcon(delivery.deliveryType)}</Text>
              <Text style={[styles.typeName, { color: typeColor }]}>{typeName}</Text>
            </View>
            <Text style={styles.orderId}>{delivery.orderId}</Text>
            <Text style={styles.time}>
              {formatSmartDate(delivery.createdAt)}
            </Text>
          </View>
          <StatusBadge status={delivery.status} size="small" />
        </View>

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={[styles.dot, { backgroundColor: typeColor }]} />
            <View style={[styles.routeLine, { backgroundColor: '#E5E5EA' }]} />
            <View style={[styles.dot, { backgroundColor: '#34C759' }]} />
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.routeLocation}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationName} numberOfLines={1}>
                {delivery.pickupLocation.address}
              </Text>
              <Text style={[styles.merchantName, { color: typeColor }]}>
                {delivery.merchant.name}
              </Text>
            </View>
            <View style={styles.routeLocation}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.locationName} numberOfLines={1}>
                {delivery.deliveryLocation.address}
              </Text>
              <Text style={styles.customerName}>{delivery.customer.name}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDistance(delivery.distance)}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDuration(delivery.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValueEarnings}>
                {formatCurrency(delivery.totalEarnings)}
              </Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>

          {!isCompact && (
            <View style={styles.packages}>
              <Text style={styles.packagesLabel}>
                {delivery.packages.length} item{delivery.packages.length > 1 ? 's' : ''}
                {delivery.totalWeight > 0 && ` • ${delivery.totalWeight.toFixed(1)}kg`}
              </Text>
              <Text style={styles.packagesList} numberOfLines={1}>
                {delivery.packages.map((p) => p.description).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Special Instructions */}
        {delivery.specialInstructions && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsLabel}>Note:</Text>
            <Text style={styles.instructionsText} numberOfLines={1}>
              {delivery.specialInstructions}
            </Text>
          </View>
        )}

        {/* Surge indicator */}
        {delivery.surgeFee && delivery.surgeFee > 0 && (
          <View style={styles.surgeBadge}>
            <Text style={styles.surgeText}>Surged +{formatCurrency(delivery.surgeFee)}</Text>
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
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
    color: '#8E8E93',
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
    marginBottom: 2,
  },
  merchantName: {
    fontSize: 13,
  },
  customerName: {
    fontSize: 13,
    color: '#34C759',
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
  packages: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  packagesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  packagesList: {
    fontSize: 13,
    color: '#1A1A1A',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
    marginRight: 6,
  },
  instructionsText: {
    fontSize: 13,
    color: '#1A1A1A',
    flex: 1,
  },
  surgeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF3B3015',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  surgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

export default DeliveryCard;
