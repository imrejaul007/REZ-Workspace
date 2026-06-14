// @ts-nocheck
/**
 * StockStatus Component
 * Shows real-time stock availability
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScarcityService } from '../services';
import type { ScarcityStatus } from '../services';

interface StockStatusProps {
  itemId: string;
  storeSlug?: string;
  showVelocity?: boolean;
  style?: object;
}

export default function StockStatus({
  itemId,
  showVelocity = true,
  style,
}: StockStatusProps) {
  const [status, setStatus] = useState<ScarcityStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, [itemId]);

  async function fetchStatus() {
    try {
      const result = await ScarcityService.getItemStatus(itemId);
      if (result.success && result.data) {
        // @ts-ignore
        setStatus(result.data);
      }
    } catch {
      // Service unavailable
    } finally {
      setLoading(false);
    }
  }

  if (loading || !status) {
    return null;
  }

  function getStatusConfig() {
    if (!status) return null;
    switch (status.status) {
      case 'soldout':
        return {
          label: 'Sold Out',
          icon: '❌',
          color: '#FF3B30',
        };
      case 'scarce':
        return {
          label: `Only ${status.quantity} left!`,
          icon: '🔥',
          color: '#FF9500',
        };
      case 'low':
        return {
          label: 'Limited stock',
          icon: '⚡',
          color: '#FF9500',
        };
      default:
        if ((status.velocity || 0) > 5) {
          return {
            label: `${status.velocity}/hr`,
            icon: '⚡',
            color: '#34C759',
          };
        }
        return {
          label: 'In Stock',
          icon: '✅',
          color: '#34C759',
        };
    }
  }

  const config = getStatusConfig();

  if (!config) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
        <Text style={styles.icon}>{config.icon}</Text>
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      </View>
      {showVelocity && (status.velocity || 0) > 0 && status.status === 'available' && (
        <Text style={styles.velocity}>({status.velocity}/hr)</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  icon: {
    fontSize: 10,
    marginRight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  velocity: {
    fontSize: 10,
    color: '#8E8E93',
  },
});
