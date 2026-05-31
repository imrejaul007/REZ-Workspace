export interface BusinessSignal {
    userId: string;
    businessType: 'owner' | 'employee' | 'partner';
    business: {
        name: string;
        category: string;
        size: 'micro' | 'small' | 'medium' | 'enterprise';
        revenue?: number;
    };
    action?: 'view' | 'signup' | 'upgrade' | 'transaction';
}
export declare function emitBusinessSignals(data: BusinessSignal): Promise<void>;
//# sourceMappingURL=merchant.d.ts.map