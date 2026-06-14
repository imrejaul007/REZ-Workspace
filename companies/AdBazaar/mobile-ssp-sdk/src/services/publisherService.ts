import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppPublisherModel, AppPublisherDocument } from '../models/index.js';
import { config } from '../config/index.js';
import type {
  AppPublisher,
  App,
  Platform,
  PublisherStatus,
  PublisherEarnings,
  EarningsRecord,
} from '../types/index.js';

export class PublisherService {
  /**
   * Register a new publisher
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    company?: string;
  }): Promise<{ publisher: AppPublisher; token: string }> {
    // Check if email already exists
    const existing = await AppPublisherModel.findOne({ email: data.email });
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generate publisher ID
    const publisherId = `pub_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

    // Create publisher
    const publisher = await AppPublisherModel.create({
      publisherId,
      name: data.name,
      email: data.email,
      password: hashedPassword,
      company: data.company,
      status: 'pending',
      apps: [],
      settings: {
        adFormats: ['banner', 'interstitial'],
        minCPM: config.ssp.defaultECPM,
        autoRefresh: true,
        testMode: false,
      },
      stats: {
        totalImpressions: 0,
        totalClicks: 0,
        totalEarnings: 0,
        todayImpressions: 0,
        todayClicks: 0,
        todayEarnings: 0,
        yesterdayImpressions: 0,
        yesterdayClicks: 0,
        yesterdayEarnings: 0,
      },
    });

    // Generate JWT token
    const token = this.generateToken(publisher);

    return {
      publisher: this.toAppPublisher(publisher),
      token,
    };
  }

  /**
   * Login publisher
   */
  async login(email: string, password: string): Promise<{ publisher: AppPublisher; token: string }> {
    const publisher = await AppPublisherModel.findOne({ email });
    if (!publisher) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, (publisher as any).password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (publisher.status === 'suspended') {
      throw new Error('Account suspended');
    }

    const token = this.generateToken(publisher);

    return {
      publisher: this.toAppPublisher(publisher),
      token,
    };
  }

  /**
   * Get publisher by ID
   */
  async getById(publisherId: string): Promise<AppPublisher | null> {
    const publisher = await AppPublisherModel.findOne({ publisherId });
    return publisher ? this.toAppPublisher(publisher) : null;
  }

  /**
   * Get publisher by email
   */
  async getByEmail(email: string): Promise<AppPublisher | null> {
    const publisher = await AppPublisherModel.findOne({ email });
    return publisher ? this.toAppPublisher(publisher) : null;
  }

  /**
   * Add an app to publisher
   */
  async addApp(
    publisherId: string,
    appData: {
      name: string;
      platform: Platform;
      bundleId: string;
      category: string;
    }
  ): Promise<App> {
    const publisher = await AppPublisherModel.findOne({ publisherId });
    if (!publisher) {
      throw new Error('Publisher not found');
    }

    // Check if app with same bundleId already exists
    const existingApp = publisher.apps.find((app) => app.bundleId === appData.bundleId);
    if (existingApp) {
      throw new Error('App with this bundle ID already exists');
    }

    const appId = `app_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

    const newApp = {
      appId,
      name: appData.name,
      platform: appData.platform,
      bundleId: appData.bundleId,
      category: appData.category,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    publisher.apps.push(newApp as any);
    await publisher.save();

    return newApp;
  }

  /**
   * Update app status
   */
  async updateAppStatus(
    publisherId: string,
    appId: string,
    status: 'active' | 'pending' | 'suspended'
  ): Promise<App | null> {
    const publisher = await AppPublisherModel.findOne({ publisherId });
    if (!publisher) {
      throw new Error('Publisher not found');
    }

    const appIndex = publisher.apps.findIndex((app) => app.appId === appId);
    if (appIndex === -1) {
      throw new Error('App not found');
    }

    publisher.apps[appIndex].status = status;
    publisher.apps[appIndex].updatedAt = new Date();
    await publisher.save();

    return publisher.apps[appIndex].toObject();
  }

  /**
   * Update publisher settings
   */
  async updateSettings(
    publisherId: string,
    settings: Partial<{
      adFormats: string[];
      minCPM: number;
      autoRefresh: boolean;
      testMode: boolean;
    }>
  ): Promise<AppPublisher | null> {
    const publisher = await AppPublisherModel.findOne({ publisherId });
    if (!publisher) {
      throw new Error('Publisher not found');
    }

    if (settings.adFormats) {
      publisher.settings.adFormats = settings.adFormats as any;
    }
    if (settings.minCPM !== undefined) {
      publisher.settings.minCPM = settings.minCPM;
    }
    if (settings.autoRefresh !== undefined) {
      publisher.settings.autoRefresh = settings.autoRefresh;
    }
    if (settings.testMode !== undefined) {
      publisher.settings.testMode = settings.testMode;
    }

    await publisher.save();
    return this.toAppPublisher(publisher);
  }

  /**
   * Update publisher status
   */
  async updateStatus(publisherId: string, status: PublisherStatus): Promise<AppPublisher | null> {
    const publisher = await AppPublisherModel.findOne({ publisherId });
    if (!publisher) {
      throw new Error('Publisher not found');
    }

    publisher.status = status;
    await publisher.save();
    return this.toAppPublisher(publisher);
  }

  /**
   * Update publisher stats
   */
  async updateStats(
    publisherId: string,
    data: {
      impressions?: number;
      clicks?: number;
      earnings?: number;
    }
  ): Promise<void> {
    await AppPublisherModel.findOneAndUpdate(
      { publisherId },
      {
        $inc: {
          'stats.totalImpressions': data.impressions || 0,
          'stats.totalClicks': data.clicks || 0,
          'stats.totalEarnings': data.earnings || 0,
          'stats.todayImpressions': data.impressions || 0,
          'stats.todayClicks': data.clicks || 0,
          'stats.todayEarnings': data.earnings || 0,
        },
      }
    );
  }

  /**
   * Get publisher earnings
   */
  async getEarnings(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PublisherEarnings> {
    const { ImpressionModel, ClickModel } = await import('../models/index.js');

    // Get all impressions and clicks in date range
    const impressions = await ImpressionModel.find({
      publisherId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const clicks = await ClickModel.find({
      publisherId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    // Group by day for breakdown
    const dailyData = new Map<string, { impressions: number; clicks: number; earnings: number }>();

    // Calculate daily breakdown from impressions
    for (const impression of impressions) {
      const dateKey = impression.timestamp.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { impressions: 0, clicks: 0, earnings: 0 };
      existing.impressions++;
      existing.earnings += 0.001; // Example ECPM calculation
      dailyData.set(dateKey, existing);
    }

    // Add clicks to daily data
    for (const click of clicks) {
      const dateKey = click.timestamp.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { impressions: 0, clicks: 0, earnings: 0 };
      existing.clicks++;
      dailyData.set(dateKey, existing);
    }

    const breakdown: EarningsRecord[] = [];
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalEarnings = 0;

    for (const [date, data] of dailyData) {
      breakdown.push({
        date,
        impressions: data.impressions,
        clicks: data.clicks,
        ecpm: config.ssp.defaultECPM,
        earnings: data.earnings,
      });
      totalImpressions += data.impressions;
      totalClicks += data.clicks;
      totalEarnings += data.earnings;
    }

    return {
      publisherId,
      period: { start: startDate, end: endDate },
      totalEarnings,
      totalImpressions,
      totalClicks,
      averageECPM: totalImpressions > 0 ? (totalEarnings / totalImpressions) * 1000 : 0,
      breakdown: breakdown.sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  /**
   * Get all publishers (admin)
   */
  async getAll(options: {
    page?: number;
    limit?: number;
    status?: PublisherStatus;
  }): Promise<{ publishers: AppPublisher[]; total: number }> {
    const { page = 1, limit = 20, status } = options;

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const [publishers, total] = await Promise.all([
      AppPublisherModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AppPublisherModel.countDocuments(query),
    ]);

    return {
      publishers: publishers.map((p) => this.toAppPublisher(p)),
      total,
    };
  }

  /**
   * Generate JWT token
   */
  private generateToken(publisher: AppPublisherDocument): string {
    return jwt.sign(
      { publisherId: publisher.publisherId, email: publisher.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Convert document to AppPublisher type
   */
  private toAppPublisher(doc: AppPublisherDocument): AppPublisher {
    return {
      publisherId: doc.publisherId,
      name: doc.name,
      email: doc.email,
      company: doc.company,
      apps: doc.apps.map((app) => app.toObject()),
      settings: doc.settings.toObject(),
      stats: doc.stats.toObject(),
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export const publisherService = new PublisherService();