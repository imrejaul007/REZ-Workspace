import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/DesignTokens';
import { printerService, PrinterDevice } from '@/services/printer';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

const PRINTER_STORAGE_KEY = '@rez_connected_printer';

export default function PrinterSettingsScreen() {
  const [connectedDevice, setConnectedDevice] = useState<PrinterDevice | null>(null);
  const [availablePrinters, setAvailablePrinters] = useState<PrinterDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      setLoading(true);
      const savedPrinter = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
      if (savedPrinter) {
        // E5: If the stored JSON is corrupt, clear it so we don't fail the
        // same way on every launch — the user can just re-pair instead of
        // being stuck behind an unrecoverable settings screen.
        let printer: PrinterDevice | null = null;
        try {
          printer = JSON.parse(savedPrinter) as PrinterDevice;
        } catch (parseErr) {
          logger.warn('[Printer] Corrupt stored config, clearing', parseErr);
          await AsyncStorage.removeItem(PRINTER_STORAGE_KEY).catch((e) => logger.warn('[Printer] Failed to clear corrupt config', e));
        }
        if (printer) {
          setConnectedDevice(printer);
          try {
            await printerService.connect(printer);
          } catch (error) {
            logger.error('Reconnect error:', error);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      logger.error('Init error:', error);
      setLoading(false);
    }
  };

  const handleScanPrinters = async () => {
    try {
      setScanning(true);
      const printers = await printerService.scanForPrinters();
      setAvailablePrinters(printers);
      if (printers.length === 0) {
        showAlert('No Printers Found', 'Make sure your printer is powered on');
      }
    } catch (error) {
      showAlert('Scan Error', error.message || 'Failed to scan for printers');
    } finally {
      setScanning(false);
    }
  };

  const handleConnectPrinter = async (printer: PrinterDevice) => {
    try {
      setLoading(true);
      await printerService.connect(printer);
      setConnectedDevice(printer);
      await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(printer));
      showAlert('Success', `Connected to ${printer.deviceName}`);
    } catch (error) {
      showAlert('Connection Error', error.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Printer Settings</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Printer</Text>
          {connectedDevice ? (
            <View style={styles.printerCard}>
              <View style={styles.printerInfo}>
                <Ionicons name="print" size={24} color={Colors.success[600]} />
                <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                  <Text style={styles.printerName}>{connectedDevice.deviceName}</Text>
                  <Text style={styles.printerMac}>{connectedDevice.macAddress}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noPrinterCard}>
              <Ionicons name="alert-circle-outline" size={32} color={Colors.warning[500]} />
              <Text style={styles.noPrinterText}>No printer connected</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Available Printers</Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanPrinters}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="search" size={16} color="white" />
                <Text style={styles.scanButtonText}>Scan</Text>
              </>
            )}
          </TouchableOpacity>

          {availablePrinters.length > 0 ? (
            <FlatList
              scrollEnabled={false}
              data={availablePrinters}
              keyExtractor={(item) => item.macAddress}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.printerListItem}
                  onPress={() => handleConnectPrinter(item)}
                >
                  <Ionicons name="print" size={20} color={Colors.gray[400]} />
                  <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                    <Text style={styles.printerListName}>{item.deviceName}</Text>
                    <Text style={styles.printerListMac}>{item.macAddress}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No printers found</Text>
              <Text style={styles.emptyStateSubtext}>Turn on your printer and tap "Scan"</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  printerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success[300],
    ...Shadows.sm,
  },
  printerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  printerName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  printerMac: { fontSize: Typography.fontSize.xs, color: Colors.text.tertiary },
  noPrinterCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  noPrinterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  scanButtonText: { color: 'white', fontSize: Typography.fontSize.sm, fontWeight: '600' },
  printerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  printerListName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  printerListMac: { fontSize: Typography.fontSize.xs, color: Colors.text.tertiary },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyStateText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: { fontSize: Typography.fontSize.xs, color: Colors.text.tertiary },
});
