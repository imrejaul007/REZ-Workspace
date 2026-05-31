/**
 * StayOwn → Hojai AI Hospitality Connector
 */
export declare function emitHospitalitySignals(data: {
    userId: string;
    stay: {
        hotel: string;
        dates: {
            checkin: string;
            checkout: string;
        };
        spend: number;
    };
}): Promise<void>;
//# sourceMappingURL=hospitality.d.ts.map