import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import { Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  itemType?: string;
}

interface OrderItemsPreviewProps {
  items: OrderItem[];
  currencySymbol: string;
}

function OrderItemsPreview({ items, currencySymbol }: OrderItemsPreviewProps) {
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <View style={styles.orderItemsSection}>
      <View style={styles.orderItemsHeader}>
        <ThemedText style={styles.orderItemsTitle}>
          Order Items ({items.length})
        </ThemedText>
        <Pressable
          onPress={() => router.push('/cart')}
          accessibilityLabel="Edit cart"
          accessibilityRole="button"
          accessibilityHint="Double tap to go back to your cart and modify items"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ThemedText style={styles.editCartText}>Edit Cart</ThemedText>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.orderItemsScroll}
      >
        {items.slice(0, 5).map((item, index) => (
          <View key={item.id || index} style={styles.orderItemCard}>
            <View style={styles.orderItemImageContainer}>
              {item.image ? (
                <CachedImage
                  source={item.image}
                  style={styles.orderItemImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.orderItemImagePlaceholder}>
                  <Ionicons name="cube-outline" size={24} color={colors.neutral[400]} />
                </View>
              )}
              <View style={styles.orderItemQtyBadge}>
                <ThemedText style={styles.orderItemQtyText}>x{item.quantity}</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.orderItemName} numberOfLines={2}>
              {item.name}
            </ThemedText>
            <ThemedText style={styles.orderItemPrice}>
              {currencySymbol}{(item.price * item.quantity).toLocaleString()}
            </ThemedText>
          </View>
        ))}
        {items.length > 5 && (
          <Pressable
            style={styles.moreItemsCard}
            onPress={() => router.push('/cart')}
            accessibilityLabel={`View ${items.length - 5} more items in cart`}
            accessibilityRole="button"
            accessibilityHint="Double tap to view all items in your cart"
          >
            <ThemedText style={styles.moreItemsText}>
              +{items.length - 5} more
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  orderItemsSection: {
    backgroundColor: colors.background.primary,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.sm,
  },
  orderItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  orderItemsTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
  },
  editCartText: {
    ...Typography.body,
    fontWeight: '500',
    color: colors.gold,
  },
  orderItemsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  orderItemCard: {
    width: 100,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: 10,
    alignItems: 'center',
  },
  orderItemImageContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  orderItemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemQtyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  orderItemQtyText: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  orderItemName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.neutral[700],
    textAlign: 'center',
    marginBottom: Spacing.xs,
    lineHeight: 14,
  },
  orderItemPrice: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: colors.gold,
  },
  moreItemsCard: {
    width: 80,
    backgroundColor: colors.successScale[50],
    borderRadius: BorderRadius.md,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.successScale[200],
    borderStyle: 'dashed',
  },
  moreItemsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold,
  },
});

export default React.memo(OrderItemsPreview);
