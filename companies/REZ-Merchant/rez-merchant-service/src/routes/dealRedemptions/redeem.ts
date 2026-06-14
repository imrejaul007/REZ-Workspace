
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { DealRedemption } from '../../models/DealRedemption';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

type UseCodePayload = {
  storeId: string;
  benefitApplied?: number;
  orderAmount?: number;
  notes?: string;
};

function parseNonNegativeNumber(value: unknown, fieldName: string): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }

  return parsed;
}

function merchantOwnsStoreFilter(merchantId: string) {
  return { $or: [{ merchant: merchantId }, { merchantId: merchantId }] };
}

function validateUseCodePayload(body): UseCodePayload {
  const storeId = typeof body?.storeId === 'string' ? body.storeId.trim() : '';
  if (!storeId) {
    throw new Error('storeId is required');
  }

  const notes = typeof body?.notes === 'string' ? body.notes.trim() : undefined;
  if (notes && notes.length > 500) {
    throw new Error('notes must be at most 500 characters');
  }

  return {
    storeId,
    benefitApplied: parseNonNegativeNumber(body?.benefitApplied, 'benefitApplied'),
    orderAmount: parseNonNegativeNumber(body?.orderAmount, 'orderAmount'),
    notes,
  };
}

router.post('/:code/use', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'MerchantId missing' });
    }

    const code = req.params.code?.toUpperCase().trim();
    const codeRegex = /^RZ-[A-Z2-9]{8}$/;

    if (!code || !codeRegex.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code format. Expected format: RZ-XXXXXXXX',
      });
    }

    const { storeId, benefitApplied, orderAmount, notes } = validateUseCodePayload(req.body);

    const store = await Store.findOne({
      _id: storeId,
      ...merchantOwnsStoreFilter(merchantId),
    });

    if (!store) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission for this store',
      });
    }

    const redemption = await DealRedemption.findOneAndUpdate(
      {
        redemptionCode: code,
        status: 'active',
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          status: 'used',
          usedAt: new Date(),
          usedByMerchantId: new mongoose.Types.ObjectId(merchantId),
          usedAtStoreId: new mongoose.Types.ObjectId(storeId),
          benefitApplied,
          orderAmount,
          merchantNotes: notes,
        },
      },
      { new: true },
    );

    if (!redemption) {
      const existingRedemption = await (DealRedemption.findOne({ redemptionCode: code })
        .select('status usedAt expiresAt dealSnapshot.storeId')
        .lean()
        .exec() as unknown) as { status: string; usedAt?: Date; expiresAt?: Date; dealSnapshot?: { storeId?: mongoose.Types.ObjectId } } | null;

      if (!existingRedemption) {
        return res.status(404).json({ success: false, message: 'Code not found' });
      }

      if (existingRedemption.status === 'used') {
        return res.status(400).json({
          success: false,
          message: 'This code has already been used',
          usedAt: existingRedemption.usedAt,
        });
      }

      if (existingRedemption.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'This code is pending payment confirmation',
        });
      }

      if (existingRedemption.status === 'expired' || (existingRedemption.expiresAt && new Date() > existingRedemption.expiresAt)) {
        return res.status(400).json({ success: false, message: 'This code has expired' });
      }

      if (existingRedemption.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'This code was cancelled' });
      }

      const dealStoreId = existingRedemption.dealSnapshot?.storeId?.toString?.();
      if (dealStoreId && dealStoreId !== storeId) {
        return res.status(400).json({
          success: false,
          message: 'This code is not valid at your store',
        });
      }

      return res.status(400).json({ success: false, message: 'Unable to redeem this code' });
    }

    return res.json({
      success: true,
      message: 'Deal redeemed successfully',
      data: {
        code: redemption.redemptionCode,
        status: redemption.status,
        usedAt: redemption.usedAt,
        benefitApplied: redemption.benefitApplied,
        orderAmount: redemption.orderAmount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to redeem code',
      error: error.message,
    });
  }
});

export default router;
