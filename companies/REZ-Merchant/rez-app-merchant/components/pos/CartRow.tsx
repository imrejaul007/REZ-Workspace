/**
 * CartRow — extracted from app/pos/index.tsx
 *
 * Renders a single cart item row with quantity controls and remove action.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors as DesignColors } from '@/constants/DesignTokens';

interface CartRowProps {
  item: {
    cartId: string;
    name: string;
    price: number;
    quantity: number;
  };
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CartRow({ item, onIncrement, onDecrement, onRemove }: CartRowProps) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.info}>
        <Text style={rowStyles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={rowStyles.price}>{formatCurrency(item.price * item.quantity)}</Text>
      </View>
      <View style={rowStyles.controls}>
        <TouchableOpacity style={rowStyles.qtyButton} onPress={onDecrement}>
          <Ionicons
            name={item.quantity === 1 ? 'trash-outline' : 'remove'}
            size={16}
            color={item.quantity === 1 ? DesignColors.error[500] : DesignColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={rowStyles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity style={rowStyles.qtyButton} onPress={onIncrement}>
          <Ionicons name="add" size={16} color={DesignColors.primary[500]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rowStyles = {
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.border.light,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: DesignColors.text.primary,
  },
  price: {
    fontSize: 13,
    color: DesignColors.text.secondary,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: DesignColors.gray[100],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: DesignColors.text.primary,
    minWidth: 22,
    textAlign: 'center' as const,
  },
};
