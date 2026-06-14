/**
 * WakeWordSettings - Wake Word Configuration Component
 *
 * Configure "Hey Genie" wake word settings
 *
 * Usage:
 * ```typescript
 * <WakeWordSettings userId={userId} />
 * ```
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const WAKE_WORD_URL = process.env.EXPO_PUBLIC_HOJAI_WAKE_WORD_URL || 'http://localhost:4580';

interface WakeWordSettingsProps {
  userId: string;
  onClose?: () => void;
}

interface WakeWord {
  id: string;
  name: string;
  phrase: string;
  type: 'default' | 'custom';
  enabled: boolean;
  sensitivity: number;
}

interface Settings {
  alwaysListening: boolean;
  confirmationSound: boolean;
  visualFeedback: boolean;
  wakeOnWhisper: boolean;
  multipleDevices: boolean;
  language: string;
}

export function WakeWordSettings({ userId, onClose }: WakeWordSettingsProps) {
  const [wakeWords, setWakeWords] = useState<WakeWord[]>([]);
  const [settings, setSettings] = useState<Settings>({
    alwaysListening: false,
    confirmationSound: true,
    visualFeedback: true,
    wakeOnWhisper: false,
    multipleDevices: true,
    language: 'en',
  });
  const [loading, setLoading] = useState(true);
  const [newPhrase, setNewPhrase] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingPhrase, setTestingPhrase] = useState('');
  const [testResult, setTestResult] = useState<{ detected: boolean; response?: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      // Initialize user
      await axios.post(`${WAKE_WORD_URL}/user/${userId}`);

      // Get wake words
      const wwResponse = await axios.get(`${WAKE_WORD_URL}/user/${userId}/wakewords`);
      setWakeWords(wwResponse.data.wakeWords || []);

      // Get settings
      const settingsResponse = await axios.get(`${WAKE_WORD_URL}/user/${userId}/settings`);
      setSettings(settingsResponse.data.settings || settings);
    } catch (error) {
      console.error('Load settings error:', error);
      // Use defaults
      setWakeWords([
        { id: '1', name: 'Genie', phrase: 'hey genie', type: 'default', enabled: true, sensitivity: 0.5 },
        { id: '2', name: 'Genie Home', phrase: 'hey genie home', type: 'default', enabled: true, sensitivity: 0.5 },
        { id: '3', name: 'Genie Office', phrase: 'hey genie office', type: 'default', enabled: true, sensitivity: 0.5 },
        { id: '4', name: 'Genie Car', phrase: 'hey genie car', type: 'default', enabled: true, sensitivity: 0.5 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await axios.put(`${WAKE_WORD_URL}/user/${userId}/settings`, { [key]: value });
    } catch (error) {
      console.error('Update setting error:', error);
    }
  };

  const toggleWakeWord = async (wakeWordId: string, enabled: boolean) => {
    const updated = wakeWords.map(ww =>
      ww.id === wakeWordId ? { ...ww, enabled } : ww
    );
    setWakeWords(updated);

    try {
      await axios.put(`${WAKE_WORD_URL}/user/${userId}/wakewords/${wakeWordId}`, { enabled });
    } catch (error) {
      console.error('Toggle wake word error:', error);
    }
  };

  const updateSensitivity = async (wakeWordId: string, sensitivity: number) => {
    const updated = wakeWords.map(ww =>
      ww.id === wakeWordId ? { ...ww, sensitivity } : ww
    );
    setWakeWords(updated);

    try {
      await axios.put(`${WAKE_WORD_URL}/user/${userId}/wakewords/${wakeWordId}`, { sensitivity });
    } catch (error) {
      console.error('Update sensitivity error:', error);
    }
  };

  const addCustomWakeWord = async () => {
    if (!newPhrase.trim()) {
      Alert.alert('Error', 'Please enter a wake word phrase');
      return;
    }

    const phrase = newPhrase.toLowerCase().trim();

    // Check if already exists
    if (wakeWords.some(ww => ww.phrase === phrase)) {
      Alert.alert('Error', 'This wake word already exists');
      return;
    }

    try {
      const response = await axios.post(`${WAKE_WORD_URL}/user/${userId}/wakewords`, {
        phrase,
        name: phrase,
        sensitivity: 0.5,
      });

      setWakeWords([...wakeWords, response.data.wakeWord]);
      setNewPhrase('');
      setShowAddForm(false);
      Alert.alert('Success', `"${phrase}" added as your wake word`);
    } catch (error) {
      console.error('Add wake word error:', error);
      Alert.alert('Error', 'Failed to add wake word');
    }
  };

  const deleteWakeWord = async (wakeWordId: string) => {
    const ww = wakeWords.find(w => w.id === wakeWordId);
    if (ww?.type === 'default') {
      Alert.alert('Error', 'Cannot delete default wake words');
      return;
    }

    Alert.alert(
      'Delete Wake Word',
      'Are you sure you want to delete this wake word?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${WAKE_WORD_URL}/user/${userId}/wakewords/${wakeWordId}`);
              setWakeWords(wakeWords.filter(w => w.id !== wakeWordId));
            } catch (error) {
              console.error('Delete wake word error:', error);
            }
          },
        },
      ]
    );
  };

  const testWakeWord = async () => {
    if (!testingPhrase.trim()) {
      Alert.alert('Error', 'Please enter a phrase to test');
      return;
    }

    try {
      const response = await axios.post(`${WAKE_WORD_URL}/user/${userId}/test`, {
        phrase: testingPhrase,
      });
      setTestResult(response.data);
    } catch (error) {
      console.error('Test wake word error:', error);
      setTestResult({ detected: false });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="ear" size={24} color="#6C5CE7" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>"Hey Genie" Settings</Text>
          <Text style={styles.headerSubtitle}>
            Configure your voice wake word
          </Text>
        </View>
      </View>

      {/* Wake Words */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wake Words</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons name={showAddForm ? 'close' : 'add'} size={20} color="#6C5CE7" />
          </TouchableOpacity>
        </View>

        {/* Add Custom Form */}
        {showAddForm && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Enter wake word (e.g., 'hey genie pro')"
              placeholderTextColor="#999"
              value={newPhrase}
              onChangeText={setNewPhrase}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addFormButton} onPress={addCustomWakeWord}>
              <Text style={styles.addFormButtonText}>Add Wake Word</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Wake Word List */}
        {wakeWords.map((ww) => (
          <View key={ww.id} style={styles.wakeWordItem}>
            <View style={styles.wakeWordInfo}>
              <View style={styles.wakeWordName}>
                <Text style={styles.wakeWordNameText}>{ww.name}</Text>
                {ww.type === 'default' && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.wakeWordPhrase}>"{ww.phrase}"</Text>
            </View>

            <View style={styles.wakeWordControls}>
              {/* Sensitivity */}
              <View style={styles.sensitivityControl}>
                <TouchableOpacity
                  style={[styles.sensitivityBtn, ww.sensitivity < 0.5 && styles.sensitivityBtnActive]}
                  onPress={() => updateSensitivity(ww.id, Math.max(0.1, ww.sensitivity - 0.1))}
                >
                  <Ionicons name="remove" size={14} color="#666" />
                </TouchableOpacity>
                <View style={styles.sensitivityBar}>
                  <View
                    style={[
                      styles.sensitivityFill,
                      { width: `${ww.sensitivity * 100}%` },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.sensitivityBtn, ww.sensitivity > 0.5 && styles.sensitivityBtnActive]}
                  onPress={() => updateSensitivity(ww.id, Math.min(1, ww.sensitivity + 0.1))}
                >
                  <Ionicons name="add" size={14} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Enable/Disable */}
              <Switch
                value={ww.enabled}
                onValueChange={(value) => toggleWakeWord(ww.id, value)}
                trackColor={{ false: '#E0E0E0', true: '#B8A8FF' }}
                thumbColor={ww.enabled ? '#6C5CE7' : '#f4f3f4'}
              />

              {/* Delete */}
              {ww.type === 'custom' && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteWakeWord(ww.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#E74C3C" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="mic" size={20} color="#6C5CE7" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Always Listening</Text>
              <Text style={styles.settingDescription}>
                Continuously listen for wake word (uses more battery)
              </Text>
            </View>
          </View>
          <Switch
            value={settings.alwaysListening}
            onValueChange={(value) => updateSetting('alwaysListening', value)}
            trackColor={{ false: '#E0E0E0', true: '#B8A8FF' }}
            thumbColor={settings.alwaysListening ? '#6C5CE7' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="volume-high" size={20} color="#6C5CE7" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Confirmation Sound</Text>
              <Text style={styles.settingDescription}>
                Play sound when wake word is detected
              </Text>
            </View>
          </View>
          <Switch
            value={settings.confirmationSound}
            onValueChange={(value) => updateSetting('confirmationSound', value)}
            trackColor={{ false: '#E0E0E0', true: '#B8A8FF' }}
            thumbColor={settings.confirmationSound ? '#6C5CE7' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait" size={20} color="#6C5CE7" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Visual Feedback</Text>
              <Text style={styles.settingDescription}>
                Show indicator when listening
              </Text>
            </View>
          </View>
          <Switch
            value={settings.visualFeedback}
            onValueChange={(value) => updateSetting('visualFeedback', value)}
            trackColor={{ false: '#E0E0E0', true: '#B8A8FF' }}
            thumbColor={settings.visualFeedback ? '#6C5CE7' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="volume-low" size={20} color="#6C5CE7" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Wake on Whisper</Text>
              <Text style={styles.settingDescription}>
                Detect quiet voice commands (experimental)
              </Text>
            </View>
          </View>
          <Switch
            value={settings.wakeOnWhisper}
            onValueChange={(value) => updateSetting('wakeOnWhisper', value)}
            trackColor={{ false: '#E0E0E0', true: '#B8A8FF' }}
            thumbColor={settings.wakeOnWhisper ? '#6C5CE7' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="watch" size={20} color="#6C5CE7" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Multiple Devices</Text>
              <Text style={styles.settingDescription}>
                Sync wake word settings across devices
              </Text>
            </View>
          </View>
          <Switch
            value={settings.multipleDevices}
            onValueChange={(value) => updateSetting('multipleDevices', value)}
            trackColor={{ false: '#E0E0E0', true: '#B8A8FF' }}
            thumbColor={settings.multipleDevices ? '#6C5CE7' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Test Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Wake Word</Text>
        <View style={styles.testContainer}>
          <TextInput
            style={styles.testInput}
            placeholder="Type 'hey genie' to test"
            placeholderTextColor="#999"
            value={testingPhrase}
            onChangeText={setTestingPhrase}
          />
          <TouchableOpacity style={styles.testButton} onPress={testWakeWord}>
            <Ionicons name="play" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {testResult && (
          <View style={[
            styles.testResult,
            testResult.detected ? styles.testResultSuccess : styles.testResultFail
          ]}>
            <Ionicons
              name={testResult.detected ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={testResult.detected ? '#4CAF50' : '#E74C3C'}
            />
            <Text style={styles.testResultText}>
              {testResult.response || (testResult.detected ? 'Wake word detected!' : 'No wake word detected')}
            </Text>
          </View>
        )}
      </View>

      {/* Battery Info */}
      <View style={styles.batteryInfo}>
        <Ionicons name="battery-half" size={16} color="#666" />
        <Text style={styles.batteryText}>
          Wake word detection uses ~2% battery per day with always listening enabled
        </Text>
      </View>

      {/* Close Button */}
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addForm: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  addFormButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addFormButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  wakeWordItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  wakeWordInfo: {
    marginBottom: 12,
  },
  wakeWordName: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  wakeWordNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  defaultBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  wakeWordPhrase: {
    fontSize: 14,
    color: '#6C5CE7',
  },
  wakeWordControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensitivityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  sensitivityBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensitivityBtnActive: {
    backgroundColor: '#6C5CE7',
  },
  sensitivityBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  sensitivityFill: {
    height: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: 2,
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  testContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  testInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A2E',
    marginRight: 12,
  },
  testButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  testResultSuccess: {
    backgroundColor: '#E8F5E9',
  },
  testResultFail: {
    backgroundColor: '#FFEBEE',
  },
  testResultText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1A1A2E',
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  batteryText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  closeButton: {
    margin: 20,
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WakeWordSettings;