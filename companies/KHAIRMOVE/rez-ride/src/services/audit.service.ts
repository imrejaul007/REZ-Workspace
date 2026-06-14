import { Injectable, Logger } from '@nestjs/common';

/**
 * Audit Service - Compliance logging
 */
@Injectable()
export class AuditService {
  private logger = new Logger('AuditService');
  private logs: AuditLog[] = [];

  async log(action: string, userId: string, data: any): Promise<void> {
    const entry = { action, userId, data, timestamp: new Date(), ip: '0.0.0.0' };
    this.logs.push(entry);
    this.logger.log(`${action}: ${userId}`);
  }

  async query(filters: Partial<AuditLog>): Promise<AuditLog[]> {
    return this.logs.filter(l =>
      (!filters.action || l.action === filters.action) &&
      (!filters.userId || l.userId === filters.userId)
    );
  }
}

export interface AuditLog {
  action: string;
  userId: string;
  data: any;
  timestamp: Date;
  ip: string;
}
