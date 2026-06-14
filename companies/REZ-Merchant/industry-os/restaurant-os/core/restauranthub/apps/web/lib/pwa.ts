export interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class PWAManager {
  private static instance: PWAManager;
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private isStandalone = false;

  private constructor() {
    this.init();
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Check if app is installed
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown).standalone ||
      document.referrer.includes('android-app://');

    this.isInstalled = this.isStandalone;

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as PWAInstallPrompt;
      this.dispatchEvent('installable', { canInstall: true });
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.dispatchEvent('installed', { installed: true });
    });

    // Register service worker
    this.registerServiceWorker();

    // Handle online/offline status
    this.setupNetworkListeners();
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.dispatchEvent('updateavailable', { registration });
              }
            });
          }
        });

        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private setupNetworkListeners() {
    const updateOnlineStatus = () => {
      this.dispatchEvent('networkchange', {
        online: navigator.onLine,
        connectionType: this.getConnectionType(),
      });
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial status
    updateOnlineStatus();
  }

  private getConnectionType(): string {
    const connection = (navigator as unknown).connection ||
      (navigator as unknown).mozConnection ||
      (navigator as unknown).webkitConnection;

    return connection?.effectiveType || 'unknown';
  }

  private dispatchEvent(type: string, detail) {
    window.dispatchEvent(new CustomEvent(`pwa-${type}`, { detail }));
  }

  // Public methods
  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      this.deferredPrompt = null;

      if (outcome === 'accepted') {
        this.dispatchEvent('installaccepted', {});
        return true;
      } else {
        this.dispatchEvent('installdismissed', {});
        return false;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  getInstallStatus(): {
    canInstall: boolean;
    isInstalled: boolean;
    isStandalone: boolean;
  } {
    return {
      canInstall: this.canInstall(),
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
    };
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      });

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async updateServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }

  // Utility methods
  isOnline(): boolean {
    return navigator.onLine;
  }

  getConnectionInfo(): {
    online: boolean;
    type: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  } {
    const connection = (navigator as unknown).connection ||
      (navigator as unknown).mozConnection ||
      (navigator as unknown).webkitConnection;

    return {
      online: navigator.onLine,
      type: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  }

  // Storage utilities for offline data
  async storeOfflineData(key: string, data): Promise<void> {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }

  getOfflineData<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (stored) {
        const { data } = JSON.parse(stored);
        return data;
      }
    } catch (error) {
      console.error('Failed to get offline data:', error);
    }
    return null;
  }

  clearOfflineData(key?: string): void {
    if (key) {
      localStorage.removeItem(`offline_${key}`);
    } else {
      // Clear all offline data
      Object.keys(localStorage)
        .filter(k => k.startsWith('offline_'))
        .forEach(k => localStorage.removeItem(k));
    }
  }
}