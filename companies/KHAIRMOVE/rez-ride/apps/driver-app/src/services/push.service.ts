import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class PushNotificationService {
  async initialize(): Promise<void> {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }

    await Notifications.setNotificationChannelAsync('rides', {
      name: 'Ride Requests',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#6B4EFF',
    });
  }

  async notifyNewRide(rideId: string, pickup: string, fare: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Ride Request! 🚗',
        body: `${pickup} - ₹${fare}`,
        data: { type: 'new_ride', rideId },
        sound: true,
        categoryIdentifier: 'ride_request',
      },
      trigger: null,
    });
  }

  async notifyRideCancelled(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ride Cancelled',
        body: 'The rider has cancelled the ride',
        data: { type: 'ride_cancelled' },
      },
      trigger: null,
    });
  }

  addResponseListener(callback: (response: Notifications.NotificationResponse) => void): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const pushService = new PushNotificationService();
