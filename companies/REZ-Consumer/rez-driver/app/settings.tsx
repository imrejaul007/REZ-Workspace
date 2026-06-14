import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverStore } from '../src/stores';
import { settingsApi } from '../src/services/api';
import { Card } from '../src/components';
import { DriverSettings } from '../src/types';

export default function SettingsScreen() {
  const { settings, updateSettings } = useDriverStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await settingsApi.getSettings();
        if (response.success && response.data) {
          updateSettings(response.data);
        }
      } catch (error) {
        logger.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Update setting with save
  const updateSetting = async <K extends keyof DriverSettings>(
    key: K,
    value: DriverSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    updateSettings({ [key]: value });

    setSaving(true);
    try {
      await settingsApi.updateSettings({ [key]: value });
    } catch (error) {
      // Revert on error
      updateSettings(settings);
      Alert.alert('Error', 'Failed to save setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Update nested setting
  const updateNestedSetting = async <P extends keyof DriverSettings, C extends keyof DriverSettings[P]>(
    parent: P,
    child: C,
    value: boolean | number | string
  ) => {
    const newParentSettings = {
      ...settings[parent],
      [child]: value,
    };
    updateSettings({ [parent]: newParentSettings as DriverSettings[P] });

    setSaving(true);
    try {
      await settingsApi.updateSettings({
        [parent]: newParentSettings,
      });
    } catch (error) {
      // Revert on error
      updateSettings({ [parent]: settings[parent] });
      Alert.alert('Error', 'Failed to save setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Navigation app options
  const navAppOptions = [
    { value: 'google', label: 'Google Maps' },
    { value: 'waze', label: 'Waze' },
    { value: 'apple', label: 'Apple Maps' },
  ] as const;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <Card style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sound</Text>
                <Text style={styles.settingDescription}>
                  Play sound for new notifications
                </Text>
              </View>
              <Switch
                value={settings.notifications.sound}
                onValueChange={(value) =>
                  updateNestedSetting('notifications', 'sound', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Vibration</Text>
                <Text style={styles.settingDescription}>
                  Vibrate for new notifications
                </Text>
              </View>
              <Switch
                value={settings.notifications.vibration}
                onValueChange={(value) =>
                  updateNestedSetting('notifications', 'vibration', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Delivery Requests</Text>
                <Text style={styles.settingDescription}>
                  Get notified for new deliveries
                </Text>
              </View>
              <Switch
                value={settings.notifications.deliveryRequests}
                onValueChange={(value) =>
                  updateNestedSetting('notifications', 'deliveryRequests', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Earnings Updates</Text>
                <Text style={styles.settingDescription}>
                  Notifications about your earnings
                </Text>
              </View>
              <Switch
                value={settings.notifications.earningsUpdates}
                onValueChange={(value) =>
                  updateNestedSetting('notifications', 'earningsUpdates', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Promotions</Text>
                <Text style={styles.settingDescription}>
                  Deals and promotional offers
                </Text>
              </View>
              <Switch
                value={settings.notifications.promotions}
                onValueChange={(value) =>
                  updateNestedSetting('notifications', 'promotions', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>
          </Card>
        </View>

        {/* Availability Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>

          <Card style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Accept</Text>
                <Text style={styles.settingDescription}>
                  Automatically accept delivery requests
                </Text>
              </View>
              <Switch
                value={settings.availability.autoAccept}
                onValueChange={(value) =>
                  updateNestedSetting('availability', 'autoAccept', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Prefer Near Me</Text>
                <Text style={styles.settingDescription}>
                  Prioritize nearby deliveries
                </Text>
              </View>
              <Switch
                value={settings.availability.preferNearMe}
                onValueChange={(value) =>
                  updateNestedSetting('availability', 'preferNearMe', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Max Distance</Text>
                <Text style={styles.settingDescription}>
                  Only show deliveries within {settings.availability.maxDistance} km
                </Text>
              </View>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    updateNestedSetting(
                      'availability',
                      'maxDistance',
                      Math.max(1, settings.availability.maxDistance - 1)
                    )
                  }
                  disabled={settings.availability.maxDistance <= 1}
                >
                  <Text style={styles.stepperButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>
                  {settings.availability.maxDistance} km
                </Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    updateNestedSetting(
                      'availability',
                      'maxDistance',
                      Math.min(50, settings.availability.maxDistance + 1)
                    )
                  }
                  disabled={settings.availability.maxDistance >= 50}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>

        {/* Navigation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation</Text>

          <Card style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Preferred App</Text>
                <Text style={styles.settingDescription}>
                  {navAppOptions.find((o) => o.value === settings.navigation.preferredApp)?.label}
                </Text>
              </View>
            </View>
            <View style={styles.optionsContainer}>
              {navAppOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    settings.navigation.preferredApp === option.value &&
                      styles.optionButtonSelected,
                  ]}
                  onPress={() =>
                    updateNestedSetting(
                      'navigation',
                      'preferredApp',
                      option.value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      settings.navigation.preferredApp === option.value &&
                        styles.optionButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Avoid Highways</Text>
                <Text style={styles.settingDescription}>
                  Skip highways in routes
                </Text>
              </View>
              <Switch
                value={settings.navigation.avoidHighways}
                onValueChange={(value) =>
                  updateNestedSetting('navigation', 'avoidHighways', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Avoid Tolls</Text>
                <Text style={styles.settingDescription}>
                  Skip toll roads in routes
                </Text>
              </View>
              <Switch
                value={settings.navigation.avoidTolls}
                onValueChange={(value) =>
                  updateNestedSetting('navigation', 'avoidTolls', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>
          </Card>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <Card style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Phone to Merchant</Text>
                <Text style={styles.settingDescription}>
                  Let merchants see your phone number
                </Text>
              </View>
              <Switch
                value={settings.privacy.showPhoneToMerchant}
                onValueChange={(value) =>
                  updateNestedSetting('privacy', 'showPhoneToMerchant', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Phone to Customer</Text>
                <Text style={styles.settingDescription}>
                  Let customers see your phone number
                </Text>
              </View>
              <Switch
                value={settings.privacy.showPhoneToCustomer}
                onValueChange={(value) =>
                  updateNestedSetting('privacy', 'showPhoneToCustomer', value)
                }
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>
          </Card>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <TouchableOpacity>
            <Card style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Clear Cache</Text>
                  <Text style={styles.settingDescription}>
                    Free up storage space
                  </Text>
                </View>
                <Text style={styles.menuArrow}>{'>'}</Text>
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity>
            <Card style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Export Data</Text>
                  <Text style={styles.settingDescription}>
                    Download your account data
                  </Text>
                </View>
                <Text style={styles.menuArrow}>{'>'}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>

          <Card style={[styles.card, styles.dangerCard]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, styles.dangerText]}>
                  Delete Account
                </Text>
                <Text style={styles.settingDescription}>
                  Permanently delete your account and data
                </Text>
              </View>
              <Text style={[styles.menuArrow, styles.dangerText]}>{'>'}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    padding: 0,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#FF3B3010',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#007AFF15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginHorizontal: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
  },
  menuArrow: {
    fontSize: 18,
    color: '#C7C7CC',
  },
  dangerText: {
    color: '#FF3B30',
  },
});
