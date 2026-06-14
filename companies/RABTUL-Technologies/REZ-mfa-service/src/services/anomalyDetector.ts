import { LoginAttempt, MFAUser } from '../models';
import config from '../config';
import logger from '../utils/logger';
import { AnomalyReport, AnomalyDetail } from '../types';

export interface LoginContext {
  userId: string;
  ipAddress: string;
  userAgent: string;
  city?: string;
  country?: string;
  method: 'totp' | 'backup_code' | 'sms' | 'recovery';
}

export class AnomalyDetector {
  /**
   * Record a login attempt
   */
  static async recordAttempt(
    context: LoginContext,
    success: boolean,
    anomalyTypes: string[] = []
  ): Promise<void> {
    try {
      const attempt = new LoginAttempt({
        userId: context.userId,
        timestamp: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success,
        method: context.method,
        city: context.city,
        country: context.country,
        anomalyDetected: anomalyTypes.length > 0,
        anomalyTypes,
      });

      await attempt.save();

      logger.debug('Login attempt recorded', {
        userId: context.userId,
        success,
        anomalyDetected: anomalyTypes.length > 0,
      });
    } catch (error) {
      logger.error('Failed to record login attempt', {
        userId: context.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Detect anomalies for a login attempt
   */
  static async detectAnomalies(context: LoginContext): Promise<AnomalyDetail[]> {
    const anomalies: AnomalyDetail[] = [];
    const windowStart = new Date(Date.now() - config.anomaly.loginWindowHours * 60 * 60 * 1000);

    try {
      // Get recent attempts within the time window
      const recentAttempts = await LoginAttempt.find({
        userId: context.userId,
        timestamp: { $gte: windowStart },
      }).sort({ timestamp: -1 });

      // Check for unusual location (different city in short time)
      if (context.city) {
        const recentCities = recentAttempts
          .filter(a => a.city && a.timestamp > new Date(Date.now() - 60 * 60 * 1000)) // Last hour
          .map(a => a.city);

        if (recentCities.length > 0 && !recentCities.includes(context.city)) {
          // Check if another city appeared recently (could be travel)
          const recentUniqueCities = new Set(recentCities);
          if (recentUniqueCities.size > 1) {
            anomalies.push({
              type: 'unusual_location',
              description: `Login from different city (${context.city}) within 1 hour of another location`,
              details: {
                currentCity: context.city,
                previousCities: Array.from(recentUniqueCities),
              },
            });
          }
        }
      }

      // Check for too many attempts from same IP
      const ipAttempts = recentAttempts.filter(a => a.ipAddress === context.ipAddress);
      if (ipAttempts.length >= config.anomaly.thresholdSameIp) {
        anomalies.push({
          type: 'suspicious_ip',
          description: `Multiple login attempts from same IP address (${ipAttempts.length})`,
          details: {
            ipAddress: context.ipAddress,
            attemptCount: ipAttempts.length,
          },
        });
      }

      // Check for too many failed attempts
      const failedAttempts = recentAttempts.filter(a => !a.success);
      if (failedAttempts.length >= config.anomaly.thresholdFailedAttempts) {
        anomalies.push({
          type: 'multiple_failures',
          description: `Multiple failed login attempts (${failedAttempts.length})`,
          details: {
            failedAttemptCount: failedAttempts.length,
            lastFailure: failedAttempts[0]?.timestamp,
          },
        });
      }

      // Check for new device
      const knownUserAgents = new Set(recentAttempts.map(a => a.userAgent));
      if (knownUserAgents.size > 0 && !knownUserAgents.has(context.userAgent)) {
        // Check if this is a truly new device or just a different browser
        const recentSuccessful = recentAttempts.filter(a => a.success).slice(0, 5);
        if (recentSuccessful.length > 0 && !recentSuccessful.some(a => a.userAgent === context.userAgent)) {
          anomalies.push({
            type: 'new_device',
            description: 'Login attempt from unrecognized device',
            details: {
              userAgent: context.userAgent.substring(0, 100),
              knownDevicesCount: knownUserAgents.size,
            },
          });
        }
      }

      // Check for unusual time (late night logins)
      const hour = new Date().getHours();
      if (hour >= 1 && hour <= 5) {
        const daytimeAttempts = recentAttempts.filter(a => {
          const attemptHour = new Date(a.timestamp).getHours();
          return attemptHour >= 8 && attemptHour <= 22;
        });

        if (daytimeAttempts.length > 5) {
          anomalies.push({
            type: 'unusual_time',
            description: `Login attempt during unusual hours (${hour}:00)`,
            details: {
              hour,
              previousActivityHours: daytimeAttempts.slice(0, 3).map(a => new Date(a.timestamp).getHours()),
            },
          });
        }
      }

      return anomalies;
    } catch (error) {
      logger.error('Error detecting anomalies', {
        userId: context.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Generate a risk report for a user
   */
  static async generateRiskReport(userId: string): Promise<AnomalyReport> {
    const windowStart = new Date(Date.now() - config.anomaly.loginWindowHours * 60 * 60 * 1000);

    try {
      const recentAttempts = await LoginAttempt.find({
        userId,
        timestamp: { $gte: windowStart },
      }).sort({ timestamp: -1 });

      const anomalies: AnomalyDetail[] = [];

      // Aggregate anomaly types
      recentAttempts.forEach(attempt => {
        if (attempt.anomalyDetected && attempt.anomalyTypes) {
          attempt.anomalyTypes.forEach(type => {
            if (!anomalies.some(a => a.type === type)) {
              anomalies.push({
                type: type as AnomalyDetail['type'],
                description: `Anomaly of type ${type} detected`,
                details: { count: 1 },
              });
            } else {
              const existing = anomalies.find(a => a.type === type)!;
              (existing.details.count as number)++;
            }
          });
        }
      });

      // Calculate risk level
      let riskLevel: AnomalyReport['riskLevel'] = 'low';
      const uniqueAnomalyTypes = new Set(recentAttempts.flatMap(a => a.anomalyTypes || []));

      if (uniqueAnomalyTypes.has('multiple_failures') || recentAttempts.filter(a => !a.success).length > 5) {
        riskLevel = 'high';
      } else if (uniqueAnomalyTypes.size >= 2) {
        riskLevel = 'medium';
      } else if (uniqueAnomalyTypes.size >= 1) {
        riskLevel = 'low';
      }

      return {
        userId,
        anomalies,
        recentAttempts: recentAttempts.length,
        riskLevel,
      };
    } catch (error) {
      logger.error('Error generating risk report', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        userId,
        anomalies: [],
        recentAttempts: 0,
        riskLevel: 'low',
      };
    }
  }

  /**
   * Check if a device is trusted
   */
  static async isTrustedDevice(
    userId: string,
    deviceId: string,
    ipAddress: string
  ): Promise<{ trusted: boolean; lastUsed?: Date }> {
    try {
      const user = await MFAUser.findOne({ userId });

      if (!user || !user.trustedDevices || user.trustedDevices.length === 0) {
        return { trusted: false };
      }

      const device = user.trustedDevices.find(d => d.deviceId === deviceId);

      if (!device) {
        return { trusted: false };
      }

      // Check if IP is within reasonable range (for simplicity, exact match)
      // In production, you might want to check for IP ranges or subnet matches
      const ipMatch = device.ipAddress === ipAddress;

      // Update last used if trusted
      if (ipMatch) {
        device.lastUsedAt = new Date();
        await user.save();
        return { trusted: true, lastUsed: device.lastUsedAt };
      }

      return { trusted: false };
    } catch (error) {
      logger.error('Error checking trusted device', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { trusted: false };
    }
  }

  /**
   * Get login history for a user
   */
  static async getLoginHistory(
    userId: string,
    options: { limit?: number; page?: number } = {}
  ): Promise<{ attempts: Array<{
    timestamp: Date;
    ipAddress: string;
    success: boolean;
    method: string;
    city?: string;
    anomalyDetected: boolean;
  }>; total: number }> {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      LoginAttempt.find({ userId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoginAttempt.countDocuments({ userId }),
    ]);

    return {
      attempts: attempts.map(a => ({
        timestamp: a.timestamp,
        ipAddress: a.ipAddress,
        success: a.success,
        method: a.method,
        city: a.city,
        anomalyDetected: a.anomalyDetected,
      })),
      total,
    };
  }

  /**
   * Clean up old login attempts (run periodically)
   */
  static async cleanup(): Promise<number> {
    try {
      const result = await LoginAttempt.deleteMany({
        timestamp: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      });

      logger.info('Cleaned up old login attempts', {
        deletedCount: result.deletedCount,
      });

      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up login attempts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }
}
