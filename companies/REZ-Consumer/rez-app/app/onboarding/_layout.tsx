import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="location" />
      <Stack.Screen name="first-scan" />
      <Stack.Screen name="splash" />
      <Stack.Screen name="registration" />
      <Stack.Screen name="otp-verification" />
      <Stack.Screen name="loading" />
      <Stack.Screen name="notification-permission" />
      <Stack.Screen name="identity-select" options={{ headerShown: false }} />
      <Stack.Screen name="student-verify" options={{ headerShown: false }} />
      <Stack.Screen name="corporate-verify" options={{ headerShown: false }} />
      <Stack.Screen name="other-verify" options={{ headerShown: false }} />
      <Stack.Screen name="defence-verify" options={{ headerShown: false }} />
      <Stack.Screen name="healthcare-verify" options={{ headerShown: false }} />
      <Stack.Screen name="teacher-verify" options={{ headerShown: false }} />
      <Stack.Screen name="verification-success" options={{ headerShown: false }} />
      <Stack.Screen name="verification-pending" options={{ headerShown: false }} />
      <Stack.Screen name="set-pin" options={{ headerShown: false }} />
    </Stack>
  );
}
