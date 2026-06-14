/**
 * ProductCard — extracted from app/pos/index.tsx
 *
 * Displays a product with image, price, stock status, and cart badge.
 * Memoized to prevent re-renders on parent cart state changes.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Colors as DesignColors, Shadows } from '@/constants/DesignTokens';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    inStock: boolean;
    stock?: number;
  };
  cartQty: number;
  onAdd: () => void;
  onLongPress: () => void;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CARD_WIDTH = 160; // matched to POS grid

const ProductCard = React.memo(({ product, cartQty, onAdd, onLongPress }: ProductCardProps) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[productStyles.card, animStyle]}>
      <TouchableOpacity
        style={productStyles.inner}
        onPress={onAdd}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={!product.inStock}
      >
        <View style={productStyles.imageContainer}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={productStyles.image}
              contentFit="cover"
            />
          ) : (
            <View style={productStyles.imagePlaceholder}>
              <Ionicons name="cube-outline" size={28} color={DesignColors.primary[300]} />
            </View>
          )}
          {!product.inStock && (
            <View style={productStyles.outOfStockOverlay}>
              <Text style={productStyles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
            <View style={productStyles.lowStockBadge}>
              <Text style={productStyles.lowStockText}>Only {product.stock} left</Text>
            </View>
          )}
          {cartQty > 0 && (
            <Animated.View entering={ZoomIn.springify()} style={productStyles.cartBadge}>
              <Text style={productStyles.cartBadgeText}>{cartQty}</Text>
            </Animated.View>
          )}
        </View>
        <View style={productStyles.info}>
          <Text style={productStyles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={productStyles.price}>{formatCurrency(product.price)}</Text>
        </View>
        {product.inStock && (
          <View style={productStyles.addButton}>
            <Ionicons name="add" size={18} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

export default ProductCard;

const productStyles = {
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden' as const,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: DesignColors.border.light,
  },
  inner: {
    padding: 0,
  },
  imageContainer: {
    position: 'relative' as const,
    width: '100%' as const,
    height: 120,
    backgroundColor: DesignColors.gray[100],
  },
  image: {
    width: '100%' as const,
    height: '100%' as const,
  },
  imagePlaceholder: {
    width: '100%' as const,
    height: '100%' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  outOfStockOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  outOfStockText: {
    color: 'white',
    fontWeight: '700' as const,
    fontSize: 12,
  },
  cartBadge: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7C3AED',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cartBadgeText: {
    color: 'white',
    fontWeight: '800' as const,
    fontSize: 11,
  },
  lowStockBadge: {
    position: 'absolute' as const,
    top: 6,
    left: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lowStockText: {
    color: 'white',
    fontWeight: '700' as const,
    fontSize: 10,
  },
  info: {
    padding: 10,
    gap: 2 as const,
  },
  name: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: DesignColors.text.primary,
    lineHeight: 17,
  },
  price: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#7C3AED',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#7C3AED',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
};
