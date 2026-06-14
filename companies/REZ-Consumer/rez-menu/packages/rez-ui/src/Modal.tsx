import React from 'react';
import { Modal as RNModal, View, StyleSheet, ViewStyle } from 'react-native';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({ visible, onClose, children, style }) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, style]}>
          {children}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    maxWidth: '90%',
  },
});
