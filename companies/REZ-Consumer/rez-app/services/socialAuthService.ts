// @ts-nocheck
import * as Google from 'expo-google-sign-in';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { api } from './api';
import { logger } from '@/utils/logger';

const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.GOOGLE_IOS_CLIENT_ID || '';

export interface SocialUser {
  id: string;
  email: string;
  name?: string;
  photo?: string;
  provider: 'google' | 'apple';
}

class SocialAuthService {
  // Google Sign-In
  async signInWithGoogle(): Promise<SocialUser | null> {
    try {
      await Google.signInAsync();
      const user = await Google.signInSilentlyAsync();

      if (user) {
        return {
          id: user.id,
          email: user.email || '',
          name: user.name,
          photo: user.photo,
          provider: 'google'
        };
      }

      // Trigger sign-in prompt
      const result = await Google.signInAsync();

      if (result.type === 'success') {
        return {
          id: result.user?.userID || '',
          email: result.user?.email || '',
          name: result.user?.name,
          photo: result.user?.photoURL || undefined,
          provider: 'google'
        };
      }

      return null;
    } catch (error) {
      logger.error('Google sign-in error', { error });
      return null;
    }
  }

  // Apple Sign-In
  async signInWithApple(): Promise<SocialUser | null> {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedOperation: AppleAuthentication.Operation.LOGIN,
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      });

      if (credential.identityToken) {
        return {
          id: credential.user,
          email: credential.email || '',
          name: [credential.fullName?.givenName, credential.fullName?.familyName]
            .filter(Boolean)
            .join(' ') || undefined,
          provider: 'apple'
        };
      }

      return null;
    } catch (error) {
      logger.error('Apple sign-in error', { error });
      return null;
    }
  }

  // Verify and login on backend
  async verifySocialToken(
    provider: 'google' | 'apple',
    token: string
  ): Promise<{ user; token: string } | null> {
    try {
      const response = await api.post('/auth/social/verify', {
        provider,
        token
      });

      return response.data;
    } catch (error) {
      logger.error('Social verify error', { error });
      return null;
    }
  }

  // Get Google configuration
  async configureGoogle(): Promise<void> {
    Google.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      scopes: ['profile', 'email']
    });
  }

  // Check if Google Play Services available
  async isGooglePlayServicesAvailable(): Promise<boolean> {
    try {
      return await Google.playServicesAvailabilityAsync().then(
        result => result.isAvailable
      );
    } catch {
      return false;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await Google.signOutAsync();
    } catch (error) {
      logger.error('Sign out error', { error });
    }
  }
}

export const socialAuthService = new SocialAuthService();
