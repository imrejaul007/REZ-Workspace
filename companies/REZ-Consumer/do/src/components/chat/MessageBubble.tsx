import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface MessageBubbleProps {
  type: 'user' | 'do';
  content: string;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  type,
  content,
  timestamp,
  status = 'sent',
}) => {
  const { colors, borderRadius, typography, spacing } = useTheme();
  const isUser = type === 'user';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.containerUser : styles.containerDo,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleDo,
          {
            backgroundColor: isUser ? colors.primary : colors.backgroundElevated,
            borderRadius: borderRadius.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: isUser ? colors.white : colors.label,
              ...typography.bodyLarge,
            },
          ]}
        >
          {content}
        </Text>
      </View>

      {isUser && timestamp && (
        <View style={styles.meta}>
          <Text
            style={[
              styles.time,
              {
                color: colors.labelTertiary,
                ...typography.captionSmall,
              },
            ]}
          >
            {formatTime(timestamp)}
          </Text>
          {status === 'sending' && (
            <Text style={[styles.statusText, { color: colors.labelTertiary }]}>
              Sending...
            </Text>
          )}
          {status === 'sent' && <Check size={12} color={colors.labelTertiary} />}
          {status === 'delivered' && (
            <CheckCheck size={12} color={colors.labelTertiary} />
          )}
          {status === 'read' && (
            <CheckCheck size={12} color={colors.primary} />
          )}
        </View>
      )}

      {!isUser && timestamp && (
        <Text
          style={[
            styles.time,
            styles.timeDo,
            {
              color: colors.labelTertiary,
              ...typography.captionSmall,
            },
          ]}
        >
          {formatTime(timestamp)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 16,
    maxWidth: '100%',
  },
  containerUser: {
    alignItems: 'flex-end',
  },
  containerDo: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleUser: {
    borderBottomRightRadius: 6,
  },
  bubbleDo: {
    borderBottomLeftRadius: 6,
  },
  text: {
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  time: {
    textAlign: 'right',
  },
  timeDo: {
    textAlign: 'left',
    marginTop: 4,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 10,
  },
});
