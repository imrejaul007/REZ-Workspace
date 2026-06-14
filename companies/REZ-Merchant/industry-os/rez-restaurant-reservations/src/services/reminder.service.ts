/**
 * Reminder Service - SMS/Email notifications for reservations
 */

import { Reservation } from '../models';
import axios from 'axios';
import { logger } from '../config/logger';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

export const reminderService = {
  /**
   * Send reminders for upcoming reservations (2 hours before)
   */
  async sendUpcomingReminders(): Promise<void> {
    try {
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const upcomingReservations = await Reservation.find({
        date: {
          $gte: now,
          $lte: twoHoursLater,
        },
        status: 'confirmed',
        reminderSent: false,
      });

      logger.info(`Found ${upcomingReservations.length} reservations to send reminders`);

      for (const reservation of upcomingReservations) {
        try {
          await this.sendReminder(reservation);
          reservation.reminderSent = true;
          await reservation.save();
        } catch (error) {
          logger.error(`Failed to send reminder for ${reservation.reservationId}`, error);
        }
      }
    } catch (error) {
      logger.error('Error sending reminders', error);
    }
  },

  /**
   * Send a single reminder
   */
  async sendReminder(reservation): Promise<void> {
    try {
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/sms`,
        {
          phone: reservation.customerPhone,
          message: `Reminder: Your table at ${reservation.time} for ${reservation.partySize} is confirmed. See you soon!`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );
      logger.info(`Reminder sent for reservation ${reservation.reservationId}`);
    } catch (error) {
      logger.error(`Failed to send reminder: ${error}`);
      throw error;
    }
  },

  /**
   * Cancel no-shows (30 minutes after reservation time)
   */
  async cancelNoShows(): Promise<void> {
    try {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      const noShows = await Reservation.find({
        date: { $lte: thirtyMinutesAgo },
        status: 'confirmed',
      });

      logger.info(`Found ${noShows.length} potential no-shows`);

      for (const reservation of noShows) {
        // Check if already past the reservation time window
        const [hours, minutes] = reservation.time.split(':').map(Number);
        const reservationDateTime = new Date(reservation.date);
        reservationDateTime.setHours(hours, minutes, 0, 0);

        if (reservationDateTime.getTime() + 30 * 60 * 1000 < now.getTime()) {
          reservation.status = 'no_show';
          await reservation.save();
          logger.info(`Marked ${reservation.reservationId} as no-show`);
        }
      }
    } catch (error) {
      logger.error('Error checking no-shows', error);
    }
  },

  /**
   * Send booking confirmation
   */
  async sendConfirmation(reservation): Promise<void> {
    try {
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/sms`,
        {
          phone: reservation.customerPhone,
          message: `Booking confirmed! Table for ${reservation.partySize} on ${reservation.date.toDateString()} at ${reservation.time}. Reply CANCEL to cancel.`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to send confirmation', error);
    }
  },

  /**
   * Send waitlist notification
   */
  async notifyWaitlist(waitlistEntry, estimatedWait: number): Promise<void> {
    try {
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/sms`,
        {
          phone: waitlistEntry.customerPhone,
          message: `Your table at ${waitlistEntry.restaurantId} is ready! Please check in with the host. Estimated wait was ${estimatedWait} minutes.`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to send waitlist notification', error);
    }
  },
};
