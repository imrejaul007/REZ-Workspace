import { Tabs, Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { platformAlertDestructive } from '@/utils/platformAlert';
import { socketService } from '@/services/api/socket';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useDashboardRealTime } from '@/hooks/useRealTimeUpdates';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { canViewTeam } from '@/utils/teamHelpers';
import { StoreSelector } from '@/components/stores/StoreSelector';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { logger } from '@/utils/logger';

export default function DashboardLayout() {
  const colorScheme = useColorScheme();
  const { logout, permissions, role, isAuthenticated, isLoading } = useAuth();
  const { activeStore, isLoading: storeLoading } = useStore();
  const insets = useSafeAreaInsets();
  const realTime = useDashboardRealTime();
  const scheme = colorScheme ?? 'light';

  // ALL hooks MUST run unconditionally before any early return.
  // Previously usePushNotifications was called AFTER the auth-gate early
  // returns, which meant the hook count changed when auth resolved —
  // React then threw "Rendered fewer hooks than expected" on re-render
  // (most visibly during logout). Keep this hook (and any future hooks)
  // above the early returns.
  usePushNotifications();

  // Listen for admin suspension events and immediately log out the merchant.
  // This effect must run unconditionally (before early returns) to obey the
  // Rules of Hooks. It registers listeners on mount and removes them on unmount.
  useEffect(() => {
    const handleSuspension = async () => {
      if (__DEV__) logger.log('[Dashboard] Merchant suspended — logging out');
      Alert.alert(
        'Account Suspended',
        'Your account access has been suspended by an administrator.',
        [{ text: 'OK' }]
      );
      await logout();
    };

    const handleStatusChanged = (data) => {
      if (data?.status === 'suspended' || data?.isActive === false) {
        handleSuspension();
      }
    };

    socketService.on('merchant_suspended', handleSuspension);
    socketService.on('merchant-status-changed', handleStatusChanged);

    return () => {
      socketService.off('merchant_suspended', handleSuspension);
      socketService.off('merchant-status-changed', handleStatusChanged);
    };
  }, [logout]);

  // Auth gate: block unauthenticated access to the entire (dashboard) group.
  // Without this, any deep link (e.g., /(dashboard)/orders) mounts the tab
  // navigator for unauthenticated users.
  if (isLoading || storeLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // If the active store exists but has no slug configured, launch the REZ Now setup wizard.
  // We only redirect when storeLoading has finished so we don't flash on first render.
  if (activeStore && !activeStore.slug) {
    return <Redirect href="/onboarding/rez-now-setup" />;
  }

  // Check if user can view team
  const hasTeamViewPermission = canViewTeam(permissions);

  // Only cashier and staff see the KDS tab (not admin/manager)
  const showKdsTab = role === 'cashier' || role === 'staff';

  // Check if user can view analytics
  const hasAnalyticsViewPermission = permissions?.includes('analytics:view') ?? true;

  // Check if user can view audit logs
  const hasAuditViewPermission = permissions?.includes('logs:view') ?? false;
  const tabBarShadowStyle =
    Platform.OS === 'web'
      ? { boxShadow: '0 -4px 16px rgba(124, 58, 237, 0.15)' }
      : {
          shadowColor: '#7C3AED',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        };
  const sellButtonShadowStyle =
    Platform.OS === 'web'
      ? { boxShadow: '0 3px 6px rgba(124, 58, 237, 0.45)' }
      : {
          shadowColor: '#7C3AED',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.45,
          shadowRadius: 6,
        };

  const handleLogout = () => {
    platformAlertDestructive(
      'Log Out',
      'Are you sure you want to log out?',
      () => logout(),
      'Log Out'
    );
  };

  return (
    <ErrorBoundary name="DashboardLayout">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#7C3AED',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: 'transparent',
            borderTopWidth: 0,
            height: 70 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 0,
            elevation: 16,
            ...tabBarShadowStyle,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
            marginBottom: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 5,
            gap: 2,
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
          headerShown: true,
          headerTransparent: false,
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerBackground: () => {
            const gradientColors =
              colorScheme === 'dark'
                ? (['#4C3686', '#3730A3'] as const)
                : (['#7C3AED', '#6366F1'] as const);
            return (
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
            );
          },
          headerTintColor: 'white',
          headerLeft: () => (
            <View style={[localStyles.headerLeft, { maxWidth: 180 }]}>
              <StoreSelector compact />
            </View>
          ),
          headerRight: () => (
            <View style={localStyles.headerRight}>
              <View style={localStyles.liveStatusContainer}>
                <View
                  style={[localStyles.liveDot, realTime.isConnected && localStyles.liveDotPulse]}
                />
                <Text style={localStyles.liveText}>
                  {realTime.isConnected ? 'LIVE' : 'OFFLINE'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleLogout}
                style={localStyles.logoutButton}
                activeOpacity={0.8}
                accessibilityLabel="Log out"
                accessibilityRole="button"
              >
                <Ionicons name="log-out-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ),
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
            letterSpacing: 0.3,
            marginLeft: 8,
            maxWidth: 180,
            overflow: 'hidden',
          },
          headerLeftContainerStyle: {
            paddingLeft: 12,
            maxWidth: '50%',
          },
          headerRightContainerStyle: {
            paddingRight: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: 'Products',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'cube' : 'cube-outline'} size={24} color={color} />
            ),
          }}
        />
        {/* Hidden from tab bar — accessible from Products screen */}
        <Tabs.Screen
          name="product-restore"
          options={{
            title: 'Deleted Products',
            href: null,
            headerShown: false,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'trash' : 'trash-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
            ),
          }}
        />
        {/* KDS — visible for staff/cashier, hidden for owner/admin */}
        <Tabs.Screen
          name="kds-tab"
          options={{
            title: 'Kitchen',
            href: showKdsTab ? '/kds' : null,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons
                name={focused ? 'restaurant' : 'restaurant-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        {/* Hidden from tab bar — accessible via More page */}
        <Tabs.Screen
          name="visits"
          options={{
            title: 'Visits',
            href: null,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="cashback"
          options={{
            title: 'Cashback',
            href: null,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'gift' : 'gift-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="deals"
          options={{
            title: 'Deals',
            href: null,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'ticket' : 'ticket-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons
                name={focused ? 'bar-chart' : 'bar-chart-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        {/* POS shortcut — navigates to /pos stack */}
        <Tabs.Screen
          name="pos-shortcut"
          options={{
            title: 'Sell',
            href: '/pos',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#7C3AED',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 2,
                  elevation: 6,
                  ...sellButtonShadowStyle,
                }}
              >
                <Ionicons name="storefront" size={22} color="white" />
              </View>
            ),
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '700',
              color: '#7C3AED',
            },
            tabBarActiveTintColor: '#7C3AED',
          }}
        />
        <Tabs.Screen
          name="team"
          options={{
            title: 'Team',
            href: null,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="audit"
          options={{
            title: 'Audit',
            href: null,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons
                name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
            href: null,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="coins"
          options={{
            title: 'Coins',
            href: null,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bonus-campaigns"
          options={{
            title: 'Bonus Campaigns',
            href: null,
            headerShown: false,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'gift' : 'gift-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            title: 'Payments',
            href: null,
            headerShown: false,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'cash' : 'cash-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            headerShown: false,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons
                name={focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="bundles"
          options={{
            title: 'Combo Bundles',
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="aov-analytics"
          options={{
            title: 'AOV Analytics',
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="campaign-simulator"
          options={{
            title: 'Campaign Simulator',
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="integrations"
          options={{
            title: 'Integrations',
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="web-orders"
          options={{
            title: 'REZ Now Orders',
            href: null,
            headerShown: true,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'globe' : 'globe-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="customers"
          options={{
            title: 'Customers',
            href: '/customers',
            headerShown: false,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="aggregator-orders"
          options={{
            title: 'Aggregator Orders',
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="dynamic-pricing"
          options={{
            title: 'Dynamic Pricing',
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="subscription-plans"
          options={{
            title: 'Subscription Plans',
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="subscription"
          options={{
            title: 'Subscription',
            href: '/subscription',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="payouts"
          options={{
            title: 'Payouts',
            href: '/payouts',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="marketing"
          options={{
            title: 'Ads Manager',
            href: null,
            headerShown: false,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons
                name={focused ? 'megaphone' : 'megaphone-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="post-purchase"
          options={{
            title: 'Post-Purchase Rules',
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports & Exports',
            href: null,
            headerShown: false,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons
                name={focused ? 'document-text' : 'document-text-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="broadcast"
          options={{ title: 'Broadcast', href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="campaign-roi"
          options={{ title: 'Campaign ROI', href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="try-trials"
          options={{ title: 'TRY Trials', href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="campaign-rules"
          options={{ title: 'Campaign Rules', href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="create-offer"
          options={{ title: 'Create Offer', href: null, headerShown: false }}
        />
        <Tabs.Screen name="growth" options={{ title: 'Growth', href: null, headerShown: false }} />
        <Tabs.Screen
          name="corporate"
          options={{ title: 'Corporate Dashboard', href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="qr-generator"
          options={{ title: 'QR Codes', href: null, headerShown: false }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}

const localStyles = StyleSheet.create({
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  liveStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  liveDotPulse: {
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});
