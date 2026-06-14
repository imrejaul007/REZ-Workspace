import { ConfigService } from '@nestjs/config';
import { RezHttpClient } from '../rez-http.client';
import type { RezMerchant, RezMerchantStats, RezStore, RezPurchaseOrder, RezPurchaseOrderSummary, RezStaffShift, RezShiftGap } from '../types/rez.types';
export declare class RezMerchantClient {
    private readonly client;
    private readonly config;
    private readonly logger;
    private readonly http;
    constructor(client: RezHttpClient, config: ConfigService);
    getMerchant(merchantId: string): Promise<RezMerchant | null>;
    getMerchantStats(merchantId: string): Promise<RezMerchantStats | null>;
    getMerchantStores(merchantId: string): Promise<RezStore[]>;
    getPurchaseOrders(merchantId: string, days?: number): Promise<RezPurchaseOrder[]>;
    getPurchaseOrderSummary(merchantId: string): Promise<RezPurchaseOrderSummary | null>;
    getStaffShifts(merchantId: string): Promise<RezStaffShift[]>;
    getShiftGaps(merchantId: string): Promise<RezShiftGap[]>;
}
