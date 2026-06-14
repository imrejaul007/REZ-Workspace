import { Module } from '@nestjs/common';
import { RestaurantWhatsAppService } from './restaurant-whatsapp.service';
import { RestaurantWhatsAppController } from './restaurant-whatsapp.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Restaurant WhatsApp Module
 *
 * Handles all WhatsApp communications for restaurant use cases:
 * - Order confirmations and status updates
 * - Table reservation notifications
 * - Wait time alerts
 * - Review requests
 * - Marketing campaigns
 *
 * Integrates with HOJAI Unified Platform (WhatsApp)
 */
@Module({
  imports: [PrismaModule],
  controllers: [RestaurantWhatsAppController],
  providers: [RestaurantWhatsAppService],
  exports: [RestaurantWhatsAppService],
})
export class RestaurantWhatsAppModule {}
