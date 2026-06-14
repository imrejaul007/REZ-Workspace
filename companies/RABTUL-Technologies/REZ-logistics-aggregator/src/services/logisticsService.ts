/**
 * Logistics Aggregator - Logistics Service
 * Multi-carrier rates, tracking, label generation
 */

import { Shipment, RateQuote, CarrierConfig, PickupSchedule } from '../models';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { NotFoundError, BusinessRuleError } from '../../../../shared/rez-errors/src';

const logger = {
  info: (msg: string, meta?: object) => console.log(JSON.stringify({ level: 'info', message: msg, ...meta })),
  error: (msg: string, meta?: object) => console.error(JSON.stringify({ level: 'error', message: msg, ...meta })),
  warn: (msg: string, meta?: object) => console.warn(JSON.stringify({ level: 'warn', message: msg, ...meta })),
};

interface ShipmentInput {
  orderId: string;
  pickup: {
    name: string;
    phone: string;
    address1: string;
    city: string;
    state: string;
    pincode: string;
  };
  delivery: {
    name: string;
    phone: string;
    address1: string;
    city: string;
    state: string;
    pincode: string;
  };
  package: {
    weight: number;
    length?: number;
    breadth?: number;
    height?: number;
  };
  isCOD?: boolean;
  codAmount?: number;
}

class LogisticsService {
  /**
   * Get rate quotes from all carriers
   */
  async getRates(input: {
    pickup: { city: string; pincode: string };
    delivery: { city: string; pincode: string };
    package: { weight: number; length?: number; breadth?: number; height?: number };
    isCOD?: boolean;
    codAmount?: number;
  }): Promise<unknown> {
    const quoteId = `qt_${uuid()}`;

    // Calculate volumetric weight
    const volumetricWeight = this.calculateVolumetricWeight(input.package);

    // Get carrier configs
    const carriers = await CarrierConfig.find({ active: true });

    // Get quotes from each carrier
    const quotes = [];
    for (const carrier of carriers) {
      const quote = await this.getCarrierRate(carrier, input, volumetricWeight);
      if (quote) {
        quotes.push(quote);
      }
    }

    // Sort by price
    quotes.sort((a, b) => a.rate - b.rate);

    // Save quote
    await RateQuote.create({
      quoteId,
      pickup: input.pickup,
      delivery: input.delivery,
      package: input.package,
      isCOD: input.isCOD,
      codAmount: input.codAmount,
      quotes,
      bestQuote: quotes[0] || null,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
    });

    return {
      quoteId,
      quotes,
      bestQuote: quotes[0],
    };
  }

  /**
   * Get rate from single carrier
   */
  private async getCarrierRate(
    carrier,
    input,
    volumetricWeight: number
  ): Promise<unknown | null> {
    try {
      // Determine zone
      const fromZone = this.getZone(input.pickup.pincode);
      const toZone = this.getZone(input.delivery.pincode);
      const zoneKey = `${fromZone}_${toZone}`;

      // Find zone rate
      const zone = carrier.zones?.find(
        (z) => z.fromZone === fromZone && z.toZone === toZone
      );

      if (!zone) {
        return null; // Not serviceable
      }

      // Find weight slab
      const weightKg = Math.max(input.package.weight || 0.5, volumetricWeight);
      const slab = zone.rates?.find(
        (r) => weightKg >= r.weightMin && weightKg <= (r.weightMax || 999)
      );

      if (!slab) {
        return null;
      }

      // Calculate total
      let total = slab.rate;

      // COD charge
      let codCharge = 0;
      if (input.isCOD && carrier.cod?.enabled) {
        codCharge = Math.max(
          carrier.cod.chargePercent * (input.codAmount || 0) / 100,
          carrier.cod.minCharge || 0
        );
        codCharge = Math.min(codCharge, carrier.cod.maxCharge || Infinity);
        total += codCharge;
      }

      // Fuel surcharge (assume 15%)
      const fuelSurcharge = Math.round(total * 0.15);
      total += fuelSurcharge;

      return {
        carrier: carrier.carrier,
        name: carrier.name,
        service: carrier.services?.[0]?.name || 'Standard',
        rate: total,
        eta: carrier.services?.[0]?.eta || '3-5 days',
        codAvailable: carrier.cod?.enabled || false,
        codCharge: codCharge,
      };
    } catch (error) {
      console.warn(`Rate calculation failed for ${carrier.carrier}:`, error);
      return null;
    }
  }

  /**
   * Book shipment with selected carrier
   */
  async bookShipment(input: ShipmentInput & { carrier: string }): Promise<unknown> {
    const shipmentId = `shp_${uuid()}`;

    // Get rate quote
    const rates = await this.getRates({
      pickup: input.pickup,
      delivery: input.delivery,
      package: input.package,
      isCOD: input.isCOD,
      codAmount: input.codAmount,
    });

    const selectedQuote = rates.quotes.find((q) => q.carrier === input.carrier);
    if (!selectedQuote) {
      throw new BusinessRuleError('Carrier not available for this route', 'CARRIER_UNAVAILABLE');
    }

    // Create shipment
    const shipment = await Shipment.create({
      shipmentId,
      orderId: input.orderId,
      pickup: input.pickup,
      delivery: input.delivery,
      package: {
        ...input.package,
        volumetricWeight: this.calculateVolumetricWeight(input.package),
      },
      carrier: {
        name: input.carrier,
        service: selectedQuote.name,
      },
      rate: {
        base: selectedQuote.rate - selectedQuote.codCharge,
        fuelSurcharge: Math.round(selectedQuote.rate * 0.15),
        codCharge: selectedQuote.codCharge || 0,
        total: selectedQuote.rate,
      },
      codAmount: input.isCOD ? input.codAmount : 0,
      status: 'pending',
    });

    // Call carrier API (mock)
    const trackingId = await this.createCarrierShipment(shipment, selectedQuote);

    // Update with tracking
    shipment.trackingId = trackingId;
    shipment.trackingUrl = this.getTrackingUrl(input.carrier, trackingId);
    await shipment.save();

    return {
      shipmentId,
      trackingId,
      trackingUrl: shipment.trackingUrl,
      rate: selectedQuote.rate,
      labelUrl: `/api/logistics/shipments/${shipmentId}/label`,
    };
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingId: string): Promise<unknown> {
    const shipment = await Shipment.findOne({ trackingId });
    if (!shipment) {
      throw new NotFoundError('Shipment', trackingId);
    }

    // Get latest status from carrier (mock)
    const status = await this.getCarrierStatus(shipment.carrier.name, trackingId);

    // Update status history
    if (status) {
      shipment.statusHistory.push(status);
      shipment.currentStatus = status.status;
      shipment.status = this.mapStatus(status.status);

      if (status.status === 'delivered') {
        shipment.deliveredAt = new Date();
      }

      await shipment.save();
    }

    return {
      trackingId,
      status: shipment.currentStatus,
      history: shipment.statusHistory,
      estimatedDelivery: shipment.expectedDelivery,
    };
  }

  /**
   * Get tracking URL for carrier
   */
  private getTrackingUrl(carrier: string, trackingId: string): string {
    const urls: Record<string, string> = {
      delhivery: `https://www.delhivery.com/track/package/${trackingId}`,
      dtdc: `https://www.dtdc.in/track.asp?strTno=${trackingId}`,
      xpressbees: `https://www.xpressbees.com/track?waybill=${trackingId}`,
      shiprocket: `https://app.shiprocket.in/tracking/${trackingId}`,
    };
    return urls[carrier.toLowerCase()] || `https://rez.app/track/${trackingId}`;
  }

  /**
   * Calculate volumetric weight
   */
  private calculateVolumetricWeight(pkg): number {
    if (!pkg.length || !pkg.breadth || !pkg.height) {
      return 0;
    }
    // Volumetric = L × B × H / 5000 (industry standard)
    return (pkg.length * pkg.breadth * pkg.height) / 5000;
  }

  /**
   * Get zone from pincode
   */
  private getZone(pincode: string): string {
    const prefix = pincode.substring(0, 2);
    const metroPincodes = ['11', '22', '33', '44', '55']; // Delhi, Mumbai, Chennai, Kolkata, Bangalore

    if (metroPincodes.includes(prefix)) {
      return 'metro';
    }
    return 'tier2';
  }

  /**
   * Map carrier status to internal status
   */
  private mapStatus(carrierStatus: string): string {
    const statusMap: Record<string, string> = {
      'picked_up': 'picked_up',
      'in_transit': 'in_transit',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
      'rto_initiated': 'rto',
      'delivery_failed': 'failed',
    };
    return statusMap[carrierStatus] || 'in_transit';
  }

  /**
   * Create shipment with carrier (mock)
   */
  private async createCarrierShipment(shipment, quote): Promise<string> {
    // In production, call actual carrier API
    // FIX: Use crypto for secure tracking IDs instead of Math.random()
    return `TRK${Date.now()}${crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase()}`;
  }

  /**
   * Get status from carrier (mock)
   */
  private async getCarrierStatus(carrier: string, trackingId: string): Promise<unknown> {
    // In production, call actual carrier API
    return {
      status: 'in_transit',
      location: 'Mumbai',
      timestamp: new Date(),
      description: 'Package in transit',
    };
  }

  /**
   * Generate label (mock)
   */
  async generateLabel(shipmentId: string): Promise<string> {
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      throw new NotFoundError('Shipment', shipmentId);
    }

    // In production, call carrier API for actual label
    return `data:application/pdf;base64,BASE64_LABEL_DATA_HERE`;
  }
}

export const logisticsService = new LogisticsService();
