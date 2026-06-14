import mongoose, { Schema, Document, Types } from 'mongoose';

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { LedgerAccountType, LedgerDirection, LedgerOperationType, LedgerCoinType, ILedgerEntry } from '@rez/shared-types/entities/wallet';

export type LedgerAccountType = 'user_wallet' | 'platform_fees' | 'platform_float' | 'merchant_wallet' | 'expired_pool';
export type LedgerDirection = 'debit' | 'credit';
export type LedgerOperationType =
    | 'transfer'
    | 'gift'
    | 'topup'
    | 'withdrawal'
    | 'payment'
    | 'refund'
    | 'cashback'
    | 'loyalty_credit'
    | 'admin_adjustment'
    | 'expiry'
    | 'gift_card_purchase'
    | 'scratch_card_prize'
    | 'correction'
    | 'order_payment'
    | 'order_coin_deduction'
    | 'merchant_payout'
    | 'order_refund'
    | 'subscription_payment'
    | 'subscription_refund'
    | 'game_prize'
    | 'achievement_reward'
    | 'referral_bonus'
    | 'bonus_campaign'
    | 'daily_login'
    | 'review_reward'
    | 'tournament_prize'
    | 'learning_reward'
    | 'lock_fee'
    | 'lock_fee_refund'
    | 'social_impact'
    | 'creator_reward'
    | 'coin_expiry'
    | 'store_payment_reward'
    | 'travel_cashback'
    | 'mall_affiliate'
    | 'voucher_cashback'
    | 'offer_cashback'
    | 'cashback_reversal'
    | 'gift_refund'
    | 'merchant_liability_issuance'
    | 'merchant_liability_settlement'
    | 'purchase'
    | 'purchase_cashback';
// ENUM-01 FIX: Added 'cashback' and 'referral' to match the canonical CoinType enum
// in rezbackend and rez-shared. Without these, cashback/referral coin ledger entries
// fail Mongoose validation.
export type LedgerCoinType = 'rez' | 'promo' | 'branded' | 'prive' | 'cashback' | 'referral';

export interface ILedgerEntry extends Document {
    pairId: string;
    accountType: LedgerAccountType;
    accountId: Types.ObjectId;
    direction: LedgerDirection;
    amount: number;
    coinType: LedgerCoinType;
    runningBalance?: number;
    operationType: LedgerOperationType;
    referenceId: string;
    referenceModel: string;
    reversalReferenceId?: string;
    metadata: {
        requestId?: string;
        idempotencyKey?: string;
        adminUserId?: string;
        description?: string;
    };
    yearMonth: string;
    createdAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
    {
        pairId: { type: String, required: true, index: true },
        accountType: {
            type: String,
            required: true,
            enum: ['user_wallet', 'platform_fees', 'platform_float', 'merchant_wallet', 'expired_pool'],
        },
        accountId: { type: Schema.Types.ObjectId, required: true, index: true },
        direction: { type: String, required: true, enum: ['debit', 'credit'] },
        amount: { type: Number, required: true, min: 0 },
        // ENUM-01 FIX: schema enum now matches LedgerCoinType (includes cashback + referral)
        coinType: { type: String, required: true, enum: ['rez', 'promo', 'branded', 'prive', 'cashback', 'referral'], default: 'rez' },
        runningBalance: { type: Number, required: false },
        operationType: {
            type: String,
            required: true,
            enum: [
                'transfer', 'gift', 'topup', 'withdrawal', 'payment', 'refund',
                'cashback', 'loyalty_credit', 'admin_adjustment', 'expiry',
                'gift_card_purchase', 'scratch_card_prize', 'correction',
                'order_payment', 'order_coin_deduction', 'merchant_payout',
                'order_refund', 'subscription_payment', 'subscription_refund',
                'game_prize', 'achievement_reward', 'referral_bonus', 'bonus_campaign',
                'daily_login', 'review_reward', 'tournament_prize', 'learning_reward',
                'lock_fee', 'lock_fee_refund', 'social_impact', 'creator_reward',
                'coin_expiry', 'store_payment_reward', 'travel_cashback',
                'mall_affiliate', 'voucher_cashback', 'offer_cashback',
                'cashback_reversal', 'gift_refund',
                'merchant_liability_issuance', 'merchant_liability_settlement',
                'purchase', 'purchase_cashback',
            ],
        },
        referenceId: { type: String, required: true },
        referenceModel: { type: String, required: true },
        reversalReferenceId: { type: String, default: null },
        metadata: {
            requestId: String,
            idempotencyKey: String,
            adminUserId: String,
            description: String,
        },
        yearMonth: { type: String, index: true },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

LedgerEntrySchema.pre('save', function (next) {
    if (this.isNew && !this.yearMonth) {
        const d = this.createdAt || new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        this.yearMonth = `${y}-${m}`;
    }
    next();
});

LedgerEntrySchema.index({ accountId: 1, createdAt: -1 });
LedgerEntrySchema.index({ accountType: 1, operationType: 1 });
LedgerEntrySchema.index({ accountId: 1, coinType: 1, createdAt: -1 });
LedgerEntrySchema.index({ pairId: 1, direction: 1 }, { unique: true });
LedgerEntrySchema.index({ reversalReferenceId: 1 }, { sparse: true });
LedgerEntrySchema.index({ yearMonth: 1, accountType: 1 });
LedgerEntrySchema.index(
    { referenceId: 1, referenceModel: 1, operationType: 1, direction: 1 },
    { unique: true, name: 'ledger_idempotency_idx' },
);
LedgerEntrySchema.index({ operationType: 1 });
LedgerEntrySchema.index({ accountType: 1, accountId: 1, createdAt: -1 });

export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
