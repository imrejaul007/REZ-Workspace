import { Folio, ISplitMember } from '../models/Folio';
import { Transaction, TransactionType } from '../models/Transaction';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * SplitBillService - Handles split bill operations
 * Allows splitting bills between multiple guests
 */
export class SplitBillService {
  /**
   * Initialize split bill for a folio
   */
  async initializeSplit(folioId: string, members: Array<{
    guestId: string;
    guestName: string;
    sharePercentage: number;
  }>): Promise<{
    success: boolean;
    folioId?: string;
    members?: ISplitMember[];
    error?: string;
  }> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      return { success: false, error: 'Folio not found' };
    }

    if (folio.status !== 'OPEN') {
      return { success: false, error: 'Cannot split a closed folio' };
    }

    // Validate percentages
    const totalPercentage = members.reduce((sum, m) => sum + m.sharePercentage, 0);
    if (totalPercentage !== 100) {
      return { success: false, error: 'Split percentages must total 100%' };
    }

    // Create split group ID
    const splitGroupId = `SPLIT-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Calculate share amounts
    const netAmount = folio.netAmount;
    const calculatedMembers: ISplitMember[] = members.map((m) => ({
      guestId: m.guestId,
      guestName: m.guestName,
      sharePercentage: m.sharePercentage,
      shareAmount: Math.round((netAmount * m.sharePercentage) / 100),
      settled: false,
    }));

    // Update folio
    folio.splitBillEnabled = true;
    folio.splitBillMembers = calculatedMembers;

    // Create split transactions for tracking
    const splitTransactions = await Promise.all(
      calculatedMembers.map(async (member) => {
        const transaction = new Transaction({
          transactionId: `SPLIT-${uuidv4().substring(0, 12).toUpperCase()}`,
          folioId,
          propertyId: folio.propertyId,
          outletType: 'SPLIT',
          outletId: 'SYSTEM',
          type: TransactionType.CHARGE,
          status: 'PENDING',
          items: [],
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: member.shareAmount,
          currency: folio.currency,
          guestId: member.guestId,
          guestName: member.guestName,
          roomNumber: folio.roomNumber,
          splitGroupId,
          notes: `Split bill share: ${member.sharePercentage}%`,
        });
        await transaction.save();
        return transaction;
      })
    );

    await folio.save();

    logger.info('Split bill initialized', {
      folioId,
      splitGroupId,
      members: members.length,
      totalAmount: netAmount,
    });

    return {
      success: true,
      folioId,
      members: calculatedMembers,
    };
  }

  /**
   * Settle a split member's portion
   */
  async settleMember(
    folioId: string,
    guestId: string,
    paymentData: {
      paymentMethod: string;
      amount: number;
      reference?: string;
    }
  ): Promise<{
    success: boolean;
    settlementId?: string;
    error?: string;
  }> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      return { success: false, error: 'Folio not found' };
    }

    if (!folio.splitBillEnabled) {
      return { success: false, error: 'Split bill not enabled for this folio' };
    }

    const memberIndex = folio.splitBillMembers.findIndex((m) => m.guestId === guestId);
    if (memberIndex === -1) {
      return { success: false, error: 'Guest not found in split bill' };
    }

    const member = folio.splitBillMembers[memberIndex];

    if (member.settled) {
      return { success: false, error: 'Guest has already settled their portion' };
    }

    if (Math.abs(paymentData.amount - member.shareAmount) > 0.01) {
      return {
        success: false,
        error: `Payment amount must equal share amount: ${member.shareAmount}`,
      };
    }

    // Create settlement transaction
    const settlementTransaction = new Transaction({
      transactionId: `STL-${uuidv4().substring(0, 12).toUpperCase()}`,
      folioId,
      propertyId: folio.propertyId,
      outletType: 'SPLIT',
      outletId: 'SYSTEM',
      type: TransactionType.PAYMENT,
      status: 'COMPLETED',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: paymentData.amount,
      currency: folio.currency,
      paymentMethod: paymentData.paymentMethod as unknown,
      paymentReference: paymentData.reference,
      guestId: member.guestId,
      guestName: member.guestName,
      splitGroupId: folio.splitBillMembers[0]?.sharePercentage ? `SPLIT-${folioId}` : undefined,
      completedAt: new Date(),
    });

    await settlementTransaction.save();

    // Mark member as settled
    folio.splitBillMembers[memberIndex].settled = true;
    folio.splitBillMembers[memberIndex].settledAt = new Date();

    // Check if all members settled
    const allSettled = folio.splitBillMembers.every((m) => m.settled);
    if (allSettled) {
      (folio.status as unknown) = 'CLOSED';
      folio.paymentStatus = 'SETTLED';
      folio.closedAt = new Date();
    }

    await folio.save();

    logger.info('Split member settled', {
      folioId,
      guestId,
      amount: paymentData.amount,
      allSettled,
    });

    return {
      success: true,
      settlementId: settlementTransaction.transactionId,
    };
  }

  /**
   * Adjust split percentages
   */
  async adjustSplit(
    folioId: string,
    adjustments: Array<{
      guestId: string;
      newPercentage: number;
    }>
  ): Promise<{
    success: boolean;
    folioId?: string;
    members?: ISplitMember[];
    error?: string;
  }> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      return { success: false, error: 'Folio not found' };
    }

    if (!folio.splitBillEnabled) {
      return { success: false, error: 'Split bill not enabled for this folio' };
    }

    // Check for already settled members
    const settledMembers = folio.splitBillMembers.filter((m) => m.settled);
    if (settledMembers.length > 0) {
      return { success: false, error: 'Cannot adjust split after partial settlement' };
    }

    // Build new members array
    const newMembers: ISplitMember[] = [];
    for (const adjustment of adjustments) {
      const existing = folio.splitBillMembers.find((m) => m.guestId === adjustment.guestId);
      if (!existing) {
        return { success: false, error: `Guest not found in split: ${adjustment.guestId}` };
      }

      const newAmount = Math.round((folio.netAmount * adjustment.newPercentage) / 100);
      newMembers.push({
        ...existing,
        sharePercentage: adjustment.newPercentage,
        shareAmount: newAmount,
      });
    }

    // Validate percentages
    const totalPercentage = newMembers.reduce((sum, m) => sum + m.sharePercentage, 0);
    if (totalPercentage !== 100) {
      return { success: false, error: 'Split percentages must total 100%' };
    }

    folio.splitBillMembers = newMembers;
    await folio.save();

    logger.info('Split bill adjusted', { folioId, newMembers: newMembers.length });

    return {
      success: true,
      folioId,
      members: newMembers,
    };
  }

  /**
   * Cancel split bill
   */
  async cancelSplit(folioId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      return { success: false, error: 'Folio not found' };
    }

    if (!folio.splitBillEnabled) {
      return { success: false, error: 'Split bill not enabled for this folio' };
    }

    // Check for settled members
    const settledMembers = folio.splitBillMembers.filter((m) => m.settled);
    if (settledMembers.length > 0) {
      return {
        success: false,
        error: 'Cannot cancel split after partial settlement. Close settled portions first.',
      };
    }

    // Delete split transactions
    await Transaction.deleteMany({
      folioId,
      outletType: 'SPLIT',
      status: 'PENDING',
    });

    folio.splitBillEnabled = false;
    folio.splitBillMembers = [];
    await folio.save();

    logger.info('Split bill cancelled', { folioId });

    return { success: true };
  }

  /**
   * Get split bill status
   */
  async getSplitStatus(folioId: string): Promise<{
    folioId: string;
    enabled: boolean;
    totalAmount: number;
    members: ISplitMember[];
    settledAmount: number;
    pendingAmount: number;
  } | null> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      return null;
    }

    const settledAmount = folio.splitBillMembers
      .filter((m) => m.settled)
      .reduce((sum, m) => sum + m.shareAmount, 0);

    const pendingAmount = folio.netAmount - settledAmount;

    return {
      folioId,
      enabled: folio.splitBillEnabled,
      totalAmount: folio.netAmount,
      members: folio.splitBillMembers,
      settledAmount,
      pendingAmount,
    };
  }

  /**
   * Equal split - split evenly between guests
   */
  async equalSplit(folioId: string, guestCount: number): Promise<{
    success: boolean;
    members?: ISplitMember[];
    error?: string;
  }> {
    if (guestCount < 2) {
      return { success: false, error: 'At least 2 guests required for split' };
    }

    const percentage = Math.floor(100 / guestCount);
    const remainder = 100 - (percentage * guestCount);

    const members: Array<{ guestId: string; guestName: string; sharePercentage: number }> = [];

    for (let i = 0; i < guestCount; i++) {
      // Give the remainder to the last person
      const sharePercentage = i === guestCount - 1 ? percentage + remainder : percentage;
      members.push({
        guestId: `GUEST-${i + 1}`,
        guestName: `Guest ${i + 1}`,
        sharePercentage,
      });
    }

    return this.initializeSplit(folioId, members);
  }

  /**
   * Split by item - assign specific items to specific guests
   */
  async splitByItem(
    folioId: string,
    assignments: Array<{
      guestId: string;
      guestName: string;
      itemIds: string[];
    }>
  ): Promise<{
    success: boolean;
    folioId?: string;
    members?: ISplitMember[];
    error?: string;
  }> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      return { success: false, error: 'Folio not found' };
    }

    // Get all transactions for this folio
    const transactions = await Transaction.find({
      folioId,
      type: TransactionType.CHARGE,
      status: 'COMPLETED',
    });

    // Calculate totals per guest based on assigned items
    const guestTotals: Map<string, number> = new Map();

    for (const assignment of assignments) {
      let guestTotal = 0;

      for (const itemId of assignment.itemIds) {
        for (const transaction of transactions) {
          const item = transaction.items.find((i) => i.itemId === itemId);
          if (item) {
            guestTotal += item.totalAmount;
          }
        }
      }

      guestTotals.set(assignment.guestId, guestTotal);
    }

    const netAmount = folio.netAmount;
    const members: Array<{ guestId: string; guestName: string; sharePercentage: number }> = [];

    for (const assignment of assignments) {
      const total = guestTotals.get(assignment.guestId) || 0;
      const percentage = netAmount > 0 ? Math.round((total / netAmount) * 100) : 0;

      members.push({
        guestId: assignment.guestId,
        guestName: assignment.guestName,
        sharePercentage: percentage,
      });
    }

    // Adjust for rounding
    const totalPercentage = members.reduce((sum, m) => sum + m.sharePercentage, 0);
    if (totalPercentage !== 100 && members.length > 0) {
      members[members.length - 1].sharePercentage += 100 - totalPercentage;
    }

    return this.initializeSplit(folioId, members);
  }
}

export const splitBillService = new SplitBillService();
