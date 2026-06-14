// @ts-nocheck
import React from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

interface Address {
  id?: string;
  name?: string;
  type?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
}

interface FulfillmentOption {
  type: string;
  estimatedTime?: string;
}

interface DeliveryAddressSectionProps {
  fulfillmentType: string;
  selectedAddress?: Address | null;
  store;
  fulfillmentAvailableTypes: FulfillmentOption[];
  pickupInstructions?: string;
  vehicleInfo?: string;
  tableNumber?: string;
  onOpenAddressModal: () => void;
  onSetFulfillmentDetails: (details) => void;
}

function DeliveryAddressSection({
  fulfillmentType,
  selectedAddress,
  store,
  fulfillmentAvailableTypes,
  pickupInstructions,
  vehicleInfo,
  tableNumber,
  onOpenAddressModal,
  onSetFulfillmentDetails,
}: DeliveryAddressSectionProps) {
  if (fulfillmentType === 'delivery') {
    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Delivery Address</ThemedText>

        {selectedAddress ? (
          <Pressable
            style={styles.addressCard}
            onPress={onOpenAddressModal}
            accessibilityLabel={`Delivery address: ${selectedAddress.name || selectedAddress.type || 'Address'}, ${selectedAddress.addressLine1 || ''}${selectedAddress.city ? `, ${selectedAddress.city}` : ''}. Tap to change`}
            accessibilityRole="button"
            accessibilityHint="Double tap to select a different delivery address"
          >
            <View style={styles.addressCardContent}>
              <View style={styles.addressIconContainer}>
                <Ionicons name="location" size={24} color={colors.gold} />
              </View>
              <View style={styles.addressDetails}>
                <ThemedText style={styles.addressName}>
                  {selectedAddress.name || selectedAddress.type || 'Delivery Address'}
                </ThemedText>
                <ThemedText style={styles.addressText} numberOfLines={2}>
                  {selectedAddress.addressLine1}
                  {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ''}
                </ThemedText>
                <ThemedText style={styles.addressCityText}>
                  {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                </ThemedText>
                {selectedAddress.phone && (
                  <ThemedText style={styles.addressPhoneText}>
                    Phone: {selectedAddress.phone}
                  </ThemedText>
                )}
              </View>
              <View style={styles.changeAddressButton}>
                <ThemedText style={styles.changeAddressText}>Change</ThemedText>
              </View>
            </View>
          </Pressable>
        ) : (
          <Pressable
            style={styles.addAddressCard}
            onPress={onOpenAddressModal}
            accessibilityLabel="Add delivery address"
            accessibilityRole="button"
            accessibilityHint="Double tap to add or select a delivery address"
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.gold} />
            <ThemedText style={styles.addAddressText}>Add Delivery Address</ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
          </Pressable>
        )}

        {!selectedAddress && (
          <View style={styles.addressWarning}>
            <Ionicons name="warning" size={16} color={colors.warning} />
            <ThemedText style={styles.addressWarningText}>
              Please add a delivery address to proceed with your order
            </ThemedText>
          </View>
        )}
      </View>
    );
  }

  if (fulfillmentType === 'pickup') {
    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Pickup Location</ThemedText>
        <View style={[styles.addressCard, { borderColor: colors.nileBlue, borderWidth: 1.5 }]}>
          <View style={styles.addressCardContent}>
            <View style={[styles.addressIconContainer, { backgroundColor: '#f0f6fa' }]}>
              <Ionicons name="storefront-outline" size={24} color={colors.nileBlue} />
            </View>
            <View style={styles.addressDetails}>
              <ThemedText style={[styles.addressName, { color: colors.nileBlue }]}>{store?.name}</ThemedText>
              <ThemedText style={styles.addressText}>
                Ready in ~{fulfillmentAvailableTypes.find(t => t.type === 'pickup')?.estimatedTime || '15-20 min'}
              </ThemedText>
            </View>
            <Ionicons name="navigate-outline" size={22} color={colors.nileBlue} />
          </View>
        </View>
        <TextInput
          style={[styles.specialInstructionsInput, { marginTop: 10 }]}
          placeholder="Pickup instructions (optional)"
          placeholderTextColor={colors.neutral[400]}
          value={pickupInstructions || ''}
          onChangeText={(text) => onSetFulfillmentDetails({ pickupInstructions: text })}
          maxLength={200}
          accessibilityLabel="Pickup instructions"
          accessibilityHint="Optional notes for the store about your pickup"
        />
      </View>
    );
  }

  if (fulfillmentType === 'drive_thru') {
    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Drive-Thru</ThemedText>
        <View style={[styles.addressCard, { borderColor: colors.nileBlue, borderWidth: 1.5 }]}>
          <View style={styles.addressCardContent}>
            <View style={[styles.addressIconContainer, { backgroundColor: '#f0f6fa' }]}>
              <Ionicons name="car-outline" size={24} color={colors.nileBlue} />
            </View>
            <View style={styles.addressDetails}>
              <ThemedText style={[styles.addressName, { color: colors.nileBlue }]}>{store?.name}</ThemedText>
              <ThemedText style={styles.addressText}>
                Est. wait: {fulfillmentAvailableTypes.find(t => t.type === 'drive_thru')?.estimatedTime || '5-10 min'}
              </ThemedText>
            </View>
            <Ionicons name="navigate-outline" size={22} color={colors.nileBlue} />
          </View>
        </View>
        <TextInput
          style={[styles.specialInstructionsInput, { marginTop: 10 }]}
          placeholder="Vehicle description (color, model) - optional"
          placeholderTextColor={colors.neutral[400]}
          value={vehicleInfo || ''}
          onChangeText={(text) => onSetFulfillmentDetails({ vehicleInfo: text })}
          maxLength={100}
          accessibilityLabel="Vehicle description"
          accessibilityHint="Optional vehicle color and model to help staff identify you at drive-thru"
        />
      </View>
    );
  }

  if (fulfillmentType === 'dine_in') {
    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Dine-In</ThemedText>
        <View style={[styles.addressCard, { borderColor: colors.nileBlue, borderWidth: 1.5 }]}>
          <View style={styles.addressCardContent}>
            <View style={[styles.addressIconContainer, { backgroundColor: '#f0f6fa' }]}>
              <Ionicons name="restaurant-outline" size={24} color={colors.nileBlue} />
            </View>
            <View style={styles.addressDetails}>
              <ThemedText style={[styles.addressName, { color: colors.nileBlue }]}>{store?.name}</ThemedText>
              <ThemedText style={styles.addressText}>Order from your table</ThemedText>
            </View>
          </View>
        </View>
        <TextInput
          style={[styles.specialInstructionsInput, { marginTop: 10 }]}
          placeholder="Table number *"
          placeholderTextColor={colors.neutral[400]}
          value={tableNumber || ''}
          onChangeText={(text) => onSetFulfillmentDetails({ tableNumber: text })}
          maxLength={20}
          accessibilityLabel="Table number"
          accessibilityHint="Required. Enter your table number for dine-in service"
          keyboardType="number-pad"
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.base,
  },
  addressCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  addressCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.successScale[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressDetails: {
    flex: 1,
    paddingRight: 8,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: colors.neutral[600],
    lineHeight: 20,
    marginBottom: 2,
  },
  addressCityText: {
    fontSize: 13,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  addressPhoneText: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 4,
  },
  changeAddressButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: 8,
  },
  changeAddressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold,
  },
  addAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    padding: 16,
    gap: 12,
  },
  addAddressText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.gold,
  },
  addressWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.amber,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  addressWarningText: {
    flex: 1,
    fontSize: 13,
    color: colors.brand.amberDark,
  },
  specialInstructionsInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    ...Typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
});

export default React.memo(DeliveryAddressSection);
