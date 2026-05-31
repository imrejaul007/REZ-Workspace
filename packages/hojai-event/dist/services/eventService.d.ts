export declare class EventBusService {
    private redis;
    private subscribers;
    constructor();
    publish(event: {
        type: string;
        userId?: string;
        tenantId?: string;
        data: Record<string, any>;
        timestamp?: string;
    }): Promise<{
        id: string;
    }>;
    subscribe(eventType: string, handler: (event: any) => void): Promise<void>;
    forwardToRez(event: any): Promise<void>;
    private notifySubscribers;
    getHistory(limit?: number): Promise<any[]>;
}
export declare const eventBusService: EventBusService;
//# sourceMappingURL=eventService.d.ts.map