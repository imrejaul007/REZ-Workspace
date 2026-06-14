// AI Chat Integration Guide for rez-app-consumer
// =================================================
// To add AI Chat to the consumer app:
//
// 1. Install the chat package:
//    npm install @rez/chat-rn
//
// 2. Add to your screens:
//
// import { AIChatWidget } from '@rez/chat-rn';
//
// function MyScreen() {
//   return (
//     <View style={{ flex: 1 }}>
//       {/* Your content */}
//       <AIChatWidget
//         appType="general"
//         userId={user.id}
//         socketUrl={process.env.EXPO_PUBLIC_AI_SOCKET_URL}
//         themeColor="#6366f1"
//       />
//     </View>
//   );
// }
//
// For full integration, add to AppProviders or main _layout.tsx

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from '@/constants/theme';

// Placeholder component - will be replaced with actual @rez/chat-rn import
export function AIChatWidgetPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Chat</Text>
      <Text style={styles.subtitle}>Install @rez/chat-rn to enable</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default AIChatWidgetPlaceholder;
