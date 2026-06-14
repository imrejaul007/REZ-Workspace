import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeliveryStatus } from '../types';
import { getStatusColor, getStatusLabel } from '../utils';

interface StatusBadgeProps {
  status: DeliveryStatus;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  showIcon = false,
}) => {
  const backgroundColor = getStatusColor(status);
  const label = getStatusLabel(status);

  const getIcon = () => {
    switch (status) {
      case 'pending':
        return 'O';
      case 'accepted':
        return 'N';
      case 'picked_up':
        return 'P';
      case 'in_transit':
        return '>';
      case 'delivered':
        return 'V';
      case 'cancelled':
        return 'X';
      case 'failed':
        return '!';
      default:
        return '?';
    }
  };

  return (
    <View
      style={[
        styles.badge,
        styles[`badge_${size}`],
        { backgroundColor: `${backgroundColor}20` },
      ]}
    >
      <Text
        style={[
          styles.icon,
          styles[`icon_${size}`],
          { color: backgroundColor },
        ]}
      >
        {showIcon && getIcon()}
      </Text>
      <Text
        style={[
          styles.label,
          styles[`label_${size}`],
          { color: backgroundColor },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    gap: 4,
  },
  badge_small: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badge_medium: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  badge_large: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: {
    fontWeight: '700',
  },
  icon_small: {
    fontSize: 10,
  },
  icon_medium: {
    fontSize: 12,
  },
  icon_large: {
    fontSize: 14,
  },
  label: {
    fontWeight: '600',
  },
  label_small: {
    fontSize: 11,
  },
  label_medium: {
    fontSize: 13,
  },
  label_large: {
    fontSize: 15,
  },
});

export default StatusBadge;
