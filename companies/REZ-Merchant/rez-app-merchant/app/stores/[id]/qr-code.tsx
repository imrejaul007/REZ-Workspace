import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Share,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import QRCode from 'react-native-qrcode-svg';
import { useStore } from '@/contexts/StoreContext';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import ErrorModal from '@/components/common/ErrorModal';
import SuccessModal from '@/components/common/SuccessModal';
import { Colors } from '@/constants/Colors';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width - 80, 300);
const TABLE_QR_SIZE = 110;
const TABLE_QR_COLS = 2;
const TABLE_QR_ITEM_WIDTH = (width - 32 - 12) / TABLE_QR_COLS;

export default function StoreQRCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);

  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [qrType, setQrType] = useState<'store' | 'table'>('store');

  // Table QR states
  const [tableCountInput, setTableCountInput] = useState('10');
  const [tableQRsGenerated, setTableQRsGenerated] = useState(false);
  const [tableCount, setTableCount] = useState(0);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [printingAll, setPrintingAll] = useState(false);
  // Refs to capture SVG data URLs for each table QR
  const tableQRRefs = useRef<{ [key: number]: string }>({});
  // Ref to capture the unified store QR data URL
  const storeQRDataUrl = useRef<string | null>(null);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });

  // Get store slug (fall back to store ID)
  const storeSlug = store?.slug || storeId;

  // Download QR code (uses SVG ref data URL captured from the QRCode component)
  const downloadQR = async () => {
    const dataUrl = storeQRDataUrl.current;
    if (!dataUrl) {
      setErrorMessage({
        title: 'Not Ready',
        message: 'QR code is still rendering. Please try again in a moment.',
      });
      setShowErrorModal(true);
      return;
    }

    setDownloading(true);
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${store?.name || 'store'}-qr-code.png`;
        link.click();
        setSuccessMessage({
          title: 'Success',
          message: 'QR code download started',
        });
        setShowSuccessModal(true);
      } else {
        // For native, save base64 PNG to gallery
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          setErrorMessage({
            title: 'Permission Required',
            message: 'Please grant permission to save images to your gallery',
          });
          setShowErrorModal(true);
          return;
        }

        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        const filename = `${store?.name || 'store'}-qr-code.png`;
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await MediaLibrary.saveToLibraryAsync(fileUri);

        setSuccessMessage({
          title: 'Success',
          message: 'QR code saved to your gallery',
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      if (__DEV__) console.error('Error downloading QR:', error);
      setErrorMessage({
        title: 'Error',
        message: 'Failed to download QR code',
      });
      setShowErrorModal(true);
    } finally {
      setDownloading(false);
    }
  };

  // Print QR code
  const printQR = async () => {
    const dataUrl = storeQRDataUrl.current;
    if (!dataUrl || !store?.name) {
      setErrorMessage({
        title: 'Not Ready',
        message: 'QR code is still rendering. Please try again in a moment.',
      });
      setShowErrorModal(true);
      return;
    }

    setPrinting(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: white;
              padding: 20px;
            }
            .card {
              text-align: center;
              padding: 40px;
              border: 2px solid #1a3a52;
              border-radius: 16px;
              max-width: 300px;
              background: white;
            }
            .logo {
              font-size: 32px;
              font-weight: 900;
              color: #1a3a52;
              margin-bottom: 8px;
              letter-spacing: 2px;
            }
            .store-name {
              font-size: 18px;
              font-weight: 700;
              color: #1a3a52;
              margin-bottom: 4px;
            }
            .tagline {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 20px;
            }
            .qr {
              width: 200px;
              height: 200px;
              margin: 20px 0;
            }
            .instruction {
              font-size: 11px;
              color: #6b7280;
              margin-top: 16px;
              line-height: 1.5;
            }
            .url {
              font-size: 10px;
              color: #1a3a52;
              margin-top: 8px;
              font-weight: 600;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">REZ</div>
            <div class="store-name">${store.name}</div>
            <div class="tagline">Scan to order · Pay · Earn rewards</div>
            <img class="qr" src="${dataUrl}" alt="QR Code" />
            <div class="instruction">Scan the QR code with your phone camera to pay at our store</div>
            <div class="url">menu.rez.money</div>
          </div>
        </body>
        </html>
      `;

      await Print.printAsync({ html });
      setSuccessMessage({
        title: 'Success',
        message: 'QR code sent to printer',
      });
      setShowSuccessModal(true);
    } catch (err) {
      if (__DEV__) console.error('Error printing QR:', err);
      // Fallback: offer to share instead
      try {
        if (dataUrl && Platform.OS !== 'web') {
          const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
          const fileUri = FileSystem.cacheDirectory + `${store.name}-qr-code.png`;
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: 'Save or print QR code',
          });
        }
      } catch {
        setErrorMessage({
          title: 'Print Error',
          message: 'Could not open printer. Try saving and printing the QR image manually.',
        });
        setShowErrorModal(true);
      }
    } finally {
      setPrinting(false);
    }
  };

  // Share QR code
  const shareQR = async () => {
    const dataUrl = storeQRDataUrl.current;
    // Always shareable via the unified URL even if the image isn't ready
    const unifiedUrl = `https://menu.rez.money/${storeSlug}`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: `${store?.name} - QR Code`,
            text: `Scan this QR to order or pay at ${store?.name}`,
            url: unifiedUrl,
          });
        } else {
          await navigator.clipboard.writeText(unifiedUrl);
          setSuccessMessage({
            title: 'Copied',
            message: 'Store QR link copied to clipboard',
          });
          setShowSuccessModal(true);
        }
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable && dataUrl) {
          // Share the PNG image
          const filename = `${store?.name || 'store'}-qr-code.png`;
          const fileUri = FileSystem.cacheDirectory + filename;
          const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: `Share ${store?.name} QR Code`,
          });
        } else {
          // Fallback to text share with the URL
          await Share.share({
            message: `Scan to order or pay at ${store?.name}: ${unifiedUrl}`,
            title: `${store?.name} - Store QR Code`,
          });
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error sharing QR:', error);
      if (error.name !== 'AbortError') {
        setErrorMessage({
          title: 'Error',
          message: 'Failed to share QR code',
        });
        setShowErrorModal(true);
      }
    }
  };

  // Build web menu URL for a given table number
  const getTableMenuUrl = (tableNumber: number) =>
    `https://menu.rez.money/${storeSlug}?table=${tableNumber}`;

  // Generate table QR codes
  const handleGenerateTableQRs = () => {
    const count = parseInt(tableCountInput, 10);
    if (!count || count < 1 || count > 100) {
      setErrorMessage({
        title: 'Invalid Count',
        message: 'Please enter a number between 1 and 100.',
      });
      setShowErrorModal(true);
      return;
    }
    tableQRRefs.current = {};
    setTableCount(count);
    setTableQRsGenerated(true);
  };

  // Download a single table QR code
  const downloadTableQR = async (tableNumber: number, dataUrl: string) => {
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${store?.name || 'store'}-table-${tableNumber}-qr.png`;
        link.click();
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          setErrorMessage({
            title: 'Permission Required',
            message: 'Please grant permission to save images to your gallery.',
          });
          setShowErrorModal(true);
          return;
        }
        // dataUrl is a base64 PNG from QRCode getRef
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        const filename = `table-${tableNumber}-qr.png`;
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await MediaLibrary.saveToLibraryAsync(fileUri);
        setSuccessMessage({ title: 'Saved', message: `Table ${tableNumber} QR saved to gallery` });
        setShowSuccessModal(true);
      }
    } catch (err) {
      if (__DEV__) console.error('Error downloading table QR:', err);
      setErrorMessage({ title: 'Error', message: 'Failed to download QR code' });
      setShowErrorModal(true);
    }
  };

  // Build print HTML for all table QRs
  const buildTableQRPrintHTML = (
    storeName: string,
    tableDataUrls: { tableNumber: number; dataUrl: string }[]
  ): string => {
    const cards = tableDataUrls
      .map(
        ({ tableNumber, dataUrl }) => `
      <div class="card">
        <div class="logo">REZ</div>
        <div class="store-name">${storeName}</div>
        <div class="table-label">Table ${tableNumber}</div>
        <img class="qr" src="${dataUrl}" alt="Table ${tableNumber} QR Code" />
        <div class="instruction">Scan to order from your table</div>
        <div class="url">menu.rez.money</div>
      </div>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
          .grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
          .card {
            text-align: center;
            padding: 24px 20px;
            border: 2px solid #1a3a52;
            border-radius: 16px;
            width: 180px;
            background: white;
            page-break-inside: avoid;
          }
          .logo { font-size: 22px; font-weight: 900; color: #1a3a52; margin-bottom: 4px; letter-spacing: 2px; }
          .store-name { font-size: 12px; font-weight: 700; color: #1a3a52; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .table-label { font-size: 16px; font-weight: 800; color: #1a3a52; margin-bottom: 10px; }
          .qr { width: 140px; height: 140px; margin: 8px 0; }
          .instruction { font-size: 10px; color: #6b7280; margin-top: 8px; line-height: 1.4; }
          .url { font-size: 9px; color: #1a3a52; margin-top: 6px; font-weight: 600; }
          @media print { body { padding: 8px; } .grid { gap: 8px; } }
        </style>
      </head>
      <body>
        <div class="grid">${cards}</div>
      </body>
      </html>
    `;
  };

  // Download all table QR codes
  const handleDownloadAll = async () => {
    const entries = Object.entries(tableQRRefs.current);
    if (entries.length === 0) {
      setErrorMessage({
        title: 'Not Ready',
        message: 'QR codes are still loading. Please wait a moment and try again.',
      });
      setShowErrorModal(true);
      return;
    }

    setDownloadingAll(true);
    try {
      if (Platform.OS === 'web') {
        // Download each QR individually on web
        for (const [num, dataUrl] of entries) {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `${store?.name || 'store'}-table-${num}-qr.png`;
          link.click();
          // Small delay between downloads to avoid browser blocking
          await new Promise((r) => setTimeout(r, 150));
        }
        setSuccessMessage({
          title: 'Success',
          message: `${entries.length} QR code downloads started`,
        });
        setShowSuccessModal(true);
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          setErrorMessage({
            title: 'Permission Required',
            message: 'Please grant permission to save images to your gallery.',
          });
          setShowErrorModal(true);
          return;
        }
        for (const [num, dataUrl] of entries) {
          const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
          const fileUri = FileSystem.documentDirectory + `table-${num}-qr.png`;
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await MediaLibrary.saveToLibraryAsync(fileUri);
        }
        setSuccessMessage({
          title: 'Saved',
          message: `${entries.length} table QR codes saved to gallery`,
        });
        setShowSuccessModal(true);
      }
    } catch (err) {
      if (__DEV__) console.error('Error downloading all table QRs:', err);
      setErrorMessage({ title: 'Error', message: 'Failed to download all QR codes' });
      setShowErrorModal(true);
    } finally {
      setDownloadingAll(false);
    }
  };

  // Print all table QR codes
  const handlePrintAll = async () => {
    const entries = Object.entries(tableQRRefs.current);
    if (entries.length === 0) {
      setErrorMessage({
        title: 'Not Ready',
        message: 'QR codes are still loading. Please wait a moment and try again.',
      });
      setShowErrorModal(true);
      return;
    }

    setPrintingAll(true);
    try {
      const tableDataUrls = entries.map(([num, dataUrl]) => ({
        tableNumber: parseInt(num, 10),
        dataUrl,
      }));
      tableDataUrls.sort((a, b) => a.tableNumber - b.tableNumber);
      const html = buildTableQRPrintHTML(store?.name || 'Store', tableDataUrls);
      await Print.printAsync({ html });
      setSuccessMessage({ title: 'Success', message: 'Table QR codes sent to printer' });
      setShowSuccessModal(true);
    } catch (err) {
      if (__DEV__) console.error('Error printing table QRs:', err);
      setErrorMessage({
        title: 'Print Error',
        message: 'Could not open printer. Try downloading and printing manually.',
      });
      setShowErrorModal(true);
    } finally {
      setPrintingAll(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + 20 },
        ]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
      >
        {/* Store Info */}
        <View style={styles.storeInfoCard}>
          <View style={styles.storeIconContainer}>
            <Ionicons name="storefront" size={32} color={Colors.light.primary} />
          </View>
          <Text style={styles.storeName}>{store?.name || 'Your Store'}</Text>
          <Text style={styles.qrCode}>menu.rez.money/{storeSlug}</Text>
        </View>

        {/* QR Type Switcher */}
        <View style={styles.qrTypeSwitcher}>
          <TouchableOpacity
            style={[styles.qrTypeButton, qrType === 'store' && styles.qrTypeButtonActive]}
            onPress={() => setQrType('store')}
          >
            <Ionicons
              name="qr-code"
              size={18}
              color={qrType === 'store' ? '#fff' : Colors.light.primary}
            />
            <Text
              style={[styles.qrTypeButtonText, qrType === 'store' && styles.qrTypeButtonTextActive]}
            >
              Store QR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.qrTypeButton, qrType === 'table' && styles.qrTypeButtonActive]}
            onPress={() => setQrType('table')}
          >
            <Ionicons
              name="grid"
              size={18}
              color={qrType === 'table' ? '#fff' : Colors.light.primary}
            />
            <Text
              style={[styles.qrTypeButtonText, qrType === 'table' && styles.qrTypeButtonTextActive]}
            >
              Table QR
            </Text>
          </TouchableOpacity>
        </View>
        {/* Table QR Section */}
        {qrType === 'table' && (
          <>
            {/* Table count input */}
            <View style={styles.tableInputCard}>
              <Text style={styles.tableInputLabel}>How many tables?</Text>
              <View style={styles.tableInputRow}>
                <TextInput
                  style={styles.tableCountInput}
                  value={tableCountInput}
                  onChangeText={setTableCountInput}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder="e.g. 10"
                  placeholderTextColor={Colors.light.textMuted}
                />
                <TouchableOpacity
                  style={styles.generateTableQRButton}
                  onPress={handleGenerateTableQRs}
                >
                  <Ionicons name="grid-outline" size={18} color="#FFF" />
                  <Text style={styles.generateTableQRButtonText}>Generate Table QR Codes</Text>
                </TouchableOpacity>
              </View>
            </View>

            {tableQRsGenerated && tableCount > 0 && (
              <>
                {/* Bulk action buttons */}
                <View style={styles.tableQRActionsRow}>
                  <TouchableOpacity
                    style={styles.tableQRBulkButton}
                    onPress={handleDownloadAll}
                    disabled={downloadingAll}
                  >
                    {downloadingAll ? (
                      <ActivityIndicator size="small" color={Colors.light.primary} />
                    ) : (
                      <Ionicons name="download-outline" size={18} color={Colors.light.primary} />
                    )}
                    <Text style={styles.tableQRBulkButtonText}>Download All</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.tableQRBulkButton}
                    onPress={handlePrintAll}
                    disabled={printingAll}
                  >
                    {printingAll ? (
                      <ActivityIndicator size="small" color={Colors.light.primary} />
                    ) : (
                      <Ionicons name="print-outline" size={18} color={Colors.light.primary} />
                    )}
                    <Text style={styles.tableQRBulkButtonText}>Print All</Text>
                  </TouchableOpacity>
                </View>

                {/* QR Grid */}
                <View style={styles.tableQRGrid}>
                  {Array.from({ length: tableCount }, (_, i) => i + 1).map((tableNumber) => {
                    const menuUrl = getTableMenuUrl(tableNumber);
                    return (
                      <View key={tableNumber} style={styles.tableQRItem}>
                        <View style={styles.tableQRCodeWrapper}>
                          <QRCode
                            value={menuUrl}
                            size={TABLE_QR_SIZE}
                            backgroundColor="white"
                            color="#000000"
                            quietZone={6}
                            getRef={(ref) => {
                              if (ref) {
                                ref.toDataURL((dataUrl: string) => {
                                  tableQRRefs.current[tableNumber] =
                                    `data:image/png;base64,${dataUrl}`;
                                });
                              }
                            }}
                          />
                        </View>
                        <Text style={styles.tableQRLabel}>Table {tableNumber}</Text>
                        <TouchableOpacity
                          style={styles.tableQRDownloadBtn}
                          onPress={() => {
                            const dataUrl = tableQRRefs.current[tableNumber];
                            if (dataUrl) {
                              downloadTableQR(tableNumber, dataUrl);
                            } else {
                              setErrorMessage({
                                title: 'Not Ready',
                                message: 'QR code is still loading. Try again in a moment.',
                              });
                              setShowErrorModal(true);
                            }
                          }}
                        >
                          <Ionicons
                            name="download-outline"
                            size={14}
                            color={Colors.light.primary}
                          />
                          <Text style={styles.tableQRDownloadBtnText}>Download</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Info box */}
            <View style={[styles.infoBox, { marginTop: 8 }]}>
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Table QR Codes</Text>
                <Text style={styles.infoDescription}>
                  Each table gets a unique QR code that opens your web menu with the table
                  pre-selected. Customers scan to view the menu and place orders directly from their
                  table.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Unified Store QR Code */}
        {qrType === 'store' && (
          <>
            {/* QR Code Card */}
            <View style={styles.qrCard}>
              <View style={styles.qrImageContainer}>
                <QRCode
                  value={`https://menu.rez.money/${storeSlug}`}
                  size={QR_SIZE}
                  backgroundColor="white"
                  color="#000000"
                  quietZone={12}
                  getRef={(ref) => {
                    if (ref) {
                      ref.toDataURL((dataUrl: string) => {
                        storeQRDataUrl.current = `data:image/png;base64,${dataUrl}`;
                      });
                    }
                  }}
                />
              </View>

              <Text style={styles.scanInstruction}>
                Customers scan this to pay directly or browse your menu — no app required
              </Text>

              <Text style={[styles.generatedDate, { marginTop: 6 }]}>
                menu.rez.money/{storeSlug}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={downloadQR}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                ) : (
                  <Ionicons name="download-outline" size={24} color={Colors.light.primary} />
                )}
                <Text style={styles.actionButtonText}>Download</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={shareQR}>
                <Ionicons name="share-outline" size={24} color={Colors.light.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={printQR} disabled={printing}>
                {printing ? (
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                ) : (
                  <Ionicons name="print-outline" size={24} color={Colors.light.primary} />
                )}
                <Text style={styles.actionButtonText}>Print</Text>
              </TouchableOpacity>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Unified QR Code</Text>
                <Text style={styles.infoDescription}>
                  This single QR works for everyone:{'\n'}
                  {'\n'}REZ app users — pays instantly with coins, UPI, or cards
                  {'\n'}Browser users — opens your web menu to browse and order
                  {'\n'}No separate payment and menu QRs needed
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <SuccessModal
        visible={showSuccessModal}
        title={successMessage.title}
        message={successMessage.message}
        onClose={() => setShowSuccessModal(false)}
      />

      <ErrorModal
        visible={showErrorModal}
        title={errorMessage.title}
        message={errorMessage.message}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  storeInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  storeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  qrCode: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  qrCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  qrImageContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  qrImage: {
    width: QR_SIZE,
    height: QR_SIZE,
  },
  scanInstruction: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  generatedDate: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.light.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  managementSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  managementButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  activateButton: {
    backgroundColor: '#10B981',
  },
  deactivateButton: {
    backgroundColor: '#EF4444',
  },
  regenerateButton: {
    backgroundColor: '#6366F1',
  },
  managementButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 20,
  },
  noQRContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noQRIcon: {
    marginBottom: 20,
  },
  noQRTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  noQRDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },

  qrTypeSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  qrTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  qrTypeButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  qrTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  qrTypeButtonTextActive: {
    color: '#FFF',
  },

  // Table QR styles
  tableInputCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableInputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tableInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tableCountInput: {
    width: 72,
    height: 46,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
  },
  generateTableQRButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  generateTableQRButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  tableQRActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tableQRBulkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tableQRBulkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  tableQRGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tableQRItem: {
    width: TABLE_QR_ITEM_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tableQRCodeWrapper: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  tableQRLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  tableQRDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  tableQRDownloadBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
