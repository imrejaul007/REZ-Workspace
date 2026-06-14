// @ts-nocheck
/**
 * CoinDetailCard - Compact coin card (replaces WalletBalanceCard's large format)
 * Shows coin amount, icon, expiry/usage info, chevron for detail navigation
 */
import React from 'react';
import { View, StyleSheet, Pressable} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring } from 'react-native-reanimated';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { CoinBalance, COIN_TYPES, CoinType } from '@/types/wallet';
import { Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

import { BRAND } from '@/constants/brand';
const rezCoinImage = BRAND.COIN_IMAGE;

interface CoinDetailCardProps {
  coin: CoinBalance;
  onPress?: (coin: CoinBalance) => void;
}

// eslint-disable-next-line react/display-name
export const CoinDetailCard: React.FC<CoinDetailCardProps> = React.memo(({ coin, onPress }) => {
  const scaleAnim = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleAnim.value }] }));
  const coinInfo = COIN_TYPES[coin.type] || COIN_TYPES.rez;

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.97, { speed: 50,
      bounciness: 4 } as unknown);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1, { speed: 50,
      bounciness: 4 } as unknown);
  };

  // Determine info line
  const getInfoText = (): string => {
    // Check actual expiryDate first (set by backend based on admin config)
    if (coin.expiryDate) {
      const parsed = new Date(coin.expiryDate).getTime();
      if (Number.isFinite(parsed)) {
        const daysLeft = Math.ceil((parsed - Date.now()) / 86400000);
        if (daysLeft <= 0) return 'Expired';
        if (daysLeft === 1) return 'Expires tomorrow';
        if (daysLeft <= 30) return `Expires in ${daysLeft} days`;
        const months = Math.ceil(daysLeft / 30);
        return `Expires in ~${months} months`;
      }
    }
    // No expiryDate = admin configured 0 days = never expires
    if (coin.type === 'rez') return 'Never expires';
    if (coin.type === 'promo') {
      if (coin.expiryCountdown) return coin.expiryCountdown;
      return 'Max 20% per bill';
    }
    if (coin.type === 'branded') {
      return coin.brandedDetails?.merchantName
        ? `From ${coin.brandedDetails.merchantName}`
        : coin.description || 'From stores';
    }
    return coin.description ?? 'From stores';
  };

  const expiryMs = coin.expiryDate ? new Date(coin.expiryDate).getTime() : NaN;
  const isExpiringSoon = coin.type === 'promo' && Number.isFinite(expiryMs) &&
    Math.ceil((expiryMs - Date.now()) / 86400000) <= 7;

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        style={[styles.card, { borderColor: coinInfo.color + '20' }]}
        onPress={() => onPress?.(coin)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
       
        accessibilityLabel={`${coinInfo.name}: ${coin.amount} coins`}
        accessibilityRole="button"
      >
        <View style={[styles.iconContainer, { backgroundColor: coinInfo.backgroundColor }]}>
          {coin.type === 'rez' ? (
            <CachedImage source={rezCoinImage} style={styles.coinImage} contentFit="contain" transition={200} />
          ) : (
            <Ionicons
              name={coin.type === 'branded' ? 'storefront' : 'flash'}
              size={20}
              color={coinInfo.color}
            />
          )}
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.name}>{coinInfo.name}</ThemedText>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amount, { color: coinInfo.amountColor }]}>
              {Number.isFinite(coin.amount) ? coin.amount.toLocaleString() : '0'} {BRAND.CURRENCY_CODE}
            </ThemedText>
          </View>
          <ThemedText style={[styles.info, isExpiringSoon ? styles.infoWarning : null]}>
            {getInfoText()}
          </ThemedText>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    ...Shadows.subtle },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 },
  coinImage: {
    width: 24,
    height: 24 },
  content: {
    flex: 1 },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 1 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4 },
  amount: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2 },
  info: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '500',
    marginTop: 1 },
  infoWarning: {
    color: colors.warningScale[700],
    fontWeight: '600' } });

export default CoinDetailCard;
