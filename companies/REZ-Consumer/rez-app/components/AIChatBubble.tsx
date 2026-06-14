// AI Chat Bubble Component
// Displays individual messages in AI-powered chat support

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { AIChatMessage, QuickReply } from '@/services/aiSupportService';
import { PROFILE_COLORS } from '@/types/profile.types';

interface AIChatBubbleProps {
  message: AIChatMessage;
  isOwnMessage: boolean;
  onQuickReplyPress?: (quickReply: QuickReply) => void;
  onLongPress?: () => void;
}

function AIChatBubble({
  message,
  isOwnMessage,
  onQuickReplyPress,
  onLongPress,
}: AIChatBubbleProps) {
  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getSenderAvatar = () => {
    if (isOwnMessage) {
      return (
        <View style={[styles.avatar, styles.userAvatar]}>
          <Ionicons name="person" size={16} color="white" />
        </View>
      );
    }
    return (
      <View style={[styles.avatar, styles.aiAvatar]}>
        <Ionicons name="bulb" size={16} color="white" />
      </View>
    );
  };

  const getStatusIcon = () => {
    if (isOwnMessage) {
      return <Ionicons name="checkmark-done" size={14} color={PROFILE_COLORS.primary} style={styles.statusIcon} />;
    }
    return null;
  };

  const renderQuickReplies = () => {
    if (!message.quickReplies || message.quickReplies.length === 0) return null;

    return (
      <View style={styles.quickRepliesContainer}>
        {message.quickReplies.map((reply) => (
          <Pressable
            key={reply.id}
            style={styles.quickReplyButton}
            onPress={() => onQuickReplyPress?.(reply)}
          >
            {reply.icon && (
              <Ionicons name={reply.icon as unknown} size={14} color={PROFILE_COLORS.primary} style={styles.quickReplyIcon} />
            )}
            <ThemedText style={styles.quickReplyText}>{reply.text}</ThemedText>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderIntentBadge = () => {
    if (!message.intent || !message.confidence) return null;

    return (
      <View style={styles.intentBadge}>
        <Ionicons name="sparkles" size={10} color={colors.primary[500]} />
        <ThemedText style={styles.intentText}>
          {message.intent} ({Math.round(message.confidence * 100)}%)
        </ThemedText>
      </View>
    );
  };

  const getBubbleStyle = () => {
    switch (message.sender) {
      case 'user':
        return styles.userBubble;
      case 'ai':
        return styles.aiBubble;
      case 'system':
        return styles.systemBubble;
      default:
        return isOwnMessage ? styles.userBubble : styles.aiBubble;
    }
  };

  const getTextColor = () => {
    switch (message.sender) {
      case 'user':
        return 'white';
      case 'ai':
        return colors.darkGray;
      case 'system':
        return colors.text.tertiary;
      default:
        return isOwnMessage ? 'white' : colors.darkGray;
    }
  };

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessageContainer : null]}>
      {/* Avatar */}
      {!isOwnMessage && (
        <View style={styles.avatarContainer}>
          {getSenderAvatar()}
        </View>
      )}

      {/* Message Content */}
      <Pressable
        style={[styles.bubble, getBubbleStyle()]}
        onLongPress={onLongPress}
      >
        {/* Intent Badge (for AI messages) */}
        {renderIntentBadge()}

        {/* Message Text */}
        {message.content && (
          <ThemedText style={[styles.messageText, { color: getTextColor() }]}>
            {message.content}
          </ThemedText>
        )}

        {/* Quick Replies (for AI messages) */}
        {!isOwnMessage && renderQuickReplies()}

        {/* Timestamp and Status */}
        <View style={styles.footer}>
          <ThemedText
            style={[
              styles.timestamp,
              { color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : '#666' }, // ACCESSIBILITY FIX: Changed from #999 to #666 for WCAG AA color contrast (4.5:1 ratio)
            ]}
          >
            {formatTime(message.timestamp)}
          </ThemedText>
          {getStatusIcon()}
        </View>
      </Pressable>

      {/* Spacer for own messages */}
      {isOwnMessage && <View style={styles.avatarContainer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownMessageContainer: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    width: 32,
    marginHorizontal: 8,
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: PROFILE_COLORS.primary,
  },
  aiAvatar: {
    backgroundColor: colors.secondary[500],
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: PROFILE_COLORS.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.gray[100],
    borderBottomLeftRadius: 4,
  },
  systemBubble: {
    backgroundColor: colors.infoScale[50],
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.infoScale[200],
  },
  intentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 205, 87, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  intentText: {
    fontSize: 10,
    color: colors.primary[700],
    marginLeft: 4,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  quickRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: PROFILE_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickReplyIcon: {
    marginRight: 4,
  },
  quickReplyText: {
    fontSize: 13,
    color: PROFILE_COLORS.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  statusIcon: {
    marginLeft: 2,
  },
});

export default React.memo(AIChatBubble);
