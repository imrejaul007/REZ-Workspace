import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Ride } from '../models/ride.model';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly notificationsUrl: string;
  private readonly internalToken: string;

  constructor(private configService: ConfigService) {
    this.notificationsUrl = configService.get('REZ_NOTIFICATIONS_URL', 'http://localhost:4011');
    this.internalToken = configService.get('INTERNAL_SERVICE_TOKEN', '');
  }

  /**
   * Send ride assigned notification to user
   */
  async sendRideAssigned(userId: string, ride: Ride): Promise<void> {
    await this.sendPush(userId, {
      title: 'Ride Confirmed! 🚗',
      body: 'A driver has been assigned to your ride',
      data: {
        type: 'ride_assigned',
        rideId: ride._id.toString(),
      },
    });
  }

  /**
   * Send ride accepted notification to user
   */
  async sendRideAccepted(userId: string, ride: Ride): Promise<void> {
    await this.sendPush(userId, {
      title: 'Driver is on the way! 🚗',
      body: 'Your driver has accepted the ride',
      data: {
        type: 'ride_accepted',
        rideId: ride._id.toString(),
      },
    });
  }

  /**
   * Send driver arrived notification
   */
  async sendDriverArrived(userId: string, ride: Ride): Promise<void> {
    await this.sendPush(userId, {
      title: 'Driver has arrived! 📍',
      body: 'Your driver has arrived at the pickup location',
      data: {
        type: 'driver_arrived',
        rideId: ride._id.toString(),
      },
    });
  }

  /**
   * Send ride started notification
   */
  async sendRideStarted(userId: string, ride: Ride): Promise<void> {
    await this.sendPush(userId, {
      title: 'Ride in progress 🚗',
      body: 'Have a safe journey!',
      data: {
        type: 'ride_started',
        rideId: ride._id.toString(),
      },
    });
  }

  /**
   * Send ride completed notification
   */
  async sendRideCompleted(userId: string, ride: Ride): Promise<void> {
    const cashback = ride.cashbackAmount || Math.round(ride.fare.total * 0.1);

    await this.sendPush(userId, {
      title: 'Ride completed! ⭐',
      body: `Ride completed. You earned ₹${cashback.toFixed(0)} cashback!`,
      data: {
        type: 'ride_completed',
        rideId: ride._id.toString(),
        cashback,
      },
    });
  }

  /**
   * Send ride cancelled notification
   */
  async sendRideCancelledByDriver(userId: string, ride: Ride): Promise<void> {
    await this.sendPush(userId, {
      title: 'Ride cancelled',
      body: 'Driver cancelled the ride. Finding another driver...',
      data: {
        type: 'ride_cancelled',
        rideId: ride._id.toString(),
        cancelledBy: 'driver',
      },
    });
  }

  /**
   * Send ride cancelled notification to driver
   */
  async sendRideCancelledByUser(driverId: string | undefined, ride: Ride): Promise<void> {
    if (!driverId) return;

    await this.sendPush(driverId, {
      title: 'Ride cancelled',
      body: 'Rider has cancelled the ride',
      data: {
        type: 'ride_cancelled',
        rideId: ride._id.toString(),
        cancelledBy: 'user',
      },
    });
  }

  /**
   * Send ride request to driver
   */
  async sendRideRequest(driverId: string, ride: Ride): Promise<void> {
    await this.sendPush(driverId, {
      title: 'New Ride Request! 🚗',
      body: `${ride.pickup.address} → ${ride.drop.address}`,
      data: {
        type: 'ride_request',
        rideId: ride._id.toString(),
      },
    });
  }

  /**
   * Send voucher earned notification
   */
  async sendVoucherEarned(userId: string, amount: number, merchantName: string): Promise<void> {
    await this.sendPush(userId, {
      title: 'You earned a ride reward! 🎁',
      body: `₹${amount} off your next ReZ Ride from ${merchantName}`,
      data: {
        type: 'voucher_earned',
        amount,
        merchant: merchantName,
      },
    });
  }

  /**
   * Send push notification
   */
  private async sendPush(userId: string, notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<void> {
    try {
      // Get user's device tokens
      // For now, send to all channels
      await Promise.all([
        this.sendToUser(userId, notification),
      ]);
    } catch (error) {
      this.logger.error(`Failed to send push: ${error.message}`);
    }
  }

  /**
   * Send to user via notifications service
   */
  private async sendToUser(userId: string, notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<void> {
    try {
      await axios.post(
        `${this.notificationsUrl}/api/notifications/send`,
        {
          user_id: userId,
          channel: 'push',
          notification: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
          },
        },
        {
          headers: {
            'X-Internal-Token': this.internalToken,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      this.logger.debug(`Failed to send via notifications service: ${error.message}`);
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(phone: string, message: string): Promise<void> {
    try {
      await axios.post(
        `${this.notificationsUrl}/api/notifications/sms`,
        {
          phone,
          message,
        },
        {
          headers: {
            'X-Internal-Token': this.internalToken,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(phone: string, template: string, variables: Record<string, string>): Promise<void> {
    try {
      await axios.post(
        `${this.notificationsUrl}/api/notifications/whatsapp`,
        {
          phone,
          template,
          variables,
        },
        {
          headers: {
            'X-Internal-Token': this.internalToken,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp: ${error.message}`);
    }
  }
}
