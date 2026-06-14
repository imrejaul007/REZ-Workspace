import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersService } from './users.service';
import { RezWebhookController } from './rez-webhook.controller';
import { ConsentController } from './consent.controller';
import { SupportController } from './support.controller';
import { ProfileController } from './profile.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RezWebhookController, ConsentController, SupportController, ProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}