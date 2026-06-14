/**
 * REZ Workspace - Graceful Shutdown Handler
 *
 * Features:
 * - Handles SIGTERM and SIGINT signals
 * - Closes database connections
 * - Closes WebSocket connections
 * - Finishes in-progress requests
 * - Logs shutdown progress
 */

import http from 'http';
import { WebSocketServer } from 'ws';
import { logger } from '../../shared/logger';
import { disconnectMongoDB, disconnectRedis } from './database';

interface GracefulShutdownOptions {
  server: http.Server;
  wss?: WebSocketServer;
  timeout?: number;
}

class GracefulShutdown {
  private isShuttingDown = false;
  private server: http.Server;
  private wss?: WebSocketServer;
  private timeout: number;

  constructor(options: GracefulShutdownOptions) {
    this.server = options.server;
    this.wss = options.wss;
    this.timeout = options.timeout || 30000; // 30 seconds default

    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    // Handle SIGTERM (Docker, Kubernetes, cloud platforms)
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));

    // Handle SIGINT (Ctrl+C in terminal)
    process.on('SIGINT', () => this.shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => this.handleUncaughtException(error));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => this.handleUnhandledRejection(reason, promise));

    // Handle warnings
    process.on('warning', (warning) => {
      logger.warn('Process warning:', warning);
    });
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn(`Already shutting down (${signal})`);
      return;
    }

    this.isShuttingDown = true;
    const startTime = Date.now();

    logger.info(`\n========================================`);
    logger.info(`  GRACEFUL SHUTDOWN INITIATED`);
    logger.info(`  Signal: ${signal}`);
    logger.info(`  Time: ${new Date().toISOString()}`);
    logger.info(`========================================\n`);

    try {
      // Step 1: Stop accepting new connections
      logger.info('[Shutdown] Step 1: Stopping new connections...');
      await this.stopNewConnections();

      // Step 2: Wait for in-progress requests to complete
      logger.info('[Shutdown] Step 2: Waiting for in-progress requests...');
      await this.waitForRequests();

      // Step 3: Close WebSocket connections
      if (this.wss) {
        logger.info('[Shutdown] Step 3: Closing WebSocket connections...');
        await this.closeWebSocketConnections();
      }

      // Step 4: Close database connections
      logger.info('[Shutdown] Step 4: Closing database connections...');
      await this.closeDatabaseConnections();

      // Step 5: Close HTTP server
      logger.info('[Shutdown] Step 5: Closing HTTP server...');
      await this.closeHttpServer();

      const duration = Date.now() - startTime;
      logger.info(`\n========================================`);
      logger.info(`  SHUTDOWN COMPLETE`);
      logger.info(`  Duration: ${duration}ms`);
      logger.info(`========================================\n`);

      process.exit(0);
    } catch (error) {
      logger.error('[Shutdown] Error during shutdown:', error);
      process.exit(1);
    }
  }

  private async stopNewConnections(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('[Shutdown] HTTP server closed - no new connections');
        resolve();
      });
    });
  }

  private async waitForRequests(): Promise<void> {
    return new Promise((resolve) => {
      // Give existing requests a chance to complete
      const checkInterval = 1000;
      const maxWait = this.timeout;
      let waited = 0;

      const check = () => {
        // Get active connections count
        const activeConnections = (this.server as any)._connections || 0;

        if (activeConnections === 0 || waited >= maxWait) {
          if (waited >= maxWait) {
            logger.warn(`[Shutdown] Request timeout after ${maxWait}ms`);
          } else {
            logger.info(`[Shutdown] All ${activeConnections} connections completed`);
          }
          resolve();
        } else {
          logger.info(`[Shutdown] Waiting for ${activeConnections} connections...`);
          waited += checkInterval;
          setTimeout(check, checkInterval);
        }
      };

      check();
    });
  }

  private async closeWebSocketConnections(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.wss) {
        resolve();
        return;
      }

      const clients = this.wss.clients;
      let closed = 0;
      const total = clients.size;

      if (total === 0) {
        logger.info('[Shutdown] No WebSocket connections to close');
        this.wss.close(() => {
          logger.info('[Shutdown] WebSocket server closed');
          resolve();
        });
        return;
      }

      logger.info(`[Shutdown] Closing ${total} WebSocket connections...`);

      clients.forEach((client) => {
        client.close(1001, 'Server shutting down');
        closed++;
      });

      // Wait a bit for graceful closes
      setTimeout(() => {
        this.wss!.close(() => {
          logger.info(`[Shutdown] Closed ${closed} WebSocket connections`);
          resolve();
        });
      }, 1000);
    });
  }

  private async closeDatabaseConnections(): Promise<void> {
    try {
      // Close MongoDB
      await disconnectMongoDB();
      logger.info('[Shutdown] MongoDB disconnected');

      // Close Redis
      await disconnectRedis();
      logger.info('[Shutdown] Redis disconnected');
    } catch (error) {
      logger.error('[Shutdown] Error closing database connections:', error);
    }
  }

  private async closeHttpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          logger.error('[Shutdown] Error closing HTTP server:', err);
          reject(err);
        } else {
          logger.info('[Shutdown] HTTP server closed');
          resolve();
        }
      });
    });
  }

  private handleUncaughtException(error: Error): void {
    logger.error('========================================');
    logger.error('  UNCAUGHT EXCEPTION');
    logger.error('========================================');
    logger.error('Error:', error.message);
    logger.error('Stack:', error.stack);
    logger.error('========================================');

    // Log but don't exit immediately - try graceful shutdown first
    this.shutdown('uncaughtException').then(() => {
      process.exit(1);
    });

    // Force exit after timeout
    setTimeout(() => {
      logger.error('Forced exit after timeout');
      process.exit(1);
    }, this.timeout);
  }

  private handleUnhandledRejection(reason: unknown, promise: Promise<unknown>): void {
    logger.error('========================================');
    logger.error('  UNHANDLED PROMISE REJECTION');
    logger.error('========================================');
    logger.error('Reason:', reason);
    logger.error('========================================');

    // Log the rejection but don't crash the process
    // The application should continue running
  }

  public isShuttingDown(): boolean {
    return this.isShuttingDown;
  }
}

export function setupGracefulShutdown(server: http.Server, wss?: WebSocketServer): GracefulShutdown {
  return new GracefulShutdown({ server, wss });
}

export default GracefulShutdown;