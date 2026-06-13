import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

export interface Store {
  id: string;
  storeCode: string;
  name: string;
  type: 'flagship' | 'regular' | ' outlet' | 'warehouse';
  address: StoreAddress;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  operatingHours: OperatingHours;
  contact: StoreContact;
  status: 'active' | 'temporarily_closed' | 'permanently_closed';
  departments: Department[];
  staff: StaffInfo;
  capacity: StoreCapacity;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  holidays?: HolidayHours[];
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface HolidayHours {
  date: string;
  open: string;
  close: string;
  closed: boolean;
  holidayName: string;
}

export interface StoreContact {
  phone: string;
  email: string;
  website?: string;
  managerName: string;
  managerEmail: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  categories: string[];
  metrics: DepartmentMetrics;
}

export interface DepartmentMetrics {
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
  transactionCount: number;
  averageBasketSize: number;
  staffCount: number;
}

export interface StaffInfo {
  totalCount: number;
  byRole: Record<string, number>;
  schedule: WeeklySchedule;
}

export interface WeeklySchedule {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface StoreCapacity {
  maxCustomers: number;
  currentCustomers: number;
  checkoutCount: number;
  activeCheckouts: number;
}

export const createStoreSchema = {
  type: 'object',
  required: ['storeCode', 'name', 'type', 'address'],
  properties: {
    storeCode: { type: 'string', minLength: 3, maxLength: 20 },
    name: { type: 'string', minLength: 1, maxLength: 200 },
    type: { type: 'string', enum: ['flagship', 'regular', ' outlet', 'warehouse'] },
    address: {
      type: 'object',
      required: ['street', 'city', 'state', 'zipCode', 'country'],
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zipCode: { type: 'string' },
        country: { type: 'string' },
      },
    },
    coordinates: {
      type: 'object',
      properties: {
        latitude: { type: 'number', minimum: -90, maximum: 90 },
        longitude: { type: 'number', minimum: -180, maximum: 180 },
      },
    },
    contact: {
      type: 'object',
      properties: {
        phone: { type: 'string' },
        email: { type: 'string' },
        website: { type: 'string' },
        managerName: { type: 'string' },
        managerEmail: { type: 'string' },
      },
    },
    capacity: {
      type: 'object',
      properties: {
        maxCustomers: { type: 'number' },
        checkoutCount: { type: 'number' },
      },
    },
    amenities: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: true,
};

export const updateStoreSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 200 },
    status: { type: 'string', enum: ['active', 'temporarily_closed', 'permanently_closed'] },
    operatingHours: { type: 'object' },
    contact: {
      type: 'object',
      properties: {
        phone: { type: 'string' },
        email: { type: 'string' },
        website: { type: 'string' },
        managerName: { type: 'string' },
        managerEmail: { type: 'string' },
      },
    },
    capacity: {
      type: 'object',
      properties: {
        maxCustomers: { type: 'number' },
        checkoutCount: { type: 'number' },
      },
    },
    amenities: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
};

export const validateCreateStore = ajv.compile(createStoreSchema);
export const validateUpdateStore = ajv.compile(updateStoreSchema);
