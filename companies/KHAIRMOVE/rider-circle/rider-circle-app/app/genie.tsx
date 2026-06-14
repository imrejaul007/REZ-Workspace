import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function GenieScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! I\'m Genie, your AI riding companion. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');

  const quickActions = [
    { id: '1', icon: '🗺️', label: 'Plan a ride' },
    { id: '2', icon: '🔧', label: 'Check bike health' },
    { id: '3', icon: '🌦️', label: 'Weather check' },
    { id: '4', icon: '👥', label: 'Find groups' },
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Simulate Genie response
    setTimeout(() => {
      const genieResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getGenieResponse(inputText),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, genieResponse]);
    }, 1000);
  };

  const getGenieResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('ride') || lowerInput.includes('route') || lowerInput.includes('trip')) {
      return 'I can help you plan an amazing ride! Tell me:\n\n1️⃣ Where do you want to start from?\n2️⃣ What's your preferred distance?\n3️⃣ Any specific destination in mind?';
    }

    if (lowerInput.includes('bike') || lowerInput.includes('maintenance') || lowerInput.includes('service')) {
      return 'Let me check your bike\'s health! Based on your Himalayan 450 data:\n\n• Tire health: Good (78%)\n• Chain: Needs attention (62%)\n• Next service: Due in 400 km\n\nWould you like me to find nearby service centers?';
    }

    if (lowerInput.includes('weather')) {
      return 'Weather looks great for riding today in Bangalore!\n\n☀️ Clear skies\n🌡️ 28°C\n💨 Light wind\n\nPerfect conditions for a long ride!';
    }

    if (lowerInput.includes('group') || lowerInput.includes('community')) {
      return 'Here are some great groups near you:\n\n• Bangalore Riders Club (1,247 members)\n• RE Himalayan Owners (856 members)\n• Karnataka Touring Riders (423 members)\n\nWould you like to join any of them?';
    }

    return 'I\'m here to help with:\n\n🗺️ Route planning\n🔧 Bike maintenance\n🌦️ Weather updates\n👥 Finding groups & events\n📊 Ride statistics\n\nWhat would you like to know?';
  };

  const handleQuickAction = (label: string) => {
    setInputText(label);
    handleSend();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🤖</Text>
          <View>
            <Text style={styles.headerTitle}>Genie</Text>
            <Text style={styles.headerSubtitle}>AI Riding Assistant</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        renderItem={({ item }) => (
          <View style={[styles.messageContainer, item.isUser && styles.userMessageContainer]}>
            {!item.isUser && (
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>🤖</Text>
              </View>
            )}
            <View style={[styles.message, item.isUser && styles.userMessage]}>
              <Text style={[styles.messageText, item.isUser && styles.userMessageText]}>
                {item.text}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickAction}
            onPress={() => handleQuickAction(action.label)}
          >
            <Text style={styles.quickActionIcon}>{action.icon}</Text>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask Genie anything..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 20,
    color: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  placeholder: {
    width: 40,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  botAvatarText: {
    fontSize: 16,
  },
  message: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    marginRight: 40,
  },
  userMessage: {
    backgroundColor: '#e94560',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
    marginRight: 0,
    marginLeft: 40,
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 10,
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#16213e',
  },
  input: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#fff',
  },
});