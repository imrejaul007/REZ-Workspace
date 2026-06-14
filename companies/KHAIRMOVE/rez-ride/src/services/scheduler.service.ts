import { Injectable, Logger } from '@nestjs/common';

/**
 * Scheduler Service - Cron jobs
 */
@Injectable()
export class SchedulerService {
  private logger = new Logger('SchedulerService');
  private jobs = new Map();

  schedule(cron: string, fn: Function): void {
    this.logger.log(`Scheduled: ${cron}`);
  }

  every(seconds: number, fn: Function): void {
    setInterval(() => fn(), seconds * 1000);
  }

  daily(hour: number, fn: Function): void {
    this.logger.log(`Daily job at ${hour}:00`);
  }
}
