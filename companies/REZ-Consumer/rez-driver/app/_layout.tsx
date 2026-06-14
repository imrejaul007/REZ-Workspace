import React, { useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { useDriverStore } from '../src/stores';
import { driverApi, deliveryApi, notificationsApi } from '../src/services/api';

// Tab bar icon component
const TabBarIcon = ({
  name,
  color,
  focused,
}: {
  name: string;
  color: string;
  focused: boolean;
}) => {
  const iconMap: Record<string, string> = {
    deliveries: 'D',
    rides: 'R',
    earnings: 'E',
    profile: 'P',
    settings: 'S',
  };

  return (
    <View
      style={[
        styles.iconContainer,
        focused && styles.iconContainerFocused,
      ]}
    >
      <Text style={[styles.iconText, { color }]}>
        {iconMap[name] || '?'}
      </Text>
    </View>
  );
};

// Badge component for notifications
const Badge = ({ count }: { count: number }) => {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    setDriver,
    setActiveDeliveries,
    setPendingRequests,
    setNotifications,
    unreadCount,
    driver,
    isLoading,
    setLoading,
  } = useDriverStore();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Load driver profile
        const profileResponse = await driverApi.getProfile();
        if (profileResponse.success && profileResponse.data) {
          setDriver(profileResponse.data);
        }

        // Load active deliveries
        const deliveriesResponse = await deliveryApi.getActiveDeliveries();
        if (deliveriesResponse.success && deliveriesResponse.data) {
          setActiveDeliveries(deliveriesResponse.data);
        }

        // Load pending requests
        const pendingResponse = await deliveryApi.getPendingRequests();
        if (pendingResponse.success && pendingResponse.data) {
          setPendingRequests(pendingResponse.data);
        }

        // Load notifications
        const notificationsResponse = await notificationsApi.getNotifications();
        if (notificationsResponse.success && notificationsResponse.data) {
          setNotifications(notificationsResponse.data);
        }
      } catch (error) {
        logger.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Colors
  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDark ? '#8E8E93' : '#8E8E93',
    tint: '#007AFF',
    tabBar: isDark ? '#1C1C1E' : '#FFFFFF',
    tabBarBorder: isDark ? '#2C2C2E' : '#E5E5EA',
    activeTint: '#007AFF',
    inactiveTint: '#8E8E93',
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.activeTint,
        tabBarInactiveTintColor: colors.inactiveTint,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          height: Platform.OS === 'ios' ? 88 : 68,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'Deliveries',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="deliveries" color={color} focused={focused} />
          ),
          headerTitle: 'Active Deliveries',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />

      <Tabs.Screen
        name="ride"
        options={{
          title: 'Rides',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="rides" color={color} focused={focused} />
          ),
          headerTitle: 'Active Rides',
        }}
      />

      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="earnings" color={color} focused={focused} />
          ),
          headerTitle: 'My Earnings',
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="profile" color={color} focused={focused} />
          ),
          headerTitle: 'Driver Profile',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="settings" color={color} focused={focused} />
          ),
          headerTitle: 'Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
