// Staff Twin Schema - Defines types and validation for Staff Twin Service

export enum StaffRole {
  MANAGER = 'manager',
  SERVER = 'server',
  CHEF = 'chef',
  PREP = 'prep',
  HOST = 'host',
  CASHIER = 'cashier',
  DELIVERY = 'delivery',
  BARTENDER = 'bartender'
}

export enum StaffStatus {
  CLOCKED_IN = 'clocked_in',
  CLOCKED_OUT = 'clocked_out',
  ON_BREAK = 'on_break',
  OFF_DUTY = 'off_duty'
}

export interface Shift {
  date: string;
  start: string;
  end: string;
  role: StaffRole;
}

export interface StaffTwinDocument {
  twinId: string;
  staffId: string;
  restaurantId: string;
  profile: {
    name: string;
    phone: string;
    email?: string;
    role: StaffRole;
    certifications: string[];
    hireDate: string;
  };
  schedule: Shift[];
  currentStatus: {
    status: StaffStatus;
    currentStation?: string;
    currentTable?: string;
    clockInTime?: string;
  };
  performance: {
    avgOrderTime: number;
    tableTurnover: number;
    customerRating: number;
    ordersHandled: number;
    errorRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffTwinRequest {
  staffId: string;
  restaurantId: string;
  name: string;
  phone: string;
  email?: string;
  role: StaffRole;
  certifications?: string[];
}

export interface CreateStaffTwinResponse {
  twinId: string;
  staffId: string;
  twinOsEntityId: string;
  createdAt: string;
}

export interface GetStaffTwinResponse extends StaffTwinDocument {
  twinOsEntityId: string;
}

export interface CheckInRequest {
  stationId?: string;
  tableId?: string;
}

export interface CheckOutRequest {
  reason?: string;
}

export interface UpdateScheduleRequest {
  shifts: Shift[];
}
