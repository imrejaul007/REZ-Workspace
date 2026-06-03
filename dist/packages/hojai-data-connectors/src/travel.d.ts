/**
 * Airzy → Hojai AI Travel Connector
 * Privacy Tier 2
 */
export declare function emitTravelSignals(data: {
    userId: string;
    trip: {
        destination: string;
        dates: {
            from: string;
            to: string;
        };
    };
    class: string;
    loyalty: number;
}): Promise<void>;
//# sourceMappingURL=travel.d.ts.map