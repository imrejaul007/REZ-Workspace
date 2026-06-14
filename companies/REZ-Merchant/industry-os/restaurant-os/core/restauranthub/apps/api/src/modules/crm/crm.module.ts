import { Module } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * CRM Module
 *
 * Handles customer relationship management:
 * - Customer profile management
 * - Segmentation based on behavior
 * - Campaign targeting
 * - Engagement tracking
 */
@Module({
  imports: [PrismaModule],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
