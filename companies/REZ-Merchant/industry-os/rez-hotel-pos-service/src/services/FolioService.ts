import { Folio, IFolio, FolioStatus, ISplitMember } from '../models/Folio';
import { Transaction, TransactionType, TransactionStatus } from '../models/Transaction';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * FolioService - Handles all folio operations
 * Manages guest bills, charges, and folio lifecycle
 */
export class FolioService {
  /**
   * Create a new folio for a guest
   */
  async createFolio(data: {
    guestId: string;
    guestName: string;
    propertyId: string;
    guestEmail?: string;
    guestPhone?: string;
    roomNumber?: string;
    reservationId?: string;
    checkInDate?: Date;
    checkOutDate?: Date;
    notes?: string;
  }): Promise<IFolio> {
    const folio = new Folio({
      ...data,
      folioId: `FOLIO-${uuidv4().substring(0, 8).toUpperCase()}`,
    });

    await folio.save();
    logger.info('Folio created', { folioId: folio.folioId, guestId: data.guestId });

    return folio;
  }

  /**
   * Get folio by ID
   */
  async getFolioById(folioId: string): Promise<IFolio | null> {
    return Folio.findOne({ folioId }).populate('transactions');
  }

  /**
   * Get folio by PMS reference
   */
  async getFolioByPmsId(pmsFolioId: string): Promise<IFolio | null> {
    return Folio.findOne({ pmsFolioId });
  }

  /**
   * Get folios by guest ID
   */
  async getFolioByGuestId(guestId: string, status?: FolioStatus): Promise<IFolio[]> {
    const query: Record<string, unknown> = { guestId };
    if (status) {
      query.status = status;
    }
    return Folio.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get folios by property and status
   */
  async getFolioByProperty(propertyId: string, status?: FolioStatus): Promise<IFolio[]> {
    const query: Record<string, unknown> = { propertyId };
    if (status) {
      query.status = status;
    }
    return Folio.find(query).sort({ createdAt: -1 });
  }

  /**
   * Add a charge to a folio (from outlet transaction)
   */
  async addChargeToFolio(
    folioId: string,
    transactionId: string,
    amount: number,
    taxAmount: number = 0
  ): Promise<IFolio | null> {
    const session = await Folio.startSession();
    session.startTransaction();

    try {
      const folio = await Folio.findOne({ folioId }).session(session);
      if (!folio) {
        throw new Error(`Folio not found: ${folioId}`);
      }

      if (folio.status === FolioStatus.CLOSED || folio.status === FolioStatus.CHECKED_OUT) {
        throw new Error(`Cannot add charge to closed folio: ${folio.status}`);
      }

      // Add transaction to folio
      folio.transactions.push(transactionId);
      folio.totalAmount += amount;
      folio.taxAmount += taxAmount;
      folio.netAmount = folio.totalAmount + folio.taxAmount - folio.discountAmount;

      await folio.save({ session });
      await session.commitTransaction();

      logger.info('Charge added to folio', { folioId, transactionId, amount });
      return folio;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Apply discount to a folio
   */
  async applyDiscount(
    folioId: string,
    discountAmount: number,
    reason?: string
  ): Promise<IFolio | null> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      throw new Error(`Folio not found: ${folioId}`);
    }

    if (discountAmount > folio.netAmount) {
      throw new Error('Discount cannot exceed folio amount');
    }

    folio.discountAmount = discountAmount;
    folio.netAmount = folio.totalAmount + folio.taxAmount - folio.discountAmount;

    if (reason) {
      folio.notes = folio.notes ? `${folio.notes}\nDiscount: ${reason}` : `Discount: ${reason}`;
    }

    await folio.save();
    logger.info('Discount applied', { folioId, discountAmount });

    return folio;
  }

  /**
   * Close a folio (settlement)
   */
  async closeFolio(
    folioId: string,
    closedBy: string,
    paymentMethod: string
  ): Promise<IFolio | null> {
    const session = await Folio.startSession();
    session.startTransaction();

    try {
      const folio = await Folio.findOne({ folioId }).session(session);
      if (!folio) {
        throw new Error(`Folio not found: ${folioId}`);
      }

      if (folio.status === FolioStatus.CLOSED || folio.status === FolioStatus.CHECKED_OUT) {
        throw new Error('Folio is already closed');
      }

      folio.status = FolioStatus.CLOSED;
      folio.paymentStatus = 'SETTLED';
      folio.closedAt = new Date();
      folio.closedBy = closedBy;

      // Mark all pending transactions as completed
      await Transaction.updateMany(
        { folioId, status: TransactionStatus.PENDING },
        { $set: { status: TransactionStatus.COMPLETED, completedAt: new Date() } },
        { session }
      );

      await folio.save({ session });
      await session.commitTransaction();

      logger.info('Folio closed', { folioId, closedBy, paymentMethod });
      return folio;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Post folio to PMS
   */
  async postToPms(folioId: string): Promise<{ success: boolean; pmsFolioId?: string; error?: string }> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      throw new Error(`Folio not found: ${folioId}`);
    }

    const pmsUrl = process.env.PMS_SERVICE_URL;
    if (!pmsUrl) {
      return { success: false, error: 'PMS integration not configured' };
    }

    try {
      const response = await fetch(`${pmsUrl}/api/folio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKENS_JSON || '',
        },
        body: JSON.stringify({
          folioId: folio.folioId,
          guestId: folio.guestId,
          guestName: folio.guestName,
          roomNumber: folio.roomNumber,
          totalAmount: folio.totalAmount,
          taxAmount: folio.taxAmount,
          netAmount: folio.netAmount,
          transactions: folio.transactions,
          currency: folio.currency,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const result = await response.json() as { pmsFolioId: string };

      // Update local folio with PMS reference
      folio.pmsFolioId = result.pmsFolioId;
      folio.status = FolioStatus.POSTED;
      await folio.save();

      logger.info('Folio posted to PMS', { folioId, pmsFolioId: result.pmsFolioId });
      return { success: true, pmsFolioId: result.pmsFolioId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to post folio to PMS', { folioId, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Enable split bill for a folio
   */
  async enableSplitBill(folioId: string, members: ISplitMember[]): Promise<IFolio | null> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      throw new Error(`Folio not found: ${folioId}`);
    }

    // Validate split percentages add up to 100
    const totalPercentage = members.reduce((sum, m) => sum + m.sharePercentage, 0);
    if (totalPercentage !== 100) {
      throw new Error('Split percentages must total 100%');
    }

    // Calculate share amounts
    const shareAmounts = members.map((m) => ({
      ...m,
      shareAmount: (folio.netAmount * m.sharePercentage) / 100,
      settled: false,
    }));

    folio.splitBillEnabled = true;
    folio.splitBillMembers = shareAmounts;

    await folio.save();
    logger.info('Split bill enabled', { folioId, members: members.length });

    return folio;
  }

  /**
   * Mark split member as settled
   */
  async settleSplitMember(
    folioId: string,
    guestId: string,
    settledAmount: number
  ): Promise<IFolio | null> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      throw new Error(`Folio not found: ${folioId}`);
    }

    const member = folio.splitBillMembers.find((m) => m.guestId === guestId);
    if (!member) {
      throw new Error(`Guest not found in split: ${guestId}`);
    }

    if (settledAmount !== member.shareAmount) {
      throw new Error(`Settled amount must match share amount: ${member.shareAmount}`);
    }

    member.settled = true;
    member.settledAt = new Date();

    // Check if all members are settled
    const allSettled = folio.splitBillMembers.every((m) => m.settled);
    if (allSettled) {
      folio.status = FolioStatus.CLOSED;
      folio.paymentStatus = 'SETTLED';
      folio.closedAt = new Date();
    }

    await folio.save();
    logger.info('Split member settled', { folioId, guestId, amount: settledAmount });

    return folio;
  }

  /**
   * Get folio summary with transactions
   */
  async getFolioSummary(folioId: string): Promise<{
    folio: IFolio;
    transactions: Array<{
      transactionId: string;
      outletType: string;
      type: string;
      amount: number;
      status: string;
      createdAt: Date;
    }>;
    totalCharges: number;
    totalPayments: number;
    balance: number;
  } | null> {
    const folio = await Folio.findOne({ folioId });
    if (!folio) {
      return null;
    }

    const transactions = await Transaction.find({
      transactionId: { $in: folio.transactions },
    }).select('transactionId outletType type totalAmount status createdAt');

    const totalCharges = transactions
      .filter((t) => t.type === TransactionType.CHARGE)
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const totalPayments = transactions
      .filter((t) => t.type === TransactionType.PAYMENT)
      .reduce((sum, t) => sum + t.totalAmount, 0);

    return {
      folio,
      transactions: transactions.map((t) => ({
        transactionId: t.transactionId,
        outletType: t.outletType,
        type: t.type,
        amount: t.totalAmount,
        status: t.status,
        createdAt: t.createdAt,
      })),
      totalCharges,
      totalPayments,
      balance: totalCharges - totalPayments - folio.discountAmount,
    };
  }
}

export const folioService = new FolioService();
