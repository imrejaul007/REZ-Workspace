export interface KarmaSignal {
    userId: string;
    action: 'donation' | 'volunteer' | 'sustainability' | 'community';
    impact: number;
    cause?: string;
}
export declare function emitKarmaSignals(data: KarmaSignal): Promise<void>;
//# sourceMappingURL=karma.d.ts.map