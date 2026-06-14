import { withErrorBoundary } from '@/utils/withErrorBoundary';
// TabNavigation.tsx - Redesigned tab navigation for MainStorePage
import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Dimensions, LayoutChangeEvent, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { triggerImpact } from '@/utils/haptics';
import { ThemedText } from '@/components/ThemedText';
import { colors } from '@/constants/theme';
import { Colors, Spacing } from '@/constants/DesignSystem';

export type TabKey = 'menu' | 'photos' | 'reviews' | 'about';

interface TabData {
  key: TabKey;
  title: string;
}

const defaultTabs: TabData[] = [
  { key: 'menu', title: 'Menu' },
  { key: 'photos', title: 'Photos' },
  { key: 'reviews', title: 'Reviews' },
  { key: 'about', title: 'About' },
];

interface TabNavigationProps {
  activeTab: TabKey;
  onTabChange: (tabKey: TabKey) => void;
  compact?: boolean;
  menuTabLabel?: string;
}

// Extracted so useAnimatedStyle is called at the top level of a component (not inside a callback)
const TabItem: React.FC<{
  tab: TabData;
  index: number;
  isActive: boolean;
  scaleAnim: Animated.SharedValue<number>;
  compact: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}> = ({ tab, isActive, scaleAnim, compact, onPress, onLayout }) => {
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View style={[styles.tabWrapper, scaleStyle]} onLayout={onLayout}>
      <Pressable
        style={[styles.tab, compact ? styles.tabCompact : null]}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
      >
        <ThemedText style={[styles.label, isActive && styles.labelActive, compact && styles.labelCompact]}>
          {tab.title}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
};

function TabNavigation({ activeTab, onTabChange, compact = false, menuTabLabel }: TabNavigationProps) {
  const [containerWidth, setContainerWidth] = useState<number>(Dimensions.get('window').width);
  const [tabPositions, setTabPositions] = useState<{ [key: string]: { x: number; width: number } }>({});

  // Animated value for underline position (reanimated for layout props)
  const underlineLeft = useSharedValue(0);
  const underlineWidth = useSharedValue(0);

  // Scale animations for each tab
  const scale0 = useSharedValue(1);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const scale4 = useSharedValue(1);
  const scaleAnims = useRef([scale0, scale1, scale2, scale3, scale4]).current;

  // Override menu tab label if provided
  const tabs = menuTabLabel
    ? defaultTabs.map((t) => (t.key === 'menu' ? { ...t, title: menuTabLabel } : t))
    : defaultTabs;

  const tabCount = tabs.length;
  const tabWidth = containerWidth / tabCount;

  const underlineAnimStyle = useAnimatedStyle(() => ({
    left: underlineLeft.value,
    width: underlineWidth.value,
  }));

  useEffect(() => {
    const activePosition = tabPositions[activeTab];
    if (activePosition) {
      underlineLeft.value = withSpring(activePosition.x, { damping: 18, stiffness: 180 });
      underlineWidth.value = withSpring(activePosition.width, { damping: 18, stiffness: 180 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabPositions]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width || Dimensions.get('window').width;
    setContainerWidth(w);
  };

  const handleTabLayout = (key: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabPositions((prev) => ({
      ...prev,
      [key]: { x, width },
    }));
  };

  const handlePressIn = (index: number) => {
    scaleAnims[index].value = withSpring(0.95, { damping: 8, stiffness: 100 });
  };

  const handlePressOut = (index: number) => {
    scaleAnims[index].value = withSpring(1, { damping: 8, stiffness: 100 });
  };

  const handlePress = (tabKey: TabKey) => {
    triggerImpact('Light');
    onTabChange(tabKey);
  };

  return (
    <View style={[styles.wrapper, compact ? styles.wrapperCompact : null]}>
      <View style={[styles.container, compact ? styles.containerCompact : null]} onLayout={onLayout}>
        <View style={styles.tabsRow}>
          {tabs.map((tab, index) => {
            const isActive = tab.key === activeTab;

            return (
              <TabItem
                key={tab.key}
                tab={tab}
                index={index}
                isActive={isActive}
                scaleAnim={scaleAnims[index]}
                compact={compact}
                onPress={() => handlePress(tab.key)}
                onLayout={(e: LayoutChangeEvent) => handleTabLayout(tab.key, e)}
              />
            );
          })}
        </View>

        {/* Animated Underline */}
        <Animated.View style={[styles.underline, underlineAnimStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    position: 'relative',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tabWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.lightMustard,
    fontWeight: '700',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: colors.lightMustard,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // Compact mode styles (used in sticky header)
  wrapperCompact: {
    borderWidth: 0,
    borderRadius: 0,
    borderBottomWidth: 0,
  },
  containerCompact: {
    paddingVertical: 0,
    borderRadius: 0,
  },
  tabCompact: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  labelCompact: {
    fontSize: 13,
  },
});

export default withErrorBoundary(TabNavigation, 'MainStoreSectionTabNavigation');
