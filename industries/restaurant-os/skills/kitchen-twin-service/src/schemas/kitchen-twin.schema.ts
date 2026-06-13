// Kitchen Twin Schema - Defines types and validation for Kitchen Twin Service

export enum StationType {
  GRILL = 'grill',
  FRY = 'fry',
  SAUTE = 'saute',
  PREP = 'prep',
  SALAD = 'salad',
  DESSERT = 'dessert',
  BEVERAGE = 'beverage',
  INDIAN = 'indian',
  CHINESE = 'chinese'
}

export enum StationStatus {
  OPEN = 'open',
  BUSY = 'busy',
  OVERLOADED = 'overloaded',
  MAINTENANCE = 'maintenance'
}

export interface Station {
  stationId: string;
  name: string;
  type: StationType;
  assignedItems: string[];
  currentOrders: string[];
  capacity: number;
  status: StationStatus;
  avgCookTime: number;
  currentLoad: number;
}

export interface KitchenAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  stationId?: string;
  timestamp: string;
}

export interface KitchenTwinDocument {
  twinId: string;
  kitchenId: string;
  restaurantId: string;
  name: string;
  stations: Station[];
  activeOrders: string[];
  pendingOrders: number;
  avgOrderCompletionTime: number;
  peakHourThroughput: number;
  currentUtilization: number;
  alerts: KitchenAlert[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateKitchenTwinRequest {
  restaurantId: string;
  name: string;
  stations?: {
    name: string;
    type: StationType;
    assignedItems?: string[];
    capacity?: number;
  }[];
}

export interface CreateKitchenTwinResponse {
  twinId: string;
  kitchenId: string;
  twinOsEntityId: string;
  createdAt: string;
}

export interface GetKitchenTwinResponse extends KitchenTwinDocument {
  twinOsEntityId: string;
}

export interface UpdateStationRequest {
  stationId: string;
  status?: StationStatus;
  assignedItems?: string[];
  capacity?: number;
}

export interface UpdateStationResponse {
  twinId: string;
  kitchenId: string;
  station: Station;
  updatedAt: string;
}

export interface AssignOrderToStationRequest {
  stationId: string;
  orderId: string;
}

export interface AssignOrderToStationResponse {
  twinId: string;
  kitchenId: string;
  stationId: string;
  orderId: string;
  currentLoad: number;
  estimatedWaitTime: number;
  updatedAt: string;
}

export interface BumpOrderFromStationRequest {
  stationId: string;
  orderId: string;
}

export interface GetStationPerformanceResponse {
  stationId: string;
  stationName: string;
  avgCookTime: number;
  ordersCompleted: number;
  utilizationRate: number;
  bottlenecks: string[];
}

export interface GetKitchenAnalyticsResponse {
  avgOrderCompletionTime: number;
  peakHourThroughput: number;
  stationPerformance: GetStationPerformanceResponse[];
  bottleneckStations: string[];
  recommendations: string[];
}

// Default stations for a new kitchen
export const defaultStations: Station[] = [
  { stationId: 'grill-1', name: 'Grill Station 1', type: StationType.GRILL, assignedItems: [], currentOrders: [], capacity: 5, status: StationStatus.OPEN, avgCookTime: 12, currentLoad: 0 },
  { stationId: 'fry-1', name: 'Fry Station 1', type: StationType.FRY, assignedItems: [], currentOrders: [], capacity: 6, status: StationStatus.OPEN, avgCookTime: 8, currentLoad: 0 },
  { stationId: 'prep-1', name: 'Prep Station 1', type: StationType.PREP, assignedItems: [], currentOrders: [], capacity: 4, status: StationStatus.OPEN, avgCookTime: 15, currentLoad: 0 },
  { stationId: 'salad-1', name: 'Salad Station 1', type: StationType.SALAD, assignedItems: [], currentOrders: [], capacity: 3, status: StationStatus.OPEN, avgCookTime: 5, currentLoad: 0 },
  { stationId: 'beverage-1', name: 'Beverage Station 1', type: StationType.BEVERAGE, assignedItems: [], currentOrders: [], capacity: 4, status: StationStatus.OPEN, avgCookTime: 3, currentLoad: 0 }
];
