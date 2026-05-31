export interface RealEstateSignal {
    userId: string;
    action: 'view' | 'inquiry' | 'visit' | 'purchase';
    property: {
        type: 'apartment' | 'house' | 'plot' | 'commercial';
        budget: number;
        location: string;
    };
}
export declare function emitRealEstateSignals(data: RealEstateSignal): Promise<void>;
//# sourceMappingURL=realestate.d.ts.map