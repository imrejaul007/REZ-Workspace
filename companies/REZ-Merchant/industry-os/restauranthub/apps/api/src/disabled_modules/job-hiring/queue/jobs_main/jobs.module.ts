import { Module, OnModuleInit } from '@nestjs/common';
import { JobQueueService } from './job-queue.service';
import { EmailJobProcessor } from './processors/email.processor';
import { AnalyticsJobProcessor } from './processors/analytics.processor';
import { RedisModule } from '../redis/redis.module';
import { EmailModule } from '../modules/email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    RedisModule,
    EmailModule,
    PrismaModule,
  ],
  providers: [
    JobQueueService,
    EmailJobProcessor,
    AnalyticsJobProcessor,
  ],
  exports: [JobQueueService],
})
export class JobQueueModule implements OnModuleInit {
  constructor(
    private readonly jobQueue: JobQueueService,
    private readonly emailProcessor: EmailJobProcessor,
    private readonly analyticsProcessor: AnalyticsJobProcessor,
  ) {}

  async onModuleInit() {
    // Register all job processors
    this.jobQueue.registerProcessor(this.emailProcessor);
    this.jobQueue.registerProcessor(this.analyticsProcessor);
  }
}