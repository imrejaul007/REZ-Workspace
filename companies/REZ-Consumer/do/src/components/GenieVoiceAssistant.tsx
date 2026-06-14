/**
 * GenieVoiceAssistant - Enhanced Voice UI for DO App
 *
 * Integrated with Genie Services + HOJAI AI
 *
 * Usage:
 * ```typescript
 * import { GenieVoiceAssistant } from '@/components/GenieVoiceAssistant';
 *
 * <GenieVoiceAssistant userId="user_123" />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Mic, MicOff, Loader2, Sparkles } from 'lucide-react-native';
import { useGenieVoice } from '../hooks/useGenieVoice';

// ============================================
// TYPES
// ============================================

interface GenieVoiceAssistantProps {
  userId: string;
  language?: 'en-IN' | 'hi-IN' | 'hinglish';
  variant?: 'floating' | 'inline';
  onCommand?: (result: { text: string; action?: string }) => void;
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Floating button
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingButtonActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  floatingButtonSpeaking: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: 400,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#9CA3AF',
    fontSize: 16,
  },

  // Voice circle
  voiceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  voiceCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3730A3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#6366F1',
  },
  voiceCircleActive: {
    backgroundColor: '#DC2626',
    borderColor: '#EF4444',
  },
  voiceCircleSpeaking: {
    backgroundColor: '#059669',
    borderColor: '#10B981',
  },

  // Transcript
  transcriptContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    minHeight: 100,
  },
  transcriptLabel: {
    color: '#6B7280',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  transcriptText: {
    color: '#F9FAFB',
    fontSize: 16,
    lineHeight: 24,
  },
  responseText: {
    color: '#A5B4FC',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },

  // Status
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 14,
  },

  // Quick actions
  quickActions: {
    marginTop: 24,
  },
  quickActionsLabel: {
    color: '#6B7280',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickActionText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '500',
  },

  // Inline styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

// ============================================
// QUICK ACTIONS
// ============================================

const QUICK_ACTIONS = [
  { label: 'Order Food', query: 'I want to order food' },
  { label: 'Book Table', query: 'Book a table for tonight' },
  { label: 'Remember', query: 'Remember this for me' },
  { label: 'My Briefing', query: 'Give me my morning briefing' },
  { label: 'My Usual', query: 'What is my usual order?' },
];

// ============================================
// COMPONENT
// ============================================

export function GenieVoiceAssistant({
  userId,
  language = 'en-IN',
  variant = 'floating',
  onCommand,
}: GenieVoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Use the new Genie voice hook
  const {
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    response,
    error,
    startListening,
    stopListening,
    processVoiceCommand,
    speak,
  } = useGenieVoice({
    userId,
    language,
  });

  // Pulse animation when active
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [isListening, pulseAnim]);

  // Handle voice button press
  const handleVoicePress = useCallback(async () => {
    if (variant === 'floating' && !isOpen) {
      setIsOpen(true);
      return;
    }
  }, [variant, isOpen]);

  // Handle voice recording
  const handleVoiceRecord = useCallback(async () => {
    if (isListening) {
      // Stop recording
      const audioUri = await stopListening();

      // Process command
      if (audioUri) {
        try {
          const result = await processVoiceCommand(audioUri);
          await speak(result.text);
          onCommand?.(result);
        } catch (err) {
          console.error('Processing error:', err);
        }
      }
    } else {
      // Start recording
      await startListening();
    }
  }, [isListening, startListening, stopListening, processVoiceCommand, speak, onCommand]);

  // Handle quick action
  const handleQuickAction = useCallback(async (query: string) => {
    await speak('Let me help with that...');

    // Simulate Genie processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    const responses: Record<string, string> = {
      'I want to order food': 'Here are some great restaurants nearby! Your recent favorites include La Pinoz Pizza and Biryani Blues.',
      'Book a table for tonight': 'I can help you book a table. What cuisine would you prefer and for what time?',
      'Remember this for me': 'Sure! What would you like me to remember?',
      'Give me my morning briefing': 'Good morning! You have 3 meetings today: Team standup at 9 AM, Design review at 11 AM, and a client call at 3 PM.',
      'What is my usual order?': 'Your usual order is a margherita pizza from La Pinoz Pizza, ordered every Sunday!',
    };

    const genieResponse = responses[query] || 'Let me check that for you.';
    await speak(genieResponse);
    onCommand?.({ text: query });
  }, [speak, onCommand]);

  // Get status text
  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (isProcessing) return 'Genie is thinking...';
    if (isSpeaking) return 'Genie is speaking...';
    if (isListening) return 'Listening...';
    return 'Tap to speak with Genie';
  };

  // Get status color
  const getStatusColor = () => {
    if (error) return '#EF4444';
    if (isSpeaking) return '#10B981';
    if (isListening) return '#EF4444';
    return '#6366F1';
  };

  // ============================================
  // RENDER - FLOATING BUTTON
  // ============================================

  if (variant === 'floating') {
    return (
      <>
        <TouchableOpacity
          style={[
            styles.floatingButton,
            isListening && styles.floatingButtonActive,
            isSpeaking && styles.floatingButtonSpeaking,
          ]}
          onPress={handleVoicePress}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <Loader2 size={28} color="#FFFFFF" />
          ) : isListening ? (
            <MicOff size={28} color="#FFFFFF" />
          ) : (
            <Mic size={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* Modal */}
        <Modal
          visible={isOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTitle}>
                    <View style={styles.headerIcon}>
                      <Sparkles size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.headerText}>Hey Genie</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setIsOpen(false)}
                  >
                    <Text style={styles.closeText}>Close</Text>
                  </TouchableOpacity>
                </View>

                {/* Voice circle */}
                <View style={styles.voiceContainer}>
                  <Animated.View
                    style={[
                      styles.voiceCircle,
                      isListening && styles.voiceCircleActive,
                      isSpeaking && styles.voiceCircleSpeaking,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={handleVoiceRecord}
                      disabled={isProcessing}
                      style={{ padding: 24 }}
                    >
                      {isProcessing ? (
                        <Loader2 size={44} color="#FFFFFF" />
                      ) : isListening ? (
                        <MicOff size={44} color="#FFFFFF" />
                      ) : (
                        <Mic size={44} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>

                {/* Status */}
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                  <Text style={styles.statusText}>{getStatusText()}</Text>
                </View>

                {/* Transcript */}
                {(transcript || response) && (
                  <View style={styles.transcriptContainer}>
                    {transcript && (
                      <>
                        <Text style={styles.transcriptLabel}>You said</Text>
                        <Text style={styles.transcriptText}>{transcript}</Text>
                      </>
                    )}
                    {response && (
                      <Text style={styles.responseText}>{response}</Text>
                    )}
                  </View>
                )}

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  <Text style={styles.quickActionsLabel}>Quick Actions</Text>
                  <View style={styles.quickActionsGrid}>
                    {QUICK_ACTIONS.map((action) => (
                      <TouchableOpacity
                        key={action.label}
                        style={styles.quickAction}
                        onPress={() => handleQuickAction(action.query)}
                      >
                        <Text style={styles.quickActionText}>{action.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // ============================================
  // RENDER - INLINE
  // ============================================

  return (
    <View style={styles.inlineContainer}>
      <TouchableOpacity
        onPress={handleVoiceRecord}
        disabled={isProcessing}
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: isListening ? '#EF4444' : '#6366F1',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isProcessing ? (
          <Loader2 size={24} color="#FFFFFF" />
        ) : isListening ? (
          <MicOff size={24} color="#FFFFFF" />
        ) : (
          <Mic size={24} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {response && (
        <Text style={{ color: '#F9FAFB', fontSize: 14, flex: 1 }}>
          {response}
        </Text>
      )}
    </View>
  );
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default GenieVoiceAssistant;
