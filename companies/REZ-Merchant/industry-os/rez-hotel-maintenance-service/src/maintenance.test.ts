/**
 * REZ Hotel Maintenance Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RequestPriority,
  RequestStatus,
  RequestCategory,
  resetStore,
  createRequest,
  getRequest,
  getRequestsByHotel,
  getRequestsByStatus,
  getRequestsByPriority,
  updateRequest,
  assignRequest,
  startProgress,
  completeRequest,
  cancelRequest,
  addNote,
  assignVendor,
  createVendor,
  getVendor,
  getVendorsByHotel,
  getVendorsByCategory,
  updateVendor,
  deactivateVendor,
  getMaintenanceStats,
} from './services/maintenance.service.js';

describe('Maintenance Service', () => {
  beforeEach(() => {
    resetStore();
  });

  // ========================
  // REQUEST TESTS
  // ========================

  describe('Request Management', () => {
    it('should create a maintenance request', () => {
      const request = createRequest(
        'hotel-1',
        RequestCategory.PLUMBING,
        RequestPriority.HIGH,
        'Leaky faucet in bathroom',
        'The guest reported a leaky faucet in room 101 bathroom.',
        'staff-1',
        'room-101'
      );

      expect(request).toBeDefined();
      expect(request.requestId).toMatch(/^REQ-[A-F0-9]+$/);
      expect(request.hotelId).toBe('hotel-1');
      expect(request.category).toBe(RequestCategory.PLUMBING);
      expect(request.priority).toBe(RequestPriority.HIGH);
      expect(request.status).toBe(RequestStatus.PENDING);
      expect(request.roomId).toBe('room-101');
    });

    it('should create request without roomId', () => {
      const request = createRequest(
        'hotel-1',
        RequestCategory.ELECTRICAL,
        RequestPriority.EMERGENCY,
        'Power outage in lobby',
        'Complete power outage affecting the lobby area.',
        'staff-2'
      );

      expect(request.roomId).toBeNull();
      expect(request.priority).toBe(RequestPriority.EMERGENCY);
    });

    it('should get request by ID', () => {
      const request = createRequest(
        'hotel-1',
        RequestCategory.HVAC,
        RequestPriority.MEDIUM,
        'AC not cooling',
        'Air conditioner in room 202 is not cooling properly.',
        'staff-1'
      );

      const found = getRequest(request.requestId);
      expect(found).toEqual(request);
    });

    it('should return undefined for non-existent request', () => {
      const found = getRequest('non-existent');
      expect(found).toBeUndefined();
    });

    it('should get all requests for a hotel sorted by priority', () => {
      createRequest('hotel-1', RequestCategory.PLUMBING, RequestPriority.LOW, 'Low priority task', 'Description', 'staff-1');
      createRequest('hotel-1', RequestCategory.ELECTRICAL, RequestPriority.EMERGENCY, 'Emergency task', 'Description', 'staff-1');
      createRequest('hotel-1', RequestCategory.HVAC, RequestPriority.HIGH, 'High priority task', 'Description', 'staff-1');
      createRequest('hotel-2', RequestCategory.FURNITURE, RequestPriority.MEDIUM, 'Other hotel task', 'Description', 'staff-1');

      const requests = getRequestsByHotel('hotel-1');

      expect(requests).toHaveLength(3);
      expect(requests[0].priority).toBe(RequestPriority.EMERGENCY);
    });

    it('should filter requests by status', () => {
      const req1 = createRequest('hotel-1', RequestCategory.PLUMBING, RequestPriority.HIGH, 'Task 1', 'Desc', 'staff-1');
      const req2 = createRequest('hotel-1', RequestCategory.ELECTRICAL, RequestPriority.MEDIUM, 'Task 2', 'Desc', 'staff-1');
      assignRequest(req1.requestId, 'tech-1');  // Changes to ASSIGNED
      startProgress(req2.requestId);  // Changes to IN_PROGRESS

      const pendingRequests = getRequestsByStatus('hotel-1', RequestStatus.PENDING);
      const assignedRequests = getRequestsByStatus('hotel-1', RequestStatus.ASSIGNED);
      const inProgressRequests = getRequestsByStatus('hotel-1', RequestStatus.IN_PROGRESS);

      // After assignRequest and startProgress, no requests should be PENDING
      expect(pendingRequests).toHaveLength(0);
      expect(assignedRequests).toHaveLength(1);
      expect(inProgressRequests).toHaveLength(1);
    });

    it('should filter requests by priority', () => {
      createRequest('hotel-1', RequestCategory.PLUMBING, RequestPriority.EMERGENCY, 'Emergency', 'Desc', 'staff-1');
      createRequest('hotel-1', RequestCategory.ELECTRICAL, RequestPriority.HIGH, 'High', 'Desc', 'staff-1');
      createRequest('hotel-1', RequestCategory.HVAC, RequestPriority.MEDIUM, 'Medium', 'Desc', 'staff-1');
      createRequest('hotel-1', RequestCategory.FURNITURE, RequestPriority.LOW, 'Low', 'Desc', 'staff-1');

      const emergencyRequests = getRequestsByPriority('hotel-1', RequestPriority.EMERGENCY);
      const highRequests = getRequestsByPriority('hotel-1', RequestPriority.HIGH);

      expect(emergencyRequests).toHaveLength(1);
      expect(highRequests).toHaveLength(1);
    });

    it('should assign request to technician', () => {
      const request = createRequest('hotel-1', RequestCategory.PLUMBING, RequestPriority.HIGH, 'Task', 'Desc', 'staff-1');
      const assigned = assignRequest(request.requestId, 'tech-1');

      expect(assigned?.assignedTo).toBe('tech-1');
      expect(assigned?.status).toBe(RequestStatus.ASSIGNED);
    });

    it('should start progress on request', () => {
      const request = createRequest('hotel-1', RequestCategory.ELECTRICAL, RequestPriority.HIGH, 'Task', 'Desc', 'staff-1');
      assignRequest(request.requestId, 'tech-1');
      const inProgress = startProgress(request.requestId);

      expect(inProgress?.status).toBe(RequestStatus.IN_PROGRESS);
    });

    it('should complete request with cost', () => {
      const request = createRequest('hotel-1', RequestCategory.PLUMBING, RequestPriority.MEDIUM, 'Task', 'Desc', 'staff-1');
      const completed = completeRequest(request.requestId, 150.50, 'Fixed the issue successfully');

      expect(completed?.status).toBe(RequestStatus.COMPLETED);
      expect(completed?.cost).toBe(150.50);
      expect(completed?.completedDate).toBeInstanceOf(Date);
      expect(completed?.notes).toContain('Fixed the issue successfully');
    });

    it('should cancel request', () => {
      const request = createRequest('hotel-1', RequestCategory.FURNITURE, RequestPriority.LOW, 'Task', 'Desc', 'staff-1');
      const cancelled = cancelRequest(request.requestId);

      expect(cancelled?.status).toBe(RequestStatus.CANCELLED);
    });

    it('should add notes to request', () => {
      const request = createRequest('hotel-1', RequestCategory.HVAC, RequestPriority.MEDIUM, 'Task', 'Desc', 'staff-1');
      addNote(request.requestId, 'First note');
      addNote(request.requestId, 'Second note');

      const updated = getRequest(request.requestId);
      expect(updated?.notes).toHaveLength(2);
      expect(updated?.notes).toContain('First note');
      expect(updated?.notes).toContain('Second note');
    });

    it('should assign vendor to request', () => {
      const request = createRequest('hotel-1', RequestCategory.PLUMBING, RequestPriority.HIGH, 'Task', 'Desc', 'staff-1');
      const vendor = createVendor('hotel-1', 'ABC Plumbing', RequestCategory.PLUMBING, 'John', '555-1234', 'john@abc.com');
      const assigned = assignVendor(request.requestId, vendor.vendorId);

      expect(assigned?.vendorId).toBe(vendor.vendorId);
    });
  });

  // ========================
  // VENDOR TESTS
  // ========================

  describe('Vendor Management', () => {
    it('should create a vendor', () => {
      const vendor = createVendor(
        'hotel-1',
        'ABC Electricians',
        RequestCategory.ELECTRICAL,
        'Mike Johnson',
        '555-1111',
        'mike@abcelectric.com',
        '123 Main St'
      );

      expect(vendor).toBeDefined();
      expect(vendor.vendorId).toMatch(/^VND-[A-F0-9]+$/);
      expect(vendor.name).toBe('ABC Electricians');
      expect(vendor.category).toBe(RequestCategory.ELECTRICAL);
      expect(vendor.active).toBe(true);
      expect(vendor.jobsCompleted).toBe(0);
    });

    it('should get vendor by ID', () => {
      const vendor = createVendor(
        'hotel-1',
        'Quick Plumbing',
        RequestCategory.PLUMBING,
        'Sarah',
        '555-2222',
        'sarah@quickplumb.com'
      );

      const found = getVendor(vendor.vendorId);
      expect(found?.name).toBe('Quick Plumbing');
    });

    it('should get all vendors for a hotel', () => {
      createVendor('hotel-1', 'Vendor 1', RequestCategory.PLUMBING, 'A', '1', 'a@test.com');
      createVendor('hotel-1', 'Vendor 2', RequestCategory.ELECTRICAL, 'B', '2', 'b@test.com');
      createVendor('hotel-2', 'Vendor 3', RequestCategory.HVAC, 'C', '3', 'c@test.com');

      const vendors = getVendorsByHotel('hotel-1');
      expect(vendors).toHaveLength(2);
    });

    it('should filter vendors by category', () => {
      createVendor('hotel-1', 'Plumber 1', RequestCategory.PLUMBING, 'P1', '1', 'p1@test.com');
      createVendor('hotel-1', 'Plumber 2', RequestCategory.PLUMBING, 'P2', '2', 'p2@test.com');
      createVendor('hotel-1', 'Electrician 1', RequestCategory.ELECTRICAL, 'E1', '3', 'e1@test.com');

      const plumbers = getVendorsByCategory('hotel-1', RequestCategory.PLUMBING);
      const electricians = getVendorsByCategory('hotel-1', RequestCategory.ELECTRICAL);

      expect(plumbers).toHaveLength(2);
      expect(electricians).toHaveLength(1);
    });

    it('should update vendor', () => {
      const vendor = createVendor(
        'hotel-1',
        'Old Name',
        RequestCategory.FURNITURE,
        'Old Contact',
        '555-0000',
        'old@test.com'
      );

      const updated = updateVendor(vendor.vendorId, {
        name: 'New Name',
        rating: 4.5,
      });

      expect(updated?.name).toBe('New Name');
      expect(updated?.rating).toBe(4.5);
      expect(updated?.contactName).toBe('Old Contact'); // Unchanged
    });

    it('should deactivate vendor', () => {
      const vendor = createVendor(
        'hotel-1',
        'To Deactivate',
        RequestCategory.APPLIANCE,
        'Tech',
        '555-3333',
        'tech@test.com'
      );

      const success = deactivateVendor(vendor.vendorId);
      expect(success).toBe(true);

      const vendors = getVendorsByHotel('hotel-1');
      expect(vendors.find(v => v.vendorId === vendor.vendorId)).toBeUndefined();
    });

    it('should not return inactive vendors by default', () => {
      const vendor = createVendor(
        'hotel-1',
        'Will be deactivated',
        RequestCategory.SAFETY,
        'Sec',
        '555-4444',
        'sec@test.com'
      );
      deactivateVendor(vendor.vendorId);

      const vendors = getVendorsByHotel('hotel-1');
      expect(vendors.find(v => v.vendorId === vendor.vendorId)).toBeUndefined();
    });
  });

  // ========================
  // STATISTICS TESTS
  // ========================

  describe('Statistics', () => {
    it('should calculate maintenance statistics', () => {
      // Create various requests
      createRequest('hotel-1', RequestCategory.PLUMBING, RequestPriority.EMERGENCY, 'E1', 'D', 's1');
      createRequest('hotel-1', RequestCategory.ELECTRICAL, RequestPriority.HIGH, 'H1', 'D', 's1');
      createRequest('hotel-1', RequestCategory.HVAC, RequestPriority.MEDIUM, 'M1', 'D', 's1');
      createRequest('hotel-1', RequestCategory.FURNITURE, RequestPriority.LOW, 'L1', 'D', 's1');

      const allRequests = getRequestsByHotel('hotel-1');
      assignRequest(allRequests[0].requestId, 'tech-1'); // Moves from PENDING to ASSIGNED

      const stats = getMaintenanceStats('hotel-1');

      expect(stats.total).toBe(4);
      // Pending includes PENDING + ASSIGNED: 3 PENDING + 1 ASSIGNED = 4
      expect(stats.pending).toBe(4);
      expect(stats.byPriority[RequestPriority.EMERGENCY]).toBe(1);
      expect(stats.byPriority[RequestPriority.HIGH]).toBe(1);
      expect(stats.byPriority[RequestPriority.MEDIUM]).toBe(1);
      expect(stats.byPriority[RequestPriority.LOW]).toBe(1);
    });

    it('should calculate average cost from completed requests', () => {
      const req1 = createRequest('hotel-1', RequestCategory.PLUMBING, RequestPriority.HIGH, 'T1', 'D', 's1');
      const req2 = createRequest('hotel-1', RequestCategory.ELECTRICAL, RequestPriority.MEDIUM, 'T2', 'D', 's1');

      completeRequest(req1.requestId, 100);
      completeRequest(req2.requestId, 200);

      const stats = getMaintenanceStats('hotel-1');

      expect(stats.totalCost).toBe(300);
      expect(stats.avgCost).toBe(150);
    });

    it('should count completed requests', () => {
      const req1 = createRequest('hotel-1', RequestCategory.PLUMBING, RequestPriority.HIGH, 'T1', 'D', 's1');
      const req2 = createRequest('hotel-1', RequestCategory.ELECTRICAL, RequestPriority.MEDIUM, 'T2', 'D', 's1');
      const req3 = createRequest('hotel-1', RequestCategory.HVAC, RequestPriority.LOW, 'T3', 'D', 's1');

      completeRequest(req1.requestId, 100);
      completeRequest(req2.requestId, 200);

      const stats = getMaintenanceStats('hotel-1');

      expect(stats.completed).toBe(2);
      expect(stats.pending).toBe(1);
    });
  });

  // ========================
  // EDGE CASES
  // ========================

  describe('Edge Cases', () => {
    it('should handle empty hotel', () => {
      const requests = getRequestsByHotel('empty-hotel');
      const vendors = getVendorsByHotel('empty-hotel');
      const stats = getMaintenanceStats('empty-hotel');

      expect(requests).toHaveLength(0);
      expect(vendors).toHaveLength(0);
      expect(stats.total).toBe(0);
    });

    it('should return undefined when updating non-existent request', () => {
      const result = updateRequest('non-existent', { status: RequestStatus.COMPLETED });
      expect(result).toBeUndefined();
    });

    it('should return undefined when getting non-existent vendor', () => {
      const found = getVendor('non-existent');
      expect(found).toBeUndefined();
    });

    it('should handle all request categories', () => {
      const categories = Object.values(RequestCategory);

      for (const category of categories) {
        const request = createRequest('hotel-1', category, RequestPriority.LOW, `Task for ${category}`, 'Desc', 'staff-1');
        expect(request.category).toBe(category);
      }
    });

    it('should handle all priorities', () => {
      const priorities = Object.values(RequestPriority);

      for (const priority of priorities) {
        const request = createRequest('hotel-1', RequestCategory.OTHER, priority, `Task for ${priority}`, 'Desc', 'staff-1');
        expect(request.priority).toBe(priority);
      }
    });

    it('should preserve existing notes when adding new note', () => {
      const request = createRequest('hotel-1', RequestCategory.HVAC, RequestPriority.MEDIUM, 'Task', 'Desc', 'staff-1');
      addNote(request.requestId, 'First');
      addNote(request.requestId, 'Second');

      const updated = getRequest(request.requestId);
      expect(updated?.notes).toHaveLength(2);
    });
  });
});
