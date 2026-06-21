/**
 * Logistics-OS Client
 *
 * Bridges inventory-twin-service to RTMN logistics-os (port 5272).
 * When a purchase order is dispatched to procurement and the deal is
 * later signed, this client creates a shipment record so the
 * restaurant can track delivery.
 *
 * Currently the integration is fire-and-forget: we POST a shipment
 * record keyed by the PO ID so logistics-os has a destination. The
 * status polling (in-transit, delivered) is wired through
 * procurement-os's deal fulfillment flow, not here.
 *
 * Fail-open: if logistics-os is unreachable, we just log and proceed.
 * The procurement deal still completes, the inventory still updates;
 * the shipment record is best-effort.
 */

import { logger } from './logger';

const LOGISTICS_OS_URL = process.env.LOGISTICS_OS_URL || 'http://localhost:5272';
const INTERNAL_SERVICE_TOKEN = process.env.LOGISTICS_INTERNAL_TOKEN || process.env.INTERNAL_SERVICE_TOKEN || '';
const REQUEST_TIMEOUT_MS = 3000;

export interface ShipmentRequest {
  poId: string;
  rfqId?: string;
  buyerRestaurantId: string;
  sellerSupplierId: string;
  carrierId?: string;
  destinationAddress: string;
  items: Array<{ sku?: string; name: string; quantity: number; unit?: string }>;
  weightKg?: number;
}

export interface ShipmentResponse {
  shipmentId: string;
  status: 'created' | 'in_transit' | 'delivered' | 'failed';
  trackingNumber?: string;
  estimatedArrival?: string;
  carrier?: string;
}

export class LogisticsClient {
  async createShipmentForPo(req: ShipmentRequest): Promise<{ ok: boolean; shipment?: ShipmentResponse; error?: string }> {
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (INTERNAL_SERVICE_TOKEN) headers['x-internal-token'] = INTERNAL_SERVICE_TOKEN;

      // logistics-os exposes /api/shipments (see services/logistics-os/src/index.js)
      const body = {
        originWarehouseId: 'auto', // let logistics-os pick nearest
        destination: req.destinationAddress,
        carrierId: req.carrierId || 'auto',
        weight_kg: req.weightKg || req.items.reduce((s, it) => s + (it.quantity * 0.5), 0), // rough estimate
        referencePoId: req.poId,
        referenceRfqId: req.rfqId,
        buyerRestaurantId: req.buyerRestaurantId,
        sellerSupplierId: req.sellerSupplierId,
        items: req.items,
      };

      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const resp = await fetch(`${LOGISTICS_OS_URL}/api/shipments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutHandle);

      if (!resp.ok) {
        const text = await resp.text();
        return { ok: false, error: `logistics-os ${resp.status}: ${text}` };
      }
      const data: any = await resp.json();
      return {
        ok: true,
        shipment: {
          shipmentId: data.id || data.shipmentId,
          status: data.status || 'created',
          trackingNumber: data.tracking_number,
          estimatedArrival: data.eta,
          carrier: data.carrier_name,
        },
      };
    } catch (err: any) {
      const message = err && err.message ? err.message : String(err);
      logger.warn(`[logistics-client] logistics-os unreachable: ${message}`);
      return { ok: false, error: `unreachable: ${message}` };
    }
  }
}

export const logisticsClient = new LogisticsClient();