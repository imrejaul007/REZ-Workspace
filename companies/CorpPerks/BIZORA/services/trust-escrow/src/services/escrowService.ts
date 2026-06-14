import { v4 as uuidv4 } from 'uuid';
import { Escrow, IEscrow } from '../models/Escrow';
import {
  CreateEscrowInput,
  ReleaseEscrowInput,
  RefundEscrowInput,
  DisputeEscrowInput,
  EscrowStatus,
  EscrowRole
} from '../types';
import logger from '../utils/logger';

export class EscrowService {
  /**
   * Create a new escrow
   */
  async createEscrow(input: CreateEscrowInput): Promise<IEscrow> {
    const escrowId = `ESC-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Calculate platform fee
    const feePercentage = input.feeConfig?.percentage ?? 2.5;
    const feeFixed = input.feeConfig?.fixed ?? 0;
    const platformFee = (input.amount * feePercentage / 100) + feeFixed;

    const escrow = new Escrow({
      escrowId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      arbiterId: input.arbiterId,
      amount: input.amount,
      currency: input.currency ?? 'INR',
      description: input.description,
      conditions: input.conditions.map(c => ({
        ...c,
        completed: false
      })),
      milestones: input.milestones?.map(m => ({
        ...m,
        completed: false
      })) ?? [],
      status: 'pending',
      feeConfig: {
        percentage: feePercentage,
        fixed: feeFixed,
        chargedTo: input.feeConfig?.chargedTo ?? 'split'
      },
      platformFee,
      expiresAt: input.expiresAt,
      metadata: input.metadata ?? {},
      auditLog: [
        {
          action: 'ESCROW_CREATED',
          performedBy: input.buyerId,
          performedAt: new Date(),
          details: { amount: input.amount, currency: input.currency }
        }
      ]
    });

    await escrow.save();

    logger.info('Escrow created', {
      escrowId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      amount: input.amount,
      currency: input.currency
    });

    return escrow;
  }

  /**
   * Get escrow by ID
   */
  async getEscrowById(escrowId: string): Promise<IEscrow | null> {
    return Escrow.findOne({ escrowId });
  }

  /**
   * Get escrow by MongoDB _id
   */
  async getEscrowByObjectId(id: string): Promise<IEscrow | null> {
    return Escrow.findById(id);
  }

  /**
   * Fund an escrow (move funds into escrow)
   */
  async fundEscrow(escrowId: string, funderId: string): Promise<IEscrow> {
    const escrow = await Escrow.findOne({ escrowId });

    if (!escrow) {
      throw new Error('ESCROW_NOT_FOUND');
    }

    if (escrow.status !== 'pending') {
      throw new Error(`Cannot fund escrow in status: ${escrow.status}`);
    }

    // Check if funder is buyer
    if (escrow.buyerId !== funderId) {
      throw new Error('ONLY_BUYER_CAN_FUND');
    }

    // Check expiration
    if (escrow.expiresAt && new Date() > escrow.expiresAt) {
      throw new Error('ESCROW_EXPIRED');
    }

    escrow.status = 'funded';
    escrow.fundedAt = new Date();
    escrow.addAuditEntry('ESCROW_FUNDED', funderId, {
      amount: escrow.amount,
      currency: escrow.currency
    });

    await escrow.save();

    logger.info('Escrow funded', { escrowId, funderId, amount: escrow.amount });

    return escrow;
  }

  /**
   * Release funds to seller
   */
  async releaseEscrow(input: ReleaseEscrowInput): Promise<IEscrow> {
    const escrow = await Escrow.findOne({ escrowId: input.escrowId });

    if (!escrow) {
      throw new Error('ESCROW_NOT_FOUND');
    }

    // Validate authorization
    this.validateReleaseAuthorization(escrow, input.releasedBy, input.role);

    // Validate status
    if (escrow.status !== 'funded') {
      throw new Error(`Cannot release escrow in status: ${escrow.status}`);
    }

    // Check if all conditions are met
    const allConditionsMet = escrow.conditions.every(c => c.completedAt);
    if (!allConditionsMet) {
      throw new Error('CONDITIONS_NOT_MET');
    }

    // Handle milestone release
    if (input.milestoneName) {
      return this.releaseMilestone(escrow, input);
    }

    // Full release
    escrow.status = 'released';
    escrow.releasedAt = new Date();
    escrow.addAuditEntry('ESCROW_RELEASED', input.releasedBy, {
      reason: input.reason,
      fullRelease: true
    });

    await escrow.save();

    logger.info('Escrow released', {
      escrowId: input.escrowId,
      releasedBy: input.releasedBy,
      amount: escrow.amount
    });

    return escrow;
  }

  /**
   * Release a specific milestone
   */
  private async releaseMilestone(
    escrow: IEscrow,
    input: ReleaseEscrowInput
  ): Promise<IEscrow> {
    const milestone = escrow.milestones.find(m => m.name === input.milestoneName);

    if (!milestone) {
      throw new Error('MILESTONE_NOT_FOUND');
    }

    if (milestone.completed) {
      throw new Error('MILESTONE_ALREADY_RELEASED');
    }

    milestone.completed = true;
    milestone.completedAt = new Date();

    // Calculate remaining amount
    const completedMilestones = escrow.milestones.filter(m => m.completed);
    const remainingAmount = escrow.amount - completedMilestones.reduce(
      (sum, m) => sum + m.amount,
      0
    );

    // If all milestones complete, mark escrow as released
    if (escrow.milestones.every(m => m.completed)) {
      escrow.status = 'released';
      escrow.releasedAt = new Date();
    }

    escrow.addAuditEntry('MILESTONE_RELEASED', input.releasedBy, {
      milestoneName: input.milestoneName,
      amount: milestone.amount,
      reason: input.reason
    });

    await escrow.save();

    logger.info('Milestone released', {
      escrowId: input.escrowId,
      milestoneName: input.milestoneName,
      amount: milestone.amount
    });

    return escrow;
  }

  /**
   * Refund funds to buyer
   */
  async refundEscrow(input: RefundEscrowInput): Promise<IEscrow> {
    const escrow = await Escrow.findOne({ escrowId: input.escrowId });

    if (!escrow) {
      throw new Error('ESCROW_NOT_FOUND');
    }

    // Validate authorization - only buyer can request refund
    if (escrow.buyerId !== input.refundedBy) {
      throw new Error('ONLY_BUYER_CAN_REFUND');
    }

    // Validate status
    if (!['funded', 'pending'].includes(escrow.status)) {
      throw new Error(`Cannot refund escrow in status: ${escrow.status}`);
    }

    escrow.status = 'refunded';
    escrow.refundedAt = new Date();
    escrow.addAuditEntry('ESCROW_REFUNDED', input.refundedBy, {
      reason: input.reason
    });

    await escrow.save();

    logger.info('Escrow refunded', {
      escrowId: input.escrowId,
      refundedBy: input.refundedBy,
      reason: input.reason
    });

    return escrow;
  }

  /**
   * File a dispute
   */
  async disputeEscrow(input: DisputeEscrowInput): Promise<IEscrow> {
    const escrow = await Escrow.findOne({ escrowId: input.escrowId });

    if (!escrow) {
      throw new Error('ESCROW_NOT_FOUND');
    }

    // Validate status - can only dispute funded escrows
    if (escrow.status !== 'funded') {
      throw new Error(`Cannot dispute escrow in status: ${escrow.status}`);
    }

    // Only buyer, seller, or arbiter can file dispute
    const validDisputers = [escrow.buyerId, escrow.sellerId];
    if (escrow.arbiterId) {
      validDisputers.push(escrow.arbiterId);
    }

    if (!validDisputers.includes(input.disputedBy)) {
      throw new Error('UNAUTHORIZED_DISPUTE');
    }

    escrow.status = 'disputed';
    escrow.dispute = {
      reason: input.reason,
      filedBy: input.disputedBy,
      filedAt: new Date()
    };

    escrow.addAuditEntry('DISPUTE_FILED', input.disputedBy, {
      reason: input.reason
    });

    await escrow.save();

    logger.info('Dispute filed', {
      escrowId: input.escrowId,
      disputedBy: input.disputedBy,
      reason: input.reason
    });

    return escrow;
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(
    escrowId: string,
    resolvedBy: string,
    resolution: 'release_to_seller' | 'refund_to_buyer' | 'split',
    splitPercentage?: number
  ): Promise<IEscrow> {
    const escrow = await Escrow.findOne({ escrowId });

    if (!escrow) {
      throw new Error('ESCROW_NOT_FOUND');
    }

    if (escrow.status !== 'disputed') {
      throw new Error('ESCROW_NOT_UNDER_DISPUTE');
    }

    // Only arbiter can resolve
    if (escrow.arbiterId !== resolvedBy) {
      throw new Error('ONLY_ARBITER_CAN_RESOLVE');
    }

    escrow.dispute!.resolvedAt = new Date();
    escrow.dispute!.resolution = resolution;

    if (resolution === 'release_to_seller') {
      escrow.status = 'released';
      escrow.releasedAt = new Date();
    } else if (resolution === 'refund_to_buyer') {
      escrow.status = 'refunded';
      escrow.refundedAt = new Date();
    } else {
      // Split - mark as partially released (simplified)
      escrow.status = 'released';
      escrow.releasedAt = new Date();
    }

    escrow.addAuditEntry('DISPUTE_RESOLVED', resolvedBy, {
      resolution,
      splitPercentage
    });

    await escrow.save();

    logger.info('Dispute resolved', {
      escrowId,
      resolvedBy,
      resolution
    });

    return escrow;
  }

  /**
   * Cancel an escrow (before funding)
   */
  async cancelEscrow(escrowId: string, cancelledBy: string): Promise<IEscrow> {
    const escrow = await Escrow.findOne({ escrowId });

    if (!escrow) {
      throw new Error('ESCROW_NOT_FOUND');
    }

    if (escrow.status !== 'pending') {
      throw new Error('CANNOT_CANCEL_FUNDED_ESCROW');
    }

    // Only buyer or seller can cancel
    if (![escrow.buyerId, escrow.sellerId].includes(cancelledBy)) {
      throw new Error('UNAUTHORIZED_CANCEL');
    }

    escrow.status = 'cancelled';
    escrow.cancelledAt = new Date();
    escrow.addAuditEntry('ESCROW_CANCELLED', cancelledBy);

    await escrow.save();

    logger.info('Escrow cancelled', { escrowId, cancelledBy });

    return escrow;
  }

  /**
   * Mark a condition as completed
   */
  async completeCondition(
    escrowId: string,
    conditionIndex: number,
    completedBy: string,
    role: EscrowRole
  ): Promise<IEscrow> {
    const escrow = await Escrow.findOne({ escrowId });

    if (!escrow) {
      throw new Error('ESCROW_NOT_FOUND');
    }

    if (escrow.status !== 'funded') {
      throw new Error('ESCROW_NOT_FUNDED');
    }

    if (conditionIndex < 0 || conditionIndex >= escrow.conditions.length) {
      throw new Error('CONDITION_INDEX_OUT_OF_BOUNDS');
    }

    // Validate role permission
    if (role === 'buyer' && escrow.buyerId !== completedBy) {
      throw new Error('UNAUTHORIZED');
    }
    if (role === 'seller' && escrow.sellerId !== completedBy) {
      throw new Error('UNAUTHORIZED');
    }
    if (role === 'arbiter' && escrow.arbiterId !== completedBy) {
      throw new Error('UNAUTHORIZED');
    }

    escrow.conditions[conditionIndex].completedAt = new Date();
    escrow.conditions[conditionIndex].completedBy = completedBy;

    escrow.addAuditEntry('CONDITION_COMPLETED', completedBy, {
      conditionIndex,
      description: escrow.conditions[conditionIndex].description
    });

    await escrow.save();

    logger.info('Condition completed', {
      escrowId,
      conditionIndex,
      completedBy
    });

    return escrow;
  }

  /**
   * Get escrow status summary
   */
  async getEscrowStatus(escrowId: string): Promise<{
    status: EscrowStatus;
    conditionsMet: number;
    totalConditions: number;
    milestonesCompleted: number;
    totalMilestones: number;
    canRelease: boolean;
    canRefund: boolean;
    isExpired: boolean;
  }> {
    const escrow = await Escrow.findOne({ escrowId });

    if (!escrow) {
      throw new Error('ESCROW_NOT_FOUND');
    }

    const conditionsMet = escrow.conditions.filter(c => c.completedAt).length;
    const milestonesCompleted = escrow.milestones.filter(m => m.completed).length;
    const allConditionsMet = conditionsMet === escrow.conditions.length;
    const isExpired = escrow.expiresAt ? new Date() > escrow.expiresAt : false;

    return {
      status: escrow.status,
      conditionsMet,
      totalConditions: escrow.conditions.length,
      milestonesCompleted,
      totalMilestones: escrow.milestones.length,
      canRelease: escrow.status === 'funded' && allConditionsMet && !isExpired,
      canRefund: escrow.status === 'funded' && !isExpired,
      isExpired
    };
  }

  /**
   * List escrows by user
   */
  async listEscrowsByUser(
    userId: string,
    options: {
      status?: EscrowStatus;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ escrows: IEscrow[]; total: number }> {
    const query: Record<string, unknown> = {
      $or: [{ buyerId: userId }, { sellerId: userId }]
    };

    if (options.status) {
      query.status = options.status;
    }

    const [escrows, total] = await Promise.all([
      Escrow.find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 50),
      Escrow.countDocuments(query)
    ]);

    return { escrows, total };
  }

  /**
   * Validate release authorization
   */
  private validateReleaseAuthorization(
    escrow: IEscrow,
    releasedBy: string,
    role: EscrowRole
  ): void {
    if (role === 'buyer') {
      // Buyer can release if they funded
      if (escrow.buyerId !== releasedBy) {
        throw new Error('UNAUTHORIZED');
      }
    } else if (role === 'seller') {
      // Seller can release to themselves (payment received)
      if (escrow.sellerId !== releasedBy) {
        throw new Error('UNAUTHORIZED');
      }
    } else if (role === 'arbiter') {
      // Arbiter can release in dispute
      if (escrow.arbiterId !== releasedBy) {
        throw new Error('UNAUTHORIZED');
      }
    }
  }
}

export const escrowService = new EscrowService();
export default escrowService;
