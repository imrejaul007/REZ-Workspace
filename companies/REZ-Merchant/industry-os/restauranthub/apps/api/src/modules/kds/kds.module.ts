import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KdsGateway } from './kds.gateway';
import { KitchenAIConnector } from './kitchen-ai.connector';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    AuthModule,
    forwardRef(() => OrdersModule),
  ],
  providers: [KdsGateway, KitchenAIConnector],
  exports: [KdsGateway, KitchenAIConnector],
})
export class KdsModule {}
