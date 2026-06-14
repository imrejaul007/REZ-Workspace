import type { ServiceRequest, Room, HousekeepingTask, StaffMember } from '@/types';

// Mock service requests
export const mockServiceRequests: ServiceRequest[] = [
  { id: '1', roomNumber: '101', type: 'Room Service', status: 'pending', time: '2 min ago' },
  { id: '2', roomNumber: '203', type: 'Housekeeping', status: 'pending', time: '5 min ago' },
  { id: '3', roomNumber: '305', type: 'Laundry', status: 'in_progress', time: '10 min ago' },
  { id: '4', roomNumber: '402', type: 'Room Service', status: 'completed', time: '15 min ago' },
  { id: '5', roomNumber: '508', type: 'Concierge', status: 'pending', time: '8 min ago' },
  { id: '6', roomNumber: '210', type: 'Maintenance', status: 'pending', time: '3 min ago' },
];

// Mock rooms
export const mockRooms: Room[] = Array.from({ length: 60 }, (_, i) => {
  const roomNum = (i + 101).toString();
  const statuses: Room['status'][] = ['available', 'occupied', 'maintenance', 'cleaning'];
  const statusIndex = i < 45 ? 1 : i < 50 ? 3 : i < 55 ? 0 : 2;
  return {
    number: roomNum,
    status: statuses[statusIndex],
  };
});

// Mock housekeeping tasks
export const mockHousekeepingTasks: HousekeepingTask[] = [
  { id: '1', roomNumber: '101', type: 'standard_cleaning', status: 'in_progress', priority: 'high' },
  { id: '2', roomNumber: '203', type: 'deep_cleaning', status: 'pending', priority: 'medium' },
  { id: '3', roomNumber: '305', type: 'turndown', status: 'pending', priority: 'low' },
  { id: '4', roomNumber: '412', type: 'standard_cleaning', status: 'completed', priority: 'medium' },
  { id: '5', roomNumber: '508', type: 'checkout', status: 'pending', priority: 'high' },
];

// Mock staff members
export const mockStaffMembers: StaffMember[] = [
  { id: '1', name: 'John Smith', role: 'front_desk', shift: 'morning', status: 'available' },
  { id: '2', name: 'Maria Garcia', role: 'housekeeping', shift: 'morning', status: 'busy' },
  { id: '3', name: 'Chen Wei', role: 'kitchen', shift: 'morning', status: 'available' },
  { id: '4', name: 'Sarah Johnson', role: 'manager', shift: 'morning', status: 'available' },
  { id: '5', name: 'Ahmed Hassan', role: 'housekeeping', shift: 'afternoon', status: 'offline' },
];
