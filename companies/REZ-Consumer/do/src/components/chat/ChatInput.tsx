/**
 * ChatInput - Text input with voice input integration for Do app
 * Supports text input, voice input, quick actions, character counter, and draft saving
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  Keyboard,
  Platform,
  Animated,
} from 'react-native';
import { Send, XCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useDraft } from '@/hooks/useDraft';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { CharacterCounter } from '@/components/CharacterCounter';
import * as Haptics from 'expo-haptics';
import logger from '@/utils/logger';

interface ChatInputProps {
  onSend: (message: string) => void;
  onVoiceResult?: (text: string) => void;
  quickActions?: string[];
  disabled?: boolean;
  placeholder?: string;
  autoSpeak?: boolean; // Auto-speak Do's responses
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onVoiceResult,
  quickActions = [],
  disabled = false,
  placeholder = 'Message Do...',
  autoSpeak = false,
}) => {
  const { colors, borderRadius, spacing, typography } = useTheme();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Draft persistence hook
  const { saveDraft, restoreDraft, clearDraft } = useDraft();

  // Voice input hook
  const {
    isListening,
    audioLevel,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
    autoSubmit: true,
  });

  // Restore draft on mount
  useEffect(() => {
    restoreDraft(setText);
  }, [restoreDraft]);

  // Save draft on text change (debounced via useCallback in hook)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft(text);
    }, 300); // 300ms debounce for draft saving

    return () => clearTimeout(timeoutId);
  }, [text, saveDraft]);

  // Handle voice transcript result
  function handleVoiceTranscript(recognizedText: string) {
    if (recognizedText) {
      setText(recognizedText);
      onVoiceResult?.(recognizedText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearDraft(); // Clear draft when voice transcript is used
    }
  }

  // Auto-clear transcript when it's been used
  useEffect(() => {
    if (transcript && text === transcript) {
      // Transcript has been applied to input
      logger.debug('Voice transcript applied:', transcript);
    }
  }, [transcript, text]);

  const handleSend = useCallback(() => {
    const messageText = text.trim();
    if (messageText) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSend(messageText);
      setText('');
      clearTranscript();
      clearDraft(); // Clear saved draft after successful send
      Keyboard.dismiss();
    }
  }, [text, onSend, clearTranscript, clearDraft]);

  const handleVoiceStart = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleVoiceEnd = useCallback(() => {
    // Voice end is handled by stopListening in the hook
    // This is called on press out for visual feedback
  }, [stopListening]);

  const handleQuickAction = useCallback((action: string) => {
    Haptics.selectionAsync();
    onSend(action);
  }, [onSend]);

  // Show recording indicator when listening
  const showRecordingIndicator = isListening;

  return (
    <View style={styles.container}>
      {/* Quick Actions */}
      {quickActions.length > 0 && !text && !isListening && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsContainer}
          style={styles.quickActions}
        >
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickAction,
                {
                  backgroundColor: colors.fillSecondary,
                  borderRadius: borderRadius.full,
                },
              ]}
              onPress={() => handleQuickAction(action)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.quickActionText,
                  {
                    color: colors.primary,
                    ...typography.buttonSmall,
                  },
                ]}
              >
                {action}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input Row */}
      <View style={styles.inputRow}>
        {/* Recording indicator */}
        {showRecordingIndicator && (
          <RecordingIndicator colors={colors} />
        )}

        {/* Voice Input Button */}
        <VoiceInputButton
          isListening={isListening}
          audioLevel={audioLevel}
          onPressIn={handleVoiceStart}
          onPressOut={handleVoiceEnd}
          disabled={disabled}
          size="medium"
          showWaveform={true}
        />

        {/* Text Input Container */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.fill,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                {
                  color: colors.label,
                  ...typography.bodyLarge,
                },
              ]}
              value={text}
              onChangeText={setText}
              placeholder={placeholder}
              placeholderTextColor={colors.labelTertiary}
              multiline
              maxLength={1000}
              editable={!disabled && !isListening}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            {/* Character counter shown when text length > 50 */}
            {text.length > 50 && (
              <View style={styles.characterCounterContainer}>
                <CharacterCounter current={text.length} max={500} />
              </View>
            )}
          </View>

          {/* Clear button when there's text */}
          {text.length > 0 && !isListening && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setText('');
                clearTranscript();
                clearDraft(); // Clear saved draft on manual clear
              }}
            >
              <XCircle size={18} color={colors.labelTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: text.trim()
                ? colors.primary
                : colors.fill,
              borderRadius: borderRadius.full,
            },
          ]}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
        >
          <Send
            size={20}
            color={text.trim() ? colors.white : colors.labelTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Voice error message */}
      {voiceError && (
        <Text style={[styles.errorText, { color: colors.systemRed }]}>
          {voiceError}
        </Text>
      )}
    </View>
  );
};

/**
 * Recording indicator component
 */
const RecordingIndicator: React.FC<{ colors: any }> = ({ colors }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.recordingIndicator,
        {
          backgroundColor: colors.systemRed,
          opacity: pulseAnim,
        },
      ]}
    >
      <View style={styles.recordingDot} />
      <Text style={[styles.recordingText, { color: colors.white }]}>
        Listening...
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickActions: {
    marginBottom: 8,
  },
  quickActionsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  quickAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  quickActionText: {
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  recordingIndicator: {
    position: 'absolute',
    top: -40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    zIndex: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 44,
    maxHeight: 120,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 6,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 0,
    maxHeight: 100,
  },
  characterCounterContainer: {
    alignSelf: 'flex-end',
    paddingTop: 4,
  },
  clearButton: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ChatInput;
