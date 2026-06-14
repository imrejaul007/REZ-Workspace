/**
 * Auth Service - Event Connector
 */

import { eventConnector, identityEvents } from './eventConnectors';

export interface AuthConnector {
  onUserRegistered(user: {
    userId: string;
    phone?: string;
    email?: string;
    source: string;
  }): void;

  onUserLoggedIn(auth: {
    userId: string;
    method: string;
    deviceId?: string;
    ip?: string;
  }): void;

  onUserLoggedOut(auth: {
    userId: string;
    sessionId: string;
  }): void;

  onOTPSent(auth: {
    userId?: string;
    phone?: string;
    method: string;
  }): void;

  onOTPVerified(auth: {
    userId: string;
    method: string;
  }): void;

  onMFAActivated(auth: {
    userId: string;
    method: string;
  }): void;

  onLoginFailed(auth: {
    userId?: string;
    phone?: string;
    reason: string;
    ip?: string;
  }): void;
}

export function createAuthConnector(): AuthConnector {
  return {
    onUserRegistered: (user) => {
      identityEvents.userRegistered({
        userId: user.userId,
        phone: user.phone,
        email: user.email,
        source: user.source,
        registeredAt: new Date().toISOString()
      }, { userId: user.userId });
    },

    onUserLoggedIn: (auth) => {
      identityEvents.userLoggedIn({
        userId: auth.userId,
        method: auth.method,
        deviceId: auth.deviceId,
        ip: auth.ip,
        loggedInAt: new Date().toISOString()
      }, { userId: auth.userId });
    },

    onUserLoggedOut: (auth) => {
      identityEvents.userLoggedOut({
        userId: auth.userId,
        sessionId: auth.sessionId,
        loggedOutAt: new Date().toISOString()
      }, { userId: auth.userId });
    },

    onOTPSent: (auth) => {
      eventConnector.emit('auth.otp.sent', {
        userId: auth.userId,
        phone: auth.phone,
        method: auth.method,
        sentAt: new Date().toISOString()
      }, { userId: auth.userId });
    },

    onOTPVerified: (auth) => {
      eventConnector.emit('auth.otp.verified', {
        userId: auth.userId,
        method: auth.method,
        verifiedAt: new Date().toISOString()
      }, { userId: auth.userId });
    },

    onMFAActivated: (auth) => {
      eventConnector.emit('auth.mfa.activated', {
        userId: auth.userId,
        method: auth.method,
        activatedAt: new Date().toISOString()
      }, { userId: auth.userId });
    },

    onLoginFailed: (auth) => {
      eventConnector.emit('auth.login.failed', {
        userId: auth.userId,
        phone: auth.phone,
        reason: auth.reason,
        ip: auth.ip,
        attemptedAt: new Date().toISOString()
      });
    }
  };
}

export const authConnector = createAuthConnector();
export default authConnector;
