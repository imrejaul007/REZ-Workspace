/**
 * ReZ Ride → Hojai AI Mobility Connector
 */
export declare function emitMobilitySignals(data: {
    userId: string;
    rideType: 'pickup' | 'drop' | 'schedule';
    pickup: {
        lat: number;
        lng: number;
        address: string;
    };
    dropoff: {
        lat: number;
        lng: number;
        address: string;
    };
}): Promise<void>;
//# sourceMappingURL=mobility.d.ts.map