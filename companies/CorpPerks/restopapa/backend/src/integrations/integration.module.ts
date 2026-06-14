import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { NextaBizzWebhookService } from './nextabizz-webhook.service';

@Module({
  imports: [ConfigModule],
  controllers: [IntegrationController],
  providers: [IntegrationService, NextaBizzWebhookService],
  exports: [IntegrationService, NextaBizzWebhookService],
})
export class IntegrationModule {}
