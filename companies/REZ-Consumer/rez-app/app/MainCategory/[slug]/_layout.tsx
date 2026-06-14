import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function CategorySlugLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[subcategory]" />
      <Stack.Screen name="search" />
      <Stack.Screen name="top-rated" />
      <Stack.Screen name="loyalty" />
      <Stack.Screen name="offers" />
      <Stack.Screen name="stories" />
      <Stack.Screen name="experiences" />
      <Stack.Screen name="combos" />
    </Stack>
  );
}
