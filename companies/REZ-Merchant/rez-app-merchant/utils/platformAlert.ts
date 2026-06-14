/**
 * Platform Alert Utility
 *
 * Provides unified alert functionality across web and React Native platforms.
 * Replaces the pattern: Platform.OS === 'web' ? alert() : Alert.alert()
 */

import { Platform, Alert } from 'react-native';

export interface PlatformAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface PlatformAlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

/**
 * Show an alert dialog that works on both web and React Native
 */
export function platformAlert(
  title: string,
  message?: string,
  buttons?: PlatformAlertButton[],
  options?: PlatformAlertOptions
): void {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmMessage = message ? `${title}\n\n${message}` : title;
      const confirmed = window.confirm(confirmMessage);

      if (confirmed) {
        const actionButton = buttons.find((b) => b.style !== 'cancel');
        actionButton?.onPress?.();
      } else {
        const cancelButton = buttons.find((b) => b.style === 'cancel');
        cancelButton?.onPress?.();
        options?.onDismiss?.();
      }
    } else {
      const alertMessage = message ? `${title}\n\n${message}` : title;
      window.alert(alertMessage);
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(
      title,
      message,
      buttons?.map((button) => ({
        text: button.text,
        onPress: button.onPress,
        style: button.style,
      })),
      {
        cancelable: options?.cancelable ?? true,
        onDismiss: options?.onDismiss,
      }
    );
  }
}

/**
 * Show a simple alert with just an OK button
 */
export function platformAlertSimple(title: string, message?: string): void {
  platformAlert(title, message, [{ text: 'OK', style: 'default' }]);
}

/**
 * Show a confirmation dialog with Cancel and Confirm buttons
 */
export function platformAlertConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = 'Confirm',
  cancelText: string = 'Cancel'
): void {
  platformAlert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, onPress: onConfirm, style: 'default' },
  ]);
}

/**
 * Show a destructive confirmation dialog (for delete, remove, etc.)
 */
export function platformAlertDestructive(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = 'Delete',
  cancelText: string = 'Cancel'
): void {
  platformAlert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, onPress: onConfirm, style: 'destructive' },
  ]);
}

export default {
  show: platformAlert,
  simple: platformAlertSimple,
  confirm: platformAlertConfirm,
  destructive: platformAlertDestructive,
};
