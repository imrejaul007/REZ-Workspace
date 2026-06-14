import React from 'react';
import { Modal as RNModal, View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttonText?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}

export const Alert: React.FC<AlertProps> = ({
  visible,
  title,
  message,
  onClose,
  buttonText = 'OK',
  type = 'info',
}) => {
  if (!visible) return null;

  const iconMap = {
    success: { name: 'checkmark-circle' as const, color: '#10B981' },
    error: { name: 'alert-circle' as const, color: '#EF4444' },
    warning: { name: 'warning' as const, color: '#F59E0B' },
    info: { name: 'information-circle' as const, color: '#3B82F6' },
  };
  const bgMap = {
    success: '#ECFDF5',
    error: '#FEF2F2',
    warning: '#FFFBEB',
    info: '#EFF6FF',
  };
  const btnMap = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  };

  const icon = iconMap[type];
  const iconBg = bgMap[type];
  const buttonColor = btnMap[type];

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.alertContainer}>
              <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                <Ionicons name={icon.name} size={48} color={icon.color} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.titleText}>{title}</Text>
                <Text style={styles.messageText}>{message}</Text>
              </View>
              <TouchableOpacity
                style={[styles.alertButton, { backgroundColor: buttonColor }]}
                onPress={onClose}
              >
                <Text style={styles.buttonTextAlertContainer}>{buttonText}</Text>
              </TouchableOpacity>
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
  alertContainer: {
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
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonTextAlertContainer: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
