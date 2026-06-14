import {
    LedgerEntry,
    LedgerAccountType,
    LedgerDirection,
    LedgerOperationType,
    LedgerCoinType,
} from '../models/LedgerEntry';
import { createServiceLogger } from '../config/logger';
import crypto from 'crypto';
import mongoose, { ClientSession, Types } from 'mongoose';

const logger = createServiceLogger('ledger');

// Well-known platform account IDs (deterministic ObjectIds from fixed strings)
const PLATFORM_ACCOUNT_IDS = {
    platform_fees: new Types.ObjectId('000000000000000000000001'),
    platform_float: new Types.ObjectId('000000000000000000000002'),
    expired_pool: new Types.ObjectId('000000000000000000000003'),
};

export interface RecordEntryParams {
    debitAccount: { type: LedgerAccountType; id: Types.ObjectId };
    creditAccount: { type: LedgerAccountType; id: Types.ObjectId };
    amount: number;
    coinType?: LedgerCoinType;
    operationType: LedgerOperationType;
    referenceId: string;
    referenceModel: string;
    reversalReferenceId?: string;
    metadata?: {
        requestId?: string;
        idempotencyKey?: string;
        adminUserId?: string;
        description?: string;
        [key: string];
    };
}

function assertLedgerParams(params: RecordEntryParams): void {
    const requiredFields: (keyof RecordEntryParams)[] = [
        'debitAccount', 'creditAccount', 'amount', 'operationType', 'referenceId', 'referenceModel',
    ];
    for (const field of requiredFields) {
        if (params[field] === undefined || params[field] === null) {
            throw new Error(`[Ledger] Missing required field: ${field}.`);
        }
    }
    if (typeof params.amount !== 'number' || !Number.isFinite(params.amount)) {
        throw new Error(`[Ledger] Invalid amount: ${params.amount}.`);
    }
    if (!params.referenceId.trim()) throw new Error(`[Ledger] referenceId must be a non-empty string.`);
    if (!params.referenceModel.trim()) throw new Error(`[Ledger] referenceModel must be a non-empty string.`);
}

class LedgerService {
    async recordEntry(params: RecordEntryParams, session?: ClientSession): Promise<string> {
        const {
            debitAccount, creditAccount, amount,
            coinType = 'rez', operationType, referenceId, referenceModel,
            reversalReferenceId, metadata,
        } = params;

        assertLedgerParams(params);
        if (amount <= 0) throw new Error('Ledger entry amount must be positive');

        const pairId = crypto.randomUUID();
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const entries = [
            {
                pairId, accountType: debitAccount.type, accountId: debitAccount.id,
                direction: 'debit' as LedgerDirection, amount, coinType,
                operationType, referenceId, referenceModel,
                ...(reversalReferenceId && { reversalReferenceId }),
                metadata: metadata || {}, yearMonth, createdAt: now,
            },
            {
                pairId, accountType: creditAccount.type, accountId: creditAccount.id,
                direction: 'credit' as LedgerDirection, amount, coinType,
                operationType, referenceId, referenceModel,
                ...(reversalReferenceId && { reversalReferenceId }),
                metadata: metadata || {}, yearMonth, createdAt: now,
            },
        ];

        const insertOptions = session ? { session } : {};

        try {
            await LedgerEntry.insertMany(entries, insertOptions);
        } catch (err: unknown) {
            const mongoErr = err as { code?: number; writeErrors?: Array<{ code: number }> };
            const isDuplicate =
                mongoErr.code === 11000 ||
                (Array.isArray(mongoErr.writeErrors) && mongoErr.writeErrors.some((e) => e.code === 11000));

            if (isDuplicate) {
                const existingQuery = LedgerEntry.findOne(
                    { referenceId, referenceModel, operationType, direction: 'debit' },
                    { pairId: 1 },
                ).lean();
                if (session) existingQuery.session(session);
                const existing = await existingQuery;

                if (existing?.pairId) {
                    logger.warn('[Ledger] Duplicate entry detected — returning existing pairId', {
                        pairId: existing.pairId, operationType, referenceId,
                    });
                    return existing.pairId;
                }
                throw new Error(`[Ledger] Duplicate ledger entry for referenceId=${referenceId}`);
            }
            throw err;
        }

        logger.info('Ledger entry recorded', {
            pairId, operationType, amount, coinType,
            debitAccount: `${debitAccount.type}:${debitAccount.id}`,
            creditAccount: `${creditAccount.type}:${creditAccount.id}`,
            referenceId,
        });

        return pairId;
    }

    async getAccountBalance(
        accountId: Types.ObjectId,
        coinType?: LedgerCoinType,
        options?: { yearMonth?: string },
    ): Promise<number> {
        const matchStage: unknown = { accountId };
        if (coinType) matchStage.coinType = coinType;
        if (options?.yearMonth) matchStage.yearMonth = options.yearMonth;

        const result = await LedgerEntry.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalCredits: { $sum: { $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0] } },
                    totalDebits: { $sum: { $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0] } },
                },
            },
        ]);

        if (result.length === 0) return 0;
        return result[0].totalCredits - result[0].totalDebits;
    }

    async getCurrentMonthBalance(accountId: Types.ObjectId, coinType?: LedgerCoinType): Promise<number> {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return this.getAccountBalance(accountId, coinType, { yearMonth });
    }

    async getAccountHistory(
        accountId: Types.ObjectId,
        filters?: { coinType?: LedgerCoinType; operationType?: LedgerOperationType; direction?: LedgerDirection },
        pagination?: { page?: number; limit?: number },
    ) {
        const query: unknown = { accountId };
        if (filters?.coinType) query.coinType = filters.coinType;
        if (filters?.operationType) query.operationType = filters.operationType;
        if (filters?.direction) query.direction = filters.direction;

        const page = pagination?.page || 1;
        const limit = Math.min(pagination?.limit || 20, 50);
        const skip = (page - 1) * limit;

        const [entries, total] = await Promise.all([
            LedgerEntry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            LedgerEntry.countDocuments(query),
        ]);

        return { entries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async getEntryPair(pairId: string) {
        return LedgerEntry.find({ pairId }).lean();
    }

    getPlatformAccountId(type: 'platform_fees' | 'platform_float' | 'expired_pool'): Types.ObjectId {
        return PLATFORM_ACCOUNT_IDS[type];
    }
}

export const ledgerService = new LedgerService();
