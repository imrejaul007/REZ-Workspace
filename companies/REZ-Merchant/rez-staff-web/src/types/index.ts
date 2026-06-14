// Types for Hotel Staff Dashboard

export interface DashboardStats {
  todayCheckins: number;
  todayCheckouts: number;
  pendingRequests: number;
  occupiedRooms: number;
  availableRooms: number;
  housekeepingPending: number;
}

export interface ServiceRequest {
  id: string;
  roomNumber: string;
  type: 'Room Service' | 'Housekeeping' | 'Laundry' | 'Maintenance' | 'Concierge';
  status: 'pending' | 'in_progress' | 'completed';
  time: string;
  notes?: string;
  createdBy?: string;
  assignedTo?: string;
}

export interface Room {
  number: string;
  floor: number;
  type: 'standard' | 'deluxe' | 'suite';
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  guest?: {
    name: string;
    checkIn: string;
    checkOut: string;
  };
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  type: 'standard_cleaning' | 'deep_cleaning' | 'turndown' | 'checkout';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'front_desk' | 'housekeeping' | 'kitchen' | 'manager';
  shift: 'morning' | 'afternoon' | 'night';
  status: 'available' | 'busy' | 'offline';
}

export type TabType = 'dashboard' | 'requests' | 'rooms' | 'housekeeping';
