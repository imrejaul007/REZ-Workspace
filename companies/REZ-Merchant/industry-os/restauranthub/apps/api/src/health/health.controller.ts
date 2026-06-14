import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {}

  @Get()
  async getHealth() {
    const startTime = Date.now();

    // Basic health check
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'RestoPapa API is running',
      environment: this.configService.get('NODE_ENV'),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'unknown',
        redis: 'unknown',
        memory: 'ok',
        responseTime: 0,
      },
    };

    try {
      // Database connectivity check
      await this.prismaService.$queryRaw`SELECT 1`;
      health.checks.database = 'healthy';
    } catch (error) {
      health.checks.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };

    // Check if memory usage is concerning (over 1GB heap used)
    if (memUsageMB.heapUsed > 1024) {
      health.checks.memory = 'warning';
      health.status = 'degraded';
    }

    health.checks.responseTime = Date.now() - startTime;

    return {
      ...health,
      memory: memUsageMB,
    };
  }

  @Get('ready')
  async ready() {
    try {
      // Check if the application is ready to serve traffic
      await this.prismaService.$queryRaw`SELECT 1`;

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: 'Application is ready to serve traffic',
      };
    } catch (error) {
      return {
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        message: 'Application is not ready to serve traffic',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('live')
  live() {
    // Simple liveness probe - just check if the process is running
    return {
      status: 'live',
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime(),
    };
  }

  @Get('metrics')
  async metrics() {
    if (this.configService.get('NODE_ENV') === 'production') {
      // Only show detailed metrics in production with proper authentication
      // This is a simplified version - in real production, you'd want proper auth
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        versions: process.versions,
      };
    }

    return { message: 'Metrics endpoint disabled in development' };
  }
}