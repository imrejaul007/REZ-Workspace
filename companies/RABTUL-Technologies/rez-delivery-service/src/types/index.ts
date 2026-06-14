export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum DriverStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ON_BREAK = 'on_break'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: Date;
}

export interface DeliveryRoute {
  origin: GeoLocation;
  destination: GeoLocation;
  waypoints?: GeoLocation[];
  distance?: number;
  estimatedDuration?: number;
}

export interface ETACalculation {
  estimatedArrival: Date;
  remainingDistance: number;
  remainingDuration: number;
  trafficCondition: 'low' | 'medium' | 'high';
}

export interface DeliveryEvent {
  status: DeliveryStatus;
  timestamp: Date;
  location?: GeoLocation;
  notes?: string;
  updatedBy?: string;
}

export interface IDelivery {
  _id?: string;
  orderId: string;
  customerId: string;
  driverId?: string;
  status: DeliveryStatus;
  pickup: GeoLocation;
  dropoff: GeoLocation;
  route?: DeliveryRoute;
  eta?: ETACalculation;
  events: DeliveryEvent[];
  scheduledPickup?: Date;
  scheduledDropoff?: Date;
  actualPickup?: Date;
  actualDropoff?: Date;
  packageDetails: {
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    description: string;
    specialInstructions?: string;
  };
  pricing: {
    basePrice: number;
    distanceFee: number;
    surgeFee?: number;
    totalPrice: number;
  };
  proofOfDelivery?: {
    signature?: string;
    photo?: string;
    recipientName?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDriver {
  _id?: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  status: DriverStatus;
  currentLocation?: GeoLocation;
  vehicle: {
    type: 'motorcycle' | 'car' | 'van' | 'truck';
    licensePlate: string;
    model?: string;
    color?: string;
  };
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  currentDeliveryId?: string;
  availability: {
    isAvailable: boolean;
    maxRadius: number;
    workingHours: {
      start: string;
      end: string;
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateDeliveryDTO {
  orderId: string;
  customerId: string;
  pickup: GeoLocation;
  dropoff: GeoLocation;
  scheduledPickup?: Date;
  packageDetails: IDelivery['packageDetails'];
  pricing: Omit<IDelivery['pricing'], 'distanceFee' | 'totalPrice'>;
}

export interface AssignDriverDTO {
  deliveryId: string;
  driverId: string;
}

export interface UpdateDeliveryStatusDTO {
  deliveryId: string;
  status: DeliveryStatus;
  location?: GeoLocation;
  notes?: string;
}

export interface UpdateDriverLocationDTO {
  driverId: string;
  location: GeoLocation;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
