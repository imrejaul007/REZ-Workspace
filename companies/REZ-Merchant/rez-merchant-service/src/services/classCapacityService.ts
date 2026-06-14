import { Types } from 'mongoose';
import { ClassCapacity, IClassCapacity } from '../models/ClassCapacity';
import { logger } from '../config/logger';

export interface EnrollResult {
  success: boolean;
  waitlist?: boolean;
  position?: number;
  message?: string;
}

export interface ClassStatusResult {
  classId: string;
  maxCapacity: number;
  currentEnrollment: number;
  availableSpots: number;
  waitlistEnabled: boolean;
  waitlistCount: number;
  isFull: boolean;
  autoNotify: boolean;
}

export class ClassCapacityService {
  /**
   * Set or update the maximum capacity for a class
   */
  async setCapacity(
    classId: string,
    maxCapacity: number,
    storeId: string,
    merchantId: string,
    options?: { waitlistEnabled?: boolean; waitlistLimit?: number; autoNotify?: boolean }
  ): Promise<IClassCapacity> {
    const updateData: Partial<IClassCapacity> = {
      maxCapacity,
    };

    if (options?.waitlistEnabled !== undefined) {
      updateData.waitlistEnabled = options.waitlistEnabled;
    }
    if (options?.waitlistLimit !== undefined) {
      updateData.waitlistLimit = options.waitlistLimit;
    }
    if (options?.autoNotify !== undefined) {
      updateData.autoNotify = options.autoNotify;
    }

    const capacity = await ClassCapacity.findOneAndUpdate(
      { classId: new Types.ObjectId(classId), merchantId: new Types.ObjectId(merchantId) },
      {
        $set: {
          ...updateData,
          storeId: new Types.ObjectId(storeId),
        },
        $setOnInsert: {
          classId: new Types.ObjectId(classId),
          merchantId: new Types.ObjectId(merchantId),
          enrolledMembers: [],
          waitlistMembers: [],
          currentEnrollment: 0,
          waitlistCount: 0,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    logger.info('Class capacity set', {
      classId,
      merchantId,
      maxCapacity,
      waitlistEnabled: capacity.waitlistEnabled,
    });

    return capacity;
  }

  /**
   * Enroll a member in a class
   * Returns success status and whether they were added to waitlist
   */
  async enroll(classId: string, memberId: string, merchantId: string): Promise<EnrollResult> {
    const classObjectId = new Types.ObjectId(classId);
    const memberObjectId = new Types.ObjectId(memberId);
    const merchantObjectId = new Types.ObjectId(merchantId);

    // Find or create capacity record
    let capacity = await ClassCapacity.findOne({
      classId: classObjectId,
      merchantId: merchantObjectId,
    });

    if (!capacity) {
      // Create default capacity record
      capacity = new ClassCapacity({
        classId: classObjectId,
        merchantId: merchantObjectId,
        storeId: new Types.ObjectId(), // Placeholder - should be set from class
        maxCapacity: 10,
        enrolledMembers: [],
        waitlistMembers: [],
      });
      await capacity.save();
    }

    // Check if already enrolled
    const alreadyEnrolled = capacity.enrolledMembers.some(
      (m) => m.toString() === memberObjectId.toString()
    );
    if (alreadyEnrolled) {
      logger.warn('Member already enrolled', { classId, memberId });
      return { success: false, message: 'Member is already enrolled in this class' };
    }

    // Check if at capacity
    if (capacity.currentEnrollment >= capacity.maxCapacity) {
      // If waitlist is enabled, add to waitlist
      if (capacity.waitlistEnabled) {
        if (capacity.waitlistLimit > 0 && capacity.waitlistCount >= capacity.waitlistLimit) {
          logger.warn('Waitlist is full', { classId, memberId });
          return { success: false, message: 'Waitlist is full' };
        }

        const position = await this.addToWaitlistInternal(capacity, memberObjectId);
        logger.info('Added to waitlist due to full class', { classId, memberId, position });
        return { success: true, waitlist: true, position };
      }

      logger.warn('Class is at capacity', { classId, memberId });
      return { success: false, message: 'Class is at full capacity' };
    }

    // Enroll the member
    await ClassCapacity.updateOne(
      { _id: capacity._id },
      {
        $push: { enrolledMembers: memberObjectId },
        $inc: { currentEnrollment: 1 },
      }
    );

    logger.info('Member enrolled successfully', { classId, memberId });
    return { success: true };
  }

  /**
   * Cancel a member's enrollment
   */
  async cancelEnrollment(classId: string, memberId: string, merchantId: string): Promise<{ success: boolean; promotedFromWaitlist?: string }> {
    const classObjectId = new Types.ObjectId(classId);
    const memberObjectId = new Types.ObjectId(memberId);
    const merchantObjectId = new Types.ObjectId(merchantId);

    const capacity = await ClassCapacity.findOne({
      classId: classObjectId,
      merchantId: merchantObjectId,
    });

    if (!capacity) {
      logger.warn('Class capacity record not found', { classId });
      return { success: false };
    }

    // Check if member is enrolled
    const isEnrolled = capacity.enrolledMembers.some(
      (m) => m.toString() === memberObjectId.toString()
    );

    if (!isEnrolled) {
      // Check if in waitlist
      return this.removeFromWaitlist(classId, memberId, merchantId);
    }

    // Remove from enrolled and decrement count
    await ClassCapacity.updateOne(
      { _id: capacity._id },
      {
        $pull: { enrolledMembers: memberObjectId },
        $inc: { currentEnrollment: -1 },
      }
    );

    logger.info('Enrollment cancelled', { classId, memberId });

    // Promote from waitlist if autoNotify is enabled and waitlist has members
    let promotedMemberId: string | undefined;
    if (capacity.autoNotify && capacity.waitlistMembers.length > 0) {
      promotedMemberId = await this.promoteFromWaitlist(capacity._id.toString());
    }

    return { success: true, promotedFromWaitlist: promotedMemberId };
  }

  /**
   * Add a member to the waitlist
   */
  async addToWaitlist(classId: string, memberId: string, merchantId: string): Promise<number> {
    const classObjectId = new Types.ObjectId(classId);
    const memberObjectId = new Types.ObjectId(memberId);
    const merchantObjectId = new Types.ObjectId(merchantId);

    const capacity = await ClassCapacity.findOne({
      classId: classObjectId,
      merchantId: merchantObjectId,
    });

    if (!capacity) {
      throw new Error('Class capacity record not found');
    }

    if (!capacity.waitlistEnabled) {
      throw new Error('Waitlist is not enabled for this class');
    }

    // Check if waitlist is full
    if (capacity.waitlistLimit > 0 && capacity.waitlistCount >= capacity.waitlistLimit) {
      throw new Error('Waitlist is full');
    }

    // Check if already in waitlist
    const alreadyInWaitlist = capacity.waitlistMembers.some(
      (w) => w.memberId.toString() === memberObjectId.toString()
    );
    if (alreadyInWaitlist) {
      const existingPosition = capacity.waitlistMembers.find(
        (w) => w.memberId.toString() === memberObjectId.toString()
      )?.position;
      return existingPosition || 0;
    }

    return this.addToWaitlistInternal(capacity, memberObjectId);
  }

  /**
   * Internal method to add member to waitlist
   */
  private async addToWaitlistInternal(capacity: IClassCapacity, memberId: Types.ObjectId): Promise<number> {
    const position = capacity.waitlistCount + 1;

    await ClassCapacity.updateOne(
      { _id: capacity._id },
      {
        $push: {
          waitlistMembers: {
            memberId,
            joinedAt: new Date(),
            position,
          },
        },
        $inc: { waitlistCount: 1 },
      }
    );

    logger.info('Added to waitlist', {
      classId: capacity.classId,
      memberId: memberId.toString(),
      position,
    });

    return position;
  }

  /**
   * Remove a member from the waitlist
   */
  private async removeFromWaitlist(classId: string, memberId: string, merchantId: string): Promise<{ success: boolean }> {
    const classObjectId = new Types.ObjectId(classId);
    const memberObjectId = new Types.ObjectId(memberId);
    const merchantObjectId = new Types.ObjectId(merchantId);

    const capacity = await ClassCapacity.findOne({
      classId: classObjectId,
      merchantId: merchantObjectId,
    });

    if (!capacity) {
      return { success: false };
    }

    const waitlistEntry = capacity.waitlistMembers.find(
      (w) => w.memberId.toString() === memberObjectId.toString()
    );

    if (!waitlistEntry) {
      return { success: false };
    }

    const removedPosition = waitlistEntry.position;

    // Remove from waitlist
    await ClassCapacity.updateOne(
      { _id: capacity._id },
      {
        $pull: { waitlistMembers: { memberId: memberObjectId } },
        $inc: { waitlistCount: -1 },
      }
    );

    // Reorder remaining waitlist positions
    await ClassCapacity.updateOne(
      { _id: capacity._id },
      {
        $set: {
          'waitlistMembers': capacity.waitlistMembers
            .filter((w) => w.memberId.toString() !== memberObjectId.toString())
            .map((w, idx) => ({
              memberId: w.memberId,
              joinedAt: w.joinedAt,
              position: idx + 1,
            })),
        },
      }
    );

    logger.info('Removed from waitlist', { classId, memberId, previousPosition: removedPosition });
    return { success: true };
  }

  /**
   * Get the current status of a class
   */
  async getClassStatus(classId: string, merchantId: string): Promise<ClassStatusResult> {
    const classObjectId = new Types.ObjectId(classId);
    const merchantObjectId = new Types.ObjectId(merchantId);

    let capacity = await ClassCapacity.findOne({
      classId: classObjectId,
      merchantId: merchantObjectId,
    });

    if (!capacity) {
      // Return default status
      return {
        classId,
        maxCapacity: 10,
        currentEnrollment: 0,
        availableSpots: 10,
        waitlistEnabled: false,
        waitlistCount: 0,
        isFull: false,
        autoNotify: true,
      };
    }

    return {
      classId,
      maxCapacity: capacity.maxCapacity,
      currentEnrollment: capacity.currentEnrollment,
      availableSpots: Math.max(0, capacity.maxCapacity - capacity.currentEnrollment),
      waitlistEnabled: capacity.waitlistEnabled,
      waitlistCount: capacity.waitlistCount,
      isFull: capacity.currentEnrollment >= capacity.maxCapacity,
      autoNotify: capacity.autoNotify,
    };
  }

  /**
   * Promote the next person from the waitlist to enrolled
   */
  async promoteFromWaitlist(capacityId: string): Promise<string | undefined> {
    const capacity = await ClassCapacity.findById(capacityId);

    if (!capacity || capacity.waitlistMembers.length === 0) {
      return undefined;
    }

    // Get the first person in waitlist (position 1)
    const nextInLine = capacity.waitlistMembers[0];

    // Remove from waitlist
    await ClassCapacity.updateOne(
      { _id: capacityId },
      {
        $pull: { waitlistMembers: { memberId: nextInLine.memberId } },
        $push: { enrolledMembers: nextInLine.memberId },
        $inc: { waitlistCount: -1, currentEnrollment: 1 },
      }
    );

    // Reorder remaining waitlist positions
    const remaining = capacity.waitlistMembers.slice(1);
    if (remaining.length > 0) {
      await ClassCapacity.updateOne(
        { _id: capacityId },
        {
          $set: {
            'waitlistMembers': remaining.map((w, idx) => ({
              memberId: w.memberId,
              joinedAt: w.joinedAt,
              position: idx + 1,
            })),
          },
        }
      );
    }

    const promotedMemberId = nextInLine.memberId.toString();
    logger.info('Promoted from waitlist', {
      classId: capacity.classId.toString(),
      promotedMemberId,
      previousPosition: nextInLine.position,
    });

    return promotedMemberId;
  }

  /**
   * Notify members from waitlist (manual trigger)
   */
  async notifyFromWaitlist(classId: string, merchantId: string): Promise<string[]> {
    const classObjectId = new Types.ObjectId(classId);
    const merchantObjectId = new Types.ObjectId(merchantId);

    const capacity = await ClassCapacity.findOne({
      classId: classObjectId,
      merchantId: merchantObjectId,
    });

    if (!capacity) {
      throw new Error('Class capacity record not found');
    }

    if (capacity.currentEnrollment >= capacity.maxCapacity) {
      throw new Error('Class is still at full capacity');
    }

    const availableSpots = capacity.maxCapacity - capacity.currentEnrollment;
    const promotedMembers: string[] = [];

    // Promote up to available spots
    for (let i = 0; i < Math.min(availableSpots, capacity.waitlistMembers.length); i++) {
      const nextInLine = capacity.waitlistMembers[i];
      await this.promoteFromWaitlist(capacity._id.toString());
      promotedMembers.push(nextInLine.memberId.toString());
    }

    logger.info('Notified members from waitlist', {
      classId,
      promotedCount: promotedMembers.length,
    });

    return promotedMembers;
  }

  /**
   * Get waitlist for a class
   */
  async getWaitlist(classId: string, merchantId: string): Promise<Array<{ memberId: string; position: number; joinedAt: Date }>> {
    const classObjectId = new Types.ObjectId(classId);
    const merchantObjectId = new Types.ObjectId(merchantId);

    const capacity = await ClassCapacity.findOne({
      classId: classObjectId,
      merchantId: merchantObjectId,
    }).lean();

    if (!capacity) {
      return [];
    }

    return capacity.waitlistMembers.map((w) => ({
      memberId: w.memberId.toString(),
      position: w.position,
      joinedAt: w.joinedAt,
    }));
  }
}

// Singleton instance
export const classCapacityService = new ClassCapacityService();
