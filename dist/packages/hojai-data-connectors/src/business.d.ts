/**
 * BuzzLocal → Hojai AI Local Intelligence Connector
 */
export declare function emitLocalSignals(data: {
    userId: string;
    action: 'visit' | 'checkin' | 'review';
    venue: {
        name: string;
        category: string;
        location: any;
    };
}): Promise<void>;
//# sourceMappingURL=business.d.ts.map