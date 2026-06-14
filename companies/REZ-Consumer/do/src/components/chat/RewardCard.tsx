import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gift, Sparkles, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/components/Card';
import * as Haptics from 'expo-haptics';

interface RewardCardProps {
  coins?: number;
  karma?: number;
  tierProgress?: {
    current: string;
    next: string;
    percentage: number;
  };
  onAnimationComplete?: () => void;
  variant?: 'celebration' | 'progress' | 'compact';
}

export const RewardCard: React.FC<RewardCardProps> = ({
  coins,
  karma,
  tierProgress,
  onAnimationComplete,
  variant = 'celebration',
}) => {
  const { colors, borderRadius, typography, spacing, springs } = useTheme();

  // Animation values
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);
  const coinBounce = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Trigger haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Icon animation
    iconScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 150 })
    );

    iconRotate.value = withSequence(
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(-5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    // Content animation
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));
    contentTranslateY.value = withDelay(300, withSpring(0, springs.default));

    // Coin bounce
    if (coins) {
      coinBounce.value = withSequence(
        withDelay(500, withSpring(1.2, springs.bouncy)),
        withSpring(1, springs.default)
      );
    }

    // Progress bar
    if (tierProgress) {
      progressWidth.value = withDelay(
        800,
        withTiming(tierProgress.percentage, { duration: 800 })
      );
    }

    // Complete callback
    const timeout = setTimeout(() => {
      onAnimationComplete?.();
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const coinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinBounce.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (variant === 'compact') {
    return (
      <View
        style={[
          styles.compactContainer,
          { backgroundColor: colors.gold + '20' },
        ]}
      >
        <Text style={[styles.compactEmoji]}>🎉</Text>
        <View style={styles.compactContent}>
          {coins && (
            <Text style={[styles.compactCoins, { color: colors.gold }]}>
              +{coins}
            </Text>
          )}
          {karma && (
            <Text style={[styles.compactKarma, { color: colors.primary }]}>
              +{karma}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <Card
      variant="filled"
      style={[styles.card, { backgroundColor: colors.gold + '15' }]}
    >
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.gold + '30' },
          ]}
        >
          <Gift size={32} color={colors.gold} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        {coins && (
          <Animated.View style={[styles.coinRow, coinAnimatedStyle]}>
            <Sparkles size={20} color={colors.gold} />
            <Text style={[styles.coinsText, { color: colors.gold }]}>
              +{coins} coins earned!
            </Text>
          </Animated.View>
        )}

        {karma && (
          <View style={styles.karmaRow}>
            <TrendingUp size={16} color={colors.primary} />
            <Text style={[styles.karmaText, { color: colors.primary }]}>
              +{karma} karma
            </Text>
          </View>
        )}

        {tierProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text
                style={[
                  styles.progressLabel,
                  { color: colors.labelSecondary, ...typography.captionMedium },
                ]}
              >
                {tierProgress.current}
              </Text>
              <Text
                style={[
                  styles.progressLabel,
                  { color: colors.labelSecondary, ...typography.captionMedium },
                ]}
              >
                {tierProgress.next}
              </Text>
            </View>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.fill },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary },
                  progressAnimatedStyle,
                ]}
              />
            </View>
          </View>
        )}
      </Animated.View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinsText: {
    fontSize: 20,
    fontWeight: '700',
  },
  karmaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  karmaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {},
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  compactEmoji: {
    fontSize: 16,
  },
  compactContent: {
    flexDirection: 'row',
    gap: 8,
  },
  compactCoins: {
    fontSize: 14,
    fontWeight: '700',
  },
  compactKarma: {
    fontSize: 14,
    fontWeight: '600',
  },
});
