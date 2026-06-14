import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { KdsModule } from '../kds/kds.module';
import { InventoryModule } from '../inventory/inventory.module';
import { QueueModule } from '../queue/queue.module';
import { RetryQueueModule } from '../retry-queue/retry-queue.module';
import { ProcurementModule } from '../procurement/procurement.module';

/**
 * Orders Module
 *
 * Provides order management functionality:
 * - Order creation with validation
 * - Order status tracking with state machine
 * - Integration with REZ Backend for attribution and coin awards
 * - REZ Backend webhook notifications for order events
 * - KDS (Kitchen Display System) real-time broadcast on order creation
 * - Inventory deduction on order creation
 * - Loyalty cashback credit on order completion
 * - Offline queue support for POS orders
 * - Database-backed retry queue for reliability
 * - Automatic procurement via NexaBizz
 */
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => KdsModule),
    InventoryModule,
    forwardRef(() => QueueModule),
    RetryQueueModule,
    ProcurementModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
