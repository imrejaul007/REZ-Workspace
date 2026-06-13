import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, coerceTypes: true });
addFormats(ajv);

// Enums
export enum RoomType {
  STANDARD = 'standard',
  DELUXE = 'deluxe',
  SUITE = 'suite',
  PENTHOUSE = 'penthouse',
  ACCESSIBLE = 'accessible'
}

export enum RoomView {
  CITY = 'city',
  POOL = 'pool',
  GARDEN = 'garden',
  OCEAN = 'ocean',
  MOUNTAIN = 'mountain'
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  BLOCKED = 'blocked',
  OUT_OF_ORDER = 'out_of_order',
  CLEANING = 'cleaning',
  INSPECTED = 'inspected'
}

export enum BedType {
  KING = 'king',
  QUEEN = 'queen',
  TWIN = 'twin',
  BUNK = 'bunk'
}

export enum ThermostatMode {
  HEAT = 'heat',
  COOL = 'cool',
  AUTO = 'auto',
  OFF = 'off'
}

export enum BlindState {
  OPEN = 'open',
  CLOSED = 'closed',
  PARTIAL = 'partial'
}

export enum DoorLockState {
  LOCKED = 'locked',
  UNLOCKED = 'unlocked'
}

export enum MinibarDoorState {
  CLOSED = 'closed',
  OPEN = 'open'
}

export enum HousekeepingFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ON_DEPARTURE = 'on_departure'
}

export enum SupplyStatus {
  ADEQUATE = 'adequate',
  LOW = 'low',
  CRITICAL = 'critical'
}

// Type definitions
export interface RoomCapacity {
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
}

export interface BedConfiguration {
  bedCount: number;
  bedType: BedType;
  rollawayAvailable: boolean;
}

export interface RoomAmenities {
  smartTv: boolean;
  smartSpeaker: boolean;
  minibar: boolean;
  coffeeMachine: boolean;
  safe: boolean;
  balcony: boolean;
  jacuzzi: boolean;
}

export interface ThermostatState {
  current: number;
  target: number;
  mode: ThermostatMode;
}

export interface LightingState {
  scene: string;
  brightness: number;
}

export interface IoTState {
  thermostat: ThermostatState;
  lighting: LightingState;
  blinds: BlindState;
  doorLock: DoorLockState;
  minibarDoor: MinibarDoorState;
  occupancySensor: boolean;
}

export interface HousekeepingInfo {
  lastCleaned: string;
  nextScheduled: string;
  frequency: HousekeepingFrequency;
  supplyStatus: SupplyStatus;
}

export interface RoomRevenue {
  baseRate: number;
  rackRate: number;
  minibarBalance: number;
  lastRateUpdate: string;
}

export interface RoomStatusInfo {
  current: RoomStatus;
  nextAvailable: string;
  maintenanceAlerts: string[];
}

export interface RoomTwinDocument {
  twinId: string;
  roomId: string;
  propertyId: string;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  view: RoomView;
  capacity: RoomCapacity;
  bedConfiguration: BedConfiguration;
  amenities: RoomAmenities;
  status: RoomStatusInfo;
  iotState: IoTState;
  housekeeping: HousekeepingInfo;
  revenue: RoomRevenue;
  currentGuestId?: string;
  createdAt: string;
  updatedAt: string;
}

// Request/Response DTOs
export interface CreateRoomTwinRequest {
  roomId: string;
  propertyId: string;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  view: RoomView;
  capacity: RoomCapacity;
  bedConfiguration: BedConfiguration;
  amenities: RoomAmenities;
}

export interface CreateRoomTwinResponse {
  twinId: string;
  roomId: string;
  twinOsEntityId: string;
  createdAt: string;
}

export interface GetRoomStatusResponse {
  twinId: string;
  roomId: string;
  roomNumber: string;
  status: RoomStatusInfo;
  iotState: IoTState;
  currentGuestId?: string;
  housekeeping: HousekeepingInfo;
  updatedAt: string;
}

export interface UpdateIoTStateRequest {
  iotState: Partial<IoTState>;
}

export interface UpdateRoomStatusRequest {
  status: RoomStatus;
  maintenanceAlerts?: string[];
}

// API Schemas for validation
export const createRoomTwinSchema = {
  type: 'object',
  properties: {
    roomId: { type: 'string', minLength: 1 },
    propertyId: { type: 'string', minLength: 1 },
    roomNumber: { type: 'string', minLength: 1 },
    roomType: { type: 'string', enum: ['standard', 'deluxe', 'suite', 'penthouse', 'accessible'] },
    floor: { type: 'number', minimum: 0 },
    view: { type: 'string', enum: ['city', 'pool', 'garden', 'ocean', 'mountain'] },
    capacity: {
      type: 'object',
      properties: {
        maxAdults: { type: 'number', minimum: 1 },
        maxChildren: { type: 'number', minimum: 0 },
        maxOccupancy: { type: 'number', minimum: 1 }
      },
      required: ['maxAdults', 'maxChildren', 'maxOccupancy']
    },
    bedConfiguration: {
      type: 'object',
      properties: {
        bedCount: { type: 'number', minimum: 1 },
        bedType: { type: 'string', enum: ['king', 'queen', 'twin', 'bunk'] },
        rollawayAvailable: { type: 'boolean' }
      },
      required: ['bedCount', 'bedType']
    },
    amenities: {
      type: 'object',
      properties: {
        smartTv: { type: 'boolean' },
        smartSpeaker: { type: 'boolean' },
        minibar: { type: 'boolean' },
        coffeeMachine: { type: 'boolean' },
        safe: { type: 'boolean' },
        balcony: { type: 'boolean' },
        jacuzzi: { type: 'boolean' }
      }
    }
  },
  required: ['roomId', 'propertyId', 'roomNumber', 'roomType', 'floor', 'view', 'capacity', 'bedConfiguration']
} as const;

export const updateIoTStateSchema = {
  type: 'object',
  properties: {
    iotState: {
      type: 'object',
      properties: {
        thermostat: {
          type: 'object',
          properties: {
            current: { type: 'number' },
            target: { type: 'number' },
            mode: { type: 'string', enum: ['heat', 'cool', 'auto', 'off'] }
          }
        },
        lighting: {
          type: 'object',
          properties: {
            scene: { type: 'string' },
            brightness: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        blinds: { type: 'string', enum: ['open', 'closed', 'partial'] },
        doorLock: { type: 'string', enum: ['locked', 'unlocked'] },
        minibarDoor: { type: 'string', enum: ['closed', 'open'] },
        occupancySensor: { type: 'boolean' }
      }
    }
  },
  required: ['iotState']
} as const;

export const updateRoomStatusSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected'] },
    maintenanceAlerts: { type: 'array', items: { type: 'string' } }
  },
  required: ['status']
} as const;

// Validation functions
export const validateCreateRoomTwin = ajv.compile(createRoomTwinSchema);
export const validateUpdateIoTState = ajv.compile(updateIoTStateSchema);
export const validateUpdateRoomStatus = ajv.compile(updateRoomStatusSchema);

// Default values
export const defaultRoomStatus: RoomStatusInfo = {
  current: RoomStatus.AVAILABLE,
  nextAvailable: '',
  maintenanceAlerts: []
};

export const defaultIoTState: IoTState = {
  thermostat: {
    current: 72,
    target: 72,
    mode: ThermostatMode.AUTO
  },
  lighting: {
    scene: 'default',
    brightness: 80
  },
  blinds: BlindState.CLOSED,
  doorLock: DoorLockState.LOCKED,
  minibarDoor: MinibarDoorState.CLOSED,
  occupancySensor: false
};

export const defaultHousekeeping: HousekeepingInfo = {
  lastCleaned: '',
  nextScheduled: '',
  frequency: HousekeepingFrequency.DAILY,
  supplyStatus: SupplyStatus.ADEQUATE
};

export const defaultRevenue: RoomRevenue = {
  baseRate: 0,
  rackRate: 0,
  minibarBalance: 0,
  lastRateUpdate: ''
};
