import logger from './utils/logger';

/**
 * KDS Mobile Notification Service
 * Handles push notifications, sounds, and voice announcements
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Vibration } from 'react-native';
import Constants from 'expo-constants';
import {
  OrderPriority,
  KitchenStation,
  KDSNotificationPayload,
  SoundConfig,
  VoiceConfig,
} from '../types';
import { SOUND_FILES } from '../utils/constants';
import { getPriorityLabel, getStationLabel } from '../utils/helpers';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationType = 'new_order' | 'urgent_order' | 'order_bumped' | 'all_day' | 'station_alert';

export interface NotificationConfig {
  sound: SoundConfig;
  voice: VoiceConfig;
}

class KDSNotificationService {
  private soundObjects: Map<string, Audio.Sound> = new Map();
  private isInitialized = false;
  private config: NotificationConfig = {
    sound: {
      newOrder: true,
      urgentOrder: true,
      orderBumped: true,
      allDay: true,
      volume: 0.8,
    },
    voice: {
      enabled: true,
      language: 'en-IN',
      rate: 0.9,
      pitch: 1.0,
      announcePriority: true,
      announceOrderNumber: true,
      announceItems: true,
    },
  };

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('kds-orders', {
          name: 'KDS Orders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF5733',
          sound: 'new-order',
        });

        await Notifications.setNotificationChannelAsync('kds-urgent', {
          name: 'KDS Urgent',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 200, 500],
          lightColor: '#FF0000',
          sound: 'urgent-order',
        });
      }

      // Request permissions
      await this.requestPermissions();

      // Preload sounds
      await this.preloadSounds();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      logger.warn('Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('Push notification permission not granted');
      return false;
    }

    // Get Expo push token
    if (Constants.expoConfig?.extra?.eas?.projectId) {
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig.extra.eas.projectId,
        });
        console.log('Push token:', token.data);
        // Send token to server for push notification routing
        await this.registerPushToken(token.data);
      } catch (error) {
        console.error('Failed to get push token:', error);
      }
    }

    return true;
  }

  /**
   * Register push token with backend server
   */
  private async registerPushToken(token: string): Promise<void> {
    try {
      const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;
      if (!API_BASE_URL) {
        logger.warn('API base URL not configured for token registration');
        return;
      }

      // Get device info
      const deviceInfo = {
        deviceId: await Device.getDeviceTypeAsync().then(t => Device[t.toString()] ?? 'unknown'),
        osVersion: Platform.Version.toString(),
        appVersion: Constants.expoConfig?.expo?.version || '1.0.0',
      };

      await fetch(`${API_BASE_URL}/api/push/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          ...deviceInfo,
        }),
      });
      logger.info('Push token registered with server');
    } catch (error) {
      logger.error('Failed to register push token', error);
    }
  }

  /**
   * Preload notification sounds
   */
  private async preloadSounds(): Promise<void> {
    const sounds = [
      { key: 'newOrder', file: SOUND_FILES.NEW_ORDER },
      { key: 'urgentOrder', file: SOUND_FILES.URGENT_ORDER },
      { key: 'orderBumped', file: SOUND_FILES.ORDER_BUMPED },
      { key: 'allDay', file: SOUND_FILES.ALL_DAY },
    ];

    for (const { key, file } of sounds) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: `./assets/sounds/${file}` },
          { shouldPlay: false, volume: this.config.sound.volume }
        );
        this.soundObjects.set(key, sound);
      } catch (error) {
        console.warn(`Failed to preload sound ${file}:`, error);
      }
    }
  }

  /**
   * Play notification sound
   */
  async playSound(type: NotificationType): Promise<void> {
    if (!this.config.sound.newOrder && type === 'new_order') return;
    if (!this.config.sound.urgentOrder && type === 'urgent_order') return;
    if (!this.config.sound.orderBumped && type === 'order_bumped') return;
    if (!this.config.sound.allDay && type === 'all_day') return;

    try {
      // Stop any currently playing sound
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      let soundKey: string;
      switch (type) {
        case 'new_order':
          soundKey = 'newOrder';
          break;
        case 'urgent_order':
          soundKey = 'urgentOrder';
          break;
        case 'order_bumped':
          soundKey = 'orderBumped';
          break;
        case 'all_day':
          soundKey = 'allDay';
          break;
        default:
          return;
      }

      const sound = this.soundObjects.get(soundKey);
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  /**
   * Vibrate device
   */
  vibrate(pattern: 'short' | 'long' | 'urgent' = 'short'): void {
    const patterns = {
      short: [0, 200],
      long: [0, 500],
      urgent: [0, 300, 200, 300, 200, 300],
    };

    Vibration.vibrate(patterns[pattern]);
  }

  /**
   * Speak text using TTS
   */
  async speak(text: string): Promise<void> {
    if (!this.config.voice.enabled) return;

    try {
      // Stop any current speech
      await Speech.stop();

      Speech.speak(text, {
        language: this.config.voice.language,
        rate: this.config.voice.rate,
        pitch: this.config.voice.pitch,
        onError: (error) => console.error('Speech error:', error),
      });
    } catch (error) {
      console.error('Failed to speak:', error);
    }
  }

  /**
   * Announce new order
   */
  async announceNewOrder(order: KDSNotificationPayload): Promise<void> {
    const parts: string[] = [];

    // Priority announcement
    if (this.config.voice.announcePriority) {
      const priorityText =
        order.priority === OrderPriority.URGENT
          ? 'Urgent!'
          : order.priority === OrderPriority.HIGH
          ? 'High priority!'
          : '';
      if (priorityText) parts.push(priorityText);
    }

    // Order number
    if (this.config.voice.announceOrderNumber) {
      parts.push(`Order ${order.orderNumber}`);
    }

    // Station
    parts.push(`for ${getStationLabel(order.station)} station`);

    // Item count
    parts.push(`${order.itemCount} item${order.itemCount > 1 ? 's' : ''}`);

    const announcement = parts.join('. ');
    await this.speak(announcement);

    // Play sound based on priority
    if (order.priority === OrderPriority.URGENT) {
      await this.playSound('urgent_order');
      this.vibrate('urgent');
    } else {
      await this.playSound('new_order');
      this.vibrate('short');
    }
  }

  /**
   * Announce order bumped/completed
   */
  async announceOrderBumped(orderNumber: string): Promise<void> {
    await this.speak(`Order ${orderNumber} completed`);
    this.vibrate('short');
  }

  /**
   * Announce all-day reminder
   */
  async announceAllDay(items: string[]): Promise<void> {
    if (items.length === 0) return;

    const itemList = items.slice(0, 5).join(', ');
    const moreText = items.length > 5 ? ` and ${items.length - 5} more` : '';

    await this.speak(`All day: ${itemList}${moreText}`);
    await this.playSound('all_day');
  }

  /**
   * Schedule local notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    data: KDSNotificationPayload,
    trigger?: Date
  ): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as unknown as Record<string, unknown>,
        sound: data.priority === OrderPriority.URGENT ? 'urgent-order' : 'new-order',
        priority: data.priority === OrderPriority.URGENT ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: trigger ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger } : null,
    });

    return identifier;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      sound: { ...this.config.sound, ...config.sound },
      voice: { ...this.config.voice, ...config.voice },
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Stop all sounds
    for (const sound of this.soundObjects.values()) {
      await sound.unloadAsync();
    }
    this.soundObjects.clear();

    // Stop speech
    await Speech.stop();

    this.isInitialized = false;
  }
}

// Export singleton instance
export const kdsNotifications = new KDSNotificationService();
export default kdsNotifications;
