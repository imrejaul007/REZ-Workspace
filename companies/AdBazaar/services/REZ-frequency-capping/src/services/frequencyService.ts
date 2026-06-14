import { v4 as uuidv4 } from 'uuid';
import {
  FrequencyCap,
  FrequencyRecord,
  CreativeFatigue,
  CappingScope,
  CappingLevel,
  TimeWindow,
  FatigueStatus,
  FrequencyCheckResult,
  SmartFrequencyConfig,
  CreateFrequencyCapInput,
  UpdateFrequencyCapInput,
  RecordImpressionInput
} from '../types';
import logger from '../utils/logger';

class FrequencyService {
  private caps: Map<string, FrequencyCap> = new Map();
  private records: Map<string, FrequencyRecord> = new Map();
  private fatigue: Map<string, CreativeFatigue> = new Map();
  private userRecords: Map<string, Set<string>> = new Map();

  // Frequency Cap Management
  createCap(input: CreateFrequencyCapInput): FrequencyCap {
    const id = uuidv4();
    const now = new Date();

    const cap: FrequencyCap = {
      id,
      campaignId: input.campaignId,
      adGroupId: input.adGroupId,
      creativeId: input.creativeId,
      scope: input.scope,
      level: input.level ?? CappingLevel.USER,
      timeWindow: input.timeWindow ?? TimeWindow.WEEK,
      maxFrequency: input.maxFrequency,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const key = this.getCapKey(cap);
    this.caps.set(key, cap);
    logger.info(`Frequency cap created: ${id}, scope: ${input.scope}`);
    return cap;
  }

  private getCapKey(cap: FrequencyCap): string {
    return `${cap.scope}:${cap.campaignId || ''}:${cap.adGroupId || ''}:${cap.creativeId || ''}`;
  }

  getCap(id: string): FrequencyCap | undefined {
    for (const cap of this.caps.values()) {
      if (cap.id === id) return cap;
    }
    return undefined;
  }

  getCapForScope(scope: CappingScope, campaignId?: string, adGroupId?: string, creativeId?: string): FrequencyCap | undefined {
    let bestMatch: FrequencyCap | undefined;

    this.caps.forEach(cap => {
      if (!cap.isActive) return;
      if (cap.scope !== scope) return;

      const matches = (
        (!campaignId || cap.campaignId === campaignId) &&
        (!adGroupId || cap.adGroupId === adGroupId) &&
        (!creativeId || cap.creativeId === creativeId)
      );

      if (matches) {
        // Prefer most specific match
        if (!bestMatch ||
            (cap.creativeId && !bestMatch.creativeId) ||
            (cap.adGroupId && !bestMatch.adGroupId && !cap.creativeId) ||
            (cap.campaignId && !bestMatch.campaignId && !cap.adGroupId)) {
          bestMatch = cap;
        }
      }
    });

    return bestMatch;
  }

  getCaps(filters?: {
    campaignId?: string;
    adGroupId?: string;
    scope?: CappingScope;
    isActive?: boolean;
  }): FrequencyCap[] {
    const results: FrequencyCap[] = [];

    this.caps.forEach(cap => {
      if (filters?.scope && cap.scope !== filters.scope) return;
      if (filters?.campaignId && cap.campaignId !== filters.campaignId) return;
      if (filters?.adGroupId && cap.adGroupId !== filters.adGroupId) return;
      if (filters?.isActive !== undefined && cap.isActive !== filters.isActive) return;
      results.push(cap);
    });

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateCap(id: string, input: UpdateFrequencyCapInput): FrequencyCap | undefined {
    let found: FrequencyCap | undefined;
    let keyToUpdate: string = '';

    this.caps.forEach((cap, key) => {
      if (cap.id === id) {
        found = cap;
        keyToUpdate = key;
      }
    });

    if (!found) return undefined;

    const updated: FrequencyCap = {
      ...found,
      maxFrequency: input.maxFrequency ?? found.maxFrequency,
      timeWindow: input.timeWindow ?? found.timeWindow,
      isActive: input.isActive ?? found.isActive,
      updatedAt: new Date()
    };

    this.caps.delete(keyToUpdate);
    const newKey = this.getCapKey(updated);
    this.caps.set(newKey, updated);

    logger.info(`Frequency cap updated: ${id}`);
    return updated;
  }

  deleteCap(id: string): boolean {
    let keyToDelete: string = '';
    let found = false;

    this.caps.forEach((cap, key) => {
      if (cap.id === id) {
        keyToDelete = key;
        found = true;
      }
    });

    if (found) {
      this.caps.delete(keyToDelete);
      return true;
    }
    return false;
  }

  // Frequency Recording
  recordImpression(input: RecordImpressionInput): FrequencyRecord {
    const timestamp = input.timestamp ?? new Date();
    const recordKey = this.getRecordKey(input);

    let record = this.records.get(recordKey);

    if (!record) {
      record = {
        id: uuidv4(),
        userId: input.userId,
        deviceId: input.deviceId,
        campaignId: input.campaignId,
        adGroupId: input.adGroupId,
        creativeId: input.creativeId,
        impressions: 0,
        clicks: 0,
        firstImpressionAt: timestamp,
        lastImpressionAt: timestamp,
        dailyImpressions: {}
      };

      // Index by user
      const userKey = input.userId;
      const userRecordIds = this.userRecords.get(userKey) || new Set();
      userRecordIds.add(record.id);
      this.userRecords.set(userKey, userRecordIds);
    }

    record.impressions++;
    record.lastImpressionAt = timestamp;

    // Track daily impressions
    const dayKey = timestamp.toISOString().split('T')[0];
    record.dailyImpressions[dayKey] = (record.dailyImpressions[dayKey] || 0) + 1;

    this.records.set(recordKey, record);

    // Update fatigue metrics if creative
    if (input.creativeId) {
      this.updateFatigueMetrics(input.creativeId, input.campaignId, record);
    }

    return record;
  }

  private getRecordKey(input: RecordImpressionInput): string {
    return `user:${input.userId}:campaign:${input.campaignId || ''}:adgroup:${input.adGroupId || ''}:creative:${input.creativeId || ''}`;
  }

  getRecord(userId: string, campaignId?: string, adGroupId?: string, creativeId?: string): FrequencyRecord | undefined {
    const recordKey = `user:${userId}:campaign:${campaignId || ''}:adgroup:${adGroupId || ''}:creative:${creativeId || ''}`;
    return this.records.get(recordKey);
  }

  getUserRecords(userId: string): FrequencyRecord[] {
    const recordIds = this.userRecords.get(userId);
    if (!recordIds) return [];

    const records: FrequencyRecord[] = [];
    recordIds.forEach(id => {
      this.records.forEach(record => {
        if (record.id === id) records.push(record);
      });
    });
    return records;
  }

  // Frequency Check
  checkFrequency(input: {
    userId: string;
    deviceId?: string;
    campaignId?: string;
    adGroupId?: string;
    creativeId?: string;
  }): FrequencyCheckResult {
    // Get applicable cap
    const scope = input.creativeId ? CappingScope.CREATIVE :
                  input.adGroupId ? CappingScope.AD_GROUP :
                  CappingScope.CAMPAIGN;

    const cap = this.getCapForScope(scope, input.campaignId, input.adGroupId, input.creativeId);

    if (!cap) {
      // No cap defined, allow
      return {
        allowed: true,
        currentFrequency: 0,
        maxFrequency: Infinity,
        timeWindow: TimeWindow.LIFETIME
      };
    }

    const record = this.getRecord(input.userId, input.campaignId, input.adGroupId, input.creativeId);
    const currentFrequency = record ? this.calculateFrequencyForWindow(record, cap.timeWindow) : 0;

    if (currentFrequency >= cap.maxFrequency) {
      const nextAllowed = this.getNextAllowedTime(record, cap.timeWindow);
      return {
        allowed: false,
        currentFrequency,
        maxFrequency: cap.maxFrequency,
        timeWindow: cap.timeWindow,
        reason: `Frequency cap reached (${currentFrequency}/${cap.maxFrequency})`,
        nextAllowedAt: nextAllowed
      };
    }

    return {
      allowed: true,
      currentFrequency,
      maxFrequency: cap.maxFrequency,
      timeWindow: cap.timeWindow
    };
  }

  private calculateFrequencyForWindow(record: FrequencyRecord, window: TimeWindow): number {
    const now = new Date();
    const dayKey = now.toISOString().split('T')[0];
    const msPerDay = 24 * 60 * 60 * 1000;

    switch (window) {
      case TimeWindow.DAY:
        return record.dailyImpressions[dayKey] || 0;

      case TimeWindow.WEEK: {
        const weekAgo = new Date(now.getTime() - 7 * msPerDay);
        let count = 0;
        Object.entries(record.dailyImpressions).forEach(([date, impressions]) => {
          if (new Date(date) >= weekAgo) {
            count += impressions;
          }
        });
        return count;
      }

      case TimeWindow.MONTH: {
        const monthAgo = new Date(now.getTime() - 30 * msPerDay);
        let count = 0;
        Object.entries(record.dailyImpressions).forEach(([date, impressions]) => {
          if (new Date(date) >= monthAgo) {
            count += impressions;
          }
        });
        return count;
      }

      case TimeWindow.LIFETIME:
      default:
        return record.impressions;
    }
  }

  private getNextAllowedTime(record: FrequencyRecord, window: TimeWindow): Date | undefined {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;

    switch (window) {
      case TimeWindow.DAY:
        // Next day 00:00 UTC
        return new Date(now.getTime() + (msPerDay - (now.getTime() % msPerDay)));

      case TimeWindow.WEEK:
        // Next week start
        const daysUntilSunday = 7 - now.getDay();
        return new Date(now.getTime() + daysUntilSunday * msPerDay);

      case TimeWindow.MONTH:
        // Next month start
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth;

      default:
        return undefined;
    }
  }

  // Creative Fatigue Detection
  analyzeFatigue(creativeId: string, campaignId?: string): CreativeFatigue {
    let fatigue = this.fatigue.get(creativeId);

    if (!fatigue) {
      fatigue = {
        id: uuidv4(),
        creativeId,
        campaignId: campaignId || '',
        status: FatigueStatus.HEALTHY,
        totalImpressions: 0,
        uniqueUsers: 0,
        avgFrequencyPerUser: 0,
        ctrTrend: [],
        cvrTrend: [],
        engagementTrend: [],
        fatigueScore: 0,
        recommendedAction: 'none',
        lastAnalyzedAt: new Date()
      };
      this.fatigue.set(creativeId, fatigue);
    }

    // Calculate metrics from records
    let totalImpressions = 0;
    let totalClicks = 0;
    const uniqueUsers = new Set<string>();

    this.records.forEach(record => {
      if (record.creativeId === creativeId) {
        totalImpressions += record.impressions;
        totalClicks += record.clicks;
        uniqueUsers.add(record.userId);
      }
    });

    fatigue.totalImpressions = totalImpressions;
    fatigue.uniqueUsers = uniqueUsers.size;
    fatigue.avgFrequencyPerUser = uniqueUsers.size > 0 ? totalImpressions / uniqueUsers.size : 0;

    // Calculate CTR trend (simulated - would use historical data)
    const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    fatigue.ctrTrend.push(ctr);
    if (fatigue.ctrTrend.length > 10) {
      fatigue.ctrTrend = fatigue.ctrTrend.slice(-10);
    }

    // Calculate fatigue score
    const frequencyScore = Math.min(1, fatigue.avgFrequencyPerUser / 10);
    const trendScore = this.calculateTrendScore(fatigue.ctrTrend);
    const engagementDecline = this.calculateEngagementDecline(fatigue.ctrTrend);

    fatigue.fatigueScore = Math.min(1, frequencyScore * 0.3 + trendScore * 0.4 + engagementDecline * 0.3);

    // Determine status
    if (fatigue.fatigueScore >= 0.7) {
      fatigue.status = FatigueStatus.FATIGUED;
      fatigue.recommendedAction = fatigue.avgFrequencyPerUser > 8 ? 'pause' : 'refresh_creative';
    } else if (fatigue.fatigueScore >= 0.4) {
      fatigue.status = FatigueStatus.WARNING;
      fatigue.recommendedAction = 'reduce_budget';
    } else {
      fatigue.status = FatigueStatus.HEALTHY;
      fatigue.recommendedAction = 'none';
    }

    fatigue.lastAnalyzedAt = new Date();
    this.fatigue.set(creativeId, fatigue);

    logger.info(`Fatigue analyzed for creative ${creativeId}: score=${fatigue.fatigueScore.toFixed(2)}, status=${fatigue.status}`);
    return fatigue;
  }

  private calculateTrendScore(trend: number[]): number {
    if (trend.length < 2) return 0;

    const recent = trend.slice(-3);
    const older = trend.slice(0, Math.max(1, trend.length - 3));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (olderAvg === 0) return 0;

    const decline = Math.max(0, 1 - recentAvg / olderAvg);
    return Math.min(1, decline);
  }

  private calculateEngagementDecline(trend: number[]): number {
    if (trend.length < 5) return 0;

    const firstHalf = trend.slice(0, Math.floor(trend.length / 2));
    const secondHalf = trend.slice(Math.floor(trend.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (firstAvg === 0) return 0;

    const decline = Math.max(0, (firstAvg - secondAvg) / firstAvg);
    return Math.min(1, decline);
  }

  getFatigue(creativeId: string): CreativeFatigue | undefined {
    return this.fatigue.get(creativeId);
  }

  getFatiguesForCampaign(campaignId: string): CreativeFatigue[] {
    const results: CreativeFatigue[] = [];
    this.fatigue.forEach(f => {
      if (f.campaignId === campaignId) results.push(f);
    });
    return results.sort((a, b) => b.fatigueScore - a.fatigueScore);
  }

  // Smart Frequency
  calculateSmartFrequency(userId: string, config: SmartFrequencyConfig): number {
    const records = this.getUserRecords(userId);
    if (records.length === 0) return config.minFrequency;

    const totalImpressions = records.reduce((sum, r) => sum + r.impressions, 0);
    const engagement = this.calculateUserEngagement(userId);

    // Calculate optimal frequency based on engagement
    let optimalFrequency = config.maxFrequency;

    if (engagement > config.engagementThreshold) {
      // High engagement - reduce frequency
      const reduction = 1 - config.frequencyDecay;
      optimalFrequency = Math.floor(config.maxFrequency * reduction);
    }

    return Math.max(config.minFrequency, optimalFrequency);
  }

  private calculateUserEngagement(userId: string): number {
    const records = this.getUserRecords(userId);
    if (records.length === 0) return 0;

    let totalClicks = 0;
    let totalImpressions = 0;

    records.forEach(record => {
      totalClicks += record.clicks;
      totalImpressions += record.impressions;
    });

    return totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  }

  // Bulk Operations
  getFrequencyStats(tenantId: string): {
    totalCaps: number;
    activeCaps: number;
    totalRecords: number;
    avgImpressionsPerUser: number;
    fatiguedCreatives: number;
    warningCreatives: number;
  } {
    let activeCaps = 0;
    let totalRecords = 0;
    let totalImpressions = 0;
    let fatiguedCreatives = 0;
    let warningCreatives = 0;

    this.caps.forEach(cap => {
      if (cap.isActive) activeCaps++;
    });

    this.records.forEach(() => totalRecords++);
    this.fatigue.forEach(f => {
      if (f.status === FatigueStatus.FATIGUED) fatiguedCreatives++;
      else if (f.status === FatigueStatus.WARNING) warningCreatives++;
    });

    const avgImpressionsPerUser = totalRecords > 0 ? totalImpressions / totalRecords : 0;

    return {
      totalCaps: this.caps.size,
      activeCaps,
      totalRecords,
      avgImpressionsPerUser,
      fatiguedCreatives,
      warningCreatives
    };
  }
}

export default new FrequencyService();
