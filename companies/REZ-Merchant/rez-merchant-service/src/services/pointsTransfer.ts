import mongoose, { Schema, model, Types } from 'mongoose';

export interface IPointsTransfer extends Document {
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  grossPoints: number;
  feeAmount: number;
  netPoints: number;
  reason?: string;
  createdAt: Date;
}

const PointsTransferSchema = new Schema<IPointsTransfer>({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  grossPoints: { type: Number, required: true },
  feeAmount: { type: Number, default: 0 },
  netPoints: { type: Number, required: true },
  reason: String,
  createdAt: { type: Date, default: Date.now }
});

PointsTransferSchema.index({ fromUserId: 1 });
PointsTransferSchema.index({ toUserId: 1 });

export const PointsTransfer = mongoose.models.PointsTransfer || model<IPointsTransfer>('PointsTransfer', PointsTransferSchema, 'points_transfers');

const TRANSFER_FEE_PERCENTAGE = 5;
const MIN_TRANSFER_POINTS = 10;

export class PointsTransferService {
  async transfer(
    fromUserId: string,
    toUserId: string,
    points: number,
    reason?: string
  ): Promise<IPointsTransfer> {
    // Validate
    if (fromUserId === toUserId) {
      throw new Error('Cannot transfer to yourself');
    }

    if (points < MIN_TRANSFER_POINTS) {
      throw new Error(`Minimum transfer is ${MIN_TRANSFER_POINTS} points`);
    }

    // Calculate fee
    const feeAmount = Math.floor(points * TRANSFER_FEE_PERCENTAGE / 100);
    const netPoints = points - feeAmount;

    // Check sender balance
    const sender = await mongoose.model('LoyaltyAccount').findOne({ userId: fromUserId });
    if (!sender || sender.points < points) {
      throw new Error('Insufficient points');
    }

    // Execute transfer in transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct from sender
      await mongoose.model('LoyaltyAccount').updateOne(
        { userId: fromUserId },
        { $inc: { points: -points } },
        { session }
      );

      // Add to recipient
      await mongoose.model('LoyaltyAccount').updateOne(
        { userId: toUserId },
        { $inc: { points: netPoints } },
        { session }
      );

      // Record transaction
      const transfer = await PointsTransfer.create([{
        fromUserId,
        toUserId,
        grossPoints: points,
        feeAmount,
        netPoints,
        reason
      }], { session });

      await session.commitTransaction();
      return transfer[0];

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getTransferHistory(
    userId: string,
    type: 'sent' | 'received'
  ) {
    const query = type === 'sent'
      ? { fromUserId: userId }
      : { toUserId: userId };

    return PointsTransfer.find(query)
      .populate(type === 'sent' ? 'toUserId' : 'fromUserId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async getTransferStats(userId: string) {
    const [sent, received] = await Promise.all([
      PointsTransfer.aggregate([
        { $match: { fromUserId: new mongoose.Types.ObjectId(userId) } },
        { $group: {
          _id: null,
          totalSent: { $sum: '$grossPoints' },
          totalFees: { $sum: '$feeAmount' }
        }}
      ]),
      PointsTransfer.aggregate([
        { $match: { toUserId: new mongoose.Types.ObjectId(userId) } },
        { $group: {
          _id: null,
          totalReceived: { $sum: '$netPoints' }
        }}
      ])
    ]);

    return {
      sent: sent[0] || { totalSent: 0, totalFees: 0 },
      received: received[0] || { totalReceived: 0 }
    };
  }
}

export const pointsTransferService = new PointsTransferService();
