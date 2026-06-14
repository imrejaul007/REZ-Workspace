// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import logger from '@/utils/logger';
import { useHomeTab } from '@/contexts/HomeTabContext';
import { useTheme } from '@/contexts/ThemeContext';
import { colors as themeColors } from '@/constants/theme';
import { useUserIdentityStore } from '@/stores/userIdentityStore';
import { useAuthStore } from '@/stores/authStore';
import { getActiveWebOrderCount } from '@/services/webOrderApi';

// Import the Pay in Store icon (REZ animated coin)
const payInStoreIcon = require('@/assets/images/rez-coin-animated.gif');

// ─── Icon pairs: filled (active) / outline (inactive) ────────────────────────
const ICON_MAP: Record<string, { active: string; inactive: string }> = {
  // Default tabs
  'home':                   { active: 'home',            inactive: 'home-outline' },
  'compass-outline':        { active: 'compass',         inactive: 'compass-outline' },
  'flash-outline':          { active: 'flash',           inactive: 'flash-outline' },
  'person-circle-outline':  { active: 'person-circle',   inactive: 'person-circle-outline' },
  // Mall tabs
  'search':                 { active: 'search',          inactive: 'search-outline' },
  'pricetag':               { active: 'pricetag',        inactive: 'pricetag-outline' },
  'person':                 { active: 'person',          inactive: 'person-outline' },
  // Cash Store tabs
  'wallet-outline':         { active: 'wallet',          inactive: 'wallet-outline' },
  'server-outline':         { active: 'server',          inactive: 'server-outline' },
  'person-outline':         { active: 'person',          inactive: 'person-outline' },
  // Segment-specific
  'school-outline':         { active: 'school',          inactive: 'school-outline' },
  'briefcase-outline':      { active: 'briefcase',       inactive: 'briefcase-outline' },
  'medkit-outline':         { active: 'medkit',          inactive: 'medkit-outline' },
  'shield-outline':         { active: 'shield',          inactive: 'shield-outline' },
  'book-outline':           { active: 'book',            inactive: 'book-outline' },
  'heart-outline':          { active: 'heart',           inactive: 'heart-outline' },
  'business-outline':       { active: 'business',        inactive: 'business-outline' },
};

// ─── Segment-aware Deals tab config — routes verified users to their exclusive offers page
const SEGMENT_DEALS_TAB: Record<string, { name: string; route: string; icon: string }> = {
  verified_student:    { name: 'Student',  route: '/offers/student',          icon: 'school-outline' },
  verified_employee:   { name: 'My Perks', route: '/offers/corporate',        icon: 'briefcase-outline' },
  verified_healthcare: { name: 'Health',   route: '/offers/zones/healthcare', icon: 'medkit-outline' },
  verified_defence:    { name: 'Defence',  route: '/offers/zones/defence',    icon: 'shield-outline' },
  verified_teacher:    { name: 'Teacher',  route: '/offers/zones/teacher',    icon: 'book-outline' },
  verified_senior:     { name: 'Senior',   route: '/offers/zones/senior',     icon: 'heart-outline' },
  verified_government: { name: 'Gov',      route: '/offers/zones/government', icon: 'business-outline' },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BottomNavigationProps {
  style?;
}

// Curved background SVG - creates transparent navbar with semi-circle dip in center
const CurvedBackground = ({ isPrive = false, isDark = false }: { isPrive?: boolean; isDark?: boolean }) => {
  const width = SCREEN_WIDTH;
  const height = 70;
  const scale = width / 375; // Scale based on 375px design

  // SVG path: flat on sides, curves DOWN in center to create semi-circle dip
  const path = `
    M 0 0
    L ${Math.floor(108 * scale)} 0
    C ${Math.floor(130 * scale)} 0 ${Math.floor(142 * scale)} 4 ${Math.floor(152 * scale)} 20
    C ${Math.floor(162 * scale)} 36 ${Math.floor(173 * scale)} 48 ${Math.floor(187.5 * scale)} 48
    C ${Math.floor(202 * scale)} 48 ${Math.floor(213 * scale)} 36 ${Math.floor(223 * scale)} 20
    C ${Math.floor(233 * scale)} 4 ${Math.floor(245 * scale)} 0 ${Math.floor(267 * scale)} 0
    L ${width} 0
    L ${width} ${height}
    L 0 ${height}
    Z
  `.trim();

  // Dark mode / Privé theme fill
  const fillColor = isPrive
    ? 'rgba(31, 41, 55, 0.98)'
    : isDark
      ? 'rgba(30, 30, 30, 0.95)'
      : 'rgba(255, 255, 255, 0.92)';

  return (
    <View style={[curvedBgStyles.container, isPrive && curvedBgStyles.priveContainer]} pointerEvents="none">
      <Svg
        width={width}
        height={height}
        style={{ pointerEvents: 'none' } as unknown}
      >
        <Path d={path} fill={fillColor} />
      </Svg>
    </View>
  );
};

// Styles for curved background (separate to avoid circular reference)
const curvedBgStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 1, // Lowest z-index - behind everything
    // Shadow to make the curve visible
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 -3px 6px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  priveContainer: {
    ...Platform.select({
      ios: {
        shadowColor: themeColors.brand.goldAccent,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -2px 8px rgba(201, 169, 98, 0.15)',
      },
    }),
  },
});

const BottomNavigation: React.FC<BottomNavigationProps> = ({ style }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, colors } = useTheme();
  const { segment, statedIdentity } = useUserIdentityStore();
  const insets = useSafeAreaInsets();
  const [imageError, setImageError] = useState(false);

  // REZ Now active order badge count
  const [activeWebOrderCount, setActiveWebOrderCount] = useState(0);
  const lastFetchRef = useRef<number>(0);

  const refreshWebOrderBadge = useCallback(async () => {
    if (!useAuthStore.getState().state.isAuthenticated) return;
    // Throttle: at most once every 30 seconds to avoid hammering the API
    const now = Date.now();
    if (now - lastFetchRef.current < 30_000) return;
    lastFetchRef.current = now;
    try {
      const count = await getActiveWebOrderCount();
      setActiveWebOrderCount(count);
    } catch {
      // non-fatal — badge simply stays at previous value
    }
  }, []);

  // Fetch on mount and every time app comes to foreground
  useEffect(() => {
    refreshWebOrderBadge();
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        refreshWebOrderBadge();
      }
    });
    return () => sub.remove();
  }, [refreshWebOrderBadge]);

  // Get active home tab from Zustand store (never throws — safe to call unconditionally).
  // Previously wrapped in try/catch which violated React rules of hooks.
  const homeTabContext = useHomeTab();
  const isRezMallActive = homeTabContext.isRezMallActive ?? false;
  const isCashStoreActive = homeTabContext.isCashStoreActive ?? false;
  const isPriveActive = homeTabContext.isPriveActive ?? false;

  // Hide bottom navigation on auth/onboarding pages and payment sub-flows
  const hidePages = [
    '/sign-in',
    '/onboarding',
    '/index', // Landing page
    '/pay-in-store/store-search',
    '/pay-in-store/enter-amount',
    '/pay-in-store/payment',
    '/pay-in-store/offers',
    '/product-page', // Product detail page has its own sticky bottom bar
    '/MainStorePage', // Main store page has its own sticky bottom bar
    '/picks', // Pick detail page has its own sticky bottom bar
    '/creator/', // Creator profile page
    '/submit-pick', // Pick submission page
    '/creator-dashboard', // Creator dashboard
    '/social/reels', // Full-screen reels experience
    '/social-impact/', // Event detail page has its own sticky bottom bar
    '/support/chat', // Live chat has its own input bar
    '/support/ticket/', // Ticket detail page has its own input bar
    '/support/create-ticket', // Ticket creation form
    '/support/feedback', // Feedback form
    '/support/report-fraud', // Fraud report form
    '/support/call', // Call support page
    '/orders/', // Order detail pages
    '/menu/', // Restaurant menu page has its own cart footer
  ];

  const shouldHide = hidePages.some(page => pathname?.startsWith(page));

  if (shouldHide) {
    return null;
  }

  // Determine which tab is active based on pathname
  const getActiveTab = () => {
    // Handle empty pathname - treat as home
    if (!pathname || pathname === '' || pathname === '/') {
      return 'Home';
    }

    // Normalize pathname for comparison (remove trailing slash)
    const normalizedPath = pathname.replace(/\/$/, '');

    // Cash Store tabs: Home, Wallet, Coins, Profile
    if (isCashStoreActive) {
      // Check for Wallet tab
      if (
        normalizedPath === '/wallet-screen' ||
        normalizedPath === '/wallet' ||
        normalizedPath.startsWith('/wallet/')
      ) {
        return 'Wallet';
      }

      // Check for Coins tab
      if (
        normalizedPath === '/coins' ||
        normalizedPath.startsWith('/coin')
      ) {
        return 'Coins';
      }

      // Check for Profile tab
      if (
        normalizedPath === '/account' ||
        normalizedPath.startsWith('/account/')
      ) {
        return 'Profile';
      }
    }
    // REZ Mall tabs: Home, Search, Pay at Store, Offers, Profile
    else if (isRezMallActive) {
      // Check for Search tab - multiple formats (search, categories)
      if (
        normalizedPath === '/categories' ||
        normalizedPath === '/(tabs)/categories' ||
        normalizedPath.startsWith('/categories/') ||
        normalizedPath.startsWith('/(tabs)/categories/') ||
        normalizedPath === '/search' ||
        normalizedPath.startsWith('/search/')
      ) {
        return 'Search';
      }

      // Check for Offers tab - multiple formats
      if (
        normalizedPath === '/mall/offers' ||
        normalizedPath.startsWith('/mall/offers/') ||
        normalizedPath === '/offers' ||
        normalizedPath.startsWith('/offers/') ||
        normalizedPath === '/cash-store/brands' ||
        normalizedPath.startsWith('/cash-store/')
      ) {
        return 'Offers';
      }

      // Check for Profile tab - multiple formats
      if (
        normalizedPath === '/account' ||
        normalizedPath.startsWith('/account/')
      ) {
        return 'Profile';
      }
    } else {
      // Default tabs: Home, Categories, Pay in Store, Play, Earn

      // Categories still accessible but no longer a nav tab — map to Home
      if (
        normalizedPath === '/(tabs)/categories' ||
        normalizedPath.startsWith('/(tabs)/categories/')
      ) {
        return 'Home';
      }

      // Check for Explore tab - multiple formats
      if (
        normalizedPath === '/explore' ||
        normalizedPath === '/(tabs)/explore' ||
        normalizedPath.startsWith('/explore/') ||
        normalizedPath.startsWith('/(tabs)/explore/')
      ) {
        return 'Explore';
      }

      // Check for Save tab
      if (
        normalizedPath === '/saved-offers' ||
        normalizedPath.startsWith('/saved-offers/')
      ) {
        return 'Save';
      }

      // Check for Deals tab — includes segment-specific offer routes
      if (
        normalizedPath === '/deals' ||
        normalizedPath.startsWith('/deals/') ||
        normalizedPath === '/offers/student' ||
        normalizedPath === '/offers/corporate' ||
        normalizedPath.startsWith('/offers/zones/')
      ) {
        return 'Deals';
      }

      // Check for You tab
      if (
        normalizedPath === '/profile' ||
        normalizedPath.startsWith('/profile/') ||
        normalizedPath === '/account' ||
        normalizedPath.startsWith('/account/')
      ) {
        return 'You';
      }
    }

    // Check for Home tab - handle multiple formats
    // Home is at /(tabs) or /(tabs)/index, or root /
    // IMPORTANT: Check home last, after other tabs, to avoid conflicts
    if (
      normalizedPath === '/(tabs)' ||
      normalizedPath === '/(tabs)/index' ||
      normalizedPath.startsWith('/(tabs)/index/') ||
      // If pathname includes (tabs) but doesn't match other tabs, it's home
      (normalizedPath.includes('/(tabs)') &&
       !normalizedPath.includes('/explore') &&
       !normalizedPath.includes('/earn') &&
       !normalizedPath.includes('/categories'))
    ) {
      return 'Home';
    }

    // Default: no tab is active on other pages
    return null;
  };

  const activeTab = getActiveTab();

  const handleTabPress = (route: string) => {
    // Use navigate instead of push so tabs don't stack in the history.
    // navigate() is a no-op when already on the target route, making it
    // safe to call repeatedly (e.g. tapping Home while on Home).
    router.navigate(route as unknown);
  };

  // Render a regular tab item
  const renderTab = (tab: { name: string; route: string; icon: string; isActive: boolean; showBadge?: boolean; badgeCount?: number }, index?: number) => {
    // Theme-aware tab colors
    const activeColor   = isPriveActive ? colors.brand.goldAccent : isDark ? colors.lightMustard : colors.nileBlue;
    const inactiveColor = isPriveActive ? '#A0A0A0'               : isDark ? colors.neutral[400] : '#94A3B8';

    // Resolved icon: filled when active, outline when inactive
    const iconPair = ICON_MAP[tab.icon] ?? { active: tab.icon, inactive: tab.icon };
    const resolvedIcon = tab.isActive ? iconPair.active : iconPair.inactive;

    return (
      <Pressable
        key={tab.name}
        style={isCashStoreActive ? styles.cashStoreTab : styles.tab}
        onPress={() => handleTabPress(tab.route)}
        android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true, radius: 28 }}
        accessibilityLabel={`${tab.name} tab`}
        accessibilityRole="tab"
        accessibilityState={{ selected: tab.isActive }}
      >
        {/* Active background pill */}
        {tab.isActive && (
          <View style={[
            styles.activePill,
            isPriveActive && { backgroundColor: 'rgba(201,169,98,0.12)' },
            isDark && !isPriveActive && { backgroundColor: 'rgba(255,200,87,0.10)' },
          ]} />
        )}

        {/* Icon + badge */}
        <View style={styles.iconWrapper}>
          <Ionicons
            name={resolvedIcon as unknown}
            size={22}
            color={tab.isActive ? activeColor : inactiveColor}
          />
          {(tab.badgeCount != null && tab.badgeCount > 0) ? (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>
                {tab.badgeCount > 9 ? '9+' : String(tab.badgeCount)}
              </Text>
            </View>
          ) : tab.showBadge ? (
            <View style={styles.badgeDot} />
          ) : null}
        </View>

        {/* Label */}
        <Text
          numberOfLines={1}
          style={[
            styles.tabLabelText,
            {
              color: tab.isActive ? activeColor : inactiveColor,
              fontWeight: tab.isActive ? '700' : '500',
            },
          ]}
        >
          {tab.name}
        </Text>

        {/* Active indicator dot below label */}
        {tab.isActive && (
          <View style={[
            styles.activeIndicatorDot,
            { backgroundColor: isPriveActive ? colors.brand.goldAccent : isDark ? colors.lightMustard : '#FFC857' },
          ]} />
        )}
      </Pressable>
    );
  };

  // =====================================================
  // CASH STORE LAYOUT - 4 tabs, no center floating button
  // =====================================================
  if (isCashStoreActive) {
    const cashStoreTabs = [
      {
        name: 'Home',
        route: '/(tabs)',
        icon: 'home',
        isActive: activeTab === 'Home',
      },
      {
        name: 'Wallet',
        route: '/wallet-screen',
        icon: 'wallet-outline',
        isActive: activeTab === 'Wallet',
      },
      {
        name: 'Coins',
        route: '/coins',
        icon: 'server-outline',
        isActive: activeTab === 'Coins',
      },
      {
        name: 'Profile',
        route: '/account',
        icon: 'person-outline',
        isActive: activeTab === 'Profile',
        badgeCount: activeWebOrderCount > 0 ? activeWebOrderCount : undefined,
      },
    ];

    return (
      <View style={[styles.cashStoreContainer, { paddingBottom: insets.bottom }, style]}>
        {/* Simple flat background */}
        <View style={[
          styles.cashStoreBackground,
          { height: 70 + insets.bottom },
          isDark && { backgroundColor: 'rgba(30, 30, 30, 0.98)', borderTopColor: 'rgba(255, 255, 255, 0.06)' },
        ]} />

        {/* 4 equal tabs */}
        <View style={[styles.cashStoreTabBar, { paddingBottom: insets.bottom }]}>
          {cashStoreTabs.map((tab, index) => renderTab(tab, index))}
        </View>
      </View>
    );
  }

  // =====================================================
  // REZ MALL / DEFAULT LAYOUT - 5 tabs with center floating button
  // =====================================================

  // Different tabs based on active home tab
  const tabs = isRezMallActive
    ? [
        // REZ Mall tabs: Home, Search, Pay at Store, Offers, Profile
        {
          name: 'Home',
          route: '/(tabs)',
          icon: 'home',
          isActive: activeTab === 'Home',
          isCenter: false,
        },
        {
          name: 'Search',
          route: '/search',
          icon: 'search',
          isActive: activeTab === 'Search',
          isCenter: false,
        },
        {
          name: 'Pay at Store',
          route: '/pay-in-store',
          icon: 'qr-code',
          isActive: false,
          isCenter: true,
        },
        {
          name: 'Offers',
          route: '/cash-store/brands',
          icon: 'pricetag',
          isActive: activeTab === 'Offers',
          isCenter: false,
        },
        {
          name: 'Profile',
          route: '/account',
          icon: 'person',
          isActive: activeTab === 'Profile',
          isCenter: false,
          badgeCount: activeWebOrderCount > 0 ? activeWebOrderCount : undefined,
        },
      ]
    : [
        // V2 tabs: Home · Explore · [REZ Pay] · Deals · You
        {
          name: 'Home',
          route: '/(tabs)',
          icon: 'home',
          isActive: activeTab === 'Home',
          isCenter: false,
        },
        {
          name: 'Explore',
          route: '/explore',
          icon: 'compass-outline',
          isActive: activeTab === 'Explore',
          isCenter: false,
        },
        {
          name: 'REZ Pay',
          route: '/pay-in-store',
          icon: 'qr-code',
          isActive: false,
          isCenter: true,
        },
        {
          name: SEGMENT_DEALS_TAB[segment]?.name ?? 'Deals',
          route: SEGMENT_DEALS_TAB[segment]?.route ?? '/deals',
          icon: SEGMENT_DEALS_TAB[segment]?.icon ?? 'flash-outline',
          isActive: activeTab === 'Deals',
          isCenter: false,
        },
        {
          name: 'You',
          route: '/profile',
          icon: 'person-circle-outline',
          isActive: activeTab === 'You',
          isCenter: false,
          showBadge: segment === 'normal' && !!statedIdentity && statedIdentity !== 'general',
          badgeCount: activeWebOrderCount > 0 ? activeWebOrderCount : undefined,
        },
      ];

  // Split tabs: left (first 2), center (floating), right (last 2)
  const leftTabs = tabs.filter(t => !t.isCenter).slice(0, 2);
  const rightTabs = tabs.filter(t => !t.isCenter).slice(2);
  const centerTab = tabs.find(t => t.isCenter)!;

  return (
    <View style={[styles.container, { height: 105 + insets.bottom, paddingBottom: insets.bottom }, style]} pointerEvents="box-none">
      {/* Layer 1: Curved background (dark for Privé) */}
      <CurvedBackground isPrive={isPriveActive} isDark={isDark} />

      {/* Layer 2: Floating center button (above the curve) */}
      <View style={styles.floatingButtonContainer} pointerEvents="box-none">
        <Pressable
          style={styles.floatingButton}
          onPress={() => handleTabPress(centerTab.route)}
          android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: 32 }}
          accessibilityLabel={`${centerTab.name} tab`}
          accessibilityRole="tab"
        >
          {/* White backing disc — blocks page content showing through the SVG gap */}
          <View style={[
            styles.floatingButtonBacking,
            isPriveActive && { backgroundColor: '#1F2937' },
            isDark && !isPriveActive && { backgroundColor: '#1E1E1E' },
          ]} />
          <View style={[
            styles.floatingButtonCircle,
            isPriveActive && styles.floatingButtonCirclePrive,
          ]}>
            {!imageError ? (
              <ExpoImage
                source={payInStoreIcon}
                style={styles.payInStoreGif}
                contentFit="cover"
                cachePolicy="memory-disk"
                {...({ autoPlay: true } as unknown)}
                onError={() => setImageError(true)}
              />
            ) : (
              <Ionicons
                name="ellipse"
                size={44}
                color={isPriveActive ? colors.brand.goldAccent : colors.secondary[600]}
              />
            )}
          </View>
        </Pressable>
        <Text style={[
          styles.floatingButtonLabel,
          isPriveActive && styles.floatingButtonLabelPrive,
          isDark && !isPriveActive && { color: '#B0B0B0' },
        ]}>{centerTab.name}</Text>
      </View>

      {/* Layer 3: Tab bar with left and right tabs */}
      <View style={styles.tabBar}>
        {/* Left tabs */}
        <View style={styles.leftTabs}>
          {leftTabs.map(tab => renderTab(tab))}
        </View>

        {/* Center spacer (for the floating button area) */}
        <View style={styles.centerSpacer} />

        {/* Right tabs */}
        <View style={styles.rightTabs}>
          {rightTabs.map(tab => renderTab(tab))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // =====================================================
  // DEFAULT / REZ MALL STYLES (with floating center button)
  // =====================================================

  // Main container - holds everything
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 105, // Taller to accommodate floating button lifted above curve
    zIndex: 1000,
    overflow: 'visible',
  },

  // Floating center button container - positioned above the curve
  floatingButtonContainer: {
    position: 'absolute',
    top: -18, // Negative: lifts coin button above the nav bar top edge
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },

  // The touchable button wrapper
  floatingButton: {
    // No extra styling needed
  },

  // The gradient circle button (kept for reference)
  floatingButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: themeColors.background.primary,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },

  // Circle container for the coin icon
  floatingButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a3a52',  // navy — matches GIF background so it looks clean
    borderWidth: 3,
    borderColor: '#FFC857',       // mustard ring for brand identity
    // Shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
    overflow: 'hidden',
  },

  // White backing disc behind coin button — blocks page bleed-through the SVG gap
  floatingButtonBacking: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'white',
    zIndex: -1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 8 },
    }),
  },

  // Pay in Store icon (REZ coin) - fills the circle
  payInStoreGif: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  // Label below floating button
  floatingButtonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a3a52',  // navy — matches active tab style
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Privé theme - gold border for floating button
  floatingButtonCirclePrive: {
    borderColor: themeColors.brand.goldAccent,
    backgroundColor: themeColors.neutral[800],
  },

  // Privé theme - gold label
  floatingButtonLabelPrive: {
    color: themeColors.brand.goldAccent,
  },

  // Tab bar container
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    zIndex: 50, // Higher than curved background, but below floating button
  },

  // Left tabs section
  leftTabs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 10,
    zIndex: 60,
  },

  // Center spacer for floating button
  centerSpacer: {
    width: 96,
  },

  // Right tabs section
  rightTabs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingRight: 10,
    zIndex: 60,
  },

  // Individual tab button
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 60,
    minHeight: 48, // Android recommends 48px minimum touch target
    position: 'relative',
  },

  // Subtle background pill behind active icon+label
  activePill: {
    position: 'absolute',
    top: 6,
    left: 2,
    right: 2,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(26,58,82,0.08)', // very subtle navy tint
  },

  // Wrapper so badge can be positioned relative to icon
  iconWrapper: {
    position: 'relative',
  },

  // Tab label text
  tabLabelText: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // Small mustard dot below label — active indicator
  activeIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
    backgroundColor: themeColors.brand.goldWarm,
  },

  // Orange badge dot for unverified users on You tab
  badgeDot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFC857',
  },

  // Numeric badge bubble for REZ Now active order count
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 12,
  },

  // =====================================================
  // CASH STORE STYLES (4 equal tabs, no floating button)
  // =====================================================

  // Cash Store container - simpler, no floating button
  cashStoreContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 1000,
  },

  // Cash Store flat background
  cashStoreBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.06)',
      },
    }),
  },

  // Cash Store tab bar - 4 equal tabs
  cashStoreTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 16,
  },

  // Cash Store individual tab
  cashStoreTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 50,
    position: 'relative',
  },
});

export default React.memo(BottomNavigation);
