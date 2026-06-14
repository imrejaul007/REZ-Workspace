/**
 * Transaction PIN step-up helper.
 *
 * Used as a fallback when biometric step-up authentication is not available
 * or not enrolled on the device. Reuses the existing `/user/auth/login-pin`
 * endpoint (the same PIN the user set during onboarding).
 *
 * Behaviour:
 *  - iOS:     Alert.prompt (secure-text)
 *  - Web:     window.prompt
 *  - Android: Alert.prompt is unavailable in React Native core; we return
 *             `false` so the caller blocks the flow and surfaces a clear
 *             "enable biometric auth" message. A future dedicated PIN modal
 *             can replace this helper without changing call sites.
 */

import { Alert, Platform } from 'react-native';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const VERIFY_PIN_ENDPOINT = '/user/auth/login-pin';

interface VerifyPinResponse {
  user?: Record<string, unknown>;
  tokens?: { accessToken: string; refreshToken: string };
  attemptsLeft?: number;
}

async function verifyPinWithServer(pin: string): Promise<boolean> {
  const user = useAuthStore.getState().state?.user;
  const phoneNumber = user?.phoneNumber;
  if (!phoneNumber) {
    return false;
  }
  try {
    const response = await apiClient.post<VerifyPinResponse>(VERIFY_PIN_ENDPOINT, {
      phoneNumber,
      pin,
    });
    return response.success === true;
  } catch {
    return false;
  }
}

function promptForPin(title: string, message: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const value = typeof window !== 'undefined' && typeof window.prompt === 'function'
        ? window.prompt(`${title}\n\n${message}`)
        : null;
      resolve(value && value.length > 0 ? value : null);
      return;
    }

    if (Platform.OS === 'ios' && typeof (Alert as { prompt?: unknown }).prompt === 'function') {
      const alertWithPrompt = Alert as unknown as {
        prompt: (
          title: string,
          message: string | undefined,
          callbackOrButtons: Array<{
            text: string;
            style?: 'default' | 'cancel' | 'destructive';
            onPress?: (value?: string) => void;
          }>,
          type?: 'default' | 'plain-text' | 'secure-text' | 'login-password',
          defaultValue?: string,
          keyboardType?: string,
        ) => void;
      };
      alertWithPrompt.prompt(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          {
            text: 'Verify',
            onPress: (value?: string) => resolve(value && value.length > 0 ? value : null),
          },
        ],
        'secure-text',
        '',
        'number-pad',
      );
      return;
    }

    // Android / other: no native prompt available — caller will treat as cancel.
    resolve(null);
  });
}

/**
 * Prompt the user for their 4-digit transaction PIN and verify it server-side.
 * Returns true only if the server confirms the PIN.
 */
export async function promptTransactionPin(
  title: string = 'Confirm with PIN',
  message: string = 'Enter your 4-digit PIN to authorise this transaction.',
): Promise<boolean> {
  const pin = await promptForPin(title, message);
  if (!pin || !/^\d{4}$/.test(pin)) {
    return false;
  }
  return verifyPinWithServer(pin);
}

/**
 * Returns true when the current platform can surface an interactive PIN prompt.
 * Android currently lacks a native `Alert.prompt`, so the caller should either
 * block the flow or present a dedicated PIN modal instead.
 */
export function canPromptTransactionPin(): boolean {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'ios' && typeof (Alert as { prompt?: unknown }).prompt === 'function') {
    return true;
  }
  return false;
}
