import { Client, IClient } from '../models';
import { logger } from '../utils/logger';
import { clientCreateSchema, clientUpdateSchema, ClientCreate, ClientUpdate } from '../utils/helpers';
import { agencyService } from './agencyService';

export class ClientService {
  /**
   * Add a new client to agency
   */
  async addClient(agencyId: string, data: ClientCreate): Promise<IClient> {
    try {
      const validatedData = clientCreateSchema.parse(data);

      const client = new Client({
        ...validatedData,
        agencyId,
        status: 'active',
        totalSpend: 0
      });

      await client.save();

      // Update agency stats
      await agencyService.updateAgencyStats(agencyId, {
        totalClients: 1,
        activeClients: 1
      });

      logger.info(`Client added to agency: ${agencyId}`, {
        agencyId,
        clientId: client._id,
        clientName: client.name
      });

      return client;
    } catch (error) {
      logger.error('Failed to add client', { agencyId, error });
      throw error;
    }
  }

  /**
   * Get client by ID
   */
  async getClientById(clientId: string): Promise<IClient | null> {
    try {
      return await Client.findById(clientId);
    } catch (error) {
      logger.error('Failed to get client', { clientId, error });
      throw error;
    }
  }

  /**
   * List clients for agency
   */
  async listClients(agencyId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    company?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ clients: IClient[]; total: number; page: number; limit: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        company,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const query: any = { agencyId };
      if (status) query.status = status;
      if (company) query.company = { $regex: company, $options: 'i' };

      const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [clients, total] = await Promise.all([
        Client.find(query)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Client.countDocuments(query)
      ]);

      return { clients: clients as IClient[], total, page, limit };
    } catch (error) {
      logger.error('Failed to list clients', { agencyId, error });
      throw error;
    }
  }

  /**
   * Update client
   */
  async updateClient(clientId: string, data: ClientUpdate): Promise<IClient | null> {
    try {
      const validatedData = clientUpdateSchema.parse(data);

      const client = await Client.findByIdAndUpdate(
        clientId,
        { $set: validatedData },
        { new: true, runValidators: true }
      );

      if (client) {
        logger.info(`Client updated: ${clientId}`);
      }

      return client;
    } catch (error) {
      logger.error('Failed to update client', { clientId, error });
      throw error;
    }
  }

  /**
   * Delete client
   */
  async deleteClient(agencyId: string, clientId: string): Promise<boolean> {
    try {
      const client = await Client.findOneAndDelete({ _id: clientId, agencyId });

      if (client) {
        // Update agency stats
        await agencyService.updateAgencyStats(agencyId, {
          totalClients: -1,
          activeClients: client.status === 'active' ? -1 : 0
        });

        logger.info(`Client deleted: ${clientId}`, { agencyId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete client', { agencyId, clientId, error });
      throw error;
    }
  }

  /**
   * Add campaign to client
   */
  async addCampaignToClient(
    clientId: string,
    campaign: {
      campaignId: string;
      name: string;
      budget: number;
      startDate: Date;
      endDate?: Date;
    }
  ): Promise<IClient | null> {
    try {
      const client = await Client.findByIdAndUpdate(
        clientId,
        {
          $push: {
            campaigns: {
              ...campaign,
              status: 'draft',
              spend: 0
            }
          },
          $inc: { 'budget.total': campaign.budget }
        },
        { new: true }
      );

      if (client) {
        logger.info(`Campaign added to client: ${clientId}`, {
          clientId,
          campaignId: campaign.campaignId
        });
      }

      return client;
    } catch (error) {
      logger.error('Failed to add campaign to client', { clientId, error });
      throw error;
    }
  }

  /**
   * Update campaign in client
   */
  async updateClientCampaign(
    clientId: string,
    campaignId: string,
    updates: Partial<{
      status: string;
      budget: number;
      spend: number;
      endDate: Date;
    }>
  ): Promise<IClient | null> {
    try {
      const updateOps: any = {};

      if (updates.status) {
        updateOps['campaigns.$.status'] = updates.status;
      }
      if (updates.budget) {
        updateOps['campaigns.$.budget'] = updates.budget;
      }
      if (updates.spend) {
        updateOps['campaigns.$.spend'] = updates.spend;
      }
      if (updates.endDate) {
        updateOps['campaigns.$.endDate'] = updates.endDate;
      }

      const client = await Client.findOneAndUpdate(
        { _id: clientId, 'campaigns.campaignId': campaignId },
        { $set: updateOps },
        { new: true }
      );

      return client;
    } catch (error) {
      logger.error('Failed to update client campaign', { clientId, campaignId, error });
      throw error;
    }
  }

  /**
   * Get client performance metrics
   */
  async getClientPerformance(clientId: string): Promise<any> {
    try {
      const client = await Client.findById(clientId);

      if (!client) {
        return null;
      }

      const activeCampaigns = client.campaigns.filter(c => c.status === 'active');
      const totalBudget = client.budget.total;
      const totalSpend = client.totalSpend;
      const utilizationRate = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

      return {
        clientId: client._id,
        name: client.name,
        company: client.company,
        status: client.status,
        budget: client.budget,
        totalSpend,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        campaigns: {
          total: client.campaigns.length,
          active: activeCampaigns.length,
          details: client.campaigns
        },
        roi: totalSpend > 0 ? ((totalBudget - totalSpend) / totalSpend) * 100 : 0
      };
    } catch (error) {
      logger.error('Failed to get client performance', { clientId, error });
      throw error;
    }
  }
}

export const clientService = new ClientService();