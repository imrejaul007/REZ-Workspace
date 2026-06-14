import React, { useState } from 'react';
import { Modal as RNModal, View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  type?: 'default' | 'danger' | 'warning';
  loading?: boolean;
  confirmColor?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'default',
  loading = false,
  confirmColor,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const iconMap = {
    danger: { name: 'alert-circle' as const, color: '#EF4444' },
    warning: { name: 'warning' as const, color: '#F59E0B' },
    default: { name: 'help-circle' as const, color: '#3B82F6' },
  };
  const bgMap = {
    danger: '#FEF2F2',
    warning: '#FFFBEB',
    default: '#EFF6FF',
  };
  const btnMap = {
    danger: '#EF4444',
    warning: '#F59E0B',
    default: '#3B82F6',
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await Promise.resolve(onConfirm());
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  const icon = iconMap[type];
  const iconBg = bgMap[type];
  const buttonColor = confirmColor ?? btnMap[type];
  const loadingActive = isLoading || loading;

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onCancel} accessibilityViewIsModal>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={styles.confirmDialogContainer}
              accessible={true}
              accessibilityRole="alert"
              accessibilityLabel={`${title}: ${message}`}
            >
              <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                <Ionicons name={icon.name} size={48} color={icon.color} />
              </View>
              <Text style={styles.titleText}>{title}</Text>
              <Text style={styles.messageText}>{message}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  disabled={loadingActive}
                >
                  <Text style={styles.buttonTextContainer}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton, { backgroundColor: buttonColor }, loadingActive && styles.buttonDisabled]}
                  onPress={handleConfirm}
                  disabled={loadingActive}
                >
                  {loadingActive ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonTextContainer}>{confirmText}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  confirmDialogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonTextContainer: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
