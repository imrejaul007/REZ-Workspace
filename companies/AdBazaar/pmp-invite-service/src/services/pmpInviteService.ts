import { v4 as uuidv4 } from 'uuid';
import { PMPInvite, IPMPInvite } from '../models/index.js';
import { config } from '../config/index.js';
import {
  DealType,
  InviteStatus,
  CreateInviteRequest,
  ListInvitesQuery,
  ListDealsQuery,
  PaginatedResponse,
  InviteMetrics,
  WebhookEvent,
} from '../types/index.js';
import { CreateInviteInput, UpdateInviteStatusInput } from '../types/schemas.js';

export interface CreateInviteOptions {
  createdBy: string;
}

export interface AcceptInviteOptions {
  userId: string;
  userRole: 'publisher' | 'advertiser' | 'admin';
}

export interface DeclineInviteOptions {
  userId: string;
  userRole: 'publisher' | 'advertiser' | 'admin';
  message?: string;
}

class PMPInviteService {
  private eventEmitter: Map<string, ((event: WebhookEvent) => void)[]> = new Map();

  /**
   * Create a new PMP invite
   */
  async createInvite(input: CreateInviteInput, options: CreateInviteOptions): Promise<IPMPInvite> {
    const expiryDays = input.expiresInDays || config.invite.defaultExpiryDays;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const invite = new PMPInvite({
      inviteId: this.generateInviteId(),
      publisherId: input.publisherId,
      advertiserId: input.advertiserId,
      dealType: input.dealType,
      dealDetails: {
        name: input.dealDetails.name,
        floorPrice: input.dealDetails.floorPrice,
        currency: input.dealDetails.currency || 'USD',
        targeting: input.dealDetails.targeting,
        startDate: new Date(input.dealDetails.startDate),
        endDate: new Date(input.dealDetails.endDate),
      },
      status: 'pending',
      expiresAt,
      createdBy: options.createdBy,
    });

    await invite.save();

    // Emit event
    this.emitEvent('invite.created', invite.inviteId, {
      invite: invite.toJSON(),
      createdBy: options.createdBy,
    });

    return invite;
  }

  /**
   * Get invite by ID
   */
  async getInviteById(inviteId: string): Promise<IPMPInvite | null> {
    const invite = await PMPInvite.findByInviteId(inviteId);

    if (invite && invite.status === 'pending' && invite.expiresAt < new Date()) {
      invite.status = 'expired';
      await invite.save();
    }

    return invite;
  }

  /**
   * List invites with pagination and filters
   */
  async listInvites(query: ListInvitesQuery): Promise<PaginatedResponse<IPMPInvite>> {
    const {
      status,
      publisherId,
      advertiserId,
      dealType,
      page = 1,
      limit = 20,
    } = query;

    const filter: Record<string, unknown> = {};

    if (status) {
      filter['status'] = status;
    }

    if (publisherId) {
      filter['publisherId'] = publisherId;
    }

    if (advertiserId) {
      filter['advertiserId'] = advertiserId;
    }

    if (dealType) {
      filter['dealType'] = dealType;
    }

    // Count total documents
    const total = await PMPInvite.countDocuments(filter);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch documents
    const invites = await PMPInvite.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Update pending invites that have expired
    await this.updateExpiredInvites();

    return {
      data: invites as IPMPInvite[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Accept an invite
   */
  async acceptInvite(inviteId: string, options: AcceptInviteOptions): Promise<IPMPInvite> {
    const invite = await PMPInvite.findByInviteId(inviteId);

    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.status !== 'pending') {
      throw new Error(`Cannot accept invite with status: ${invite.status}`);
    }

    if (invite.expiresAt < new Date()) {
      invite.status = 'expired';
      await invite.save();
      throw new Error('Invite has expired');
    }

    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await invite.save();

    // Emit event
    this.emitEvent('invite.accepted', invite.inviteId, {
      invite: invite.toJSON(),
      acceptedBy: options.userId,
    });

    return invite;
  }

  /**
   * Decline an invite
   */
  async declineInvite(
    inviteId: string,
    input: UpdateInviteStatusInput,
    options: DeclineInviteOptions
  ): Promise<IPMPInvite> {
    const invite = await PMPInvite.findByInviteId(inviteId);

    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.status !== 'pending') {
      throw new Error(`Cannot decline invite with status: ${invite.status}`);
    }

    if (invite.expiresAt < new Date()) {
      invite.status = 'expired';
      await invite.save();
      throw new Error('Invite has expired');
    }

    invite.status = 'declined';
    invite.declinedAt = new Date();
    invite.declinedMessage = input.message;
    await invite.save();

    // Emit event
    this.emitEvent('invite.declined', invite.inviteId, {
      invite: invite.toJSON(),
      declinedBy: options.userId,
      message: input.message,
    });

    return invite;
  }

  /**
   * List accepted deals (invites with accepted status)
   */
  async listDeals(query: ListDealsQuery): Promise<PaginatedResponse<IPMPInvite>> {
    const {
      publisherId,
      advertiserId,
      dealType,
      page = 1,
      limit = 20,
    } = query;

    const filter: Record<string, unknown> = {
      status: 'accepted',
    };

    if (publisherId) {
      filter['publisherId'] = publisherId;
    }

    if (advertiserId) {
      filter['advertiserId'] = advertiserId;
    }

    if (dealType) {
      filter['dealType'] = dealType;
    }

    const total = await PMPInvite.countDocuments(filter);
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    const deals = await PMPInvite.find(filter)
      .sort({ acceptedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      data: deals as IPMPInvite[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get metrics/analytics
   */
  async getMetrics(): Promise<InviteMetrics> {
    return PMPInvite.getMetrics();
  }

  /**
   * Update expired invites
   */
  async updateExpiredInvites(): Promise<number> {
    const result = await PMPInvite.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    return result.modifiedCount;
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (event: WebhookEvent) => void): void {
    if (!this.eventEmitter.has(event)) {
      this.eventEmitter.set(event, []);
    }
    this.eventEmitter.get(event)?.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: (event: WebhookEvent) => void): void {
    const callbacks = this.eventEmitter.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Generate unique invite ID
   */
  private generateInviteId(): string {
    return `PMP-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * Emit event to subscribers
   */
  private emitEvent(eventType: WebhookEvent['eventType'], inviteId: string, data: Record<string, unknown>): void {
    const event: WebhookEvent = {
      eventType,
      inviteId,
      timestamp: new Date(),
      data,
    };

    const callbacks = this.eventEmitter.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }

    // Also emit to wildcard subscribers
    const wildcardCallbacks = this.eventEmitter.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach((callback) => callback(event));
    }
  }
}

export const pmpInviteService = new PMPInviteService();