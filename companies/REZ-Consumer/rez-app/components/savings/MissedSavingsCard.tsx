import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MissedSavingsCardProps {
  storeName: string;
  betterStoreName: string;
  missedAmountPaise: number;
  onExplore: () => void;
  currencySymbol?: string;
}

function formatAmount(paise: number, symbol: string): string {
  const rupees = Math.round(paise / 100);
  return `${symbol}${rupees.toLocaleString('en-IN')}`;
}

const MissedSavingsCard: React.FC<MissedSavingsCardProps> = ({
  storeName,
  betterStoreName,
  missedAmountPaise,
  onExplore,
  currencySymbol = '₹',
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Ionicons name="alert-circle-outline" size={20} color="#F87171" />
          <Text style={styles.headline}>
            {'Could have saved '}
            <Text style={styles.amount}>
              {formatAmount(missedAmountPaise, currencySymbol)}
            </Text>
          </Text>
        </View>

        <Text style={styles.subtext} numberOfLines={2}>
          {'At '}
          <Text style={styles.storeNameBold}>{storeName}</Text>
          {' vs '}
          <Text style={styles.storeNameBold}>{betterStoreName}</Text>
        </Text>

        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          onPress={onExplore}
          accessibilityRole="button"
          accessibilityLabel={`Explore ${betterStoreName}`}
        >
          <Text style={styles.ctaText}>Explore Now</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    backgroundColor: '#F87171',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
  },
  amount: {
    color: '#F87171',
    fontWeight: '700',
  },
  subtext: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  storeNameBold: {
    fontWeight: '600',
    color: '#374151',
  },
  ctaButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#F87171',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  ctaButtonPressed: {
    opacity: 0.8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default MissedSavingsCard;
