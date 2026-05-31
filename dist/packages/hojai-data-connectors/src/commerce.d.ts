export interface CommerceData {
    userId: string;
    event: 'view' | 'cart' | 'purchase' | 'return';
    product?: string;
    category?: string;
    value?: number;
}
export declare function emitCommerceSignals(data: CommerceData): Promise<void>;
//# sourceMappingURL=commerce.d.ts.map