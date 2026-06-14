import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '@/constants/DesignTokens';
import { storageService } from '@/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface KDSSettings {
  selectedStoreId?: string;
  showColumns: {
    new: boolean;
    preparing: boolean;
    ready: boolean;
  };
  autoAcceptOrders: boolean;
  soundAlertsEnabled: boolean;
  prepTimeDefaults: {
    category: string;
    minutes: number;
  }[];
  alertAfterMinutes: number;
  keepScreenOn: boolean;
  displayMode: 'compact' | 'normal' | 'large';
}

const DEFAULT_SETTINGS: KDSSettings = {
  showColumns: { new: true, preparing: true, ready: true },
  autoAcceptOrders: false,
  soundAlertsEnabled: true,
  prepTimeDefaults: [
    { category: 'Appetizers', minutes: 5 },
    { category: 'Mains', minutes: 15 },
    { category: 'Desserts', minutes: 8 },
  ],
  alertAfterMinutes: 5,
  keepScreenOn: true,
  displayMode: 'normal',
};

export default function KDSSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<KDSSettings>(DEFAULT_SETTINGS);
  const [stores, setStores] = useState<unknown[]>([]);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('kds_settings');
        if (saved) {
          setSettings(JSON.parse(saved));
        }

        const merchantData = await storageService.getMerchantData<unknown>();
        if (merchantData?.stores) {
          setStores(merchantData.stores);
        }
      } catch (error) {
        logger.warn('Failed to load KDS settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem('kds_settings', JSON.stringify(settings));
      router.back();
    } catch (error) {
      logger.error('Failed to save KDS settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateColumnVisibility = (column: 'new' | 'preparing' | 'ready', value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      showColumns: { ...prev.showColumns, [column]: value },
    }));
  };

  const updateDisplayMode = (mode: 'compact' | 'normal' | 'large') => {
    setSettings((prev) => ({ ...prev, displayMode: mode }));
  };

  const updateAlertMinutes = (text: string) => {
    const num = parseInt(text) || 5;
    setSettings((prev) => ({
      ...prev,
      alertAfterMinutes: Math.max(1, num),
    }));
  };

  const updatePrepTime = (categoryIndex: number, minutes: number) => {
    setSettings((prev) => ({
      ...prev,
      prepTimeDefaults: prev.prepTimeDefaults.map((p, i) =>
        i === categoryIndex ? { ...p, minutes } : p
      ),
    }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KDS Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Store Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store</Text>
          <TouchableOpacity style={styles.card} onPress={() => setShowStorePicker(true)}>
            <View style={styles.cardContent}>
              <Ionicons name="storefront" size={20} color={Colors.primary[500]} />
              <View style={styles.cardText}>
                <Text style={styles.label}>Selected Store</Text>
                <Text style={styles.value}>
                  {settings.selectedStoreId
                    ? stores.find((s) => s._id === settings.selectedStoreId)?.name || 'Select Store'
                    : 'Select Store'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Display Columns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Columns</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleContent}>
                <Ionicons name="alert-circle" size={20} color={Colors.success[500]} />
                <Text style={styles.toggleLabel}>New Orders</Text>
              </View>
              <Switch
                value={settings.showColumns.new}
                onValueChange={(v) => updateColumnVisibility('new', v)}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleContent}>
                <Ionicons name="hourglass" size={20} color={Colors.warning[500]} />
                <Text style={styles.toggleLabel}>Preparing</Text>
              </View>
              <Switch
                value={settings.showColumns.preparing}
                onValueChange={(v) => updateColumnVisibility('preparing', v)}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleContent}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.error[500]} />
                <Text style={styles.toggleLabel}>Ready</Text>
              </View>
              <Switch
                value={settings.showColumns.ready}
                onValueChange={(v) => updateColumnVisibility('ready', v)}
              />
            </View>
          </View>
        </View>

        {/* Display Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Size</Text>
          <View style={styles.card}>
            {(['compact', 'normal', 'large'] as const).map((mode) => (
              <View key={mode}>
                <TouchableOpacity style={styles.toggleRow} onPress={() => updateDisplayMode(mode)}>
                  <Text style={styles.toggleLabel}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                  <View
                    style={[
                      styles.radioButton,
                      settings.displayMode === mode && styles.radioButtonActive,
                    ]}
                  >
                    {settings.displayMode === mode && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
                {mode !== 'large' && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Sound Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alerts & Notifications</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleContent}>
                <Ionicons name="volume-high" size={20} color={Colors.primary[500]} />
                <Text style={styles.toggleLabel}>Sound Alerts</Text>
              </View>
              <Switch
                value={settings.soundAlertsEnabled}
                onValueChange={(v) =>
                  setSettings((prev) => ({
                    ...prev,
                    soundAlertsEnabled: v,
                  }))
                }
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Alert if Delayed (minutes)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={settings.alertAfterMinutes.toString()}
                onChangeText={updateAlertMinutes}
                placeholder="5"
              />
            </View>
            <Text style={styles.helperText}>Notify if order exceeds prep time</Text>
          </View>
        </View>

        {/* Auto-Accept Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workflow</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleContent}>
                <Ionicons name="flash" size={20} color={Colors.primary[500]} />
                <Text style={styles.toggleLabel}>Auto-Accept Orders</Text>
              </View>
              <Switch
                value={settings.autoAcceptOrders}
                onValueChange={(v) =>
                  setSettings((prev) => ({
                    ...prev,
                    autoAcceptOrders: v,
                  }))
                }
              />
            </View>
            <Text style={[styles.helperText, { marginTop: Spacing.sm }]}>
              Automatically move new orders to "Preparing"
            </Text>
          </View>
        </View>

        {/* Prep Time Defaults */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prep Time Defaults</Text>
          <View style={styles.card}>
            {settings.prepTimeDefaults.map((prepTime, idx) => (
              <View key={idx}>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>{prepTime.category}</Text>
                  <View style={styles.prepTimeInput}>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={prepTime.minutes.toString()}
                      onChangeText={(text) => updatePrepTime(idx, parseInt(text) || 0)}
                      placeholder="0"
                    />
                    <Text style={styles.helperText}>min</Text>
                  </View>
                </View>
                {idx < settings.prepTimeDefaults.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Screen Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleContent}>
                <Ionicons name="phone-portrait" size={20} color={Colors.primary[500]} />
                <Text style={styles.toggleLabel}>Keep Screen On</Text>
              </View>
              <Switch
                value={settings.keepScreenOn}
                onValueChange={(v) =>
                  setSettings((prev) => ({
                    ...prev,
                    keepScreenOn: v,
                  }))
                }
              />
            </View>
            <Text style={[styles.helperText, { marginTop: Spacing.sm }]}>
              Prevents screen lock while KDS is active
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
          onPress={handleSaveSettings}
          disabled={isSaving}
        >
          <Ionicons name="checkmark" size={20} color={Colors.text.inverse} />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Store Picker Modal */}
      <Modal visible={showStorePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Store</Text>
              <TouchableOpacity onPress={() => setShowStorePicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store._id}
                  style={[
                    styles.storeOption,
                    settings.selectedStoreId === store._id && styles.storeOptionActive,
                  ]}
                  onPress={() => {
                    setSettings((prev) => ({ ...prev, selectedStoreId: store._id }));
                    setShowStorePicker(false);
                  }}
                >
                  <Text style={styles.storeOptionText}>{store.name}</Text>
                  {settings.selectedStoreId === store._id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary[500]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginHorizontal: Spacing.md,
  },
  inputRow: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text.primary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    paddingHorizontal: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
  },
  storeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  storeOptionActive: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  storeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary[500],
  },
  prepTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
