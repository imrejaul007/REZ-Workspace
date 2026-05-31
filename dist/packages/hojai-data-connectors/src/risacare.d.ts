export interface HealthData {
    userId: string;
    healthScore: number;
    metrics: {
        steps: number;
        sleep: number;
        heartRate: number;
        stress: number;
    };
    consent: boolean;
}
export declare function emitHealthSignals(data: HealthData): Promise<void>;
//# sourceMappingURL=risacare.d.ts.map