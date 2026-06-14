// Saved Properties Screen
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SavedScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="heart-outline" size={64} color="#d1d5db" />
        <Text style={styles.title}>No Saved Properties</Text>
        <Text style={styles.subtitle}>Tap the heart icon on any property to save it here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 20, fontWeight: '600', color: '#374151', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8 },
});
