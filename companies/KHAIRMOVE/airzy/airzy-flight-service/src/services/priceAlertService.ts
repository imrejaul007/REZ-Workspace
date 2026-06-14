import { PriceAlert, PriceAlertRequest } from '../types';
import { PriceAlertModel, IPriceAlert } from '../models';
import { logger } from '../utils/logger';
import { flightService } from './flightService';

export class PriceAlertService {
  async createAlert(request: PriceAlertRequest, userId?: string): Promise<PriceAlert> {
    logger.info('Creating price alert', { userId, email: request.email });

    const alert = new PriceAlertModel({
      userId,
      email: request.email,
      origin: request.origin.toUpperCase(),
      destination: request.destination.toUpperCase(),
      departureDate: request.departureDate,
      returnDate: request.returnDate,
      maxPrice: request.maxPrice,
      currency: 'INR',
      cabinClass: request.cabinClass,
      passengers: request.passengers,
      frequency: request.notifyFrequency,
      active: true,
      notifyCount: 0,
      unsubscribed: false
    });

    await alert.save();

    logger.info('Price alert created', { alertId: alert._id });

    return this.toAlertResponse(alert);
  }

  async getAlertById(alertId: string): Promise<PriceAlert | null> {
    const alert = await PriceAlertModel.findById(alertId);
    if (!alert) {
      return null;
    }
    return this.toAlertResponse(alert);
  }

  async getUserAlerts(userId: string): Promise<PriceAlert[]> {
    const alerts = await PriceAlertModel.find({ userId, unsubscribed: false })
      .sort({ createdAt: -1 });
    return alerts.map(a => this.toAlertResponse(a));
  }

  async getAlertsByEmail(email: string): Promise<PriceAlert[]> {
    const alerts = await PriceAlertModel.find({ email, unsubscribed: false })
      .sort({ createdAt: -1 });
    return alerts.map(a => this.toAlertResponse(a));
  }

  async checkAlerts(): Promise<void> {
    logger.info('Checking price alerts');

    const now = new Date();
    const alerts = await PriceAlertModel.find({
      active: true,
      unsubscribed: false,
      $or: [
        { lastChecked: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } },
        { lastChecked: null }
      ]
    });

    logger.info(`Found ${alerts.length} alerts to check`);

    for (const alert of alerts) {
      try {
        await this.checkSingleAlert(alert);
      } catch (error) {
        logger.error('Error checking alert', { alertId: alert._id, error });
      }
    }
  }

  private async checkSingleAlert(alert: IPriceAlert): Promise<void> {
    try {
      // Search for flights matching the alert criteria
      const results = await flightService.searchFlights({
        origin: alert.origin,
        destination: alert.destination,
        departureDate: alert.departureDate,
        returnDate: alert.returnDate || undefined,
        cabinClass: alert.cabinClass as any,
        passengers: { adults: alert.passengers }
      });

      if (results.flights.length > 0) {
        const lowestPrice = results.flights[0].price.amount;

        // Update last checked and price
        alert.lastChecked = new Date();
        alert.lastPrice = lowestPrice;

        if (lowestPrice <= alert.maxPrice) {
          // Price dropped below threshold - would send notification
          alert.notifyCount += 1;
          logger.info('Price alert triggered', {
            alertId: alert._id,
            lastPrice: lowestPrice,
            maxPrice: alert.maxPrice
          });

          // In production, send email notification here
        }

        await alert.save();
      }
    } catch (error) {
      logger.error('Error checking single alert', { alertId: alert._id, error });
    }
  }

  async deactivateAlert(alertId: string): Promise<PriceAlert | null> {
    const alert = await PriceAlertModel.findByIdAndUpdate(
      alertId,
      { active: false },
      { new: true }
    );

    if (!alert) {
      return null;
    }

    return this.toAlertResponse(alert);
  }

  async unsubscribe(email: string, alertId: string): Promise<boolean> {
    const alert = await PriceAlertModel.findOneAndUpdate(
      { _id: alertId, email },
      { unsubscribed: true, active: false },
      { new: true }
    );

    return !!alert;
  }

  async getActiveAlertsCount(): Promise<number> {
    return PriceAlertModel.countDocuments({ active: true, unsubscribed: false });
  }

  async getAlertsDueForCheck(): Promise<IPriceAlert[]> {
    const now = new Date();
    return PriceAlertModel.find({
      active: true,
      unsubscribed: false,
      $or: [
        { lastChecked: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } },
        { lastChecked: null }
      ]
    });
  }

  private toAlertResponse(doc: IPriceAlert): PriceAlert {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      email: doc.email,
      origin: doc.origin,
      destination: doc.destination,
      departureDate: doc.departureDate,
      returnDate: doc.returnDate,
      maxPrice: doc.maxPrice,
      currency: doc.currency,
      cabinClass: doc.cabinClass,
      passengers: doc.passengers,
      frequency: doc.frequency,
      active: doc.active,
      lastChecked: doc.lastChecked,
      lastPrice: doc.lastPrice,
      notifyCount: doc.notifyCount,
      createdAt: doc.createdAt,
      unsubscribed: doc.unsubscribed
    };
  }
}

export const priceAlertService = new PriceAlertService();
export default priceAlertService;