import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const COLORS = {
  primary: colors.brand.pink,
  white: colors.background.primary,
  gray50: colors.background.secondary,
  gray200: colors.border.default,
  gray600: colors.text.tertiary,
  green500: Colors.success,
  amber: Colors.warning,
};

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: number;
  category: string;
  image?: string;
}

interface ServiceListProps {
  services: Service[];
  currencySymbol: string;
  onServiceSelect: (service: Service) => void;
  selectedService?: Service | null;
}

const ServiceList: React.FC<ServiceListProps> = ({
  services,
  currencySymbol,
  onServiceSelect,
  selectedService,
}) => {
  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const discount = (original: number, current: number) => {
    if (!original || original <= current) return 0;
    return Math.round((1 - current / original) * 100);
  };

  return (
    <View style={styles.container}>
      {Object.entries(groupedServices).map(([category, categoryServices]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category}</Text>

          {categoryServices.map((service) => {
            const serviceDiscount = discount(service.originalPrice || 0, service.price);
            const isSelected = selectedService?.id === service.id;

            return (
              <Pressable
                key={service.id}
                style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                onPress={() => onServiceSelect(service)}
              >
                <View style={styles.serviceContent}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {service.description}
                    </Text>
                    <View style={styles.serviceMeta}>
                      <View style={styles.durationBadge}>
                        <Ionicons name="time-outline" size={12} color={COLORS.gray600} />
                        <Text style={styles.durationText}>{service.duration} min</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.priceSection}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>
                        {currencySymbol}
                        {service.price.toLocaleString()}
                      </Text>
                      {service.originalPrice && service.originalPrice > service.price && (
                        <>
                          <Text style={styles.originalPrice}>
                            {currencySymbol}
                            {service.originalPrice.toLocaleString()}
                          </Text>
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{serviceDiscount}% OFF</Text>
                          </View>
                        </>
                      )}
                    </View>
                    <Pressable
                      style={[styles.bookButton, isSelected && styles.bookButtonSelected]}
                      onPress={() => onServiceSelect(service)}
                    >
                      <Text style={[styles.bookButtonText, isSelected && styles.bookButtonTextSelected]}>
                        {isSelected ? 'Selected' : 'Book'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.base,
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: Spacing.md,
  },
  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  serviceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  serviceName: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
    marginBottom: 4,
  },
  serviceDescription: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    ...Typography.caption,
    color: COLORS.gray600,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  price: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  originalPrice: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  discountBadge: {
    backgroundColor: `${Colors.error}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  discountText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.error,
  },
  bookButton: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  bookButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  bookButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: COLORS.primary,
  },
  bookButtonTextSelected: {
    color: colors.text.inverse,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
});

export default ServiceList;
