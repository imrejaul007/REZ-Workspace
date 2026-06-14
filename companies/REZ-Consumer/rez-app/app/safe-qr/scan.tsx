// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

// API URL from environment - use production URL as fallback
const API_URL = process.env.EXPO_PUBLIC_SAFE_QR_API || 'https://rez-safe-qr-service.onrender.com/api';

interface ScanResult {
  shortcode: string;
  mode: string;
  status: string;
  profile?;
  templates?: Array<{ id: string; label: string; message: string; icon?: string }>;
  settings?: {
    allowMessages: boolean;
    allowContactRequests: boolean;
  };
}

const MODE_CONFIG: Record<string, { icon: string; color: string; name: string }> = {
  pet: { icon: '🐕', color: '#f59e0b', name: 'Pet' },
  personal: { icon: '👤', color: '#6366f1', name: 'Personal' },
  device: { icon: '💻', color: '#10b981', name: 'Device' },
  medical: { icon: '🏥', color: '#ef4444', name: 'Medical' },
  helmet: { icon: '⛑️', color: '#8b5cf6', name: 'Helmet' },
  child: { icon: '👶', color: '#ec4899', name: 'Child' },
  vehicle: { icon: '🚗', color: '#3b82f6', name: 'Vehicle' },
  bicycle: { icon: '🚲', color: '#f97316', name: 'Bicycle' },
  key: { icon: '🔑', color: '#84cc16', name: 'Key' },
  luggage: { icon: '🧳', color: '#06b6d4', name: 'Luggage' },
  home: { icon: '🏠', color: '#14b8a6', name: 'Home' },
  office: { icon: '🏢', color: '#64748b', name: 'Office' },
  event: { icon: '🎉', color: '#d946ef', name: 'Event' },
  student: { icon: '🎒', color: '#0ea5e9', name: 'Student' },
  package: { icon: '📦', color: '#a855f7', name: 'Package' },
};

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function handleBarCodeScanned({ type, data }: { type: string; data: string }) {
    if (scanned || isLoading) return;

    setScanned(true);
    setIsLoading(true);

    try {
      let shortcode = data;

      // Parse JSON payload
      if (data.startsWith('{')) {
        const payload = JSON.parse(data);
        if (payload.shortcode) shortcode = payload.shortcode;
      }

      // Parse URL format
      if (data.includes('/s/') || data.includes('/qr/')) {
        const parts = data.split('/');
        shortcode = parts[parts.length - 1].split('?')[0];
      }

      shortcode = shortcode.toUpperCase().trim();

      // Fetch scan data
      const response = await fetch(`${API_URL}/scan/${shortcode}`);
      const result = await response.json();

      if (result.success) {
        setScanResult(result.data);
      } else {
        Alert.alert('Error', 'QR not found');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to scan QR');
      setScanned(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleManualSubmit() {
    if (!manualCode.trim()) {
      Alert.alert('Error', 'Please enter a shortcode');
      return;
    }

    const shortcode = manualCode.toUpperCase().trim();
    setScanned(true);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/scan/${shortcode}`);
      const result = await response.json();

      if (result.success) {
        setScanResult(result.data);
        setShowManual(false);
        setManualCode('');
      } else {
        Alert.alert('Error', 'QR not found');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to scan QR');
      setScanned(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage() {
    if (!scanResult) return;
    if (!selectedTemplate && !customMessage.trim()) {
      Alert.alert('Error', 'Please select a template or enter a message');
      return;
    }

    setIsSending(true);

    try {
      const content = selectedTemplate
        ? scanResult.templates?.find((t) => t.id === selectedTemplate)?.message || ''
        : customMessage.trim();

      const response = await fetch(`${API_URL}/scan/${scanResult.shortcode}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type: selectedTemplate ? 'template' : 'text',
          templateId: selectedTemplate,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Sent!', 'Your message has been sent.', [
          { text: 'OK', onPress: () => resetScan() },
        ]);
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to send');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }

  function resetScan() {
    setScanResult(null);
    setScanned(false);
    setSelectedTemplate(null);
    setCustomMessage('');
  }

  // Permission check
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>We need camera access to scan QR codes</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.manualButton} onPress={() => setShowManual(true)}>
          <Text style={styles.manualButtonText}>Enter Code Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Manual entry
  if (showManual) {
    return (
      <View style={styles.manualContainer}>
        <Text style={styles.manualTitle}>Enter Shortcode</Text>
        <TextInput
          style={styles.manualInput}
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="REZP01"
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          maxLength={6}
          autoFocus
        />
        <View style={styles.manualButtons}>
          <TouchableOpacity style={styles.manualCancel} onPress={() => setShowManual(false)}>
            <Text style={styles.manualCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualSubmit} onPress={handleManualSubmit}>
            <Text style={styles.manualSubmitText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Scan result
  if (scanResult) {
    const modeConfig = MODE_CONFIG[scanResult.mode] || MODE_CONFIG.pet;

    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={[styles.resultHeader, { backgroundColor: modeConfig.color }]}>
          <Text style={styles.modeIcon}>{modeConfig.icon}</Text>
          <Text style={styles.modeName}>{modeConfig.name}</Text>
          {scanResult.status === 'lost' && (
            <View style={styles.lostBadge}>
              <Text style={styles.lostText}>LOST</Text>
            </View>
          )}
        </View>

        {/* Profile */}
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>
            {scanResult.profile?.name ||
             scanResult.profile?.displayName ||
             scanResult.profile?.brand ||
             scanResult.shortcode}
          </Text>
          {scanResult.profile?.breed && (
            <Text style={styles.profileSubtitle}>{scanResult.profile.breed}</Text>
          )}
          {scanResult.profile?.description && (
            <Text style={styles.profileDesc}>{scanResult.profile.description}</Text>
          )}
        </View>

        {/* Templates */}
        {scanResult.settings?.allowMessages && scanResult.templates?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Messages</Text>
            <View style={styles.templatesGrid}>
              {scanResult.templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    selectedTemplate === template.id && styles.templateCardSelected,
                  ]}
                  onPress={() => setSelectedTemplate(template.id)}
                >
                  <Text style={styles.templateIcon}>{template.icon || '💬'}</Text>
                  <Text style={styles.templateLabel}>{template.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Custom Message */}
        {scanResult.settings?.allowMessages && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Or Write Your Own</Text>
            <TextInput
              style={styles.customInput}
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder="Type your message..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Actions */}
        {scanResult.settings?.allowMessages && (
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Message</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.resetButton} onPress={resetScan}>
          <Text style={styles.resetButtonText}>Scan Another QR</Text>
        </TouchableOpacity>

        {/* Emergency Note */}
        {scanResult.mode === 'medical' && (
          <View style={styles.emergencyNote}>
            <Text style={styles.emergencyText}>
              For life-threatening emergencies, call emergency services immediately.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // Camera Scanner
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Scan Safe QR</Text>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.loadingText}>Scanning...</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Point camera at a Safe QR code</Text>
            <TouchableOpacity onPress={() => setShowManual(true)}>
              <Text style={styles.manualEntryText}>Enter code manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    marginTop: 16,
  },
  manualButtonText: {
    color: '#6366f1',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6366f1',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  manualEntryText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  manualContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
  },
  manualTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  manualInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,
    color: '#1f2937',
  },
  manualButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  manualCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  manualCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  manualSubmit: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  manualSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultHeader: {
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeIcon: {
    fontSize: 32,
  },
  modeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  lostBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  lostText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  profileDesc: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  templateCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  templateIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  templateLabel: {
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'center',
  },
  customInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#1f2937',
  },
  sendButton: {
    margin: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#6366f1',
    fontSize: 16,
  },
  emergencyNote: {
    margin: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emergencyText: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
  },
});
