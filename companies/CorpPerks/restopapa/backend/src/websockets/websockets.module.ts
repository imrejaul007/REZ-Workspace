import { Module } from '@nestjs/common';
import { MessagingGateway } from './messaging.gateway';
import { NotificationGateway } from './notification.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MessagingGateway, NotificationGateway],
  exports: [MessagingGateway, NotificationGateway],
})
export class WebSocketsModule {}