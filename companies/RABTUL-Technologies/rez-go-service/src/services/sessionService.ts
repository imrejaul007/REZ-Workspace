import { v4 as uuidv4 } from 'uuid';
import { GoSession, IGoSession, SessionStatus } from '../models/GoSession.js';
import { GoStore } from '../models/GoStore.js';
import { config } from '../config/index.js';

export interface CreateSessionParams {
  userId: string;
  storeId: string;
  deviceInfo?: {
    deviceId?: string;
    platform?: string;
    appVersion?: string;
  };
  location?: {
    entryLat: number;
    entryLng: number;
  };
}

export interface SessionFilters {
  userId?: string;
  storeId?: string;
  merchantId?: string;
  status?: SessionStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class SessionService {
  /**
   * Start a new shopping session
   */
  async startSession(params: CreateSessionParams): Promise<IGoSession> {
    const { userId, storeId, deviceInfo, location } = params;

    // Get store info
    const store = await GoStore.findOne({ storeId });
    if (!store) {
      throw new Error('Store not found');
    }

    if (!store.goEnabled) {
      throw new Error('REZ Go is not enabled for this store');
    }

    // Check for existing active session
    const existingSession = await GoSession.findOne({
      userId,
      storeId,
      status: 'active',
    });

    if (existingSession) {
      throw new Error('An active session already exists for this store. Please complete or cancel it first.');
    }

    // Create new session
    const session = new GoSession({
      sessionId: `GOS-${uuidv4()}`,
      userId,
      storeId,
      storeName: store.name,
      merchantId: store.merchantId,
      status: 'active',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      cashbackEarned: 0,
      coinsRedeemed: 0,
      savings: {
        totalMRP: 0,
        totalPaid: 0,
        cashbackEarned: 0,
        totalSaved: 0,
        coinsRedeemed: 0,
      },
      exitVerified: false,
      fraudScore: 0,
      auditRequired: false,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      deviceInfo,
      location: location ? {
        entryLat: location.entryLat,
        entryLng: location.entryLng,
      } : undefined,
    });

    await session.save();

    // Update store stats
    await GoStore.updateOne(
      { storeId },
      { $inc: { 'stats.totalSessions': 1 } }
    );

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<IGoSession | null> {
    return GoSession.findOne({ sessionId });
  }

  /**
   * Get session by ID with auth check
   */
  async getSessionForUser(sessionId: string, userId: string): Promise<IGoSession | null> {
    return GoSession.findOne({ sessionId, userId });
  }

  /**
   * Get active session for user at store
   */
  async getActiveSession(userId: string, storeId: string): Promise<IGoSession | null> {
    return GoSession.findOne({
      userId,
      storeId,
      status: 'active',
    });
  }

  /**
   * Update session activity timestamp
   */
  async touchSession(sessionId: string): Promise<void> {
    await GoSession.updateOne(
      { sessionId },
      { lastActivityAt: new Date() }
    );
  }

  /**
   * Complete session
   */
  async completeSession(
    sessionId: string,
    userId: string,
    params: {
      paymentMethod: string;
      paymentId?: string;
      exitLocation?: { lat: number; lng: number };
    }
  ): Promise<IGoSession | null> {
    const session = await GoSession.findOne({ sessionId, userId, status: 'active' });

    if (!session) {
      throw new Error('Session not found or already completed');
    }

    // Update session
    session.status = 'completed';
    session.completedAt = new Date();
    session.paymentMethod = params.paymentMethod as IGoSession['paymentMethod'];
    session.paymentId = params.paymentId;

    if (params.exitLocation) {
      session.location = {
        ...session.location,
        exitLat: params.exitLocation.lat,
        exitLng: params.exitLocation.lng,
      };
    }

    // Calculate final totals
    this.recalculateTotals(session);

    await session.save();

    // Update store stats
    await GoStore.updateOne(
      { storeId: session.storeId },
      {
        $inc: {
          'stats.totalRevenue': session.total,
        },
        $set: {
          'stats.avgCartValue': 0, // Will be recalculated
        },
      }
    );

    return session;
  }

  /**
   * Cancel session
   */
  async cancelSession(sessionId: string, userId: string, reason?: string): Promise<IGoSession | null> {
    const session = await GoSession.findOne({ sessionId, userId, status: 'active' });

    if (!session) {
      throw new Error('Session not found or already completed');
    }

    session.status = 'cancelled';
    session.cancelledAt = new Date();
    session.metadata = { cancelReason: reason };

    await session.save();

    return session;
  }

  /**
   * Mark session for syncing
   */
  async markForSync(sessionId: string): Promise<void> {
    await GoSession.updateOne(
      { sessionId },
      {
        status: 'syncing',
        lastActivityAt: new Date(),
      }
    );
  }

  /**
   * Get sessions with filters
   */
  async getSessions(filters: SessionFilters): Promise<{
    sessions: IGoSession[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      userId,
      storeId,
      merchantId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const query: Record<string, unknown> = {};

    if (userId) query.userId = userId;
    if (storeId) query.storeId = storeId;
    if (merchantId) query.merchantId = merchantId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.startedAt = {};
      if (startDate) (query.startedAt as Record<string, Date>).$gte = startDate;
      if (endDate) (query.startedAt as Record<string, Date>).$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      GoSession.find(query)
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit),
      GoSession.countDocuments(query),
    ]);

    return {
      sessions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user's session history
   */
  async getUserHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ sessions: IGoSession[]; total: number }> {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      GoSession.find({ userId, status: { $in: ['completed', 'cancelled'] } })
        .sort({ completedAt: -1, cancelledAt: -1 })
        .skip(skip)
        .limit(limit),
      GoSession.countDocuments({
        userId,
        status: { $in: ['completed', 'cancelled'] },
      }),
    ]);

    return { sessions, total };
  }

  /**
   * Recalculate session totals
   */
  recalculateTotals(session: IGoSession): void {
    // Calculate subtotal
    session.subtotal = session.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate cashback
    session.cashbackEarned = session.items.reduce(
      (sum, item) => sum + (item.cashbackAmount || 0) * item.quantity,
      0
    );

    // Calculate tax
    const storeTaxRate = 0.18; // Default 18% GST
    session.tax = Math.round(session.subtotal * (storeTaxRate / 100) * 100) / 100;

    // Calculate total
    session.total = session.subtotal + session.tax;

    // Calculate savings
    const totalMRP = session.items.reduce(
      (sum, item) => sum + (item.mrp || item.price) * item.quantity,
      0
    );

    session.savings = {
      totalMRP,
      totalPaid: session.subtotal,
      cashbackEarned: session.cashbackEarned,
      totalSaved: totalMRP - session.subtotal + session.cashbackEarned,
      coinsRedeemed: session.coinsRedeemed,
    };

    session.lastActivityAt = new Date();
  }
}

export const sessionService = new SessionService();
