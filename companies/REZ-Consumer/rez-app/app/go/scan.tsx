import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
import { useGo, GoCartItem } from '@/components/go/GoContext';
import { SavingsMeter } from '@/components/go/SavingsMeter';

export default function ScanScreen() {
  const router = useRouter();
  const { activeSession, cartSummary, addItem, isLoading, error, clearError } = useGo();
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isLoading) return;
    setScanned(true);
    setLastScanned(data);

    try {
      await addItem(data);
    } catch {
      // Error handled by context
    }

    // Reset scanner after delay
    setTimeout(() => setScanned(false), 2000);
  };

  const handleManualAdd = async () => {
    if (!manualBarcode.trim()) return;
    setLastScanned(manualBarcode.trim());
    await addItem(manualBarcode.trim());
    setManualBarcode('');
  };

  if (!activeSession) {
    return (
      <>
        <Stack.Screen options={{ title: 'No Active Session' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No active shopping session</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/go')}
          >
            <Text style={styles.startButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: activeSession.storeName,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/go/cart')}>
              <Text style={styles.cartBadge}>
                {cartSummary?.itemCount || 0} items
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Savings Meter */}
        {cartSummary && cartSummary.totalSaved > 0 && (
          <SavingsMeter
            saved={cartSummary.totalSaved}
            cashback={cartSummary.cashbackEarned}
            compact
          />
        )}

        {/* Scanner */}
        <View style={styles.scannerContainer}>
          {!scanned ? (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
              }}
              onBarcodeScanned={handleBarCodeScanned}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanHint}>
                  Point camera at product barcode
                </Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.scannedContainer}>
              <Text style={styles.scannedText}>
                {lastScanned ? `Scanned: ${lastScanned}` : 'Processing...'}
              </Text>
            </View>
          )}
        </View>

        {/* Manual Entry */}
        <View style={styles.manualEntry}>
          <Text style={styles.manualLabel}>Or enter barcode manually:</Text>
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.manualInput}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="Enter barcode..."
              keyboardType="default"
              returnKeyType="done"
              onSubmitEditing={handleManualAdd}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleManualAdd}
              disabled={!manualBarcode.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Items */}
        {activeSession.items.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Scans</Text>
            <FlatList
              data={activeSession.items.slice(-5).reverse()}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
              renderItem={({ item }) => (
                <View style={styles.recentItem}>
                  <Text style={styles.recentItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.recentItemPrice}>₹{item.price}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/go/cart')}
          >
            <Text style={styles.cartButtonText}>
              View Cart ({cartSummary?.itemCount || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.payButton}
            onPress={() => router.push('/go/checkout')}
            disabled={!activeSession.items.length}
          >
            <Text style={styles.payButtonText}>
              Pay ₹{cartSummary?.total?.toFixed(2) || '0.00'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cartBadge: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  scannerContainer: {
    height: 300,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 100,
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 8,
  },
  scanHint: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 14,
  },
  scannedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#22C55E',
  },
  scannedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  manualEntry: {
    padding: 16,
  },
  manualLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  recentSection: {
    paddingHorizontal: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 120,
  },
  recentItemName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  recentItemPrice: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginTop: 'auto',
  },
  cartButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  payButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
