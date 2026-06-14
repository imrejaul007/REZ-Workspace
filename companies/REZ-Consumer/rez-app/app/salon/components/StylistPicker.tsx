import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
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

interface Stylist {
  id: string;
  name: string;
  image?: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experience: string;
  available: boolean;
}

interface StylistPickerProps {
  stylists: Stylist[];
  onSelectStylist: (stylist: Stylist) => void;
  selectedStylistId?: string;
}

const StylistPicker: React.FC<StylistPickerProps> = ({
  stylists,
  onSelectStylist,
  selectedStylistId,
}) => {
  return (
    <View style={styles.container}>
      {stylists.map((stylist) => {
        const isSelected = selectedStylistId === stylist.id;

        return (
          <Pressable
            key={stylist.id}
            style={[
              styles.stylistCard,
              !stylist.available && styles.stylistCardDisabled,
              isSelected && styles.stylistCardSelected,
            ]}
            onPress={() => stylist.available && onSelectStylist(stylist)}
            disabled={!stylist.available}
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {stylist.image ? (
                <CachedImage source={{ uri: stylist.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{stylist.name.charAt(0)}</Text>
                </View>
              )}

              {/* Online/Available Indicator */}
              {stylist.available && (
                <View style={styles.availableIndicator} />
              )}
            </View>

            {/* Info */}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, !stylist.available && styles.nameDisabled]}>
                  {stylist.name}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </View>

              <Text style={styles.specialty}>{stylist.specialty}</Text>

              <View style={styles.metaRow}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color={COLORS.amber} />
                  <Text style={styles.rating}>{stylist.rating.toFixed(1)}</Text>
                  <Text style={styles.reviewCount}>({stylist.reviewCount})</Text>
                </View>
                <View style={styles.experienceBadge}>
                  <Text style={styles.experienceText}>{stylist.experience}</Text>
                </View>
              </View>

              {!stylist.available && (
                <View style={styles.unavailableBadge}>
                  <Text style={styles.unavailableText}>Currently unavailable</Text>
                </View>
              )}
            </View>

            {/* Select Button */}
            {stylist.available && !isSelected && (
              <Pressable
                style={styles.selectButton}
                onPress={() => onSelectStylist(stylist)}
              >
                <Text style={styles.selectButtonText}>Select</Text>
              </Pressable>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.base,
  },
  stylistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.lg,
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
  stylistCardDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.gray50,
  },
  stylistCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.gray50,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  availableIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.green500,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  nameDisabled: {
    color: COLORS.gray600,
  },
  specialty: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  reviewCount: {
    ...Typography.caption,
    color: COLORS.gray600,
  },
  experienceBadge: {
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  experienceText: {
    ...Typography.caption,
    color: COLORS.gray600,
  },
  unavailableBadge: {
    backgroundColor: `${Colors.error}10`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  unavailableText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '500',
  },
  selectButton: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  selectButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default StylistPicker;
