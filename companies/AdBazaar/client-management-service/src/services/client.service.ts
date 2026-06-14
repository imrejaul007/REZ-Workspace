import { v4 as uuidv4 } from 'uuid';
import { Client, IClient } from '../models';
import { logger, clientOperationsTotal, activeClientsGauge, totalBudgetGauge, totalSpendGauge, avgROASGauge } from '../utils';
import { ClientQuery, ApiResponse, ClientProfile, PaginationMeta } from '../types';
import mongoose from 'mongoose';

export class ClientService {
  /**
   * Create a new client
   */
  async createClient(data: {
    name: string;
    industry: string;
    agencyId: string;
    status?: 'active' | 'inactive' | 'prospect' | 'churned';
    budget?: {
      monthly?: number;
      quarterly?: number;
      yearly?: number;
      currency?: string;
    };
    metadata?: {
      website?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
      };
      social?: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
      };
    };
    tags?: string[];
  }): Promise<ClientProfile> {
    const startTime = Date.now();

    try {
      const clientId = `client_${uuidv4()}`;

      const client = new Client({
        clientId,
        name: data.name,
        industry: data.industry,
        agencyId: data.agencyId,
        status: data.status || 'prospect',
        budget: {
          monthly: data.budget?.monthly || 0,
          quarterly: data.budget?.quarterly || 0,
          yearly: data.budget?.yearly || 0,
          currency: data.budget?.currency || 'INR',
        },
        metadata: data.metadata || {},
        tags: data.tags || [],
        contacts: [],
        campaigns: [],
        spending: {
          total: 0,
          currentMonth: 0,
          lastMonth: 0,
          ytd: 0,
        },
        performance: {
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          avgCTR: 0,
          avgCPC: 0,
          avgROAS: 0,
        },
        notes: '',
      });

      await client.save();

      // Update metrics
      activeClientsGauge.inc({ agency_id: data.agencyId, status: data.status || 'prospect' });
      if (data.budget?.monthly) {
        totalBudgetGauge.inc({ agency_id: data.agencyId }, data.budget.monthly);
      }

      clientOperationsTotal.inc({ operation: 'create', status: 'success' });
      logger.info('Client created', { clientId, name: data.name, agencyId: data.agencyId });

      return this.formatClient(client);
    } catch (error) {
      clientOperationsTotal.inc({ operation: 'create', status: 'error' });
      logger.error('Failed to create client', { error, data });
      throw error;
    }
  }

  /**
   * Get client by ID
   */
  async getClient(clientId: string): Promise<ClientProfile | null> {
    try {
      const client = await Client.findOne({ clientId });

      if (!client) {
        logger.warn('Client not found', { clientId });
        return null;
      }

      return this.formatClient(client);
    } catch (error) {
      logger.error('Failed to get client', { error, clientId });
      throw error;
    }
  }

  /**
   * Get client by MongoDB _id
   */
  async getClientById(id: string): Promise<ClientProfile | null> {
    try {
      const client = await Client.findById(id);

      if (!client) {
        return null;
      }

      return this.formatClient(client);
    } catch (error) {
      logger.error('Failed to get client by ID', { error, id });
      throw error;
    }
  }

  /**
   * List clients with pagination and filters
   */
  async listClients(query: ClientQuery, agencyId?: string): Promise<{ clients: ClientProfile[]; meta: PaginationMeta }> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        industry,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      const filter: any = {};

      // Agency filter
      if (agencyId) {
        filter.agencyId = agencyId;
      }

      // Status filter
      if (status) {
        filter.status = status;
      }

      // Industry filter
      if (industry) {
        filter.industry = industry;
      }

      // Search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { industry: { $regex: search, $options: 'i' } },
        ];
      }

      // Sort options
      const sortOptions: any = {};
      if (sortBy === 'spending.total') {
        sortOptions['spending.total'] = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'performance.avgROAS') {
        sortOptions['performance.avgROAS'] = sortOrder === 'asc' ? 1 : -1;
      } else {
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [clients, total] = await Promise.all([
        Client.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Client.countDocuments(filter),
      ]);

      return {
        clients: clients.map(c => this.formatClient(c as IClient)),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to list clients', { error, query });
      throw error;
    }
  }

  /**
   * Update client
   */
  async updateClient(
    clientId: string,
    data: {
      name?: string;
      industry?: string;
      status?: 'active' | 'inactive' | 'prospect' | 'churned';
      budget?: {
        monthly?: number;
        quarterly?: number;
        yearly?: number;
        currency?: string;
      };
      tags?: string[];
      metadata?: any;
    }
  ): Promise<ClientProfile | null> {
    const startTime = Date.now();

    try {
      const client = await Client.findOne({ clientId });

      if (!client) {
        logger.warn('Client not found for update', { clientId });
        return null;
      }

      // Update fields
      if (data.name) client.name = data.name;
      if (data.industry) client.industry = data.industry;
      if (data.status) {
        const oldStatus = client.status;
        client.status = data.status;

        // Update metrics
        activeClientsGauge.dec({ agency_id: client.agencyId, status: oldStatus });
        activeClientsGauge.inc({ agency_id: client.agencyId, status: data.status });
      }
      if (data.budget) {
        client.budget = {
          ...client.budget.toObject(),
          ...data.budget,
        };
      }
      if (data.tags) client.tags = data.tags;
      if (data.metadata) {
        client.metadata = {
          ...client.metadata.toObject(),
          ...data.metadata,
        };
      }

      await client.save();

      clientOperationsTotal.inc({ operation: 'update', status: 'success' });
      logger.info('Client updated', { clientId, updates: Object.keys(data) });

      return this.formatClient(client);
    } catch (error) {
      clientOperationsTotal.inc({ operation: 'update', status: 'error' });
      logger.error('Failed to update client', { error, clientId });
      throw error;
    }
  }

  /**
   * Delete client
   */
  async deleteClient(clientId: string): Promise<boolean> {
    try {
      const client = await Client.findOneAndDelete({ clientId });

      if (!client) {
        return false;
      }

      activeClientsGauge.dec({ agency_id: client.agencyId, status: client.status });
      clientOperationsTotal.inc({ operation: 'delete', status: 'success' });
      logger.info('Client deleted', { clientId });

      return true;
    } catch (error) {
      clientOperationsTotal.inc({ operation: 'delete', status: 'error' });
      logger.error('Failed to delete client', { error, clientId });
      throw error;
    }
  }

  /**
   * Get client statistics
   */
  async getClientStats(agencyId?: string): Promise<any> {
    try {
      const filter = agencyId ? { agencyId } : {};

      const [total, active, prospect, churned, totalBudget, totalSpend] = await Promise.all([
        Client.countDocuments(filter),
        Client.countDocuments({ ...filter, status: 'active' }),
        Client.countDocuments({ ...filter, status: 'prospect' }),
        Client.countDocuments({ ...filter, status: 'churned' }),
        Client.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$budget.monthly' } } },
        ]),
        Client.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$spending.total' } } },
        ]),
      ]);

      return {
        total,
        active,
        prospect,
        churned,
        totalBudget: totalBudget[0]?.total || 0,
        totalSpend: totalSpend[0]?.total || 0,
      };
    } catch (error) {
      logger.error('Failed to get client stats', { error });
      throw error;
    }
  }

  /**
   * Format client document to profile
   */
  private formatClient(client: any): ClientProfile {
    return {
      clientId: client.clientId,
      name: client.name,
      industry: client.industry,
      agencyId: client.agencyId,
      status: client.status,
      contacts: [],
      campaigns: [],
      budget: client.budget?.toObject ? client.budget.toObject() : client.budget,
      spending: client.spending?.toObject ? client.spending.toObject() : client.spending,
      performance: client.performance?.toObject ? client.performance.toObject() : client.performance,
      metadata: client.metadata?.toObject ? client.metadata.toObject() : client.metadata || {},
      tags: client.tags || [],
      notes: client.notes || '',
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }
}

export const clientService = new ClientService();
export default clientService;