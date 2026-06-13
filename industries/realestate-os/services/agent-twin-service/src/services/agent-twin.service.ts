import { AgentTwinModel, IAgentTwin } from '../models/index.js';
import { getEventEmitter, AgentTwinEventType } from '../events/index.js';
import {
  CreateAgentTwinRequest,
  UpdateAgentTwinRequest,
  UpdatePerformanceRequest,
  UpdateAvailabilityRequest,
  UpdateLeadPreferencesRequest,
  AgentTwin,
} from '../schemas/index.js';

// ============================================================================
// AGENT TWIN SERVICE
// ============================================================================

export interface AgentTwinQuery {
  brokerage_id?: string;
  status?: 'available' | 'busy' | 'unavailable';
  area?: string;
  property_type?: string;
  min_budget?: number;
  max_budget?: number;
  lead_routing_enabled?: boolean;
  page?: number;
  limit?: number;
}

export interface AgentStats {
  total_agents: number;
  by_status: Record<string, number>;
  by_property_type: Record<string, number>;
  avg_transactions_ytd: number;
  avg_rating: number;
  total_volume_ytd: number;
}

export class AgentTwinService {
  private eventEmitter = getEventEmitter();

  /**
   * Create a new agent twin
   */
  async create(data: CreateAgentTwinRequest): Promise<AgentTwin> {
    // Check if agent already exists
    const existing = await AgentTwinModel.findOne({ agent_id: data.agent_id });
    if (existing) {
      throw new Error(`Agent twin already exists for agent_id: ${data.agent_id}`);
    }

    const twin_id = `twin.realestate.agent.${data.agent_id}`;
    const now = new Date();

    const agentTwin = new AgentTwinModel({
      ...data,
      twin_id,
      profile: {
        name: data.profile.name,
        photo_url: data.profile.photo_url || '',
        bio: data.profile.bio || '',
        languages: data.profile.languages || [],
        specialties: data.profile.specialties || [],
        license_number: data.profile.license_number,
        license_state: data.profile.license_state,
        license_expiration: new Date(data.profile.license_expiration),
      },
      contact: {
        phone: data.contact.phone,
        email: data.contact.email,
        website: data.contact.website || null,
        social: data.contact.social || {},
      },
      brokerage: {
        brokerage_id: data.brokerage.brokerage_id,
        brokerage_name: data.brokerage.brokerage_name,
        brokerage_address: data.brokerage.brokerage_address || '',
        team_name: data.brokerage.team_name || null,
      },
      performance: {
        ...data.performance,
        transactions_ytd: data.performance?.transactions_ytd ?? 0,
        volume_ytd: data.performance?.volume_ytd ?? 0,
        avg_days_to_close: data.performance?.avg_days_to_close ?? 0,
        list_to_sale_ratio: data.performance?.list_to_sale_ratio ?? 0,
        client_rating: data.performance?.client_rating ?? 0,
        review_count: data.performance?.review_count ?? 0,
        recommendation_rate: data.performance?.recommendation_rate ?? 0,
      },
      expertise: {
        ...data.expertise,
        areas: data.expertise?.areas ?? [],
        property_types: data.expertise?.property_types ?? [],
        price_ranges: data.expertise?.price_ranges ?? { min: 0, max: 0 },
        years_experience: data.expertise?.years_experience ?? 0,
      },
      availability: {
        ...data.availability,
        status: data.availability?.status ?? 'available',
        response_time_avg_minutes: data.availability?.response_time_avg_minutes ?? 0,
        working_hours: data.availability?.working_hours ?? {},
      },
      lead_preferences: {
        ...data.lead_preferences,
        min_budget: data.lead_preferences?.min_budget ?? 0,
        max_budget: data.lead_preferences?.max_budget ?? 0,
        property_types: data.lead_preferences?.property_types ?? [],
        areas: data.lead_preferences?.areas ?? [],
        lead_routing_enabled: data.lead_preferences?.lead_routing_enabled ?? true,
      },
      compensation: {
        ...data.compensation,
        commission_split: data.compensation?.commission_split ?? 70,
        referral_fee_rate: data.compensation?.referral_fee_rate ?? 25,
      },
      active_listings: [],
      active_deals: [],
      version: 1,
      created_at: now,
      updated_at: now,
    });

    await agentTwin.save();

    // Emit event
    await this.eventEmitter.emit(AgentTwinEventType.AGENT_TWIN_CREATED, twin_id, {
      agent_id: data.agent_id,
      profile: data.profile,
      brokerage: data.brokerage,
    });

    return this.toAgentTwin(agentTwin);
  }

  /**
   * Get agent twin by ID
   */
  async getById(agent_id: string): Promise<AgentTwin | null> {
    const twin = await AgentTwinModel.findOne({ agent_id });
    if (!twin) return null;
    return this.toAgentTwin(twin);
  }

  /**
   * Get agent twin by twin_id
   */
  async getByTwinId(twin_id: string): Promise<AgentTwin | null> {
    const twin = await AgentTwinModel.findOne({ twin_id });
    if (!twin) return null;
    return this.toAgentTwin(twin);
  }

  /**
   * List agent twins with pagination and filters
   */
  async list(query: AgentTwinQuery = {}): Promise<{ twins: AgentTwin[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.brokerage_id) filter['brokerage.brokerage_id'] = query.brokerage_id;
    if (query.status) filter['availability.status'] = query.status;
    if (query.area) filter['expertise.areas'] = query.area;
    if (query.property_type) filter['expertise.property_types'] = query.property_type;
    if (query.lead_routing_enabled !== undefined) filter['lead_preferences.lead_routing_enabled'] = query.lead_routing_enabled;
    if (query.min_budget) filter['lead_preferences.min_budget'] = { $lte: query.min_budget };
    if (query.max_budget) filter['lead_preferences.max_budget'] = { $gte: query.max_budget };

    const [twins, total] = await Promise.all([
      AgentTwinModel.find(filter).skip(skip).limit(limit).sort({ 'performance.volume_ytd': -1 }),
      AgentTwinModel.countDocuments(filter),
    ]);

    return {
      twins: twins.map(t => this.toAgentTwin(t)),
      total,
      page,
      limit,
    };
  }

  /**
   * Find agents matching lead criteria
   */
  async findMatchingAgents(
    criteria: {
      budget?: { min?: number; max?: number };
      property_types?: string[];
      areas?: string[];
    },
    limit: number = 5
  ): Promise<AgentTwin[]> {
    const filter: Record<string, unknown> = {
      'availability.status': 'available',
      'lead_preferences.lead_routing_enabled': true,
    };

    if (criteria.budget?.min) {
      filter['lead_preferences.min_budget'] = { $lte: criteria.budget.min };
    }
    if (criteria.budget?.max) {
      filter['lead_preferences.max_budget'] = { $gte: criteria.budget.max };
    }
    if (criteria.property_types?.length) {
      filter['expertise.property_types'] = { $in: criteria.property_types };
    }
    if (criteria.areas?.length) {
      filter['expertise.areas'] = { $in: criteria.areas };
    }

    const agents = await AgentTwinModel.find(filter)
      .limit(limit)
      .sort({ 'performance.client_rating': -1, 'performance.transactions_ytd': -1 });

    return agents.map(t => this.toAgentTwin(t));
  }

  /**
   * Update agent twin
   */
  async update(agent_id: string, data: UpdateAgentTwinRequest): Promise<AgentTwin | null> {
    const updateData: Record<string, unknown> = {};
    const changes: Record<string, unknown> = {};

    // Build update data based on provided fields
    if (data.profile) {
      updateData.profile = data.profile;
      changes.profile = data.profile;
    }
    if (data.contact) {
      updateData.contact = data.contact;
      changes.contact = data.contact;
    }
    if (data.brokerage) {
      updateData.brokerage = data.brokerage;
      changes.brokerage = data.brokerage;
    }
    if (data.expertise) {
      updateData.expertise = data.expertise;
      changes.expertise = data.expertise;
    }
    if (data.availability) {
      updateData.availability = data.availability;
      changes.availability = data.availability;
    }
    if (data.lead_preferences) {
      updateData.lead_preferences = data.lead_preferences;
      changes.lead_preferences = data.lead_preferences;
    }
    if (data.compensation) {
      updateData.compensation = data.compensation;
      changes.compensation = data.compensation;
    }

    const twin = await AgentTwinModel.findOneAndUpdate(
      { agent_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!twin) return null;

    await this.eventEmitter.emit(AgentTwinEventType.AGENT_TWIN_UPDATED, twin.twin_id, {
      agent_id,
      changes,
    });

    return this.toAgentTwin(twin);
  }

  /**
   * Update agent performance
   */
  async updatePerformance(agent_id: string, data: UpdatePerformanceRequest): Promise<AgentTwin | null> {
    const twin = await AgentTwinModel.findOne({ agent_id });
    if (!twin) return null;

    const updateData: Record<string, unknown> = {};
    Object.keys(data).forEach(key => {
      if (data[key as keyof UpdatePerformanceRequest] !== undefined) {
        updateData[`performance.${key}`] = data[key as keyof UpdatePerformanceRequest];
      }
    });

    const updated = await AgentTwinModel.findOneAndUpdate(
      { agent_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(AgentTwinEventType.AGENT_PERFORMANCE_UPDATED, twin.twin_id, {
      agent_id,
      performance: data,
    });

    return this.toAgentTwin(updated);
  }

  /**
   * Update agent availability
   */
  async updateAvailability(agent_id: string, data: UpdateAvailabilityRequest): Promise<AgentTwin | null> {
    const twin = await AgentTwinModel.findOne({ agent_id });
    if (!twin) return null;

    const previousStatus = twin.availability.status;
    const updateData: Record<string, unknown> = {};

    if (data.status) {
      updateData['availability.status'] = data.status;
    }
    if (data.working_hours) {
      updateData['availability.working_hours'] = data.working_hours;
    }

    const updated = await AgentTwinModel.findOneAndUpdate(
      { agent_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated) return null;

    // Emit status change event if status changed
    if (data.status && data.status !== previousStatus) {
      await this.eventEmitter.emit(AgentTwinEventType.AGENT_STATUS_CHANGED, twin.twin_id, {
        agent_id,
        previous_status: previousStatus,
        new_status: data.status,
      });
    }

    await this.eventEmitter.emit(AgentTwinEventType.AGENT_AVAILABILITY_UPDATED, twin.twin_id, {
      agent_id,
      status: updated.availability.status,
      previous_status: previousStatus,
    });

    return this.toAgentTwin(updated);
  }

  /**
   * Update lead preferences
   */
  async updateLeadPreferences(agent_id: string, data: UpdateLeadPreferencesRequest): Promise<AgentTwin | null> {
    const twin = await AgentTwinModel.findOne({ agent_id });
    if (!twin) return null;

    const updateData: Record<string, unknown> = {};
    Object.keys(data).forEach(key => {
      if (data[key as keyof UpdateLeadPreferencesRequest] !== undefined) {
        updateData[`lead_preferences.${key}`] = data[key as keyof UpdateLeadPreferencesRequest];
      }
    });

    const updated = await AgentTwinModel.findOneAndUpdate(
      { agent_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(AgentTwinEventType.AGENT_LEAD_PREFERENCES_UPDATED, twin.twin_id, {
      agent_id,
      lead_preferences: data,
    });

    return this.toAgentTwin(updated);
  }

  /**
   * Add listing to agent
   */
  async addListing(agent_id: string, listing_id: string): Promise<AgentTwin | null> {
    const twin = await AgentTwinModel.findOne({ agent_id });
    if (!twin) return null;

    // Check if already exists
    if (twin.active_listings.includes(listing_id)) {
      return this.toAgentTwin(twin);
    }

    const updated = await AgentTwinModel.findOneAndUpdate(
      { agent_id },
      {
        $addToSet: { active_listings: listing_id },
        $set: { updated_at: new Date() },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(AgentTwinEventType.AGENT_LISTING_ADDED, twin.twin_id, {
      agent_id,
      listing_id,
    });

    return this.toAgentTwin(updated);
  }

  /**
   * Remove listing from agent
   */
  async removeListing(agent_id: string, listing_id: string): Promise<AgentTwin | null> {
    const twin = await AgentTwinModel.findOne({ agent_id });
    if (!twin) return null;

    const updated = await AgentTwinModel.findOneAndUpdate(
      { agent_id },
      {
        $pull: { active_listings: listing_id },
        $set: { updated_at: new Date() },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(AgentTwinEventType.AGENT_LISTING_REMOVED, twin.twin_id, {
      agent_id,
      listing_id,
    });

    return this.toAgentTwin(updated);
  }

  /**
   * Add deal to agent
   */
  async addDeal(agent_id: string, deal_id: string): Promise<AgentTwin | null> {
    const twin = await AgentTwinModel.findOne({ agent_id });
    if (!twin) return null;

    // Check if already exists
    if (twin.active_deals.includes(deal_id)) {
      return this.toAgentTwin(twin);
    }

    const updated = await AgentTwinModel.findOneAndUpdate(
      { agent_id },
      {
        $addToSet: { active_deals: deal_id },
        $set: { updated_at: new Date() },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(AgentTwinEventType.AGENT_DEAL_ADDED, twin.twin_id, {
      agent_id,
      deal_id,
    });

    return this.toAgentTwin(updated);
  }

  /**
   * Remove deal from agent
   */
  async removeDeal(agent_id: string, deal_id: string): Promise<AgentTwin | null> {
    const twin = await AgentTwinModel.findOne({ agent_id });
    if (!twin) return null;

    const updated = await AgentTwinModel.findOneAndUpdate(
      { agent_id },
      {
        $pull: { active_deals: deal_id },
        $set: { updated_at: new Date() },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(AgentTwinEventType.AGENT_DEAL_REMOVED, twin.twin_id, {
      agent_id,
      deal_id,
    });

    return this.toAgentTwin(updated);
  }

  /**
   * Get agent statistics
   */
  async getStats(brokerage_id?: string): Promise<AgentStats> {
    const filter: Record<string, unknown> = {};
    if (brokerage_id) filter['brokerage.brokerage_id'] = brokerage_id;

    const [statusAgg, propertyTypeAgg, perfAgg] = await Promise.all([
      AgentTwinModel.aggregate([
        { $match: filter },
        { $group: { _id: '$availability.status', count: { $sum: 1 } } },
      ]),
      AgentTwinModel.aggregate([
        { $match: filter },
        { $unwind: '$expertise.property_types' },
        { $group: { _id: '$expertise.property_types', count: { $sum: 1 } } },
      ]),
      AgentTwinModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total_agents: { $sum: 1 },
            avg_transactions: { $avg: '$performance.transactions_ytd' },
            avg_rating: { $avg: '$performance.client_rating' },
            total_volume: { $sum: '$performance.volume_ytd' },
          },
        },
      ]),
    ]);

    const by_status: Record<string, number> = {};
    statusAgg.forEach(s => {
      by_status[s._id] = s.count;
    });

    const by_property_type: Record<string, number> = {};
    propertyTypeAgg.forEach(p => {
      by_property_type[p._id] = p.count;
    });

    return {
      total_agents: perfAgg[0]?.total_agents || 0,
      by_status,
      by_property_type,
      avg_transactions_ytd: perfAgg[0]?.avg_transactions || 0,
      avg_rating: perfAgg[0]?.avg_rating || 0,
      total_volume_ytd: perfAgg[0]?.total_volume || 0,
    };
  }

  /**
   * Delete agent twin
   */
  async delete(agent_id: string): Promise<boolean> {
    const result = await AgentTwinModel.deleteOne({ agent_id });
    return result.deletedCount > 0;
  }

  /**
   * Convert Mongoose document to plain AgentTwin object
   */
  private toAgentTwin(doc: IAgentTwin): AgentTwin {
    return {
      agent_id: doc.agent_id,
      twin_id: doc.twin_id,
      profile: {
        name: {
          first: doc.profile.name.first,
          last: doc.profile.name.last,
          prefix: doc.profile.name.prefix,
        },
        photo_url: doc.profile.photo_url,
        bio: doc.profile.bio,
        languages: doc.profile.languages,
        specialties: doc.profile.specialties,
        license_number: doc.profile.license_number,
        license_state: doc.profile.license_state,
        license_expiration: doc.profile.license_expiration.toISOString(),
      },
      contact: {
        phone: doc.contact.phone,
        email: doc.contact.email,
        website: doc.contact.website,
        social: doc.contact.social,
      },
      brokerage: {
        brokerage_id: doc.brokerage.brokerage_id,
        brokerage_name: doc.brokerage.brokerage_name,
        brokerage_address: doc.brokerage.brokerage_address,
        team_name: doc.brokerage.team_name,
      },
      performance: {
        transactions_ytd: doc.performance.transactions_ytd,
        volume_ytd: doc.performance.volume_ytd,
        avg_days_to_close: doc.performance.avg_days_to_close,
        list_to_sale_ratio: doc.performance.list_to_sale_ratio,
        client_rating: doc.performance.client_rating,
        review_count: doc.performance.review_count,
        recommendation_rate: doc.performance.recommendation_rate,
      },
      expertise: {
        areas: doc.expertise.areas,
        property_types: doc.expertise.property_types as AgentTwin['expertise']['property_types'],
        price_ranges: {
          min: doc.expertise.price_ranges.min,
          max: doc.expertise.price_ranges.max,
        },
        years_experience: doc.expertise.years_experience,
      },
      availability: {
        status: doc.availability.status,
        response_time_avg_minutes: doc.availability.response_time_avg_minutes,
        working_hours: doc.availability.working_hours,
      },
      lead_preferences: {
        min_budget: doc.lead_preferences.min_budget,
        max_budget: doc.lead_preferences.max_budget,
        property_types: doc.lead_preferences.property_types as AgentTwin['lead_preferences']['property_types'],
        areas: doc.lead_preferences.areas,
        lead_routing_enabled: doc.lead_preferences.lead_routing_enabled,
      },
      compensation: {
        commission_split: doc.compensation.commission_split,
        referral_fee_rate: doc.compensation.referral_fee_rate,
      },
      active_listings: doc.active_listings,
      active_deals: doc.active_deals,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
      version: doc.version,
    };
  }
}

export const agentTwinService = new AgentTwinService();