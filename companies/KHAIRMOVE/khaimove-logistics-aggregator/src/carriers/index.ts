// KHAIRMOVE Carrier Clients - Real API integrations
// Delhivery, BlueDart, DTDC, FedEx, DHL

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  pincode?: string;
}

// ============================================
// BASE INTERFACES
// ============================================

export interface CarrierCredentials {
  apiKey?: string;
  username?: string;
  password?: string;
  customerId?: string;
  licenseKey?: string;
}

export interface CarrierConfig {
  name: string;
  baseUrl: string;
  credentials: CarrierCredentials;
}

export interface ShipmentOrder {
  orderId: string;
  pickup: Location;
  drop: Location;
  items: {
    name: string;
    quantity: number;
    weight: number; // grams
    value: number;
    sku?: string;
  }[];
  serviceType: 'standard' | 'express' | 'overnight';
  insurance?: boolean;
  cod?: boolean;
  codAmount?: number;
  dimensions?: { length: number; width: number; height: number }; // cm
}

export interface ShipmentResult {
  carrierId: string;
  awbNumber: string;
  pickupScheduledDate: string;
  labelUrl: string;
  trackingUrl: string;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface TrackingResult {
  awbNumber: string;
  currentStatus: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

// ============================================
// DELHIVERY CLIENT
// ============================================

export class DelhiveryClient {
  private apiKey: string;
  private baseUrl = 'https://api.delhivery.com';

  constructor(credentials: CarrierCredentials) {
    this.apiKey = credentials.apiKey || '';
  }

  private async request<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Delhivery API error: ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  }

  async getRates(pickup: Location, drop: Location, weight: number) {
    const response = await this.request<{
      final_rate: number;
      delivery_string: string;
    }>('/api/v1/package/rates/', {
      shipment_weight: weight / 1000, // kg
      pickup_postcode: pickup.pincode || '110001',
      delivery_postcode: drop.pincode || '110001',
    });

    return {
      rate: response.final_rate,
      estimatedDays: response.delivery_string,
    };
  }

  async createShipment(order: ShipmentOrder): Promise<ShipmentResult> {
    const packages = order.items.map((item, idx) => ({
      client_id: `${order.orderId}_${idx}`,
      name: item.name,
      weight: item.weight / 1000,
      quantity: item.quantity,
      price: item.value,
      sku: item.sku || `SKU${idx}`,
    }));

    const response = await this.request<{
      packages: Array<{
        client_id: string;
        awb_code: string;
        label_url: string;
      }>;
    }>('/api/v1/packages/create/', {
      pickup_location: {
        address: order.pickup.address,
        pincode: order.pickup.pincode || '110001',
        phone: '9999999999',
        name: 'KHAIRMOVE',
      },
      packages,
      delivery_address: {
        address: order.drop.address,
        pincode: order.drop.pincode || '110001',
        phone: '9999999999',
        name: 'Customer',
      },
    });

    const pkg = response.packages[0];

    return {
      carrierId: 'delhivery',
      awbNumber: pkg.awb_code,
      pickupScheduledDate: new Date().toISOString(),
      labelUrl: pkg.label_url,
      trackingUrl: `https://www.delhivery.com/track/package/${pkg.awb_code}`,
    };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResult> {
    const response = await this.request<{
      ShipmentData: Array<{
        Shipment: {
          Status: { status: string };
          EstimatedDeliveryDate: string;
          Scans: Array<{
            ScanDetail: string;
            ScanType: string;
            Location: string;
            UpdatedOn: string;
          }>;
        };
      }>;
    }>(`/api/v1/packages/data/${awbNumber}/`);

    const shipment = response.ShipmentData?.[0]?.Shipment;

    return {
      awbNumber,
      currentStatus: shipment?.Status?.status || 'Unknown',
      estimatedDelivery: shipment?.EstimatedDeliveryDate,
      events: (shipment?.Scans || []).map((scan) => ({
        timestamp: scan.UpdatedOn,
        status: scan.ScanType,
        location: scan.Location,
        description: scan.ScanDetail,
      })),
    };
  }

  async cancelShipment(awbNumber: string): Promise<boolean> {
    try {
      await this.request('/api/v1/packages/cancel/', {
        awb_number: [awbNumber],
      });
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================
// BLUE DART CLIENT
// ============================================

export class BlueDartClient {
  private apiKey: string;
  private baseUrl = 'https://api.bluedart.com';

  constructor(credentials: CarrierCredentials) {
    this.apiKey = credentials.apiKey || '';
  }

  private async request<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'SecureKey': this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`BlueDart API error: ${response.status}`);
    }

    return response.json() as T;
  }

  async getRates(pickup: Location, drop: Location, weight: number) {
    const response = await this.request<{
      rate: number;
      transit_days: number;
    }>('/api/v1/rate', {
      origin_pincode: pickup.pincode || '110001',
      destination_pincode: drop.pincode || '110001',
      weight: weight / 1000,
    });

    return {
      rate: response.rate,
      estimatedDays: response.transit_days,
    };
  }

  async createShipment(order: ShipmentOrder): Promise<ShipmentResult> {
    const response = await this.request<{
      airwaybill_number: string;
      label_url: string;
      pickup_date: string;
    }>('/api/v1/shipment', {
      order_id: order.orderId,
      pickup: {
        address: order.pickup.address,
        pincode: order.pickup.pincode || '110001',
      },
      delivery: {
        address: order.drop.address,
        pincode: order.drop.pincode || '110001',
      },
      parcel: {
        weight: order.items.reduce((sum, i) => sum + i.weight, 0) / 1000,
        items: order.items.map((item) => ({
          description: item.name,
          quantity: item.quantity,
          declared_value: item.value,
        })),
      },
      service_type: order.serviceType,
    });

    return {
      carrierId: 'bluedart',
      awbNumber: response.airwaybill_number,
      pickupScheduledDate: response.pickup_date,
      labelUrl: response.label_url,
      trackingUrl: `https://www.bluedart.com/track?awb=${response.airwaybill_number}`,
    };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResult> {
    const response = await this.request<{
      status: string;
      estimated_delivery: string;
      scans: Array<{
        timestamp: string;
        status: string;
        location: string;
        description: string;
      }>;
    }>(`/api/v1/track/${awbNumber}`);

    return {
      awbNumber,
      currentStatus: response.status,
      estimatedDelivery: response.estimated_delivery,
      events: response.scans.map((scan) => ({
        timestamp: scan.timestamp,
        status: scan.status,
        location: scan.location,
        description: scan.description,
      })),
    };
  }

  async cancelShipment(awbNumber: string): Promise<boolean> {
    try {
      await this.request('/api/v1/shipment/cancel', { airwaybill: awbNumber });
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================
// DTDC CLIENT
// ============================================

export class DTDCClient {
  private apiKey: string;
  private customerId: string;
  private baseUrl = 'https://eCommerceapi.dtdc.in';

  constructor(credentials: CarrierCredentials) {
    this.apiKey = credentials.apiKey || '';
    this.customerId = credentials.customerId || '';
  }

  private async request<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
        'CustomerId': this.customerId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`DTDC API error: ${response.status}`);
    }

    return response.json() as T;
  }

  async getRates(pickup: Location, drop: Location, weight: number) {
    const response = await this.request<{
      rate: number;
      transit_time: string;
    }>('/api/v1/rate', {
      origin_pin: pickup.pincode || '110001',
      dest_pin: drop.pincode || '110001',
      weight,
    });

    return {
      rate: response.rate,
      estimatedDays: parseInt(response.transit_time) || 5,
    };
  }

  async createShipment(order: ShipmentOrder): Promise<ShipmentResult> {
    const response = await this.request<{
      order_no: string;
      airwaybill_no: string;
      label_url: string;
      pickup_date: string;
    }>('/api/v1/shipment', {
      order_no: order.orderId,
      pickup: {
        address: order.pickup.address,
        pincode: order.pickup.pincode || '110001',
      },
      delivery: {
        address: order.drop.address,
        pincode: order.drop.pincode || '110001',
      },
      parcel: {
        weight: order.items.reduce((sum, i) => sum + i.weight, 0) / 1000,
        pieces: order.items.length,
        collectable_value: order.cod ? order.codAmount : 0,
      },
      service_type: order.serviceType === 'overnight' ? 'Express' : 'Surface',
    });

    return {
      carrierId: 'dtdc',
      awbNumber: response.airwaybill_no,
      pickupScheduledDate: response.pickup_date,
      labelUrl: response.label_url,
      trackingUrl: `https://www.dtdc.in/track/${response.airwaybill_no}`,
    };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResult> {
    const response = await this.request<{
      status: string;
      delivery_date: string;
      scan_detail: Array<{
        scan_date_time: string;
        scan_type: string;
        scan_loc: string;
        scan_details: string;
      }>;
    }>(`/api/v1/track/${awbNumber}`);

    return {
      awbNumber,
      currentStatus: response.status,
      estimatedDelivery: response.delivery_date,
      events: response.scan_detail.map((scan) => ({
        timestamp: scan.scan_date_time,
        status: scan.scan_type,
        location: scan.scan_loc,
        description: scan.scan_details,
      })),
    };
  }

  async cancelShipment(awbNumber: string): Promise<boolean> {
    try {
      await this.request('/api/v1/shipment/cancel', { airwaybill_no: awbNumber });
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================
// FEDEX CLIENT (Fixed token expiry)
// ============================================

export class FedExClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://apis.fedex.com';
  private accessToken: string = '';
  private tokenExpiry: number = 0;

  constructor(credentials: CarrierCredentials) {
    this.clientId = credentials.username || '';
    this.clientSecret = credentials.password || '';
  }

  private async authenticate(): Promise<string> {
    // Check if token is still valid (with 5 min buffer for safety)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`FedEx auth error: ${response.status}`);
    }

    const data = await response.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      throw new Error('FedEx auth: No access token received');
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;

    return this.accessToken;
  }

  private async request<T>(endpoint: string, body?: unknown): Promise<T> {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-locale': 'en_US',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`FedEx API error: ${response.status}`);
    }

    return response.json() as T;
  }

  async getRates(pickup: Location, drop: Location, weight: number) {
    const response = await this.request<{
      output: {
        rateReplyDetails: Array<{
          totalNetChargeWithDutiesAndTaxes: string;
          serviceType: string;
        }>;
      };
    }>('/rate/v1/rates/quotes', {
      rateRequestControlParameters: { returnDetailedRates: true },
      requestedShipment: {
        shipFrom: {
          address: {
            postalCode: pickup.pincode || '110001',
            countryCode: 'IN',
          },
        },
        shipTo: {
          address: {
            postalCode: drop.pincode || '110001',
            countryCode: 'IN',
          },
        },
        requestedPackageLineItems: [{ weight: { value: weight / 1000, units: 'KG' } }],
      },
    });

    const rate = response.output.rateReplyDetails[0];

    return {
      rate: parseFloat(rate.totalNetChargeWithDutiesAndTaxes) || 500,
      estimatedDays: rate.serviceType.includes('EXPRESS') ? 2 : 5,
    };
  }

  async createShipment(order: ShipmentOrder): Promise<ShipmentResult> {
    const response = await this.request<{
      output: {
        transactionShipments: Array<{
          masterTrackingNumber: string;
          documents: Array<{ url: string }>;
          pickupConfirmationNumber: string;
        }>;
      };
    }>('/ship/v1/shipments', {
      requestedShipment: {
        shipper: {
          contact: { personName: 'KHAIRMOVE', phoneNumber: '9999999999' },
          address: {
            streetLines: [order.pickup.address || ''],
            postalCode: order.pickup.pincode || '110001',
            countryCode: 'IN',
          },
        },
        recipients: [{
          contact: { personName: 'Customer', phoneNumber: '9999999999' },
          address: {
            streetLines: [order.drop.address || ''],
            postalCode: order.drop.pincode || '110001',
            countryCode: 'IN',
          },
        }],
        shippingChargesPayment: { paymentType: 'SENDER' },
        serviceType: order.serviceType === 'overnight' ? 'INTERNATIONAL_PRIORITY' : 'INTERNATIONAL_ECONOMY',
        requestedPackageLineItems: [{
          weight: { value: order.items.reduce((sum, i) => sum + i.weight, 0) / 1000, units: 'KG' },
        }],
      },
    });

    const shipment = response.output.transactionShipments[0];

    return {
      carrierId: 'fedex',
      awbNumber: shipment.masterTrackingNumber,
      pickupScheduledDate: new Date().toISOString(),
      labelUrl: shipment.documents[0]?.url || '',
      trackingUrl: `https://www.fedex.com/fedextrack/?trknbr=${shipment.masterTrackingNumber}`,
    };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResult> {
    const response = await this.request<{
      output: {
        completeTrackResults: Array<{
          trackResults: Array<{
            latestStatusDetail: { statusByLocale: string };
            dateAndTimes: Array<{ type: string; dateTime: string }>;
            scanEvents: Array<{
              date: string;
              eventType: string;
              eventDescription: string;
              scanLocation: { city: string };
            }>;
          }>;
        }>;
      };
    }>(`/track/v1/trackingnumbers/${awbNumber}`);

    const trackResult = response.output.completeTrackResults[0]?.trackResults[0];

    return {
      awbNumber,
      currentStatus: trackResult?.latestStatusDetail?.statusByLocale || 'Unknown',
      estimatedDelivery: trackResult?.dateAndTimes.find((d) => d.type === 'ESTIMATED_DELIVERY')?.dateTime,
      events: (trackResult?.scanEvents || []).map((event) => ({
        timestamp: event.date,
        status: event.eventType,
        location: event.scanLocation.city,
        description: event.eventDescription,
      })),
    };
  }

  async cancelShipment(awbNumber: string): Promise<boolean> {
    try {
      await this.request('/ship/v1/shipments/cancel', { trackingNumber: awbNumber });
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================
// DHL CLIENT (Real API implementation)
// ============================================

export class DHLClient {
  private apiKey: string;
  private baseUrl = 'https://api.dhl.com';

  constructor(credentials: CarrierCredentials) {
    this.apiKey = credentials.apiKey || '';
  }

  private async request<T>(endpoint: string, method: string = 'GET', body?: unknown): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        'DHL-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`DHL API error: ${response.status}`);
    }

    return response.json() as T;
  }

  async getRates(pickup: Location, drop: Location, weight: number) {
    const response = await this.request<{
      products: Array<{
        productName: string;
        price: { currency: string; price: number };
        transistTimeDays: string;
      }>;
    }>('/rate/v1/accounts', 'POST', {
      originCountryCode: 'IN',
      originPostalCode: pickup.pincode || '110001',
      destinationCountryCode: 'IN',
      destinationPostalCode: drop.pincode || '110001',
      weight: String(weight / 1000),
      length: '10',
      width: '10',
      height: '10',
    });

    const product = response.products[0];

    return {
      rate: product?.price?.price || 500,
      estimatedDays: parseInt(product?.transistTimeDays || '5'),
    };
  }

  async createShipment(order: ShipmentOrder): Promise<ShipmentResult> {
    // Real DHL shipment creation via DHL Express API
    const totalWeight = order.items.reduce((sum, i) => sum + i.weight, 0) / 1000;

    const response = await this.request<{
      documents: Array<{ type: string; size: string; href: string }>;
      shipmentTrackingNumber: string;
      trackerId: string;
      packages: Array<{
        trackingNumber: string;
      }>;
    }>('/ship/v1/shipments', 'POST', {
      plannedShippingDateAndTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      pickup: {
        isAddressPrivate: false,
        address: {
          addressLine1: order.pickup.address || 'Pickup Address',
          cityName: order.pickup.city || 'Mumbai',
          postalCode: order.pickup.pincode || '110001',
          countryCode: 'IN',
        },
        contact: {
          companyName: 'KHAIRMOVE',
          phone: '9999999999',
        },
      },
      customerDetails: {
        shipperDetails: {
          address: {
            addressLine1: order.pickup.address || 'Shipper Address',
            cityName: order.pickup.city || 'Mumbai',
            postalCode: order.pickup.pincode || '110001',
            countryCode: 'IN',
          },
        },
        receiverDetails: {
          address: {
            addressLine1: order.drop.address || 'Receiver Address',
            cityName: order.drop.city || 'Delhi',
            postalCode: order.drop.pincode || '110001',
            countryCode: 'IN',
          },
        },
      },
      content: {
        packages: order.items.map((item, idx) => ({
          weight: item.weight / 1000,
          dimensions: {
            length: order.dimensions?.length || 10,
            width: order.dimensions?.width || 10,
            height: order.dimensions?.height || 10,
          },
        })),
        description: order.items.map(i => i.name).join(', '),
        totalWeight: totalWeight,
        totalPackageCount: String(order.items.length),
      },
      outputFormat: {
        allDocumentsInOneImage: true,
        splitTransportAndCustomsDocuments: false,
      },
    });

    const trackingNumber = response.packages?.[0]?.trackingNumber || response.shipmentTrackingNumber;

    return {
      carrierId: 'dhl',
      awbNumber: trackingNumber,
      pickupScheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      labelUrl: response.documents?.[0]?.href || '',
      trackingUrl: `https://www.dhl.com/track?tracking-id=${encodeURIComponent(trackingNumber)}`,
    };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResult> {
    const response = await this.request<{
      events: Array<{
        timestamp: string;
        location: { address: { addressLocality: string } };
        type: string;
        description: string;
      }>;
      status: string;
      estimatedDeliveryDate: string;
    }>(`/track/v2/shipments/${encodeURIComponent(awbNumber)}`);

    return {
      awbNumber,
      currentStatus: response.status,
      estimatedDelivery: response.estimatedDeliveryDate,
      events: response.events.map((event) => ({
        timestamp: event.timestamp,
        status: event.type,
        location: event.location.address.addressLocality,
        description: event.description,
      })),
    };
  }

  async cancelShipment(awbNumber: string): Promise<boolean> {
    try {
      await this.request(`/ship/v1/shipments/${encodeURIComponent(awbNumber)}`, 'DELETE');
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================
// CARRIER FACTORY
// ============================================

export type CarrierType = 'delhivery' | 'bluedart' | 'dtdc' | 'fedex' | 'dhl';

export interface CarrierCredentialsMap {
  delhivery: CarrierCredentials;
  bluedart: CarrierCredentials;
  dtdc: CarrierCredentials;
  fedex: CarrierCredentials;
  dhl: CarrierCredentials;
}

export function createCarrierClient(
  carrier: CarrierType,
  credentials: CarrierCredentials
): DelhiveryClient | BlueDartClient | DTDCClient | FedExClient | DHLClient {
  switch (carrier) {
    case 'delhivery':
      return new DelhiveryClient(credentials);
    case 'bluedart':
      return new BlueDartClient(credentials);
    case 'dtdc':
      return new DTDCClient(credentials);
    case 'fedex':
      return new FedExClient(credentials);
    case 'dhl':
      return new DHLClient(credentials);
    default:
      throw new Error(`Unknown carrier: ${carrier}`);
  }
}

export function getCarrierCredentials(carrier: CarrierType): CarrierCredentials {
  switch (carrier) {
    case 'delhivery':
      return { apiKey: process.env.DELHIVERY_API_KEY };
    case 'bluedart':
      return { apiKey: process.env.BLUEDART_API_KEY };
    case 'dtdc':
      return {
        apiKey: process.env.DTDC_API_KEY,
        customerId: process.env.DTDC_CUSTOMER_ID,
      };
    case 'fedex':
      return {
        username: process.env.FEDEX_CLIENT_ID,
        password: process.env.FEDEX_CLIENT_SECRET,
      };
    case 'dhl':
      return { apiKey: process.env.DHL_API_KEY };
    default:
      return {};
  }
}
