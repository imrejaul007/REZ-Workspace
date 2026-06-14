/**
 * Card Skeleton Presets
 * Reusable skeleton components for common card types
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

export function CartItemSkeleton() {
  return (
    <View style={styles.cartItem} accessibilityLabel="Loading cart item" accessibilityRole="none">
      <SkeletonLoader width={80} height={80} borderRadius={12} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <SkeletonLoader width="80%" height={16} />
        <SkeletonLoader width="50%" height={14} style={{ marginTop: 6 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <SkeletonLoader width={80} height={16} />
          <SkeletonLoader width={100} height={32} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

export function WishlistItemSkeleton() {
  return (
    <View style={styles.wishlistItem} accessibilityLabel="Loading wishlist item" accessibilityRole="none">
      <SkeletonLoader width={100} height={100} borderRadius={8} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <SkeletonLoader width="70%" height={16} />
        <SkeletonLoader width="40%" height={14} style={{ marginTop: 4 }} />
        <SkeletonLoader width="30%" height={16} style={{ marginTop: 8 }} />
        <SkeletonLoader width={80} height={28} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartItem: {
    flexDirection: 'row',
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)' },
    }),
  },
  wishlistItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)' },
    }),
  },
});
