/**
 * REZ Go Checkout Recovery Screen
 *
 * Move to Counter feature:
 * - User-initiated transfer
 * - Auto-recovery suggestions
 * - Staff rescue mode
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useGo } from './GoContext';

interface CheckoutRecoveryProps {
  visible: boolean;
  onClose: () => void;
  onTransferComplete?: () => void;
}

interface TransferData {
  transferId: string;
  status: string;
  expiresAt: Date;
  cartItems: number;
  cartTotal: number;
  transferQR: string;
}

type RecoveryReason =
  | 'payment_failed'
  | 'scan_mismatch'
  | 'fraud_suspicion'
  | 'network_timeout'
  | 'user_request'
  | 'age_restricted'
  | 'inventory_mismatch';

export function CheckoutRecovery({ visible, onClose, onTransferComplete }: CheckoutRecoveryProps) {
  const { activeSession, cancelSession } = useGo();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transferData, setTransferData] = useState<TransferData | null>(null);

  const handleInitiateTransfer = async (reason: RecoveryReason) => {
    if (!activeSession) return;

    setIsLoading(true);

    try {
      // In production, call the API
      // const res = await fetch('/api/recovery/initiate', {
      //   method: 'POST',
      //   body: JSON.stringify({ sessionId: activeSession.sessionId, reason })
      // });

      // Mock response
      const mockTransfer = {
        transferId: `RCV-${Date.now().toString(36).toUpperCase()}`,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        cartItems: activeSession.items.length,
        cartTotal: activeSession.total,
        transferQR: JSON.stringify({
          intent: 'go-recovery',
          v: 1,
          transferId: `RCV-${Date.now().toString(36).toUpperCase()}`,
          sessionId: activeSession.sessionId,
        }),
      };

      setTransferData(mockTransfer);
      setShowSuccess(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate transfer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTransfer = async () => {
    if (!transferData) return;

    Alert.alert(
      'Cancel Transfer',
      'Are you sure you want to cancel this transfer? Your cart will be cleared.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (activeSession) {
              await cancelSession();
            }
            setShowSuccess(false);
            setTransferData(null);
            onClose();
            onTransferComplete?.();
          },
        },
      ]
    );
  };

  const handleCompleteAtCounter = async () => {
    // User will go to counter - session remains active until cashier completes
    onClose();
  };

  const recoveryOptions: { reason: RecoveryReason; icon: string; title: string; description: string }[] = [
    {
      reason: 'payment_failed',
      icon: '💳',
      title: 'Payment Failed',
      description: 'Transaction did not go through',
    },
    {
      reason: 'scan_mismatch',
      icon: '📷',
      title: 'Scan Issue',
      description: 'Product barcode not recognized',
    },
    {
      reason: 'network_timeout',
      icon: '📶',
      title: 'Network Error',
      description: 'Connection lost during checkout',
    },
    {
      reason: 'age_restricted',
      icon: '🔞',
      title: 'Age Restricted',
      description: 'Cannot complete self-checkout',
    },
    {
      reason: 'user_request',
      icon: '🙋',
      title: 'Continue at Counter',
      description: 'Just want to pay at counter',
    },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {!showSuccess ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Need Help?</Text>
                <Text style={styles.subtitle}>
                  Don't worry! You can continue your checkout at the counter.
                </Text>
              </View>

              {/* Cart Summary */}
              {activeSession && (
                <View style={styles.cartSummary}>
                  <View style={styles.cartInfo}>
                    <Text style={styles.cartItems}>
                      {activeSession.items.length} items
                    </Text>
                    <Text style={styles.cartTotal}>
                      ₹{activeSession.total.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Recovery Options */}
              <View style={styles.options}>
                <Text style={styles.optionsTitle}>Select reason:</Text>
                {recoveryOptions.map((option) => (
                  <TouchableOpacity
                    key={option.reason}
                    style={styles.optionCard}
                    onPress={() => handleInitiateTransfer(option.reason)}
                    disabled={isLoading}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    </View>
                    <Text style={styles.optionArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Manual Action */}
              <TouchableOpacity
                style={styles.manualButton}
                onPress={handleCompleteAtCounter}
              >
                <Text style={styles.manualButtonText}>
                  Just Show QR at Counter →
                </Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Continue Shopping</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Success State */}
              <View style={styles.successHeader}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successTitle}>Transfer Initiated!</Text>
                <Text style={styles.successSubtitle}>
                  Show this QR at the counter
                </Text>
              </View>

              {/* Transfer QR */}
              <View style={styles.qrContainer}>
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrText}>QR CODE</Text>
                  <Text style={styles.qrSubtext}>{transferData?.transferId}</Text>
                </View>
              </View>

              {/* Instructions */}
              <View style={styles.instructions}>
                <View style={styles.instruction}>
                  <Text style={styles.instructionNumber}>1</Text>
                  <Text style={styles.instructionText}>
                    Show this QR to the cashier
                  </Text>
                </View>
                <View style={styles.instruction}>
                  <Text style={styles.instructionNumber}>2</Text>
                  <Text style={styles.instructionText}>
                    Cashier will scan to load your cart
                  </Text>
                </View>
                <View style={styles.instruction}>
                  <Text style={styles.instructionNumber}>3</Text>
                  <Text style={styles.instructionText}>
                    Pay and complete your purchase
                  </Text>
                </View>
              </View>

              {/* Timer */}
              <View style={styles.timer}>
                <Text style={styles.timerLabel}>Valid for</Text>
                <Text style={styles.timerValue}>30 minutes</Text>
              </View>

              {/* Actions */}
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleCompleteAtCounter}
              >
                <Text style={styles.doneButtonText}>Done, Heading to Counter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelTransferButton}
                onPress={handleCancelTransfer}
              >
                <Text style={styles.cancelTransferText}>Cancel Transfer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  cartSummary: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cartInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItems: {
    fontSize: 16,
    color: '#6B7280',
  },
  cartTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  options: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  optionArrow: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  manualButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Success state styles
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 48,
    color: '#22C55E',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  qrText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  qrSubtext: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
  },
  instructions: {
    marginBottom: 20,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  timer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    color: '#92400E',
  },
  timerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelTransferButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelTransferText: {
    fontSize: 14,
    color: '#EF4444',
  },
});

export default CheckoutRecovery;
