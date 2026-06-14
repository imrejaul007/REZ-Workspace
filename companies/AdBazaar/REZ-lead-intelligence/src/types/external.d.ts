/**
 * External module type declarations
 * These modules may not have @types packages or be in node_modules
 */

// Declare @rez/shared module
declare module '@rez/shared' {
  interface LogMetadata {
    [key: string]: unknown;
  }

  interface Logger {
    info(message: string, meta?: unknown): void;
    warn(message: string, meta?: unknown): void;
    error(message: string, meta?: unknown): void;
    debug(message: string, meta?: unknown): void;
  }

  export const logger: Logger;

  export function createServiceLogger(serviceName: string): Logger;
}

// Declare node-cron module
declare module 'node-cron' {
  interface ScheduledTask {
    start(): void;
    stop(): void;
  }

  interface ScheduleOptions {
    scheduled?: boolean;
    timezone?: string;
  }

  export function schedule(
    expression: string,
    func: () => void | Promise<void>,
    options?: ScheduleOptions
  ): ScheduledTask;

  export default {
    schedule,
  };
}
