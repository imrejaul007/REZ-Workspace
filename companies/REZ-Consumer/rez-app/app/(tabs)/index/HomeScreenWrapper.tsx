/**
 * HomeScreenWrapper
 * Wrapper using extracted components from index.tsx
 *
 * This demonstrates how to use the extracted components.
 * The full index.tsx should be refactored to use this pattern.
 */

import React, { Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import ReAnimated, { FadeIn } from 'react-native-reanimated';

// Extracted components
import HomeErrorState from './components/HomeErrorState';
import HomeHeader from './components/HomeHeader';
import LocationBanner from './components/LocationBanner';
import StreakScoreRow from './components/StreakScoreRow';
import HomeSkeleton from './components/HomeSkeleton';

interface HomeScreenWrapperProps {
  isLoading: boolean;
  error?: string;
  streakCount: number;
  rezScore?: number;
  onRetry: () => void;
  children: React.ReactNode;
}

export default function HomeScreenWrapper({
  isLoading,
  error,
  streakCount,
  rezScore,
  onRetry,
  children,
}: HomeScreenWrapperProps) {
  // Error state
  if (error) {
    return <HomeErrorState error={error} onRetry={onRetry} />;
  }

  // Loading state
  if (isLoading) {
    return <HomeSkeleton />;
  }

  // Main content
  return (
    <ReAnimated.View style={styles.container} entering={FadeIn.duration(250)}>
      {/* Header */}
      <Suspense fallback={null}>
        <HomeHeader streakCount={streakCount} />
      </Suspense>

      {/* Location Banner */}
      <Suspense fallback={null}>
        <LocationBanner />
      </Suspense>

      {/* Streak & Score Row */}
      <Suspense fallback={null}>
        <StreakScoreRow streakCount={streakCount} rezScore={rezScore} />
      </Suspense>

      {/* Main Content (lazy-loaded sections) */}
      {children}
    </ReAnimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
