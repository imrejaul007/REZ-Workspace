import React, { useEffect } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Screens
import { DashboardScreen } from './src/screens/dashboard';
import { POListScreen } from './src/screens/poList';
import { PODetailScreen } from './src/screens/poDetail';
import { CreatePOScreen } from './src/screens/createPO';
import { SupplierSearchScreen } from './src/screens/supplierSearch';
import { ProductSearchScreen } from './src/screens/productSearch';
import { CameraScreen } from './src/screens/camera';
import { SettingsScreen } from './src/screens/settings';

// Store
import { usePOStore } from './src/contexts/store';

// Types
import { RootStackParamList, MainTabParamList } from './src/types';

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

// Tab Navigator
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="POList"
        component={POListScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreatePOScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CreatePO', {});
          },
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsPlaceholder}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Notifications Placeholder
const NotificationsPlaceholder: React.FC = () => (
  <View style={styles.placeholder}>
    <MaterialCommunityIcons name="bell-outline" size={64} color="#CCC" />
    <Text style={styles.placeholderTitle}>Notifications</Text>
    <Text style={styles.placeholderMessage}>
      You'll see important alerts about your purchase orders here
    </Text>
  </View>
);

// Main App Navigator
const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F5F7FA' },
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="PODetail"
        component={PODetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CreatePO"
        component={CreatePOScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EditPO"
        component={CreatePOScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="SupplierSearch"
        component={SupplierSearchScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ProductSearch"
        component={ProductSearchScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="PriceComparison"
        component={PriceComparisonPlaceholder}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="DeliveryTracking"
        component={DeliveryTrackingPlaceholder}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

// Placeholder screens
const PriceComparisonPlaceholder: React.FC = () => (
  <View style={styles.placeholder}>
    <MaterialCommunityIcons name="chart-bar" size={64} color="#CCC" />
    <Text style={styles.placeholderTitle}>Price Comparison</Text>
    <Text style={styles.placeholderMessage}>
      Compare prices from multiple suppliers
    </Text>
  </View>
);

const DeliveryTrackingPlaceholder: React.FC = () => (
  <View style={styles.placeholder}>
    <MaterialCommunityIcons name="truck-delivery" size={64} color="#CCC" />
    <Text style={styles.placeholderTitle}>Delivery Tracking</Text>
    <Text style={styles.placeholderMessage}>
      Track your delivery in real-time
    </Text>
  </View>
);

// Main App Component
const App: React.FC = () => {
  const { initializeNetworkListener } = usePOStore();

  useEffect(() => {
    // Initialize network listener for offline support
    const unsubscribe = initializeNetworkListener();

    return () => {
      unsubscribe();
    };
  }, [initializeNetworkListener]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <StatusBar
              barStyle="dark-content"
              backgroundColor="#FFFFFF"
              translucent={false}
            />
            <AppNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F7FA',
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  placeholderMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default App;
