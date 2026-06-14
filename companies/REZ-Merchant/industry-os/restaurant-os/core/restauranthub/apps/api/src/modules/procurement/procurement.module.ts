import { Module } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Procurement Module
 *
 * Handles automatic procurement via NexaBizz:
 * - Creates RFQ when inventory is low
 * - Manages purchase orders
 * - Provides reorder recommendations
 */
@Module({
  imports: [PrismaModule],
  controllers: [ProcurementController],
  providers: [ProcurementService],
  exports: [ProcurementService],
})
export class ProcurementModule {}
