import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

/**
 * Keeps the Render free-tier instance alive by self-pinging /health every
 * 12 minutes.  Render spins down services after 15 minutes of inactivity;
 * this ensures the gap never reaches that threshold.
 *
 * Only active when the RENDER environment variable is present (Render sets
 * it automatically on all free-tier instances).  Does nothing in local dev.
 */
@Injectable()
export class KeepAliveService implements OnModuleInit {
  private readonly logger = new Logger(KeepAliveService.name);
  private selfUrl: string | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    // RENDER_EXTERNAL_URL is automatically injected by Render
    const renderUrl = this.config.get<string>('RENDER_EXTERNAL_URL');
    const isRender = !!this.config.get<string>('RENDER');

    if (isRender && renderUrl) {
      this.selfUrl = `${renderUrl}/health`;
      this.logger.log(`Keep-alive active — pinging ${this.selfUrl} every 12 min`);
    }
  }

  // Runs at 0, 12, 24, 36, 48 minutes past every hour
  @Cron('0 */12 * * * *')
  async ping() {
    if (!this.selfUrl) return;

    try {
      const res = await fetch(this.selfUrl, { signal: AbortSignal.timeout(10_000) });
      this.logger.debug(`Keep-alive ping → ${res.status}`);
    } catch (err: unknown) {
      this.logger.warn(`Keep-alive ping failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
