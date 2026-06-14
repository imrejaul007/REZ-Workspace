import { Transfer, ITransfer, ITransferItem } from '../models/Transfer';
import { Stock } from '../models/Stock';
import { SKU } from '../models/SKU';
import mongoose, { Types, ClientSession } from 'mongoose';

export interface CreateTransferRequest {
  fromStoreId: string;
  toStoreId: string;
  items: {
    skuId: string;
    sku: string;
    requestedQuantity: number;
  }[];
  requestedBy: string;
  notes?: string;
}

export interface UpdateTransferItemsRequest {
  items: {
    skuId: string;
    sku: string;
    requestedQuantity: number;
  }[];
}

class TransferService {
  /**
   * Generate a unique transfer number
   */
  private async generateTransferNumber(): Promise<string> {
    const count = await Transfer.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const seq = (count + 1).toString().padStart(5, '0');
    return `TRF-${year}${month}${day}-${seq}`;
  }

  /**
   * Request a new transfer
   */
  async requestTransfer(data: CreateTransferRequest): Promise<ITransfer> {
    if (data.fromStoreId === data.toStoreId) {
      throw new Error('Source and destination stores must be different');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('At least one item is required for transfer');
    }

    // Validate all SKUs exist
    for (const item of data.items) {
      const sku = await SKU.findById(item.skuId);
      if (!sku) {
        throw new Error(`SKU not found: ${item.skuId}`);
      }
    }

    const transferNumber = await this.generateTransferNumber();

    const transfer = new Transfer({
      transferNumber,
      fromStoreId: data.fromStoreId,
      toStoreId: data.toStoreId,
      items: data.items.map((item) => ({
        skuId: new Types.ObjectId(item.skuId),
        sku: item.sku,
        requestedQuantity: item.requestedQuantity,
      })),
      status: 'pending',
      requestedBy: data.requestedBy,
      notes: data.notes,
    });

    await transfer.save();
    return transfer;
  }

  /**
   * Approve a transfer request
   */
  async approve(id: string, approvedBy: string): Promise<ITransfer> {
    const transfer = await Transfer.findById(id);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'pending') {
      throw new Error(`Cannot approve transfer with status: ${transfer.status}`);
    }

    // Validate stock availability for each item
    for (const item of transfer.items) {
      const stock = await Stock.findOne({
        skuId: item.skuId,
        storeId: transfer.fromStoreId,
      });

      if (!stock) {
        throw new Error(`No stock found for SKU ${item.sku} in source store`);
      }

      const availableQty = stock.quantity - (stock.reservedQuantity || 0);
      if (availableQty < item.requestedQuantity) {
        throw new Error(
          `Insufficient stock for SKU ${item.sku}. Available: ${availableQty}, Requested: ${item.requestedQuantity}`
        );
      }
    }

    // Set approved quantities (default to requested quantities)
    transfer.items = transfer.items.map((item) => ({
      ...item.toObject(),
      approvedQuantity: item.requestedQuantity,
    })) as ITransferItem[];

    transfer.status = 'approved';
    transfer.approvedBy = approvedBy;

    await transfer.save();
    return transfer;
  }

  /**
   * Dispatch a transfer (deduct from source store)
   */
  async dispatch(id: string): Promise<ITransfer> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transfer = await Transfer.findById(id).session(session);
      if (!transfer) {
        throw new Error('Transfer not found');
      }

      if (transfer.status !== 'approved') {
        throw new Error(`Cannot dispatch transfer with status: ${transfer.status}`);
      }

      // Deduct stock from source store for each item
      for (const item of transfer.items) {
        const stock = await Stock.findOne({
          skuId: item.skuId,
          storeId: transfer.fromStoreId,
        }).session(session);

        if (!stock) {
          throw new Error(`No stock found for SKU ${item.sku} in source store`);
        }

        const approvedQty = item.approvedQuantity || item.requestedQuantity;
        const availableQty = stock.quantity - (stock.reservedQuantity || 0);

        if (availableQty < approvedQty) {
          throw new Error(
            `Insufficient stock for SKU ${item.sku}. Available: ${availableQty}, Approved: ${approvedQty}`
          );
        }

        // Deduct from source store
        stock.quantity -= approvedQty;
        stock.availableQuantity = stock.quantity - (stock.reservedQuantity || 0);
        await stock.save({ session });

        // Update dispatched quantity
        item.dispatchedQuantity = approvedQty;
      }

      transfer.status = 'dispatched';
      transfer.dispatchedAt = new Date();
      await transfer.save({ session });

      await session.commitTransaction();
      return transfer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Receive a transfer (add to destination store)
   */
  async receive(id: string): Promise<ITransfer> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transfer = await Transfer.findById(id).session(session);
      if (!transfer) {
        throw new Error('Transfer not found');
      }

      if (transfer.status !== 'dispatched') {
        throw new Error(`Cannot receive transfer with status: ${transfer.status}`);
      }

      // Add stock to destination store for each item
      for (const item of transfer.items) {
        let stock = await Stock.findOne({
          skuId: item.skuId,
          storeId: transfer.toStoreId,
        }).session(session);

        const dispatchedQty = item.dispatchedQuantity || item.approvedQuantity || item.requestedQuantity;

        if (!stock) {
          // Create new stock record
          stock = new Stock({
            skuId: item.skuId,
            storeId: transfer.toStoreId,
            quantity: dispatchedQty,
            reservedQuantity: 0,
            availableQuantity: dispatchedQty,
            lowStockAlert: false,
          });
        } else {
          // Update existing stock
          stock.quantity += dispatchedQty;
          stock.availableQuantity = stock.quantity - (stock.reservedQuantity || 0);
        }

        await stock.save({ session });
      }

      transfer.status = 'received';
      transfer.receivedAt = new Date();
      await transfer.save({ session });

      await session.commitTransaction();
      return transfer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Cancel a transfer
   */
  async cancel(id: string, reason: string, cancelledBy?: string): Promise<ITransfer> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transfer = await Transfer.findById(id).session(session);
      if (!transfer) {
        throw new Error('Transfer not found');
      }

      if (transfer.status === 'received') {
        throw new Error('Cannot cancel a transfer that has already been received');
      }

      if (transfer.status === 'cancelled') {
        throw new Error('Transfer is already cancelled');
      }

      // If dispatched, need to return stock to source store
      if (transfer.status === 'dispatched') {
        for (const item of transfer.items) {
          const stock = await Stock.findOne({
            skuId: item.skuId,
            storeId: transfer.fromStoreId,
          }).session(session);

          if (stock) {
            const dispatchedQty = item.dispatchedQuantity || 0;
            stock.quantity += dispatchedQty;
            stock.availableQuantity = stock.quantity - (stock.reservedQuantity || 0);
            await stock.save({ session });
          }
        }
      }

      transfer.status = 'cancelled';
      transfer.cancelledAt = new Date();
      transfer.cancelReason = reason;
      if (cancelledBy) {
        transfer.cancelledBy = cancelledBy;
      }
      await transfer.save({ session });

      await session.commitTransaction();
      return transfer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Update transfer items (only for pending transfers)
   */
  async updateItems(id: string, items: UpdateTransferItemsRequest['items']): Promise<ITransfer> {
    const transfer = await Transfer.findById(id);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'pending') {
      throw new Error('Can only update items for pending transfers');
    }

    // Validate all SKUs exist
    for (const item of items) {
      const sku = await SKU.findById(item.skuId);
      if (!sku) {
        throw new Error(`SKU not found: ${item.skuId}`);
      }
    }

    transfer.items = items.map((item) => ({
      skuId: new Types.ObjectId(item.skuId),
      sku: item.sku,
      requestedQuantity: item.requestedQuantity,
    })) as ITransferItem[];

    await transfer.save();
    return transfer;
  }

  /**
   * Get pending transfers for a store
   */
  async getPending(storeId: string): Promise<ITransfer[]> {
    return Transfer.find({
      $or: [{ fromStoreId: storeId }, { toStoreId: storeId }],
      status: { $in: ['pending', 'approved', 'dispatched'] },
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get all transfers with filters
   */
  async getTransfers(filters: {
    storeId?: string;
    status?: string;
    fromStoreId?: string;
    toStoreId?: string;
  }): Promise<ITransfer[]> {
    const query: any = {};

    if (filters.storeId) {
      query.$or = [
        { fromStoreId: filters.storeId },
        { toStoreId: filters.storeId },
      ];
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.fromStoreId) {
      query.fromStoreId = filters.fromStoreId;
    }

    if (filters.toStoreId) {
      query.toStoreId = filters.toStoreId;
    }

    return Transfer.find(query)
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get transfer by ID
   */
  async getById(id: string): Promise<ITransfer | null> {
    return Transfer.findById(id).lean();
  }

  /**
   * Get transfer by transfer number
   */
  async getByTransferNumber(transferNumber: string): Promise<ITransfer | null> {
    return Transfer.findOne({ transferNumber: transferNumber.toUpperCase() }).lean();
  }
}

export const transferService = new TransferService();
