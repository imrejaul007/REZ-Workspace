import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HowRezWorksFlow from '@/components/how-rez-works-flow'; // component file: how-rez-works-flow
import { colors } from '@/constants/theme';

const HowRezWorksPage: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      <HowRezWorksFlow />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});

export default withErrorBoundary(HowRezWorksPage, 'HowRezWorks');
