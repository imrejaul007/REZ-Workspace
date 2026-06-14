/**
 * StayOwn Mobile - Check-in Screen with QR Code
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';

const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#F59E0B',
  success: '#10B981',
  background: '#F9FAFB',
  white: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
};

export default function CheckInScreen({ route, navigation }: any) {
  const { bookingId } = route.params || {};
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQrCode();
    requestNotifications();
  }, []);

  const fetchQrCode = async () => {
    try {
      // In production: Call API to get QR code
      // const response = await fetch(`${API_URL}/api/room-qr/${bookingId}`);
      // const data = await response.json();

      // Demo: Use a placeholder
      setQrCode(`STAYOWN-${bookingId || 'DEMO123'}-2026-06-01`);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load check-in QR code');
      setLoading(false);
    }
  };

  const requestNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissions', 'Enable notifications for updates');
    }
  };

  const shareQrCode = () => {
    Alert.alert('Share', 'Sharing QR code with hotel front desk...');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Digital Check-in</Text>
          <Text style={styles.subtitle}>Show this QR code at the front desk</Text>
        </View>

        {/* Booking Info */}
        <View style={styles.bookingCard}>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Hotel</Text>
            <Text style={styles.bookingValue}>The Grand Palace</Text>
          </View>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Room</Text>
            <Text style={styles.bookingValue}>201 - Deluxe Suite</Text>
          </View>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Check-in</Text>
            <Text style={styles.bookingValue}>Jun 1, 2026 - 2:00 PM</Text>
          </View>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Check-out</Text>
            <Text style={styles.bookingValue}>Jun 3, 2026 - 11:00 AM</Text>
          </View>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Guests</Text>
            <Text style={styles.bookingValue}>2 Adults</Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>📱</Text>
            <Text style={styles.qrCode}>{qrCode}</Text>
          </View>
          <Text style={styles.qrHint}>
            Scan this QR code at the hotel reception
          </Text>
        </View>

        {/* Guest Details */}
        <View style={styles.guestCard}>
          <Text style={styles.sectionTitle}>Guest Details</Text>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Name</Text>
            <Text style={styles.bookingValue}>John Doe</Text>
          </View>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Phone</Text>
            <Text style={styles.bookingValue}>+91 98765 43210</Text>
          </View>
          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Email</Text>
            <Text style={styles.bookingValue}>john@example.com</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.shareBtn} onPress={shareQrCode}>
          <Text style={styles.shareBtnIcon}>📤</Text>
          <Text style={styles.shareBtnText}>Share QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.downloadBtn}>
          <Text style={styles.downloadBtnIcon}>⬇️</Text>
          <Text style={styles.downloadBtnText}>Download QR Code</Text>
        </TouchableOpacity>

        {/* Help */}
        <TouchableOpacity style={styles.helpBtn}>
          <Text style={styles.helpIcon}>❓</Text>
          <Text style={styles.helpText}>Need help with check-in?</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Add ScrollView import
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bookingLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  bookingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  qrText: {
    fontSize: 60,
    marginBottom: 8,
  },
  qrCode: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: 'monospace',
  },
  qrHint: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  guestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  shareBtnIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 24,
  },
  downloadBtnIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  downloadBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  helpIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.primary,
  },
});
