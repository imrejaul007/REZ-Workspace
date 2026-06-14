import { Module } from '@nestjs/common';
import { RezHttpClient } from './rez-http.client';
import { RezMerchantClient } from './clients/merchant.client';
import { RezAnalyticsClient } from './clients/analytics.client';
import { RezCatalogClient } from './clients/catalog.client';
import { RezWalletClient } from './clients/wallet.client';

/**
 * RezClientModule
 *
 * Import this module in unknown NestJS feature module that needs to call REZ
 * microservices. ConfigModule must be globally available (forRoot with
 * isGlobal: true) or imported alongside this module.
 *
 * Required env vars — see rez-http.client.ts for full list.
 *
 * @example
 * // In your feature module:
 * @Module({ imports: [RezClientModule], ... })
 * export class DashboardModule {}
 */
@Module({
  providers: [
    RezHttpClient,
    RezMerchantClient,
    RezAnalyticsClient,
    RezCatalogClient,
    RezWalletClient,
  ],
  exports: [
    RezMerchantClient,
    RezAnalyticsClient,
    RezCatalogClient,
    RezWalletClient,
  ],
})
export class RezClientModule {}
