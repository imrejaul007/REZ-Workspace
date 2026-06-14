import { ConfigService } from '@nestjs/config';
import { RezHttpClient } from '../rez-http.client';
import type { RezWalletBalance, RezTransaction, RezCreditScore } from '../types/rez.types';
export declare class RezWalletClient {
    private readonly client;
    private readonly config;
    private readonly logger;
    private readonly http;
    constructor(client: RezHttpClient, config: ConfigService);
    getWalletBalance(merchantId: string): Promise<RezWalletBalance | null>;
    getTransactions(merchantId: string, limit?: number): Promise<RezTransaction[]>;
    getMerchantCreditScore(merchantId: string): Promise<RezCreditScore | null>;
}
