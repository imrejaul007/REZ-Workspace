import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useStore } from '@/contexts/StoreContext';

export default function QRCheckinScreen() {
  const router = useRouter();
  const { activeStore } = useStore();
  const svgRef = useRef<unknown>(null);

  if (!activeStore) return null;

  // Deep link that opens consumer app scanner
  const qrValue = `rez://checkin?storeId=${activeStore._id}&store=${encodeURIComponent(activeStore.name)}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Pay at ${activeStore.name} and earn REZ coins! Scan our QR: ${qrValue}`,
        title: `${activeStore.name} — REZ QR`,
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store QR Code</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.storeName}>{activeStore.name}</Text>
          <Text style={styles.sub}>Customers scan this to earn REZ coins</Text>

          <View style={styles.qrBox}>
            <QRCode
              value={qrValue}
              size={220}
              color="#1a3a52"
              backgroundColor="#fff"
              getRef={svgRef as unknown as ((instance: unknown) => void)}
            />
          </View>

          <View style={styles.instructionRow}>
            <Ionicons name="phone-portrait-outline" size={18} color="#6B7280" />
            <Text style={styles.instruction}>
              Customer opens REZ app → Scan QR → Enter amount → Earn coins instantly
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#7C3AED" />
            <Text style={styles.statLabel}>No app change needed</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flash" size={24} color="#F59E0B" />
            <Text style={styles.statLabel}>Coins awarded instantly</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={styles.statLabel}>15-min fraud protection</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
          <Ionicons name="share-social" size={20} color="#fff" />
          <Text style={styles.shareBtnText}>Share QR Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  body: { flex: 1, padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  storeName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  qrBox: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 8,
  },
  instruction: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center', fontWeight: '500' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a3a52',
    borderRadius: 14,
    paddingVertical: 16,
  },
  shareBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
