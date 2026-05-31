export interface RelationshipSignal {
    userId: string;
    connectionType: 'friend' | 'match' | 'blocked';
    sharedInterests?: string[];
    engagement?: number;
}
export declare function emitRelationshipSignals(data: RelationshipSignal): Promise<void>;
//# sourceMappingURL=rendez.d.ts.map