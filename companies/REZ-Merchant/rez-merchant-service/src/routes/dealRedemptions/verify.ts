
import { Router, Request, Response } from 'express';
import { DealRedemption } from '../../models/DealRedemption';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

async function getMerchantStores(merchantId: string) {
  return Store.find({
    $or: [{ merchant: merchantId }, { merchantId: merchantId }],
  })
    .select('_id name')
    .lean();
}

function buildCustomerName(user): string {
  const first = user?.profile?.firstName || user?.firstName || '';
  const last = user?.profile?.lastName || user?.lastName || '';
  const combined = `${first} ${last}`.trim();
  return combined || user?.name || 'Customer';
}

router.get('/verify/:code', async (req: Request, res: Response) => {
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
        valid: false,
        reason: 'Invalid code format. Expected format: RZ-XXXXXXXX',
      });
    }

    const redemption = await DealRedemption.findOne({
      redemptionCode: code,
    }).populate('user', 'profile.firstName profile.lastName firstName lastName name phoneNumber');

    if (!redemption) {
      return res.json({ success: true, valid: false, reason: 'Code not found' });
    }

    const merchantStores = await getMerchantStores(merchantId);
    const merchantStoreIds = merchantStores.map((store) => store._id.toString());
    const dealStoreId = redemption.dealSnapshot?.storeId?.toString?.();

    if (dealStoreId && !merchantStoreIds.includes(dealStoreId)) {
      return res.json({
        success: true,
        valid: false,
        reason: 'This code is not valid at your store',
      });
    }

    if (redemption.status === 'pending') {
      return res.json({ success: true, valid: false, reason: 'This code is pending payment confirmation' });
    }

    if (redemption.status === 'used') {
      return res.json({
        success: true,
        valid: false,
        reason: 'This code has already been used',
        usedAt: redemption.usedAt,
      });
    }

    if (redemption.status === 'expired' || new Date() > new Date(redemption.expiresAt)) {
      await DealRedemption.updateOne({ _id: redemption._id }, { $set: { status: 'expired' } });
      return res.json({
        success: true,
        valid: false,
        reason: 'This code has expired',
        expiredAt: redemption.expiresAt,
      });
    }

    if (redemption.status === 'cancelled') {
      return res.json({ success: true, valid: false, reason: 'This code was cancelled' });
    }

    return res.json({
      success: true,
      valid: true,
      redemption: {
        id: redemption._id,
        code: redemption.redemptionCode,
        status: redemption.status,
        expiresAt: redemption.expiresAt,
        dealSnapshot: {
          store: redemption.dealSnapshot?.store,
          storeId: redemption.dealSnapshot?.storeId,
          cashback: redemption.dealSnapshot?.cashback,
          discount: redemption.dealSnapshot?.discount,
          coins: redemption.dealSnapshot?.coins,
          bonus: redemption.dealSnapshot?.bonus,
          image: redemption.dealSnapshot?.image,
        },
        campaignSnapshot: {
          title: redemption.campaignSnapshot?.title,
          subtitle: redemption.campaignSnapshot?.subtitle,
          type: redemption.campaignSnapshot?.type,
          terms: redemption.campaignSnapshot?.terms,
          minOrderValue: redemption.campaignSnapshot?.minOrderValue,
          maxBenefit: redemption.campaignSnapshot?.maxBenefit,
        },
        isPaid: redemption.isPaid,
        user: {
          name: buildCustomerName(redemption.user),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code',
      error: error.message,
    });
  }
});

export default router;
