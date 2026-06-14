import logger from './utils/logger';

import cron from 'node-cron';
import { aggregationService } from '../services/aggregationService';
import { dashboardModel } from '../models/Dashboard';

interface WorkerConfig {
  enableHourlyAggregation: boolean;
  enableDailyAggregation: boolean;
  enableWeeklyAggregation: boolean;
  enableCleanup: boolean;
}

interface WorkerStats {
  lastRun: Date | null;
  lastSuccess: Date | null;
  lastError: Date | null;
  errorCount: number;
  runCount: number;
  tasks: {
    hourly: { lastRun: Date | null; status: 'idle' | 'running' | 'completed' | 'error' };
    daily: { lastRun: Date | null; status: 'idle' | 'running' | 'completed' | 'error' };
    weekly: { lastRun: Date | null; status: 'idle' | 'running' | 'completed' | 'error' };
    cleanup: { lastRun: Date | null; status: 'idle' | 'running' | 'completed' | 'error' };
  };
}

class AggregationWorker {
  private config: WorkerConfig;
  private stats: WorkerStats;
  private isRunning: boolean = false;
  private scheduledTasks: cron.ScheduledTask[] = [];

  constructor() {
    this.config = {
      enableHourlyAggregation: true,
      enableDailyAggregation: true,
      enableWeeklyAggregation: true,
      enableCleanup: true,
    };

    this.stats = {
      lastRun: null,
      lastSuccess: null,
      lastError: null,
      errorCount: 0,
      runCount: 0,
      tasks: {
        hourly: { lastRun: null, status: 'idle' },
        daily: { lastRun: null, status: 'idle' },
        weekly: { lastRun: null, status: 'idle' },
        cleanup: { lastRun: null, status: 'idle' },
      },
    };
  }

  /**
   * Initialize and start the worker
   */
  start(): void {
    if (this.isRunning) {
      logger.info('[AggregationWorker] Already running');
      return;
    }

    logger.info('[AggregationWorker] Starting aggregation worker...');
    this.isRunning = true;

    // Schedule hourly aggregation (every hour at minute 5)
    if (this.config.enableHourlyAggregation) {
      const hourlyTask = cron.schedule('5 * * * *', async () => {
        await this.runHourlyAggregation();
      });
      this.scheduledTasks.push(hourlyTask);
      logger.info('[AggregationWorker] Hourly aggregation scheduled (at minute 5 of every hour)');
    }

    // Schedule daily aggregation (every day at midnight)
    if (this.config.enableDailyAggregation) {
      const dailyTask = cron.schedule('0 0 * * *', async () => {
        await this.runDailyAggregation();
      });
      this.scheduledTasks.push(dailyTask);
      logger.info('[AggregationWorker] Daily aggregation scheduled (midnight)');
    }

    // Schedule weekly aggregation (every Monday at 1 AM)
    if (this.config.enableWeeklyAggregation) {
      const weeklyTask = cron.schedule('0 1 * * 1', async () => {
        await this.runWeeklyAggregation();
      });
      this.scheduledTasks.push(weeklyTask);
      logger.info('[AggregationWorker] Weekly aggregation scheduled (Monday 1 AM)');
    }

    // Schedule cleanup (every day at 3 AM)
    if (this.config.enableCleanup) {
      const cleanupTask = cron.schedule('0 3 * * *', async () => {
        await this.runCleanup();
      });
      this.scheduledTasks.push(cleanupTask);
      logger.info('[AggregationWorker] Cleanup scheduled (3 AM daily)');
    }

    // Run initial aggregation on startup
    this.runInitialAggregation();

    logger.info('[AggregationWorker] Worker started successfully');
  }

  /**
   * Stop the worker gracefully
   */
  stop(): void {
    if (!this.isRunning) {
      logger.info('[AggregationWorker] Not running');
      return;
    }

    logger.info('[AggregationWorker] Stopping...');
    this.scheduledTasks.forEach(task => task.stop());
    this.scheduledTasks = [];
    this.isRunning = false;
    logger.info('[AggregationWorker] Stopped');
  }

  /**
   * Run initial aggregation on startup
   */
  private async runInitialAggregation(): Promise<void> {
    logger.info('[AggregationWorker] Running initial aggregation...');
    try {
      aggregationService.runFullAggregation();
      this.stats.lastRun = new Date();
      this.stats.lastSuccess = new Date();
      this.stats.runCount++;
      logger.info('[AggregationWorker] Initial aggregation completed');
    } catch (error) {
      logger.error('[AggregationWorker] Initial aggregation failed:', error);
      this.stats.lastError = new Date();
      this.stats.errorCount++;
    }
  }

  /**
   * Run hourly aggregation
   */
  private async runHourlyAggregation(): Promise<void> {
    this.stats.tasks.hourly.status = 'running';
    this.stats.tasks.hourly.lastRun = new Date();
    logger.info('[AggregationWorker] Running hourly aggregation...');

    try {
      const orders = dashboardModel.getOrders();
      aggregationService.aggregateRevenue(orders, 'hourly');
      aggregationService.aggregateOrders('hourly');

      this.stats.tasks.hourly.status = 'completed';
      logger.info('[AggregationWorker] Hourly aggregation completed');
    } catch (error) {
      logger.error('[AggregationWorker] Hourly aggregation failed:', error);
      this.stats.tasks.hourly.status = 'error';
      this.stats.errorCount++;
    }
  }

  /**
   * Run daily aggregation
   */
  private async runDailyAggregation(): Promise<void> {
    this.stats.tasks.daily.status = 'running';
    this.stats.tasks.daily.lastRun = new Date();
    logger.info('[AggregationWorker] Running daily aggregation...');

    try {
      aggregationService.runFullAggregation();

      this.stats.tasks.daily.status = 'completed';
      this.stats.lastSuccess = new Date();
      this.stats.runCount++;
      logger.info('[AggregationWorker] Daily aggregation completed');
    } catch (error) {
      logger.error('[AggregationWorker] Daily aggregation failed:', error);
      this.stats.tasks.daily.status = 'error';
      this.stats.lastError = new Date();
      this.stats.errorCount++;
    }
  }

  /**
   * Run weekly aggregation
   */
  private async runWeeklyAggregation(): Promise<void> {
    this.stats.tasks.weekly.status = 'running';
    this.stats.tasks.weekly.lastRun = new Date();
    logger.info('[AggregationWorker] Running weekly aggregation...');

    try {
      aggregationService.aggregateCustomerCohorts();
      aggregationService.aggregateMerchantPerformance();

      this.stats.tasks.weekly.status = 'completed';
      logger.info('[AggregationWorker] Weekly aggregation completed');
    } catch (error) {
      logger.error('[AggregationWorker] Weekly aggregation failed:', error);
      this.stats.tasks.weekly.status = 'error';
      this.stats.errorCount++;
    }
  }

  /**
   * Run cleanup tasks
   */
  private async runCleanup(): Promise<void> {
    this.stats.tasks.cleanup.status = 'running';
    this.stats.tasks.cleanup.lastRun = new Date();
    logger.info('[AggregationWorker] Running cleanup...');

    try {
      // Clear old aggregation cache (keep last 7 days)
      aggregationService.clearCache();

      this.stats.tasks.cleanup.status = 'completed';
      logger.info('[AggregationWorker] Cleanup completed');
    } catch (error) {
      logger.error('[AggregationWorker] Cleanup failed:', error);
      this.stats.tasks.cleanup.status = 'error';
      this.stats.errorCount++;
    }
  }

  /**
   * Manually trigger aggregation
   */
  async triggerAggregation(type: 'hourly' | 'daily' | 'weekly' | 'full'): Promise<{ success: boolean; message: string }> {
    logger.info(`[AggregationWorker] Manual trigger: ${type}`);

    try {
      switch (type) {
        case 'hourly':
          await this.runHourlyAggregation();
          break;
        case 'daily':
          await this.runDailyAggregation();
          break;
        case 'weekly':
          await this.runWeeklyAggregation();
          break;
        case 'full':
          aggregationService.runFullAggregation();
          break;
      }

      return { success: true, message: `${type} aggregation triggered successfully` };
    } catch (error) {
      return { success: false, message: `Failed to run ${type} aggregation: ${error}` };
    }
  }

  /**
   * Get worker statistics
   */
  getStats(): WorkerStats {
    return { ...this.stats };
  }

  /**
   * Update worker configuration
   */
  updateConfig(config: Partial<WorkerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[AggregationWorker] Configuration updated:', this.config);
  }

  /**
   * Force immediate aggregation run
   */
  async forceAggregation(): Promise<void> {
    logger.info('[AggregationWorker] Force aggregation triggered');
    await this.runDailyAggregation();
  }
}

// Create singleton instance
export const aggregationWorker = new AggregationWorker();

// Main entry point for standalone worker process
if (require.main === module) {
  logger.info('[AggregationWorker] Starting as standalone process...');

  aggregationWorker.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('[AggregationWorker] Received SIGINT');
    aggregationWorker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('[AggregationWorker] Received SIGTERM');
    aggregationWorker.stop();
    process.exit(0);
  });

  // Expose stats endpoint via HTTP for monitoring
  const http = require('http');
  const server = http.createServer((req: { url: string; method: string }, res: { writeHead: (code: number, headers: object) => void; end: (data: string) => void }) => {
    if (req.url === '/stats' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(aggregationWorker.getStats()));
    } else if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', worker: 'running' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  server.listen(4017, () => {
    logger.info('[AggregationWorker] Stats server listening on port 4017');
  });
}
