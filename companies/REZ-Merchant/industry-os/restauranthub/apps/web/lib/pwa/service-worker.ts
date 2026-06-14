import logger from './utils/logger';

/**
 * Service Worker registration and PWA utilities
 * Handles service worker lifecycle, background sync, and offline functionality
 */

interface CacheStatus {
  caches: Record<string, number>;
  offlineActions: number;
  dbInitialized: boolean;
}

interface OfflineAction {
  type: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;
  private listeners: { [key: string]: ((data) => void)[] } = {};

  constructor() {
    this.setupOnlineOfflineListeners();
    this.setupVisibilityChangeListener();
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      logger.info('Service Worker registered successfully');

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.emit('updateAvailable', { registration: this.registration });
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Update the service worker
   */
  async update(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      logger.info('Service Worker update triggered');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return;

    this.sendMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }

  /**
   * Store an action for offline sync
   */
  async storeOfflineAction(action: OfflineAction): Promise<void> {
    this.sendMessage({
      type: 'STORE_OFFLINE_ACTION',
      payload: action,
    });

    // Also store in local cache for immediate UI feedback
    const offlineActions = this.getOfflineActions();
    offlineActions.push({
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
    });
    localStorage.setItem('offline_actions', JSON.stringify(offlineActions));
  }

  /**
   * Get pending offline actions from localStorage
   */
  getOfflineActions(): unknown[] {
    try {
      const actions = localStorage.getItem('offline_actions');
      return actions ? JSON.parse(actions) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear offline actions
   */
  clearOfflineActions(): void {
    localStorage.removeItem('offline_actions');
    this.sendMessage({ type: 'CLEAR_OFFLINE_CACHE' });
  }

  /**
   * Get cache status from service worker
   */
  async getCacheStatus(): Promise<CacheStatus | null> {
    return new Promise((resolve) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATUS') {
          resolve(event.data.data);
        } else {
          resolve(null);
        }
      };

      this.sendMessage(
        { type: 'GET_CACHE_STATUS' },
        [channel.port2]
      );
    });
  }

  /**
   * Cache important data
   */
  cacheImportantData(key: string, data): void {
    this.sendMessage({
      type: 'CACHE_IMPORTANT_DATA',
      payload: { key, data },
    });
  }

  /**
   * Trigger immediate sync
   */
  syncNow(): void {
    this.sendMessage({ type: 'SYNC_NOW' });

    // Also trigger background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      this.registration?.sync.register('critical-data-sync');
    }
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return 'beforeinstallprompt' in window;
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    const deferredPrompt = (window as unknown).deferredPrompt;
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        logger.info('PWA installation accepted');
        (window as unknown).deferredPrompt = null;
        return true;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
    }

    return false;
  }

  /**
   * Check if app is running in standalone mode
   */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as unknown).standalone === true;
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data) => void): void {
    if (!this.listeners[event]) return;

    const index = this.listeners[event].indexOf(callback);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data): void {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  /**
   * Send message to service worker
   */
  private sendMessage(message, transfer?: Transferable[]): void {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage(message, transfer);
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;

    switch (data.type) {
      case 'CACHE_STATUS':
        this.emit('cacheStatus', data.data);
        break;

      case 'SYNC_COMPLETE':
        this.emit('syncComplete', data.data);
        // Clear local offline actions on successful sync
        if (data.data.success) {
          localStorage.removeItem('offline_actions');
        }
        break;

      case 'OFFLINE_READY':
        this.emit('offlineReady', data.data);
        break;

      default:
        console.log('Unhandled service worker message:', data);
    }
  }

  /**
   * Setup online/offline listeners
   */
  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online', { isOnline: true });

      // Trigger sync when coming back online
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline', { isOnline: false });
    });
  }

  /**
   * Setup visibility change listener for background sync
   */
  private setupVisibilityChangeListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        // Trigger sync when app becomes visible and online
        this.syncNow();
      }
    });
  }

  /**
   * Get online status
   */
  get online(): boolean {
    return this.isOnline;
  }
}

// Create global instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register service worker
if (typeof window !== 'undefined') {
  serviceWorkerManager.register();
}

// Handle beforeinstallprompt
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as unknown).deferredPrompt = e;
    serviceWorkerManager.emit('installable', { canInstall: true });
  });

  window.addEventListener('appinstalled', () => {
    (window as unknown).deferredPrompt = null;
    serviceWorkerManager.emit('installed', { installed: true });
  });
}

export default serviceWorkerManager;