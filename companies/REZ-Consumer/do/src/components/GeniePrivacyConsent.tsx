/**
 * Genie Privacy Consent Component
 *
 * Privacy consent UI for ambient listening and data collection
 *
 * Usage:
 * ```typescript
 * <GeniePrivacyConsent
 *   onAccept={handleAccept}
 *   onDecline={handleDecline}
 * />
 * ```
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GeniePrivacyConsentProps {
  onAccept: (consents: ConsentState) => void;
  onDecline: () => void;
}

interface ConsentState {
  voiceCommands: boolean;
  voiceWakeWord: boolean;
  activityData: boolean;
  locationData: boolean;
  calendarSync: boolean;
  emailSync: boolean;
}

export function GeniePrivacyConsent({ onAccept, onDecline }: GeniePrivacyConsentProps) {
  const [consents, setConsents] = useState<ConsentState>({
    voiceCommands: true,
    voiceWakeWord: false,
    activityData: false,
    locationData: false,
    calendarSync: false,
    emailSync: false,
  });

  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleConsent = (key: keyof ConsentState) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAcceptAll = () => {
    onAccept({
      voiceCommands: true,
      voiceWakeWord: true,
      activityData: true,
      locationData: true,
      calendarSync: true,
      emailSync: true,
    });
  };

  const handleAcceptSelected = () => {
    onAccept(consents);
  };

  const consentItems = [
    {
      key: 'voiceCommands' as const,
      title: 'Voice Commands',
      description: 'Process voice commands when you tap the mic button',
      required: true,
      icon: 'mic',
      detail: 'Your voice is processed locally or sent to HOJAI AI for transcription. Audio is not stored.',
    },
    {
      key: 'voiceWakeWord' as const,
      title: '"Hey Genie" Wake Word',
      description: 'Listen for "Hey Genie" in the background to activate voice assistant',
      required: false,
      icon: 'volume-high',
      detail: 'Requires microphone permission. Uses minimal battery. Can be disabled anytime in Settings.',
    },
    {
      key: 'calendarSync' as const,
      title: 'Calendar Sync',
      description: 'Sync with Google Calendar and Outlook for meeting reminders',
      required: false,
      icon: 'calendar',
      detail: 'We read your calendar to remind you about meetings and help you prepare.',
    },
    {
      key: 'emailSync' as const,
      title: 'Email Integration',
      description: 'Read emails to track commitments and generate summaries',
      required: false,
      icon: 'mail',
      detail: 'We access your Gmail to remember promises made and summarize important emails.',
    },
    {
      key: 'activityData' as const,
      title: 'Activity Data',
      description: 'Collect usage patterns to personalize your experience',
      required: false,
      icon: 'trending-up',
      detail: 'Learn your habits to provide better recommendations and remember your preferences.',
    },
    {
      key: 'locationData' as const,
      title: 'Location Context',
      description: 'Know your location for contextual reminders',
      required: false,
      icon: 'location',
      detail: 'Used for location-based reminders like "Call John when you reach office."',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={48} color="#6C5CE7" />
        </View>
        <Text style={styles.title}>Your Privacy, Your Control</Text>
        <Text style={styles.subtitle}>
          Genie needs your permission to help you. You can change these anytime in Settings.
        </Text>
      </View>

      {/* Consent Items */}
      <View style={styles.consentList}>
        {consentItems.map((item) => (
          <View key={item.key} style={styles.consentItem}>
            <TouchableOpacity
              style={styles.consentHeader}
              onPress={() => setExpandedItem(expandedItem === item.key ? null : item.key)}
            >
              <View style={styles.consentInfo}>
                <View style={styles.consentTitleRow}>
                  <Ionicons name={item.icon as any} size={20} color="#6C5CE7" />
                  <Text style={styles.consentTitle}>{item.title}</Text>
                  {item.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.consentDescription}>{item.description}</Text>
              </View>

              <View style={[
                styles.toggleContainer,
                item.required && styles.toggleDisabled,
                consents[item.key] && styles.toggleActive,
              ]}>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    consents[item.key] && styles.toggleOn,
                    item.required && styles.toggleRequired,
                  ]}
                  onPress={() => !item.required && toggleConsent(item.key)}
                  disabled={item.required}
                >
                  <View style={[
                    styles.toggleKnob,
                    consents[item.key] && styles.toggleKnobOn,
                  ]} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {expandedItem === item.key && (
              <View style={styles.consentDetail}>
                <Text style={styles.consentDetailText}>{item.detail}</Text>
                {!item.required && (
                  <TouchableOpacity
                    style={styles.learnMore}
                    onPress={() => Linking.openSettings()}
                  >
                    <Text style={styles.learnMoreText}>Manage in Settings</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Privacy Link */}
      <TouchableOpacity style={styles.privacyLink}>
        <Ionicons name="document-text-outline" size={16} color="#6C5CE7" />
        <Text style={styles.privacyLinkText}>Read our Privacy Policy</Text>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.acceptAllButton} onPress={handleAcceptAll}>
          <Text style={styles.acceptAllText}>Accept All</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={handleAcceptSelected}>
          <Text style={styles.continueText}>Continue with Selected</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
          <Text style={styles.declineText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  consentList: {
    padding: 16,
  },
  consentItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  consentInfo: {
    flex: 1,
    marginRight: 12,
  },
  consentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginLeft: 8,
  },
  requiredBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  consentDescription: {
    fontSize: 13,
    color: '#666',
    marginLeft: 28,
  },
  toggleContainer: {
    padding: 4,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleActive: {
    // Active state styling
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    padding: 2,
  },
  toggleOn: {
    backgroundColor: '#6C5CE7',
  },
  toggleRequired: {
    backgroundColor: '#6C5CE7',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  consentDetail: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  consentDetailText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  learnMore: {
    marginTop: 8,
  },
  learnMoreText: {
    fontSize: 13,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  privacyLinkText: {
    fontSize: 14,
    color: '#6C5CE7',
    marginLeft: 4,
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  acceptAllButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#F0EBFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueText: {
    color: '#6C5CE7',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineText: {
    color: '#999',
    fontSize: 14,
  },
});

export default GeniePrivacyConsent;