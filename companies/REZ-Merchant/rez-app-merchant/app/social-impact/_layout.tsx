import { Stack } from 'expo-router';

export default function SocialImpactLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" options={{ presentation: 'card' }} />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/edit" options={{ presentation: 'card' }} />
      <Stack.Screen name="[id]/participants" />
      <Stack.Screen name="[id]/scan" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
