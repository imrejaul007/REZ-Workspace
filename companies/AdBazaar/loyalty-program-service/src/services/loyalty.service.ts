import { Program, IProgram } from '../models/program.model';
import { Enrollment, IEnrollment } from '../models/enrollment.model';
import { Tier } from '../models/tier.model';
import { v4 as uuidv4 } from 'uuid';
import logger from 'utils/logger.js';
import { programsCreated, enrollments, pointsEarned, pointsRedeemed, activeMembers } from '../utils/metrics';

export interface CreateProgramInput {
  name: string;
  description?: string;
  type: 'points' | 'tiered' | 'cashback' | 'hybrid';
  earningRules: Array<{
    action: string;
    pointsPerUnit: number;
    multiplier?: number;
    conditions?: Record<string, unknown>;
  }>;
  redemptionRules: {
    pointsPerUnit: number;
    minRedemption: number;
    maxRedemption?: number;
    expiryDays?: number;
  };
  tiers?: Array<{
    name: string;
    level: number;
    minPoints: number;
    maxPoints?: number;
    benefits: string[];
    multiplier: number;
    requirements?: {
      minPurchases?: number;
      minOrders?: number;
      tenureDays?: number;
    };
    perks?: Array<{
      type: string;
      value?: number;
      description: string;
    }>;
  }>;
  currency?: string;
}

export interface UpdateProgramInput {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
  earningRules?: Array<{
    action: string;
    pointsPerUnit: number;
    multiplier?: number;
    conditions?: Record<string, unknown>;
  }>;
  redemptionRules?: {
    pointsPerUnit: number;
    minRedemption: number;
    maxRedemption?: number;
    expiryDays?: number;
  };
}

export class LoyaltyService {
  async createProgram(input: CreateProgramInput, createdBy: string): Promise<IProgram> {
    const programId = `prog-${uuidv4().slice(0, 8)}`;

    const program = new Program({
      programId,
      name: input.name,
      description: input.description,
      type: input.type,
      earningRules: input.earningRules.map((r, i) => ({
        ruleId: `rule-${i}`,
        ...r
      })),
      redemptionRules: input.redemptionRules,
      currency: input.currency || 'points',
      createdBy
    });

    await program.save();
    programsCreated.inc();

    // Create tiers if provided
    if (input.tiers?.length) {
      for (const tierInput of input.tiers) {
        const tier = new Tier({
          tierId: `tier-${uuidv4().slice(0, 8)}`,
          programId,
          ...tierInput
        });
        await tier.save();
      }
    }

    logger.info(`Loyalty program created: ${programId}`);
    return program;
  }

  async findProgramById(programId: string): Promise<IProgram | null> {
    return Program.findOne({ programId });
  }

  async updateProgram(programId: string, input: UpdateProgramInput): Promise<IProgram | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status) updateData.status = input.status;
    if (input.redemptionRules) updateData.redemptionRules = input.redemptionRules;

    if (input.earningRules) {
      updateData.earningRules = input.earningRules.map((r, i) => ({
        ruleId: `rule-${i}`,
        ...r
      }));
    }

    const program = await Program.findOneAndUpdate(
      { programId },
      { $set: updateData },
      { new: true }
    );

    if (program) logger.info(`Loyalty program updated: ${programId}`);
    return program;
  }

  async listPrograms(filters?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ programs: IProgram[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [programs, total] = await Promise.all([
      Program.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Program.countDocuments(query)
    ]);

    return { programs, total };
  }

  async enrollUser(programId: string, userId: string): Promise<IEnrollment> {
    const program = await Program.findOne({ programId, status: 'active' });
    if (!program) throw new Error('Program not found or inactive');

    // Check if already enrolled
    let enrollment = await Enrollment.findOne({ programId, userId });
    if (enrollment) throw new Error('User already enrolled');

    const enrollmentId = `enr-${uuidv4().slice(0, 8)}`;

    enrollment = new Enrollment({
      enrollmentId,
      programId,
      userId,
      status: 'active',
      pointsBalance: 0,
      lifetimePoints: 0,
      pointsEarned: 0,
      pointsRedeemed: 0
    });

    await enrollment.save();

    // Update program member count
    await Program.updateOne({ programId }, { $inc: { memberCount: 1 } });

    enrollments.inc();
    activeMembers.inc({ program_id: programId });

    logger.info(`User ${userId} enrolled in program ${programId}`);
    return enrollment;
  }

  async earnPoints(programId: string, userId: string, points: number, action?: string): Promise<IEnrollment> {
    const enrollment = await Enrollment.findOne({ programId, userId, status: 'active' });
    if (!enrollment) throw new Error('Enrollment not found');

    enrollment.pointsBalance += points;
    enrollment.lifetimePoints += points;
    enrollment.pointsEarned += points;
    enrollment.lastActivityAt = new Date();

    await enrollment.save();

    // Update program totals
    await Program.updateOne({ programId }, { $inc: { totalPointsIssued: points } });

    pointsEarned.inc({ program_id: programId }, points);

    logger.info(`User ${userId} earned ${points} points in program ${programId}`);
    return enrollment;
  }

  async redeemPoints(programId: string, userId: string, points: number): Promise<{
    success: boolean;
    enrollment: IEnrollment;
    message?: string;
  }> {
    const enrollment = await Enrollment.findOne({ programId, userId, status: 'active' });
    if (!enrollment) throw new Error('Enrollment not found');

    if (enrollment.pointsBalance < points) {
      return {
        success: false,
        enrollment,
        message: 'Insufficient points balance'
      };
    }

    enrollment.pointsBalance -= points;
    enrollment.pointsRedeemed += points;

    await enrollment.save();

    // Update program totals
    await Program.updateOne({ programId }, { $inc: { totalPointsRedeemed: points } });

    pointsRedeemed.inc({ program_id: programId }, points);

    logger.info(`User ${userId} redeemed ${points} points in program ${programId}`);
    return { success: true, enrollment };
  }

  async getEnrollment(programId: string, userId: string): Promise<IEnrollment | null> {
    return Enrollment.findOne({ programId, userId });
  }

  async getUserEnrollments(userId: string): Promise<IEnrollment[]> {
    return Enrollment.find({ userId, status: 'active' });
  }

  async updateTier(programId: string, userId: string): Promise<IEnrollment | null> {
    const enrollment = await Enrollment.findOne({ programId, userId, status: 'active' });
    if (!enrollment) return null;

    const tiers = await Tier.find({ programId }).sort({ level: 1 });

    for (const tier of tiers) {
      if (enrollment.lifetimePoints >= tier.minPoints &&
          (!tier.maxPoints || enrollment.lifetimePoints <= tier.maxPoints)) {
        if (enrollment.currentTier !== tier.tierId) {
          enrollment.currentTier = tier.tierId;
          enrollment.tierUpdatedAt = new Date();
          await enrollment.save();
          logger.info(`User ${userId} upgraded to tier ${tier.name}`);
        }
        break;
      }
    }

    return enrollment;
  }

  async deleteProgram(programId: string): Promise<boolean> {
    const result = await Program.findOneAndUpdate(
      { programId },
      { $set: { status: 'archived' } }
    );

    if (result) {
      logger.info(`Loyalty program archived: ${programId}`);
      return true;
    }
    return false;
  }
}

export const loyaltyService = new LoyaltyService();