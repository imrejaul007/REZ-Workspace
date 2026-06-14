import { Client, ClientDocument, Deal, Proposal, Invoice } from '../models/index.js';
import { ActivityModel } from '../models/Activity.js';
import { Contact } from '../types/index.js';
import { generateId } from '../utils/index.js';
import { createClientSchema, updateClientSchema, addContactSchema, clientFiltersSchema } from '../utils/validators.js';
import { ZodError } from 'zod';

export class ClientService {
  /**
   * Create a new client
   */
  async create(data: unknown, tenantId: string): Promise<ClientDocument> {
    const validated = createClientSchema.parse(data);

    const client = new Client({
      ...validated,
      tenantId,
      clientId: `CLIENT-${Date.now()}`,
      contacts: validated.contacts || [],
    });

    await client.save();

    // Log activity
    await this.logActivity(tenantId, 'created', 'client', client._id.toString(), 'system', {
      companyName: client.companyName,
    });

    return client;
  }

  /**
   * Get all clients with filters and pagination
   */
  async findAll(
    tenantId: string,
    filters: Record<string, unknown>
  ): Promise<{ clients: ClientDocument[]; total: number; page: number; limit: number }> {
    const parsed = clientFiltersSchema.parse(filters);
    const { page, limit, ...query } = parsed;

    const where: Record<string, unknown> = { tenantId };

    if (query.status) where.status = query.status;
    if (query.source) where.source = query.source;
    if (query.industry) where.industry = query.industry;
    if (query.assignedTo) where.assignedTo = query.assignedTo;

    if (query.search) {
      where.$or = [
        { companyName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.minDealValue !== undefined || query.maxDealValue !== undefined) {
      where.dealValue = {};
      if (query.minDealValue !== undefined) (where.dealValue as Record<string, number>).$gte = query.minDealValue;
      if (query.maxDealValue !== undefined) (where.dealValue as Record<string, number>).$lte = query.maxDealValue;
    }

    const [clients, total] = await Promise.all([
      Client.find(where)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean() as unknown as ClientDocument[],
      Client.countDocuments(where),
    ]);

    return { clients, total, page, limit };
  }

  /**
   * Get a single client by ID
   */
  async findById(tenantId: string, clientId: string): Promise<ClientDocument | null> {
    return Client.findOne({ tenantId, _id: clientId }).lean() as Promise<ClientDocument | null>;
  }

  /**
   * Get a single client by clientId
   */
  async findByClientId(tenantId: string, clientId: string): Promise<ClientDocument | null> {
    return Client.findOne({ tenantId, clientId }).lean() as Promise<ClientDocument | null>;
  }

  /**
   * Update a client
   */
  async update(tenantId: string, clientId: string, data: unknown): Promise<ClientDocument | null> {
    const validated = updateClientSchema.parse(data);

    const client = await Client.findOneAndUpdate(
      { tenantId, _id: clientId },
      { $set: validated },
      { new: true, runValidators: true }
    ).lean() as ClientDocument | null;

    if (client) {
      await this.logActivity(tenantId, 'updated', 'client', client._id.toString(), 'system', {
        updatedFields: Object.keys(validated),
      });
    }

    return client;
  }

  /**
   * Archive (soft delete) a client
   */
  async archive(tenantId: string, clientId: string): Promise<boolean> {
    const result = await Client.findOneAndUpdate(
      { tenantId, _id: clientId },
      { $set: { status: 'inactive' } }
    );

    if (result) {
      await this.logActivity(tenantId, 'archived', 'client', clientId, 'system');
    }

    return !!result;
  }

  /**
   * Add a contact to a client
   */
  async addContact(
    tenantId: string,
    clientId: string,
    contactData: unknown
  ): Promise<ClientDocument | null> {
    const validated = addContactSchema.parse(contactData);

    const newContact: Contact = {
      contactId: `CONT-${generateId().substring(0, 8).toUpperCase()}`,
      ...validated,
      createdAt: new Date(),
    };

    const client = await Client.findOneAndUpdate(
      { tenantId, _id: clientId },
      {
        $push: { contacts: newContact },
        $set: validated.isPrimary ? { 'contacts.$[].isPrimary': false } : {},
      },
      { new: true, runValidators: true }
    ).lean() as ClientDocument | null;

    if (client) {
      await this.logActivity(tenantId, 'created', 'client', clientId, 'system', {
        contactId: newContact.contactId,
        action: 'contact_added',
      });
    }

    return client;
  }

  /**
   * Get contacts for a client
   */
  async getContacts(tenantId: string, clientId: string): Promise<Contact[]> {
    const client = await Client.findOne({ tenantId, _id: clientId })
      .select('contacts')
      .lean();
    return (client?.contacts || []) as Contact[];
  }

  /**
   * Update total deal value for a client
   */
  async updateDealValue(tenantId: string, clientId: string): Promise<void> {
    const pipeline = [
      { $match: { tenantId, clientId: clientId } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$value' },
        },
      },
    ];

    const result = await Deal.aggregate(pipeline);
    const totalValue = result[0]?.totalValue || 0;

    await Client.updateOne({ tenantId, clientId: clientId }, { $set: { dealValue: totalValue } });
  }

  /**
   * Get client statistics
   */
  async getStats(tenantId: string, clientId: string): Promise<Record<string, unknown>> {
    const [client, dealCount, proposalCount, invoiceCount, recentActivity] = await Promise.all([
      Client.findOne({ tenantId, _id: clientId }).lean(),
      Deal.countDocuments({ tenantId, clientId }),
      Proposal.countDocuments({ tenantId, clientId }),
      Invoice.countDocuments({ tenantId, clientId }),
      ActivityModel.find({ tenantId, entityType: 'client', entityId: clientId })
        .sort({ date: -1 })
        .limit(10)
        .lean(),
    ]);

    const paidInvoices = await Invoice.find({ tenantId, clientId, status: 'paid' })
      .select('total')
      .lean();
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    return {
      client,
      dealCount,
      proposalCount,
      invoiceCount,
      totalRevenue,
      recentActivity,
    };
  }

  /**
   * Log an activity
   */
  private async logActivity(
    tenantId: string,
    action: string,
    entityType: string,
    entityId: string,
    performedBy: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await ActivityModel.create({
      activityId: `ACT-${generateId().substring(0, 8).toUpperCase()}`,
      tenantId,
      type: action === 'created' ? 'created' : 'updated',
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} ${entityType}`,
      description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${entityType} at ${new Date().toISOString()}`,
      date: new Date(),
      performedBy,
      entityType: entityType as 'client' | 'deal' | 'proposal' | 'invoice',
      entityId,
      metadata,
    });
  }
}

export const clientService = new ClientService();
