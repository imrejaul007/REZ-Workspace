/**
 * VoiceAssistant - "Hey Genie" Voice Assistant Component
 *
 * Full voice assistant with wake word, STT, and TTS
 *
 * Usage:
 * ```typescript
 * import { VoiceAssistant } from '@/components/VoiceAssistant';
 *
 * // Floating button anywhere
 * <VoiceAssistant />
 *
 * // Or in a modal
 * <VoiceAssistant mode="modal" onClose={() => setModalVisible(false)} />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWakeWord, WAKE_WORDS } from '@/hooks/useWakeWord';
import { useFlowVoice } from '@/hooks/useFlowVoice';
import { useGenieMemory } from '@/hooks/useGenieMemory';
import { useHybridAI } from '@/hooks/useHybridAI';

const { width, height } = Dimensions.get('window');

interface VoiceAssistantProps {
  mode?: 'floating' | 'modal';
  userId?: string;
  onCommand?: (command: string, result: any) => void;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'ready';

export function VoiceAssistant({ mode = 'floating', userId = 'default', onCommand }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  // Wake word detection ("Hey Genie")
  const wakeWord = useWakeWord({
    onWakeWord: (word, confidence) => {
      console.log('Wake word detected:', word, confidence);
      setWakeWordDetected(true);
      setIsOpen(true);
      setState('ready');

      // Announce ready
      flow.speak('Yes? How can I help?');
    },
    onError: (error) => {
      console.error('Wake word error:', error);
    },
  });

  // Voice STT/TTS
  const flow = useFlowVoice({
    language: 'en-IN',
    voice: 'shimmer',
    onSpeakingStart: () => setState('speaking'),
    onSpeakingEnd: () => {
      setState('idle');
      setResponse('');
    },
  });

  // Memory
  const genie = useGenieMemory(userId);

  // Hybrid AI
  const ai = useHybridAI();

  // Animation
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation when listening
  useEffect(() => {
    if (state === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  // Start listening for wake word on mount
  useEffect(() => {
    // Only start if permission granted (handled in hook)
    wakeWord.startListening();

    return () => {
      wakeWord.stopListening();
    };
  }, []);

  // Handle voice button press
  const handlePress = useCallback(async () => {
    if (mode === 'modal' && isOpen) {
      setIsOpen(false);
      setState('idle');
      return;
    }

    if (state === 'listening') {
      // Stop listening and process
      await stopListening();
      return;
    }

    if (state === 'speaking') {
      // Stop speaking
      flow.stopSpeaking?.();
      setState('idle');
      return;
    }

    // Start listening
    setIsOpen(true);
    setState('listening');
    setTranscript('');
    setResponse('');

    await flow.startListening();

    // Auto-stop after 5 seconds
    setTimeout(async () => {
      if (state === 'listening') {
        await stopListening();
      }
    }, 5000);
  }, [state, flow, wakeWord]);

  // Stop listening and process
  const stopListening = useCallback(async () => {
    setState('processing');

    const text = await flow.stopListening();
    setTranscript(text);

    if (!text) {
      setState('idle');
      return;
    }

    // Process with AI
    try {
      const result = await ai.handleCommand(text, {
        userId,
        includeMemories: true,
      });

      setResponse(result.response);

      // Speak response
      await flow.speak(result.response);

      // Remember if transaction
      if (result.action === 'order' && result.merchant) {
        await genie.rememberTransaction(result.merchant, result.amount);
      }

      // Callback
      if (onCommand) {
        onCommand(text, result);
      }
    } catch (error) {
      console.error('AI error:', error);
      await flow.speak('Sorry, something went wrong. Please try again.');
      setState('idle');
    }
  }, [flow, ai, genie, userId, onCommand]);

  // Cancel/close
  const handleClose = useCallback(() => {
    if (state === 'listening') {
      flow.stopListening?.();
    }
    if (state === 'speaking') {
      flow.stopSpeaking?.();
    }
    setIsOpen(false);
    setState('idle');
    setTranscript('');
    setResponse('');
  }, [state, flow]);

  // Render floating button
  if (mode === 'floating') {
    return (
      <>
        <TouchableOpacity
          style={[
            styles.floatingButton,
            wakeWord.isListening && styles.floatingButtonActive,
            state === 'listening' && styles.floatingButtonListening,
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.floatingIcon,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Ionicons
              name={
                state === 'speaking' ? 'volume-high' :
                state === 'listening' ? 'mic' :
                state === 'processing' ? 'hourglass' :
                wakeWord.isListening ? 'ear' :
                'mic'
              }
              size={28}
              color="#fff"
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Listening indicator */}
        {wakeWord.isListening && !isOpen && (
          <View style={styles.listeningIndicator}>
            <View style={styles.listeningDot} />
            <Text style={styles.listeningText}>Listening for "Hey Genie"</Text>
          </View>
        )}

        {/* Modal when active */}
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={handleClose}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleClose}
          >
            <View style={styles.modalContent}>
              {/* Status */}
              <View style={styles.statusContainer}>
                <Animated.View
                  style={[
                    styles.statusIcon,
                    state === 'listening' && styles.statusIconListening,
                    state === 'speaking' && styles.statusIconSpeaking,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Ionicons
                    name={
                      state === 'listening' ? 'mic' :
                      state === 'speaking' ? 'volume-high' :
                      state === 'processing' ? 'hourglass' :
                      'chatbubble'
                    }
                    size={32}
                    color="#fff"
                  />
                </Animated.View>
                <Text style={styles.statusText}>
                  {state === 'idle' ? 'Ready' :
                   state === 'listening' ? 'Listening...' :
                   state === 'speaking' ? 'Speaking...' :
                   'Processing...'}
                </Text>
              </View>

              {/* Transcript */}
              {transcript && (
                <View style={styles.transcriptContainer}>
                  <Text style={styles.transcriptLabel}>You said:</Text>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
              )}

              {/* Response */}
              {response && (
                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>Genie:</Text>
                  <Text style={styles.responseText}>{response}</Text>
                </View>
              )}

              {/* Close button */}
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // Render modal-only
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.fullModalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Genie Assistant</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="#1A1A2E" />
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.centerContent}>
          <TouchableOpacity
            style={[
              styles.mainMicButton,
              state === 'listening' && styles.mainMicButtonActive,
            ]}
            onPress={handlePress}
          >
            <Ionicons
              name={state === 'listening' ? 'mic' : 'chatbubble'}
              size={48}
              color="#fff"
            />
          </TouchableOpacity>
          <Text style={styles.mainMicText}>
            {state === 'listening' ? 'Tap to stop' : 'Tap to speak'}
          </Text>
        </View>

        {/* Conversation */}
        <View style={styles.conversationContainer}>
          {transcript && (
            <View style={styles.conversationItem}>
              <View style={styles.conversationBubbleUser}>
                <Text style={styles.conversationText}>{transcript}</Text>
              </View>
            </View>
          )}
          {response && (
            <View style={styles.conversationItemGenie}>
              <View style={styles.conversationBubbleGenie}>
                <Text style={styles.conversationText}>{response}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Floating button
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonActive: {
    backgroundColor: '#6C5CE7',
  },
  floatingButtonListening: {
    backgroundColor: '#E74C3C',
  },
  floatingIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listeningIndicator: {
    position: 'absolute',
    bottom: 170,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
    marginRight: 8,
  },
  listeningText: {
    fontSize: 12,
    color: '#666',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIconListening: {
    backgroundColor: '#E74C3C',
  },
  statusIconSpeaking: {
    backgroundColor: '#27AE60',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  transcriptContainer: {
    backgroundColor: '#F0EBFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#6C5CE7',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    color: '#1A1A2E',
  },
  responseContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 16,
    color: '#1A1A2E',
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#666',
  },

  // Full modal
  fullModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainMicButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainMicButtonActive: {
    backgroundColor: '#E74C3C',
  },
  mainMicText: {
    fontSize: 16,
    color: '#666',
  },
  conversationContainer: {
    padding: 16,
    maxHeight: 200,
  },
  conversationItem: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  conversationItemGenie: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  conversationBubbleUser: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  conversationBubbleGenie: {
    backgroundColor: '#F0EBFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
  },
  conversationText: {
    fontSize: 15,
    color: '#fff',
  },
});

export default VoiceAssistant;