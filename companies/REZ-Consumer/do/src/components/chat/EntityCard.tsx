import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MapPin, Star, Clock, Users, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import * as Haptics from 'expo-haptics';

interface EntityCardProps {
  entity: {
    id: string;
    type: 'venue' | 'trial' | 'event';
    name: string;
    image?: string;
    subtitle: string;
    cuisine?: string;
    distance?: string;
    rating?: number;
    reviewCount?: number;
    priceRange?: string;
    openNow?: boolean;
    nextSlot?: string;
    partySize?: number;
    karmaDiscount?: number;
    coinEarning?: number;
  };
  variant?: 'compact' | 'full' | 'horizontal';
  onAction?: (action: string) => void;
  onPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  variant = 'full',
  onAction,
  onPress,
}) => {
  const { colors, borderRadius, typography, spacing } = useTheme();

  const handleAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAction?.(action);
  };

  const renderFull = () => (
    <Card variant="elevated" padding="none" style={styles.cardFull}>
      {/* Image */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.imageContainer}>
          {entity.image ? (
            <Image source={{ uri: entity.image }} style={styles.image} />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: colors.fill },
              ]}
            >
              <Text style={[styles.placeholderText, { color: colors.labelTertiary }]}>
                {entity.type === 'venue' ? '🍽️' : entity.type === 'trial' ? '✨' : '🎫'}
              </Text>
            </View>
          )}

          {/* Badges overlay */}
          <View style={styles.badgesOverlay}>
            {entity.openNow !== undefined && (
              <Badge
                label={entity.openNow ? 'Open' : 'Closed'}
                variant={entity.openNow ? 'success' : 'error'}
                size="small"
              />
            )}
            {entity.karmaDiscount && (
              <Badge
                label={`${entity.karmaDiscount}% off`}
                variant="gold"
                size="small"
                style={styles.karmaBadge}
              />
            )}
          </View>

          {/* Coin earning */}
          {entity.coinEarning && (
            <View
              style={[
                styles.coinBadge,
                { backgroundColor: colors.gold },
              ]}
            >
              <Text style={[styles.coinText, { color: colors.black }]}>
                +{entity.coinEarning} coins
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Content */}
      <View style={[styles.content, { padding: spacing.md }]}>
        <View style={styles.header}>
          <Text
            style={[
              styles.name,
              { color: colors.label, ...typography.titleMedium },
            ]}
            numberOfLines={1}
          >
            {entity.name}
          </Text>
        </View>

        <Text
          style={[
            styles.subtitle,
            { color: colors.labelSecondary, ...typography.bodyMedium },
          ]}
          numberOfLines={1}
        >
          {entity.subtitle}
        </Text>

        {/* Meta Row */}
        <View style={[styles.metaRow, { marginTop: spacing.sm }]}>
          {entity.distance && (
            <View style={styles.metaItem}>
              <MapPin size={14} color={colors.labelTertiary} />
              <Text
                style={[
                  styles.metaText,
                  { color: colors.labelSecondary, ...typography.captionMedium },
                ]}
              >
                {entity.distance}
              </Text>
            </View>
          )}

          {entity.rating && (
            <View style={styles.metaItem}>
              <Star size={14} color={colors.gold} fill={colors.gold} />
              <Text
                style={[
                  styles.metaText,
                  { color: colors.labelSecondary, ...typography.captionMedium },
                ]}
              >
                {entity.rating}
                {entity.reviewCount && ` (${entity.reviewCount})`}
              </Text>
            </View>
          )}

          {entity.priceRange && (
            <Text
              style={[
                styles.priceRange,
                { color: colors.labelTertiary, ...typography.captionMedium },
              ]}
            >
              {entity.priceRange}
            </Text>
          )}
        </View>

        {/* Next slot */}
        {entity.nextSlot && (
          <View style={[styles.slotRow, { marginTop: spacing.sm }]}>
            <Clock size={14} color={colors.primary} />
            <Text
              style={[
                styles.slotText,
                { color: colors.primary, ...typography.captionMedium },
              ]}
            >
              Next: {entity.nextSlot}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={[styles.actions, { marginTop: spacing.md }]}>
          <Button
            variant="primary"
            size="medium"
            onPress={() => handleAction('book')}
            style={styles.primaryAction}
            fullWidth
          >
            Book Now
          </Button>
          <Button
            variant="secondary"
            size="medium"
            onPress={() => handleAction('directions')}
            style={styles.secondaryAction}
          >
            <MapPin size={16} color={colors.primary} />
          </Button>
        </View>
      </View>
    </Card>
  );

  const renderHorizontal = () => (
    <TouchableOpacity
      style={[
        styles.horizontalCard,
        {
          backgroundColor: colors.backgroundElevated,
          borderRadius: borderRadius.lg,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {entity.image ? (
        <Image source={{ uri: entity.image }} style={styles.horizontalImage} />
      ) : (
        <View
          style={[
            styles.horizontalImagePlaceholder,
            { backgroundColor: colors.fill },
          ]}
        >
          <Text style={styles.placeholderText}>
            {entity.type === 'venue' ? '🍽️' : '✨'}
          </Text>
        </View>
      )}

      <View style={[styles.horizontalContent, { padding: spacing.sm }]}>
        <Text
          style={[
            styles.horizontalName,
            { color: colors.label, ...typography.titleSmall },
          ]}
          numberOfLines={1}
        >
          {entity.name}
        </Text>
        <Text
          style={[
            styles.horizontalSubtitle,
            { color: colors.labelSecondary, ...typography.captionMedium },
          ]}
          numberOfLines={1}
        >
          {entity.distance} • {entity.rating}★
        </Text>

        {entity.karmaDiscount && (
          <Badge
            label={`${entity.karmaDiscount}% off`}
            variant="gold"
            size="small"
            style={{ marginTop: 4 }}
          />
        )}
      </View>

      <View style={styles.horizontalArrow}>
        <ArrowRight size={16} color={colors.labelTertiary} />
      </View>
    </TouchableOpacity>
  );

  const renderCompact = () => (
    <TouchableOpacity
      style={[
        styles.compactCard,
        {
          backgroundColor: colors.fill,
          borderRadius: borderRadius.md,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {entity.image ? (
        <Image source={{ uri: entity.image }} style={styles.compactImage} />
      ) : (
        <View
          style={[
            styles.compactImagePlaceholder,
            { backgroundColor: colors.fillSecondary },
          ]}
        >
          <Text style={styles.placeholderText}>
            {entity.type === 'venue' ? '🍽️' : '✨'}
          </Text>
        </View>
      )}
      <Text
        style={[
          styles.compactName,
          { color: colors.label, ...typography.captionMedium },
        ]}
        numberOfLines={1}
      >
        {entity.name}
      </Text>
    </TouchableOpacity>
  );

  if (variant === 'horizontal') return renderHorizontal();
  if (variant === 'compact') return renderCompact();
  return renderFull();
};

const styles = StyleSheet.create({
  // Full variant
  cardFull: {
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  badgesOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  karmaBadge: {
    marginLeft: 6,
  },
  coinBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coinText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
  },
  subtitle: {
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {},
  priceRange: {
    marginLeft: 'auto',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotText: {},
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    width: 44,
    height: 44,
    paddingHorizontal: 0,
  },

  // Horizontal variant
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
    paddingRight: 8,
    overflow: 'hidden',
  },
  horizontalImage: {
    width: 80,
    height: 80,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  horizontalImagePlaceholder: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  horizontalContent: {
    flex: 1,
  },
  horizontalName: {
    marginBottom: 2,
  },
  horizontalSubtitle: {},
  horizontalArrow: {
    padding: 8,
  },

  // Compact variant
  compactCard: {
    width: 100,
    alignItems: 'center',
    paddingBottom: 8,
    overflow: 'hidden',
  },
  compactImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  compactImagePlaceholder: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  compactName: {
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
