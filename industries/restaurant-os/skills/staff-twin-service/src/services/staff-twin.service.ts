import { StaffTwin } from '../models/staff-twin.model';
import { CreateStaffTwinRequest, CreateStaffTwinResponse, GetStaffTwinResponse, CheckInRequest, CheckOutRequest, UpdateScheduleRequest, StaffStatus } from '../schemas/staff-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';

export class StaffTwinService {
  async createStaffTwin(request: CreateStaffTwinRequest): Promise<CreateStaffTwinResponse> {
    const twinId = `twin.restaurant.staff.${request.staffId}`;
    logger.info('Creating Staff Twin', { staffId: request.staffId });

    const existingTwin = await StaffTwin.findByStaffId(request.staffId);
    if (existingTwin) {
      throw new Error(`Staff Twin already exists for staffId: ${request.staffId}`);
    }

    const staffTwin = new StaffTwin({
      twinId,
      staffId: request.staffId,
      restaurantId: request.restaurantId,
      profile: {
        name: request.name,
        phone: request.phone,
        email: request.email,
        role: request.role,
        certifications: request.certifications || [],
        hireDate: new Date().toISOString()
      },
      currentStatus: { status: StaffStatus.CLOCKED_OUT }
    });

    await staffTwin.save();
    await messageBroker.publish('restaurant.staff.created', { twinId, staffId: request.staffId, twinOsEntityId: twinId, timestamp: new Date().toISOString() });

    return { twinId, staffId: request.staffId, twinOsEntityId: twinId, createdAt: staffTwin.createdAt.toISOString() };
  }

  async getStaffTwin(staffId: string): Promise<GetStaffTwinResponse> {
    logger.info('Fetching Staff Twin', { staffId });
    const staffTwin = await StaffTwin.findByStaffId(staffId);
    if (!staffTwin) {
      throw new Error(`Staff Twin not found for staffId: ${staffId}`);
    }
    return staffTwin.toJSON() as GetStaffTwinResponse;
  }

  async checkIn(staffId: string, request: CheckInRequest): Promise<void> {
    logger.info('Checking in staff', { staffId });
    const staffTwin = await StaffTwin.findByStaffId(staffId);
    if (!staffTwin) {
      throw new Error(`Staff Twin not found for staffId: ${staffId}`);
    }

    staffTwin.currentStatus = {
      status: StaffStatus.CLOCKED_IN,
      currentStation: request.stationId,
      currentTable: request.tableId,
      clockInTime: new Date().toISOString()
    };

    await staffTwin.save();
    await messageBroker.publish('restaurant.staff.checkedin', { twinId: staffTwin.twinId, staffId, timestamp: new Date().toISOString() });
  }

  async checkOut(staffId: string, request: CheckOutRequest): Promise<void> {
    logger.info('Checking out staff', { staffId });
    const staffTwin = await StaffTwin.findByStaffId(staffId);
    if (!staffTwin) {
      throw new Error(`Staff Twin not found for staffId: ${staffId}`);
    }

    staffTwin.currentStatus = { status: StaffStatus.CLOCKED_OUT };
    await staffTwin.save();
    await messageBroker.publish('restaurant.staff.checkedout', { twinId: staffTwin.twinId, staffId, reason: request.reason, timestamp: new Date().toISOString() });
  }

  async updateSchedule(staffId: string, request: UpdateScheduleRequest): Promise<void> {
    logger.info('Updating staff schedule', { staffId });
    const staffTwin = await StaffTwin.findByStaffId(staffId);
    if (!staffTwin) {
      throw new Error(`Staff Twin not found for staffId: ${staffId}`);
    }

    staffTwin.schedule = request.shifts;
    await staffTwin.save();
    await messageBroker.publish('restaurant.staff.schedule.updated', { twinId: staffTwin.twinId, staffId, timestamp: new Date().toISOString() });
  }

  async deleteStaffTwin(staffId: string): Promise<void> {
    logger.info('Deleting Staff Twin', { staffId });
    const result = await StaffTwin.deleteOne({ staffId });
    if (result.deletedCount === 0) {
      throw new Error(`Staff Twin not found for staffId: ${staffId}`);
    }
    await messageBroker.publish('restaurant.staff.deleted', { staffId, timestamp: new Date().toISOString() });
  }
}

export const staffTwinService = new StaffTwinService();