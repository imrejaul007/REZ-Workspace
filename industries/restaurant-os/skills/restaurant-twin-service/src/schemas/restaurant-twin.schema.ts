// Restaurant Twin Schema - Defines types and validation for Restaurant Twin Service

export enum RestaurantStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  BUSY = 'busy',
  SLOW = 'slow',
  MAINTENANCE = 'maintenance'
}

export enum CuisineType {
  INDIAN = 'indian',
  CHINESE = 'chinese',
  ITALIAN = 'italian',
  MEXICAN = 'mexican',
  AMERICAN = 'american',
  JAPANESE = 'japanese',
  THAI = 'thai',
  FRENCH = 'french',
  MEDITERRANEAN = 'mediterranean',
  KOREAN = 'korean',
  VIETNAMESE = 'vietnamese',
  MIDDLE_EASTERN = 'middle_eastern',
  FUSION = 'fusion',
  OTHER = 'other'
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
  QR = 'qr',
  KIOSK = 'kiosk'
}

export interface OperatingHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface RestaurantFeatures {
  delivery: boolean;
  takeaway: boolean;
  dineIn: boolean;
  driveThru: boolean;
  qrOrdering: boolean;
  selfKiosk: boolean;
  onlineOrdering: boolean;
  reservations: boolean;
  buffet: boolean;
  liveCooking: boolean;
  outdoorSeating: boolean;
  wifi: boolean;
  parking: boolean;
  wheelchairAccessible: boolean;
}

export interface CurrentMetrics {
  currentCovers: number;
  pendingOrders: number;
  avgWaitTime: number;
  tableTurnover: number;
  activeStaff: number;
  kitchenUtilization: number;
  revenueToday: number;
  ordersToday: number;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ContactInfo {
  phone: string;
  email: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

// Main Restaurant Twin Document Interface
export interface RestaurantTwinDocument {
  twinId: string;
  restaurantId: string;
  merchantId: string;
  name: string;
  description?: string;
  cuisineType: CuisineType[];
  location: Location;
  contact: ContactInfo;
  totalTables: number;
  totalSeats: number;
  operatingHours: OperatingHours[];
  features: RestaurantFeatures;
  currentMetrics: CurrentMetrics;
  status: RestaurantStatus;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

// Request/Response Types
export interface CreateRestaurantTwinRequest {
  restaurantId: string;
  merchantId: string;
  name: string;
  description?: string;
  cuisineType: CuisineType[];
  location: Location;
  contact: ContactInfo;
  totalTables: number;
  totalSeats: number;
  operatingHours: OperatingHours[];
  features?: Partial<RestaurantFeatures>;
}

export interface CreateRestaurantTwinResponse {
  twinId: string;
  restaurantId: string;
  twinOsEntityId: string;
  createdAt: string;
}

export interface GetRestaurantTwinResponse extends RestaurantTwinDocument {
  twinOsEntityId: string;
}

export interface UpdateRestaurantStatusRequest {
  status: RestaurantStatus;
}

export interface UpdateRestaurantStatusResponse {
  twinId: string;
  restaurantId: string;
  status: RestaurantStatus;
  updatedAt: string;
}

export interface UpdateMetricsRequest {
  currentCovers?: number;
  pendingOrders?: number;
  avgWaitTime?: number;
  tableTurnover?: number;
  activeStaff?: number;
  kitchenUtilization?: number;
  revenueToday?: number;
  ordersToday?: number;
}

export interface UpdateMetricsResponse {
  twinId: string;
  restaurantId: string;
  metrics: CurrentMetrics;
  updatedAt: string;
}

export interface UpdateOperatingHoursRequest {
  operatingHours: OperatingHours[];
}

export interface UpdateOperatingHoursResponse {
  twinId: string;
  restaurantId: string;
  operatingHours: OperatingHours[];
  updatedAt: string;
}

export interface UpdateFeaturesRequest {
  features: Partial<RestaurantFeatures>;
}

export interface UpdateFeaturesResponse {
  twinId: string;
  restaurantId: string;
  features: RestaurantFeatures;
  updatedAt: string;
}

export interface ListRestaurantsRequest {
  merchantId?: string;
  status?: RestaurantStatus;
  cuisineType?: CuisineType;
  limit?: number;
  offset?: number;
}

export interface ListRestaurantsResponse {
  restaurants: RestaurantTwinDocument[];
  total: number;
  limit: number;
  offset: number;
}

// Default values
export const defaultFeatures: RestaurantFeatures = {
  delivery: false,
  takeaway: false,
  dineIn: true,
  driveThru: false,
  qrOrdering: false,
  selfKiosk: false,
  onlineOrdering: false,
  reservations: false,
  buffet: false,
  liveCooking: false,
  outdoorSeating: false,
  wifi: false,
  parking: false,
  wheelchairAccessible: false
};

export const defaultMetrics: CurrentMetrics = {
  currentCovers: 0,
  pendingOrders: 0,
  avgWaitTime: 0,
  tableTurnover: 0,
  activeStaff: 0,
  kitchenUtilization: 0,
  revenueToday: 0,
  ordersToday: 0
};

export const defaultOperatingHours: OperatingHours[] = [
  { day: 'monday', open: '09:00', close: '22:00', isClosed: false },
  { day: 'tuesday', open: '09:00', close: '22:00', isClosed: false },
  { day: 'wednesday', open: '09:00', close: '22:00', isClosed: false },
  { day: 'thursday', open: '09:00', close: '22:00', isClosed: false },
  { day: 'friday', open: '09:00', close: '23:00', isClosed: false },
  { day: 'saturday', open: '09:00', close: '23:00', isClosed: false },
  { day: 'sunday', open: '10:00', close: '21:00', isClosed: false }
];
