import { ConfigService } from '@nestjs/config';
import { RezHttpClient } from '../rez-http.client';
import type { RezProduct, RezCategory, RezSupplier } from '../types/rez.types';
export declare class RezCatalogClient {
    private readonly client;
    private readonly config;
    private readonly logger;
    private readonly http;
    constructor(client: RezHttpClient, config: ConfigService);
    getProducts(storeId: string): Promise<RezProduct[]>;
    getCategories(merchantId: string): Promise<RezCategory[]>;
    getSuppliers(merchantId: string): Promise<RezSupplier[]>;
}
