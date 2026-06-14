import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { DeliveryType, DELIVERY_TYPE_CONFIG } from '../types';

interface DeliveryTypeFilterProps {
  selectedTypes: DeliveryType[];
  onToggleType: (type: DeliveryType) => void;
  showAll?: boolean;
}

const DeliveryTypeIcon = ({ type }: { type: DeliveryType }) => {
  const icons: Record<DeliveryType, string> = {
    food: '🍔',
    grocery: '🛒',
    medicine: '💊',
    courier: '📦',
    furniture: '🪑',
    cab: '🚕',
    ride_share: '🚗',
  };
  return <Text style={styles.icon}>{icons[type]}</Text>;
};

export const DeliveryTypeFilter: React.FC<DeliveryTypeFilterProps> = ({
  selectedTypes,
  onToggleType,
  showAll = true,
}) => {
  const deliveryTypes = showAll
    ? (['food', 'grocery', 'medicine', 'courier', 'furniture'] as DeliveryType[])
    : selectedTypes;

  const allSelected = selectedTypes.length === 5;

  const handleToggleAll = () => {
    if (allSelected) {
      // Deselect all
      deliveryTypes.forEach((type) => {
        if (selectedTypes.includes(type)) {
          onToggleType(type);
        }
      });
    } else {
      // Select all
      deliveryTypes.forEach((type) => {
        if (!selectedTypes.includes(type)) {
          onToggleType(type);
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showAll && (
          <TouchableOpacity
            style={[styles.chip, allSelected && styles.chipSelected]}
            onPress={handleToggleAll}
          >
            <Text style={[styles.chipText, allSelected && styles.chipTextSelected]}>
              All
            </Text>
          </TouchableOpacity>
        )}
        {deliveryTypes.map((type) => {
          const isSelected = selectedTypes.includes(type);
          const config = DELIVERY_TYPE_CONFIG[type];
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.chip,
                isSelected && { backgroundColor: config.color },
              ]}
              onPress={() => onToggleType(type)}
            >
              <DeliveryTypeIcon type={type} />
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {config.name.replace(' Delivery', '')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  icon: {
    fontSize: 14,
  },
});

export default DeliveryTypeFilter;
