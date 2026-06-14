import dns from 'dns';
import { promisify } from 'util';
import { MXValidation, MXRecord } from '../types';
import { logger } from '../utils/logger';

const resolveMx = promisify(dns.resolveMx);
const dnsLookup = promisify(dns.lookup);

export class MXService {
  private timeout: number;

  constructor(timeout: number = 5000) {
    this.timeout = timeout;
  }

  async validateMX(domain: string): Promise<MXValidation> {
    const startTime = Date.now();

    try {
      // Check MX records
      const mxRecords = await this.withTimeout(
        resolveMx(domain),
        this.timeout
      );

      if (!mxRecords || mxRecords.length === 0) {
        logger.logMXCheck(domain, false, 0);
        return {
          hasMX: false,
          mxRecords: [],
          reachable: false,
          score: 0,
        };
      }

      // Sort by priority
      const sortedRecords = mxRecords
        .map((r) => ({ priority: r.priority, exchange: r.exchange }))
        .sort((a, b) => a.priority - b.priority);

      const mxStrings = sortedRecords.map((r) => `${r.priority} ${r.exchange}`);

      // Check if at least one MX server is reachable
      const reachable = await this.checkReachability(sortedRecords);

      const score = this.calculateScore(sortedRecords.length, reachable);

      logger.logMXCheck(domain, true, sortedRecords.length);

      return {
        hasMX: true,
        mxRecords: mxStrings,
        reachable,
        score,
      };
    } catch (error) {
      logger.error(`MX validation failed for ${domain}`, error);
      return {
        hasMX: false,
        mxRecords: [],
        reachable: false,
        score: 0,
      };
    }
  }

  private async checkReachability(records: MXRecord[]): Promise<boolean> {
    // Check the top 2 MX servers
    const toCheck = records.slice(0, 2);

    for (const record of toCheck) {
      try {
        await this.withTimeout(dnsLookup(record.exchange), this.timeout);
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  private calculateScore(recordCount: number, reachable: boolean): number {
    let score = 0;

    // Base score for having MX records
    score += Math.min(recordCount * 10, 30);

    // Bonus for multiple MX records (redundancy)
    if (recordCount > 1) score += 10;

    // Bonus for reachability
    if (reachable) score += 20;

    return Math.min(score, 60);
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`DNS lookup timed out after ${ms}ms`));
      }, ms);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  async getTopMX(domain: string): Promise<MXRecord | null> {
    try {
      const records = await this.withTimeout(
        resolveMx(domain),
        this.timeout
      );

      if (!records || records.length === 0) return null;

      const sorted = records.sort((a, b) => a.priority - b.priority);

      return {
        priority: sorted[0].priority,
        exchange: sorted[0].exchange,
      };
    } catch {
      return null;
    }
  }
}

export const mxService = new MXService();
