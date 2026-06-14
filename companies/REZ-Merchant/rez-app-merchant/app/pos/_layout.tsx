import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function POSLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: false,
        headerStyle: { backgroundColor: 'transparent' },
        headerBackground: () => (
          <LinearGradient
            colors={['#7C3AED', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        ),
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Point of Sale',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="quick-bill"
        options={{
          title: 'Quick Bill',
          headerBackTitle: 'POS',
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          title: 'Collect Payment',
          headerBackTitle: 'Cancel',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          title: 'Payment Success',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="offline"
        options={{
          title: 'Offline POS',
          headerBackTitle: 'POS',
        }}
      />
      <Stack.Screen
        name="refund"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="recent-orders"
        options={{
          title: 'Recent Orders',
          headerBackTitle: 'POS',
        }}
      />
      <Stack.Screen
        name="shift-open"
        options={{
          title: 'Open Shift',
          headerBackTitle: 'POS',
        }}
      />
      <Stack.Screen
        name="shift-close"
        options={{
          title: 'Close Shift',
          headerBackTitle: 'POS',
        }}
      />
    </Stack>
  );
}
