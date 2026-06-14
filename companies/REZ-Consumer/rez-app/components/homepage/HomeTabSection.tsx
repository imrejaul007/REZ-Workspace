import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
// CategoryCashbackGrid removed per Section 6 handoff (category chips row removed)
import { colors, spacing } from '@/constants/theme';

// Updated to 4 tabs
export type TabId = 'near-u' | 'mall' | 'cash' | 'prive';

// Tab configuration with icons and descriptions
const TAB_CONFIG: Record<TabId, {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
}> = {
  'near-u': {
    iconName: 'location-outline',
    label: 'Near U',
    description: 'Local discovery + payments',
  },
  'mall': {
    iconName: 'storefront-outline',
    label: 'Mall',
    description: 'Curated brands, fast delivery',
  },
  'cash': {
    iconName: 'wallet-outline',
    label: 'Cash',
    description: 'Affiliate cashback & coupons',
  },
  'prive': {
    iconName: 'diamond-outline',
    label: 'Privé',
    // Section 6: exact tagline from handoff
    description: 'Exclusive luxury & privileges',
  },
};

// CRED Light: clean white/cream tab bar — Nile Blue active indicator
const LIGHT_BG      = '#FFFFFF';
const NILE_BLUE     = '#1a3a52';
const MUSTARD_HEX   = '#FFC857';
const MUTED_TEXT    = '#9CA3AF';
const CARD_BORDER   = 'rgba(0,0,0,0.06)';
const SEARCH_BG     = '#FFFFFF';
const SEARCH_BORDER = '#E8E8E8';
const DESCRIPTION_TEXT = '#6B7280';

// Comprehensive theme configuration for each tab (light mode)
const TAB_THEMES: Record<TabId, {
  heroGradient: string[];
  tabActiveColor: string;
  tabActiveTextColor: string;
  tabInactiveTextColor: string;
  categoryIconColor: string;
  containerBg: string;
}> = {
  'near-u': {
    heroGradient: [LIGHT_BG, LIGHT_BG, LIGHT_BG],
    tabActiveColor: NILE_BLUE,
    tabActiveTextColor: NILE_BLUE,
    tabInactiveTextColor: MUTED_TEXT,
    categoryIconColor: NILE_BLUE,
    containerBg: LIGHT_BG,
  },
  'mall': {
    heroGradient: [LIGHT_BG, LIGHT_BG, LIGHT_BG],
    tabActiveColor: NILE_BLUE,
    tabActiveTextColor: NILE_BLUE,
    tabInactiveTextColor: MUTED_TEXT,
    categoryIconColor: NILE_BLUE,
    containerBg: LIGHT_BG,
  },
  'cash': {
    heroGradient: [LIGHT_BG, LIGHT_BG, LIGHT_BG],
    tabActiveColor: NILE_BLUE,
    tabActiveTextColor: NILE_BLUE,
    tabInactiveTextColor: MUTED_TEXT,
    categoryIconColor: NILE_BLUE,
    containerBg: LIGHT_BG,
  },
  'prive': {
    heroGradient: [LIGHT_BG, LIGHT_BG, LIGHT_BG],
    tabActiveColor: NILE_BLUE,
    tabActiveTextColor: NILE_BLUE,
    tabInactiveTextColor: MUTED_TEXT,
    categoryIconColor: NILE_BLUE,
    containerBg: LIGHT_BG,
  },
};

// Tab position interface for curve calculations
interface TabLayout {
  x: number;
  width: number;
}

interface HomeTabSectionProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  onSearchPress: () => void;
  coinBalance?: number;
  onCoinPress?: () => void;
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  isPriveEligible?: boolean;
  onPriveLockedPress?: () => void;
}

// Tab order for layout calculations
const TAB_ORDER: TabId[] = ['near-u', 'mall', 'cash', 'prive'];

const HomeTabSection: React.FC<HomeTabSectionProps> = ({
  activeTab,
  onTabChange,
  onSearchPress,
  coinBalance = 0,
  onCoinPress,
  selectedCategory = 'all',
  onCategoryChange,
  isPriveEligible = false,
  onPriveLockedPress,
}) => {
  const theme = TAB_THEMES[activeTab];
  const isPriveMode = activeTab === 'prive';
  const [containerWidth, setContainerWidth] = useState(0);
  const [tabLayouts, setTabLayouts] = useState<Record<TabId, TabLayout>>({
    'near-u': { x: 0, width: 0 },
    'mall': { x: 0, width: 0 },
    'cash': { x: 0, width: 0 },
    'prive': { x: 0, width: 0 },
  });

  // Handle container layout measurement
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Handle individual tab layout measurement
  const handleTabLayout = useCallback((tabId: TabId, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => ({
      ...prev,
      [tabId]: { x: x + 9, width },
    }));
  }, []);

  // Handle Privé tab press - always switch to Privé tab
  // Eligibility is now handled inside PriveSectionContainer
  const handlePrivePress = useCallback(() => {
    onTabChange('prive');
  }, [onTabChange]);

  // Generate SVG path for curved background
  const generateCurvedPath = useCallback(() => {
    const activeLayout = tabLayouts[activeTab];
    if (!containerWidth || !activeLayout.width) return '';

    const curveRadius = 14;
    const tabRowBottom = 70;
    const tabTop = 6;
    const leftX = activeLayout.x + 2;
    const rightX = activeLayout.x + activeLayout.width - 2;
    const totalWidth = containerWidth;

    const path = `
      M 0 ${tabRowBottom}
      L ${Math.max(0, leftX - curveRadius)} ${tabRowBottom}
      C ${leftX - curveRadius / 2} ${tabRowBottom} ${leftX} ${tabRowBottom - curveRadius / 2} ${leftX} ${tabRowBottom - curveRadius}
      L ${leftX} ${tabTop + curveRadius}
      C ${leftX} ${tabTop + curveRadius / 2} ${leftX + curveRadius / 2} ${tabTop} ${leftX + curveRadius} ${tabTop}
      L ${rightX - curveRadius} ${tabTop}
      C ${rightX - curveRadius / 2} ${tabTop} ${rightX} ${tabTop + curveRadius / 2} ${rightX} ${tabTop + curveRadius}
      L ${rightX} ${tabRowBottom - curveRadius}
      C ${rightX} ${tabRowBottom - curveRadius / 2} ${rightX + curveRadius / 2} ${tabRowBottom} ${rightX + curveRadius} ${tabRowBottom}
      L ${totalWidth} ${tabRowBottom}
      L ${totalWidth} 350
      L 0 350
      Z
    `;
    return path;
  }, [activeTab, tabLayouts, containerWidth]);

  // CRED Light: always white background regardless of tab
  const containerBg = LIGHT_BG;

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]} onLayout={handleContainerLayout}>
      {/* SVG Curved Background — pointerEvents="none" is CRITICAL on Android.
          Without it the SVG bounding box (350px tall) swallows every touch in
          the content area below the tab row, making all buttons unresponsive. */}
      {containerWidth > 0 && (
        <View style={styles.svgContainer} pointerEvents="none">
          <Svg width={containerWidth} height={350} style={styles.svg} pointerEvents="none">
            <Path
              d={generateCurvedPath()}
              fill={theme.heroGradient[0]}
            />
          </Svg>
        </View>
      )}

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        {/* Tab 1: Near U */}
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange('near-u')}
          onLayout={(e) => handleTabLayout('near-u', e)}
          accessibilityRole="tab"
          accessibilityLabel="Near U tab — deals close to you"
          accessibilityState={{ selected: activeTab === 'near-u' }}
        >
          <View style={[
            styles.tab,
            styles.tabPill,
            activeTab === 'near-u' ? styles.tabActive : styles.tabInactive,
          ]}>
            <Ionicons
              name={TAB_CONFIG['near-u'].iconName}
              size={16}
              color={activeTab === 'near-u' ? NILE_BLUE : MUTED_TEXT}
              style={styles.tabIcon}
            />
            <Text
              numberOfLines={1}
              style={[styles.tabText, { color: activeTab === 'near-u' ? NILE_BLUE : MUTED_TEXT }]}
            >{TAB_CONFIG['near-u'].label}</Text>
            {activeTab === 'near-u' && <View style={styles.activeUnderline} />}
          </View>
        </Pressable>

        {/* Tab 2: Mall */}
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange('mall')}
          onLayout={(e) => handleTabLayout('mall', e)}
          accessibilityRole="tab"
          accessibilityLabel="Mall tab — shop online brands"
          accessibilityState={{ selected: activeTab === 'mall' }}
        >
          <View style={[
            styles.tab,
            styles.tabPill,
            activeTab === 'mall' ? styles.tabActive : styles.tabInactive,
          ]}>
            <Ionicons
              name={TAB_CONFIG['mall'].iconName}
              size={16}
              color={activeTab === 'mall' ? NILE_BLUE : MUTED_TEXT}
              style={styles.tabIcon}
            />
            <Text
              numberOfLines={1}
              style={[styles.tabText, { color: activeTab === 'mall' ? NILE_BLUE : MUTED_TEXT }]}
            >{TAB_CONFIG['mall'].label}</Text>
            {activeTab === 'mall' && <View style={styles.activeUnderline} />}
          </View>
        </Pressable>

        {/* Tab 3: Cash */}
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange('cash')}
          onLayout={(e) => handleTabLayout('cash', e)}
          accessibilityRole="tab"
          accessibilityLabel="Cash Store tab — earn cashback"
          accessibilityState={{ selected: activeTab === 'cash' }}
        >
          <View style={[
            styles.tab,
            styles.tabPill,
            activeTab === 'cash' ? styles.tabActive : styles.tabInactive,
          ]}>
            <Ionicons
              name={TAB_CONFIG['cash'].iconName}
              size={16}
              color={activeTab === 'cash' ? NILE_BLUE : MUTED_TEXT}
              style={styles.tabIcon}
            />
            <Text
              numberOfLines={1}
              style={[styles.tabText, { color: activeTab === 'cash' ? NILE_BLUE : MUTED_TEXT }]}
            >{TAB_CONFIG['cash'].label}</Text>
            {activeTab === 'cash' && <View style={styles.activeUnderline} />}
          </View>
        </Pressable>

        {/* Tab 4: Privé */}
        <Pressable
          style={styles.tabItem}
          onPress={handlePrivePress}
          onLayout={(e) => handleTabLayout('prive', e)}
          accessibilityRole="tab"
          accessibilityLabel={isPriveEligible ? 'Privé tab — exclusive luxury deals' : 'Privé tab — locked, upgrade to access exclusive deals'}
          accessibilityState={{ selected: activeTab === 'prive' }}
        >
          <View style={[
            styles.tab,
            styles.tabPill,
            activeTab === 'prive' ? styles.tabActive : styles.tabInactive,
          ]}>
            <View style={styles.priveTabContent}>
              {!isPriveEligible && activeTab !== 'prive' && (
                <Ionicons
                  name="lock-closed-outline"
                  size={12}
                  color={NILE_BLUE}
                  style={styles.lockIcon}
                />
              )}
              <Text
                numberOfLines={1}
                style={[styles.tabText, { color: activeTab === 'prive' ? NILE_BLUE : MUTED_TEXT }]}
              >{TAB_CONFIG['prive'].label}</Text>
            </View>
            {activeTab === 'prive' && <View style={styles.activeUnderline} />}
          </View>
        </Pressable>
      </View>

      {/* Middle section — flat dark background, CRED-style */}
      <View style={styles.middleSection}>
        {/* Tab Description — muted white */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            {TAB_CONFIG[activeTab].description}
          </Text>
        </View>

        {/* Search row — pill search. Hide for Cash tab. */}
        {activeTab !== 'cash' && (
          <View style={styles.searchRow}>
            <Pressable
              style={styles.searchContainerCompact}
              onPress={onSearchPress}
              accessibilityRole="search"
              accessibilityLabel={isPriveMode ? 'Search exclusive offers' : 'Search products, deals, and stores'}
            >
              <Ionicons
                name="search"
                size={16}
                color="#9CA3AF"
                style={styles.searchIcon}
              />
              <Text style={styles.searchPlaceholderCompact}>
                {isPriveMode ? 'Search exclusive offers...' : 'Search products...'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Privé mode teaser */}
        {isPriveMode && (
          <View style={styles.priveTeaser}>
            <Text style={styles.priveTeaserIcon}>✦</Text>
            <Text style={styles.priveTeaserText}>
              Exclusive offers for Privé members
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LIGHT_BG,
    paddingTop: 8,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
    position: 'relative',
    overflow: 'visible',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  // SVG curved background (layout only — transparent on light)
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  middleSection: {
    paddingTop: 4,
    paddingBottom: 10,
    marginBottom: 0,
    marginTop: 0,
    zIndex: 1,
    backgroundColor: LIGHT_BG,
  },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: 0,
    marginBottom: 0,
    zIndex: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  tabItem: {
    flex: 1,
  },
  // CRED Light tab: flat white bg, Nile Blue active text + thin Nile Blue underline
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    flexDirection: 'column',
    gap: 4,
    position: 'relative',
  },
  tabPill: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  tabIcon: {
    // Icon size controlled by Ionicons size prop (16)
  },
  // Active tab: transparent bg, Nile Blue text + thin Nile Blue underline
  tabActive: {
    backgroundColor: 'transparent',
  },
  // Inactive tab: transparent, muted gray text
  tabInactive: {
    backgroundColor: 'transparent',
  },
  tabLocked: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  // Nile Blue underline for active tab (2px — clean segmented control)
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2,
    borderRadius: 1,
    backgroundColor: NILE_BLUE,
  },
  priveTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  lockIcon: {
    marginLeft: 0,
  },
  // Description — muted gray center tagline
  descriptionSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionText: {
    fontSize: 11,
    fontWeight: '400',
    color: DESCRIPTION_TEXT,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  // Search — white with gray border, subtle shadow
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
    marginBottom: 0,
    gap: 10,
  },
  searchContainerCompact: {
    flex: 1,
    backgroundColor: SEARCH_BG,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 99,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: SEARCH_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholderCompact: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
  },
  // Privé teaser — Nile Blue accent on light bg
  priveTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 6,
    gap: 6,
  },
  priveTeaserIcon: {
    fontSize: 14,
    color: MUSTARD_HEX,
  },
  priveTeaserText: {
    fontSize: 13,
    fontWeight: '500',
    color: NILE_BLUE,
    letterSpacing: 0.3,
  },
});

export default React.memo(HomeTabSection);
