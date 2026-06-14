import crypto from 'crypto';
import { RateRequest, Shipment, Address, Package } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface Rate {
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  estimatedDays: number;
  estimatedDelivery: string;
}

export class ShippingCore {
  private shipments: Map<string, Shipment> = new Map();

  calculateRates(request: RateRequest): Rate[] {
    const { from, to, package: pkg, serviceType } = request;

    const distance = this.calculateDistance(from, to);
    const volumetricWeight = this.calculateVolumetricWeight(pkg);
    const chargeableWeight = Math.max(pkg.weight, volumetricWeight);

    const rates: Rate[] = [];

    const carriers = [
      { name: 'REZ Express', baseRate: 30, perKg: 45, perKm: 0.02 },
      { name: 'REZ Standard', baseRate: 25, perKg: 35, perKm: 0.015 },
      { name: 'REZ Economy', baseRate: 20, perKg: 28, perKm: 0.01 }
    ];

    for (const carrier of carriers) {
      if (serviceType && !this.matchesService(carrier.name, serviceType)) {
        continue;
      }

      const baseAmount = carrier.baseRate;
      const weightAmount = chargeableWeight * carrier.perKg;
      const distanceAmount = distance * carrier.perKm;
      const total = baseAmount + weightAmount + distanceAmount;

      const deliveryDays = this.estimateDays(serviceType || 'standard', distance);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

      rates.push({
        carrier: carrier.name,
        service: serviceType || 'standard',
        rate: Math.round(total * 100) / 100,
        currency: 'INR',
        estimatedDays: deliveryDays,
        estimatedDelivery: deliveryDate.toISOString().split('T')[0]
      });
    }

    return rates.sort((a, b) => a.rate - b.rate);
  }

  private matchesService(carrier: string, serviceType: string): boolean {
    if (serviceType === 'standard' || serviceType === 'economy') {
      return carrier.includes('Standard') || carrier.includes('Economy');
    }
    if (serviceType === 'express' || serviceType === 'next_day') {
      return carrier.includes('Express') || carrier.includes('Standard');
    }
    return true;
  }

  private calculateDistance(from: Address, to: Address): number {
    if (from.pincode === to.pincode) {
      return 5;
    }
    if (from.city === to.city) {
      return 20;
    }
    if (from.state === to.state) {
      // STATISTICAL: mock shipping cost calculation
      return 100 + Math.random() * 100;
    }
    // STATISTICAL: mock shipping cost calculation for inter-state
    return 500 + Math.random() * 1000;
  }

  private calculateVolumetricWeight(pkg: Package): number {
    return (pkg.length * pkg.breadth * pkg.height) / 5000;
  }

  private estimateDays(serviceType: string, distance: number): number {
    const baseDays: Record<string, number> = {
      same_day: 0,
      next_day: 1,
      express: 2,
      standard: 4,
      economy: 7
    };

    let days = baseDays[serviceType] || 4;
    if (distance > 500) days += 1;
    if (distance > 1000) days += 1;

    return days;
  }

  createShipment(shipment: Shipment): Shipment {
    const trackingId = `REZ${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const fullShipment = {
      ...shipment,
      trackingId,
      status: 'created' as const
    };

    this.shipments.set(trackingId, fullShipment);
    logger.info(`Shipment created: ${trackingId}`);

    return fullShipment;
  }

  getShipment(trackingId: string): Shipment | undefined {
    return this.shipments.get(trackingId);
  }

  updateStatus(trackingId: string, status: Shipment['status']): Shipment | undefined {
    const shipment = this.shipments.get(trackingId);
    if (shipment) {
      shipment.status = status;
      if (status === 'delivered') {
        shipment.actualDelivery = new Date().toISOString();
      }
      this.shipments.set(trackingId, shipment);
      logger.info(`Shipment ${trackingId} status: ${status}`);
    }
    return shipment;
  }

  generateLabel(trackingId: string): string {
    const shipment = this.shipments.get(trackingId);
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    const labelData = {
      trackingId: shipment.trackingId,
      carrier: shipment.carrier,
      from: shipment.from,
      to: shipment.to,
      package: shipment.package,
      createdAt: new Date().toISOString()
    };

    shipment.labelUrl = `data:application/json;base64,${Buffer.from(JSON.stringify(labelData)).toString('base64')}`;
    this.shipments.set(trackingId, shipment);

    return shipment.labelUrl;
  }

  trackShipment(trackingId: string): { trackingId: string; status: string; events: { timestamp: string; location: string; status: string }[] } | undefined {
    const shipment = this.shipments.get(trackingId);
    if (!shipment) return undefined;

    const events = [
      { timestamp: new Date(Date.now() - 86400000).toISOString(), location: shipment.from.city, status: 'Shipment picked up' },
      { timestamp: new Date(Date.now() - 43200000).toISOString(), location: 'Sort Facility', status: 'In transit' }
    ];

    if (shipment.status === 'delivered') {
      events.push({ timestamp: new Date().toISOString(), location: shipment.to.city, status: 'Delivered' });
    } else if (shipment.status === 'out_for_delivery') {
      events.push({ timestamp: new Date().toISOString(), location: shipment.to.city, status: 'Out for delivery' });
    }

    return {
      trackingId,
      status: shipment.status,
      events
    };
  }
}

export const shippingCore = new ShippingCore();
