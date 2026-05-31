export interface EventSignal {
    userId: string;
    action: 'view' | 'rsvp' | 'attend' | 'share';
    event: {
        id: string;
        name: string;
        category: string;
        location: string;
    };
}
export declare function emitEventSignals(data: EventSignal): Promise<void>;
//# sourceMappingURL=events.d.ts.map