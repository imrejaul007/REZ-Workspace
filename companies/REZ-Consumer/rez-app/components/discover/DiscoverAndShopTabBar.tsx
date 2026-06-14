// DiscoverAndShopTabBar.tsx - Modern glassy tab navigation for Discover & Shop
// REZ Brand Colors: Nile Blue (#1a3a52) and Mustard (#ffcd57)
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DiscoverTabType } from '@/types/discover.types';
import { colors } from '@/constants/theme';

// REZ Brand Colors
const REZ_COLORS = {
  nileBlue: colors.nileBlue,
  nileBlueLight: '#2a4a62',
  mustard: colors.lightMustard,
  primaryGold: colors.brand.goldWarm,
  navy: colors.brand.navyDark,
  gray: colors.neutral[400],
  lightGray: colors.neutral[100],
};

interface Tab {
  id: DiscoverTabType;
  label: string;
  icon: string;
  activeIcon: string;
}

const TABS: Tab[] = [
  {
    id: 'reels',
    label: 'Reels/UGC',
    icon: 'play-circle-outline',
    activeIcon: 'play-circle',
  },
  {
    id: 'posts',
    label: 'Posts',
    icon: 'grid-outline',
    activeIcon: 'grid',
  },
  {
    id: 'articles',
    label: 'Articles',
    icon: 'document-text-outline',
    activeIcon: 'document-text',
  },
  {
    id: 'images',
    label: 'Images',
    icon: 'images-outline',
    activeIcon: 'images',
  },
];

interface DiscoverAndShopTabBarProps {
  activeTab: DiscoverTabType;
  onTabChange: (tab: DiscoverTabType) => void;
}

function DiscoverAndShopTabBar({
  activeTab,
  onTabChange,
}: DiscoverAndShopTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabsWrapper}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, isActive ? styles.activeTab : null]}
              onPress={() => onTabChange(tab.id)}
             
              accessibilityLabel={`${tab.label} tab`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              {isActive ? (
                <LinearGradient
                  colors={[REZ_COLORS.nileBlue, REZ_COLORS.nileBlueLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTabGradient}
                >
                  <Ionicons
                    name={tab.activeIcon as unknown}
                    size={16}
                    color={colors.background.primary}
                  />
                  <Text style={styles.activeTabLabel}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveTabContent}>
                  <Ionicons
                    name={tab.icon as unknown}
                    size={16}
                    color={REZ_COLORS.gray}
                  />
                  <Text style={styles.tabLabel}>{tab.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: REZ_COLORS.lightGray,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: REZ_COLORS.lightGray,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  activeTab: {
    ...Platform.select({
      ios: {
        shadowColor: REZ_COLORS.nileBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  activeTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 5,
    borderRadius: 10,
  },
  inactiveTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: REZ_COLORS.gray,
  },
  activeTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background.primary,
  },
});

export default React.memo(DiscoverAndShopTabBar);
