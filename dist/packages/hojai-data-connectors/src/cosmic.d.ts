export interface CosmicSignal {
    userId: string;
    chart: {
        sunSign: string;
        moonSign: string;
        ascendant: string;
    };
    predictions?: {
        love: number;
        career: number;
        health: number;
        finance: number;
    };
}
export declare function emitCosmicSignals(data: CosmicSignal): Promise<void>;
//# sourceMappingURL=cosmic.d.ts.map