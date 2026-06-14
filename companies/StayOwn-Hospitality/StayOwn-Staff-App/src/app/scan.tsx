/**
 * StayOwn Staff App - QR Scanner Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

export default function ScanScreen() {
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    // Simulate scan - in real app, use expo-camera
    const mockRoomId = '101';
    setScanned(true);
    Alert.alert(
      'Room Scanned!',
      `Room ${mockRoomId} has been scanned successfully.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
        { text: 'View Details', onPress: () => {
          setScanned(false);
          router.replace(`/room/${mockRoomId}`);
        }},
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.scannerArea}>
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <Text style={styles.instruction}>
          {scanned ? 'Processing...' : 'Position QR code within frame'}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleScan}>
            <Text style={styles.actionIcon}>🧹</Text>
            <Text style={styles.actionLabel}>Start Cleaning</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleScan}>
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionLabel}>Mark Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleScan}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionLabel}>Report Issue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleScan}>
            <Text style={styles.actionIcon}>📥</Text>
            <Text style={styles.actionLabel}>Guest Check-in</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#2563EB',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#1F2937',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#374151',
    marginHorizontal: 24,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
