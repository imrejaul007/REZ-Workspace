import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/config';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'PeopleOS' }} />
        <Stack.Screen name="leave" options={{ title: 'My Leaves' }} />
        <Stack.Screen name="leave/new" options={{ title: 'Request Leave', presentation: 'modal' }} />
        <Stack.Screen name="leave/[id]" options={{ title: 'Leave Details' }} />
        <Stack.Screen name="expense" options={{ title: 'My Expenses' }} />
        <Stack.Screen name="expense/new" options={{ title: 'Submit Expense', presentation: 'modal' }} />
        <Stack.Screen name="expense/[id]" options={{ title: 'Expense Details' }} />
        <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
      </Stack>
    </>
  );
}
