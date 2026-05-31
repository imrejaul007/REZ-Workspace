/**
 * RidZa Finance → Hojai AI Finance Connector
 * Privacy Tier 3
 */
export declare function emitFinanceSignals(data: {
    userId: string;
    transaction: {
        amount: number;
        type: 'income' | 'expense' | 'investment';
    };
}): Promise<void>;
//# sourceMappingURL=finance.d.ts.map