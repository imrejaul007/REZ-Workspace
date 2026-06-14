/**
 * REZ Go Voice Shopping
 *
 * Voice commands for hands-free shopping:
 * - "Add milk"
 * - "Find protein snacks"
 * - "What's in my cart?"
 * - "How much did I spend?"
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useGo, GoCartItem } from './GoContext';

interface VoiceCommand {
  id: string;
  command: string;
  action: string;
  examples: string[];
}

const VOICE_COMMANDS: VoiceCommand[] = [
  {
    id: 'add',
    command: 'Add',
    action: 'add_product',
    examples: ['Add milk', 'Add 2 kg rice', 'Find and add apples'],
  },
  {
    id: 'remove',
    command: 'Remove',
    action: 'remove_product',
    examples: ['Remove milk', 'Remove 2 items'],
  },
  {
    id: 'quantity',
    command: 'Update',
    action: 'update_quantity',
    examples: ['Increase milk to 3', 'Set eggs to 12'],
  },
  {
    id: 'find',
    command: 'Find',
    action: 'search',
    examples: ['Find protein snacks', 'Search for organic', 'Where is bread?'],
  },
  {
    id: 'cart',
    command: 'Cart',
    action: 'show_cart',
    examples: ["What's in my cart?", 'Show cart summary'],
  },
  {
    id: 'total',
    command: 'Total',
    action: 'show_total',
    examples: ['How much did I spend?', 'What is my total?'],
  },
  {
    id: 'savings',
    command: 'Savings',
    action: 'show_savings',
    examples: ['How much did I save?', 'Show my savings'],
  },
  {
    id: 'help',
    command: 'Help',
    action: 'show_help',
    examples: ['Help', 'What can I say?'],
  },
];

interface VoiceShoppingProps {
  onAddProduct?: (searchQuery: string) => void;
}

export function VoiceShopping({ onAddProduct }: VoiceShoppingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const { activeSession, cartSummary } = useGo();

  const handleCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase().trim();
    let response = '';

    // Parse commands
    if (lowerText.startsWith('add ')) {
      const product = lowerText.slice(4);
      response = `Searching for "${product}"...`;
      onAddProduct?.(product);
    } else if (lowerText.startsWith('remove ')) {
      const item = lowerText.slice(7);
      response = `Removing "${item}" from cart...`;
    } else if (lowerText.startsWith('find ') || lowerText.startsWith('search ')) {
      const query = lowerText.replace(/^(find|search)\s+/, '');
      response = `Searching for "${query}"...`;
      onAddProduct?.(query);
    } else if (lowerText.includes("what's in my cart") || lowerText.includes('show cart')) {
      if (!activeSession || activeSession.items.length === 0) {
        response = 'Your cart is empty';
      } else {
        const items = activeSession.items
          .map((item) => `${item.quantity}x ${item.name}`)
          .join(', ');
        response = `You have ${activeSession.items.length} items: ${items}`;
      }
    } else if (lowerText.includes('how much') || lowerText.includes('total')) {
      if (!cartSummary) {
        response = 'No active session';
      } else {
        response = `Your total is ₹${cartSummary.total.toFixed(2)}`;
      }
    } else if (lowerText.includes('save') || lowerText.includes('savings')) {
      if (!cartSummary) {
        response = 'No active session';
      } else {
        response = `You've saved ₹${cartSummary.totalSaved.toFixed(2)} on this shopping trip!`;
      }
    } else if (lowerText.includes('help')) {
      response = getHelpText();
    } else {
      response = `I didn't understand "${text}". Try "Add milk" or "Find snacks"`;
    }

    setLastResponse(response);
    return response;
  }, [activeSession, cartSummary, onAddProduct]);

  const getHelpText = () => {
    return `Here are some things you can say:

• "Add milk" - Search and add products
• "Remove milk" - Remove from cart
• "Find protein snacks" - Search products
• "What's in my cart?" - View cart items
• "How much did I spend?" - View total
• "How much did I save?" - View savings

Or just type what you're looking for!`;
  };

  const handleTextSubmit = () => {
    if (!input.trim()) return;
    handleCommand(input);
    setInput('');
  };

  const handleVoiceInput = () => {
    // In production, use expo-speech or speech recognition
    // For now, simulate with a prompt
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setIsOpen(true);
    }, 500);
  };

  const quickCommands = [
    { label: '🛒 Add', action: () => setInput('Add ') },
    { label: '🔍 Find', action: () => setInput('Find ') },
    { label: '📦 Cart', action: () => handleCommand("what's in my cart") },
    { label: '💰 Total', action: () => handleCommand('how much did I spend') },
    { label: '💚 Savings', action: () => handleCommand('how much did I save') },
  ];

  return (
    <>
      {/* Voice Button */}
      <TouchableOpacity
        style={styles.voiceButton}
        onPress={handleVoiceInput}
        disabled={!activeSession}
      >
        <Text style={styles.voiceButtonText}>🎤</Text>
      </TouchableOpacity>

      {/* Voice Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Voice Shopping</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Say or type a command..."
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={handleTextSubmit}
                returnKeyType="send"
                autoFocus
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleTextSubmit}
              >
                <Text style={styles.sendButtonText}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Listening indicator */}
            {isListening && (
              <View style={styles.listeningIndicator}>
                <Text style={styles.listeningText}>🎤 Listening...</Text>
              </View>
            )}

            {/* Response */}
            {lastResponse && (
              <View style={styles.responseContainer}>
                <Text style={styles.responseText}>{lastResponse}</Text>
              </View>
            )}

            {/* Quick Commands */}
            <View style={styles.quickCommands}>
              <Text style={styles.quickCommandsTitle}>Quick Commands</Text>
              <View style={styles.quickCommandsGrid}>
                {quickCommands.map((cmd) => (
                  <TouchableOpacity
                    key={cmd.label}
                    style={styles.quickCommandButton}
                    onPress={cmd.action}
                  >
                    <Text style={styles.quickCommandText}>{cmd.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Example commands */}
            <View style={styles.examples}>
              <Text style={styles.examplesTitle}>Try saying:</Text>
              <FlatList
                data={VOICE_COMMANDS.slice(0, 5)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.exampleItem}
                    onPress={() => handleCommand(item.examples[0])}
                  >
                    <Text style={styles.exampleText}>{item.examples[0]}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  voiceButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voiceButtonText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  listeningIndicator: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  listeningText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  responseContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  responseText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  quickCommands: {
    marginBottom: 16,
  },
  quickCommandsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  quickCommandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCommandButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickCommandText: {
    fontSize: 14,
    color: '#374151',
  },
  examples: {
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  exampleItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  exampleText: {
    fontSize: 14,
    color: '#22C55E',
  },
});

export default VoiceShopping;
