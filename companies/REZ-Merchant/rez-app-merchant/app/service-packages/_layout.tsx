import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function ServicePackagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
      }}
    />
  );
}
