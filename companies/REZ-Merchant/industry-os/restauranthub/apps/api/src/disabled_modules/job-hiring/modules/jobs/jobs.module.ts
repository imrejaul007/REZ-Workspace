import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [PrismaModule, VerificationModule],
  providers: [JobsService],
  controllers: [JobsController],
  exports: [JobsService],
})
export class JobsModule {}