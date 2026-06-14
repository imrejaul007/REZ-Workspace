import { Seat, ISeat, SeatStatus, SeatRole } from '../models/seat.model';
import { Organization } from '../models/organization.model';
import mongoose, { FilterQuery } from 'mongoose';
import { logger } from 'utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateSeatInput {
  userId: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: SeatRole;
  status?: SeatStatus;
  invitedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSeatInput {
  firstName?: string;
  lastName?: string;
  role?: SeatRole;
  status?: SeatStatus;
  metadata?: Record<string, unknown>;
}

export interface SeatQueryOptions {
  organizationId?: string;
  status?: SeatStatus;
  role?: SeatRole;
  search?: string;
  page?: number;
  limit?: number;
}

class SeatService {
  /**
   * Create a new seat
   */
  async createSeat(input: CreateSeatInput): Promise<ISeat> {
    try {
      // Check if organization exists
      const organization = await Organization.findById(input.organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Check if seat already exists for this user in this organization
      const existingSeat = await Seat.findOne({
        userId: input.userId,
        organizationId: input.organizationId
      });

      if (existingSeat) {
        throw new Error('Seat already exists for this user in this organization');
      }

      // Check if organization can add more seats
      if (!organization.canAddSeat()) {
        throw new Error('Organization has reached its seat limit');
      }

      const seat = new Seat({
        ...input,
        organizationId: new mongoose.Types.ObjectId(input.organizationId),
        invitedBy: input.invitedBy ? new mongoose.Types.ObjectId(input.invitedBy) : undefined,
        status: input.status || SeatStatus.PENDING,
        role: input.role || SeatRole.MEMBER,
        invitedAt: new Date()
      });

      await seat.save();

      // Update organization seats array
      await Organization.findByIdAndUpdate(input.organizationId, {
        $push: { seats: seat._id }
      });

      logger.info(`Seat created: ${seat._id} for user ${seat.userId} in org ${seat.organizationId}`);

      return seat;
    } catch (error) {
      logger.error('Error creating seat:', error);
      throw error;
    }
  }

  /**
   * Get seat by ID
   */
  async getSeatById(seatId: string): Promise<ISeat | null> {
    try {
      const seat = await Seat.findById(seatId).populate('permissions');
      if (!seat) {
        logger.warn(`Seat not found: ${seatId}`);
      }
      return seat;
    } catch (error) {
      logger.error(`Error getting seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Get seat by user ID and organization ID
   */
  async getSeatByUserAndOrg(userId: string, organizationId: string): Promise<ISeat | null> {
    try {
      return await Seat.findOne({
        userId,
        organizationId: new mongoose.Types.ObjectId(organizationId)
      }).populate('permissions');
    } catch (error) {
      logger.error(`Error getting seat for user ${userId} in org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * List seats with filtering and pagination
   */
  async listSeats(options: SeatQueryOptions): Promise<{ seats: ISeat[]; total: number; page: number; limit: number }> {
    try {
      const {
        organizationId,
        status,
        role,
        search,
        page = 1,
        limit = 20
      } = options;

      const query: FilterQuery<typeof Seat> = {};

      if (organizationId) {
        query.organizationId = new mongoose.Types.ObjectId(organizationId);
      }
      if (status) {
        query.status = status;
      }
      if (role) {
        query.role = role;
      }
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const [seats, total] = await Promise.all([
        Seat.find(query)
          .populate('permissions')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Seat.countDocuments(query)
      ]);

      return { seats, total, page, limit };
    } catch (error) {
      logger.error('Error listing seats:', error);
      throw error;
    }
  }

  /**
   * Update seat
   */
  async updateSeat(seatId: string, input: UpdateSeatInput): Promise<ISeat | null> {
    try {
      const seat = await Seat.findByIdAndUpdate(
        seatId,
        { $set: input },
        { new: true, runValidators: true }
      ).populate('permissions');

      if (seat) {
        logger.info(`Seat updated: ${seatId}`);
      }

      return seat;
    } catch (error) {
      logger.error(`Error updating seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Activate seat
   */
  async activateSeat(seatId: string): Promise<ISeat | null> {
    try {
      const seat = await Seat.findByIdAndUpdate(
        seatId,
        {
          $set: {
            status: SeatStatus.ACTIVE,
            activatedAt: new Date()
          }
        },
        { new: true }
      );

      if (seat) {
        // Update organization active seat count
        await Organization.findByIdAndUpdate(seat.organizationId, {
          $inc: { activeSeats: 1 }
        });

        logger.info(`Seat activated: ${seatId}`);
      }

      return seat;
    } catch (error) {
      logger.error(`Error activating seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate seat
   */
  async deactivateSeat(seatId: string): Promise<ISeat | null> {
    try {
      const seat = await Seat.findById(seatId);

      if (!seat) {
        throw new Error('Seat not found');
      }

      if (seat.status !== SeatStatus.ACTIVE) {
        throw new Error('Seat is not active');
      }

      const updatedSeat = await Seat.findByIdAndUpdate(
        seatId,
        {
          $set: {
            status: SeatStatus.INACTIVE,
            deactivatedAt: new Date()
          }
        },
        { new: true }
      );

      if (updatedSeat) {
        // Update organization active seat count
        await Organization.findByIdAndUpdate(seat.organizationId, {
          $inc: { activeSeats: -1 }
        });

        logger.info(`Seat deactivated: ${seatId}`);
      }

      return updatedSeat;
    } catch (error) {
      logger.error(`Error deactivating seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Delete seat
   */
  async deleteSeat(seatId: string): Promise<boolean> {
    try {
      const seat = await Seat.findById(seatId);

      if (!seat) {
        throw new Error('Seat not found');
      }

      // Check if this is the last seat or owner
      if (seat.role === SeatRole.OWNER) {
        throw new Error('Cannot delete owner seat');
      }

      const org = await Organization.findById(seat.organizationId);
      if (org && org.seats.length <= 1) {
        throw new Error('Cannot delete the last seat');
      }

      // Remove seat from organization
      await Organization.findByIdAndUpdate(seat.organizationId, {
        $pull: { seats: seatId }
      });

      // Delete seat
      await Seat.findByIdAndDelete(seatId);

      // Update active seat count if seat was active
      if (seat.status === SeatStatus.ACTIVE) {
        await Organization.findByIdAndUpdate(seat.organizationId, {
          $inc: { activeSeats: -1 }
        });
      }

      logger.info(`Seat deleted: ${seatId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Get team members for a seat's organization
   */
  async getTeamMembers(seatId: string): Promise<ISeat[]> {
    try {
      const seat = await Seat.findById(seatId);
      if (!seat) {
        throw new Error('Seat not found');
      }

      return await Seat.find({
        organizationId: seat.organizationId,
        status: SeatStatus.ACTIVE
      }).populate('permissions');
    } catch (error) {
      logger.error(`Error getting team members for seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Get pending invitations for an organization
   */
  async getPendingInvitations(organizationId: string): Promise<ISeat[]> {
    try {
      return await Seat.find({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: SeatStatus.PENDING
      }).sort({ invitedAt: -1 });
    } catch (error) {
      logger.error(`Error getting pending invitations for org ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Transfer seat ownership
   */
  async transferOwnership(seatId: string, newOwnerId: string): Promise<ISeat | null> {
    try {
      const currentSeat = await Seat.findById(seatId);
      if (!currentSeat) {
        throw new Error('Seat not found');
      }

      if (currentSeat.role !== SeatRole.OWNER) {
        throw new Error('Only owner can transfer ownership');
      }

      // Find current owner
      const currentOwner = await Seat.findOne({
        organizationId: currentSeat.organizationId,
        role: SeatRole.OWNER
      });

      if (!currentOwner) {
        throw new Error('Current owner not found');
      }

      // Demote current owner to admin
      await Seat.findByIdAndUpdate(currentOwner._id, {
        role: SeatRole.ADMIN
      });

      // Promote new owner
      const newOwner = await Seat.findByIdAndUpdate(
        seatId,
        { role: SeatRole.OWNER },
        { new: true }
      );

      logger.info(`Ownership transferred from ${currentOwner._id} to ${seatId}`);
      return newOwner;
    } catch (error) {
      logger.error(`Error transferring ownership for seat ${seatId}:`, error);
      throw error;
    }
  }
}

export const seatService = new SeatService();