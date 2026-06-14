/**
 * Customer Engagement domain router: loyalty, coins, offers, discounts, vouchers.
 */
import { Router } from 'express';
import offerRoutes from '../routes/offers';
import cashbackRoutes from '../routes/cashback';
import discountsRoutes from '../routes/discounts';
import discountRulesRoutes from '../routes/discountRules';
import giftCardsRoutes from '../routes/giftCards';
import storeVouchersRoutes from '../routes/storeVouchers';
import punchCardsRoutes from '../routes/punchCards';
import stampCardsRoutes from '../routes/stampCards';
import loyaltyTiersRoutes from '../routes/loyaltyTiers';
import coinsRoutes from '../routes/coins';
import upsellRulesRoutes from '../routes/upsellRules';
import notificationRoutes from '../routes/notifications';
import eventRoutes from '../routes/events';
import voucherRedemptionsRoutes from '../routes/voucherRedemptions';
import dealRedemptionsRoutes from '../routes/dealRedemptions';

const router = Router();

router.use('/offers', offerRoutes);
router.use('/cashback', cashbackRoutes);
router.use('/discounts', discountsRoutes);
router.use('/discount-rules', discountRulesRoutes);
router.use('/gift-cards', giftCardsRoutes);
router.use('/store-vouchers', storeVouchersRoutes);
router.use('/punch-cards', punchCardsRoutes);
router.use('/stamp-cards', stampCardsRoutes);
router.use('/loyalty-tiers', loyaltyTiersRoutes);
router.use('/coins', coinsRoutes);
router.use('/upsell-rules', upsellRulesRoutes);
router.use('/notifications', notificationRoutes);
router.use('/events', eventRoutes);
router.use('/voucher-redemptions', voucherRedemptionsRoutes);
router.use('/deal-redemptions', dealRedemptionsRoutes);

export default router;
