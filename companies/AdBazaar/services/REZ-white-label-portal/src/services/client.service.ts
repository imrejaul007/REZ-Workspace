import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { 
  Client, 
  ClientSettings, 
  ClientContact,
  ClientStatus,
  CreateClientSchema,
  PaginatedResult,
  PaginationParams 
} from '../types';
import logger from '../utils/logger';

const clientLogger = logger.child({ component: 'ClientService' });

// In-memory storage (replace with database in production)
const clients: Map<string, Client> = new Map();

const DEFAULT_CLIENT_SETTINGS: ClientSettings = {
  reportFrequency: 'monthly',
  currency: 'USD',
  timezone: 'UTC',
  language: 'en',
  emailNotifications: true,
  dashboardView: 'expanded',
};

export class ClientService {
  // Create a new client
  async createClient(data: z.infer<typeof CreateClientSchema>): Promise<Client> {
    clientLogger.info('Creating client', { tenantId: data.tenantId, name: data.name });
    
    const clientId = uuidv4();
    
    // Generate primary contact if not provided
    const contacts: ClientContact[] = data.contacts?.length 
      ? data.contacts.map(c => ({ ...c, id: uuidv4() }))
      : [{
          id: uuidv4(),
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: 'Primary Contact',
          isPrimary: true,
        }];
    
    const client: Client = {
      id: clientId,
      tenantId: data.tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      logoUrl: data.logoUrl,
      status: data.status || 'pending',
      industry: data.industry,
      website: data.website,
      address: data.address,
      contacts,
      settings: { ...DEFAULT_CLIENT_SETTINGS, ...data.settings },
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    clients.set(clientId, client);
    return client;
  }

  // Get client by ID
  async getClient(id: string): Promise<Client | null> {
    return clients.get(id) || null;
  }

  // Get client by email
  async getClientByEmail(email: string): Promise<Client | null> {
    for (const client of clients.values()) {
      if (client.email === email) return client;
    }
    return null;
  }

  // Update client
  async updateClient(id: string, data: Partial<Client>): Promise<Client | null> {
    const client = clients.get(id);
    if (!client) return null;
    
    const updated: Client = {
      ...client,
      ...data,
      id: client.id,
      tenantId: client.tenantId,
      createdAt: client.createdAt,
      updatedAt: new Date(),
    };
    
    clients.set(id, updated);
    clientLogger.info('Client updated', { clientId: id });
    return updated;
  }

  // Delete client
  async deleteClient(id: string): Promise<boolean> {
    return clients.delete(id);
  }

  // List clients with pagination
  async listClients(
    tenantId: string, 
    pagination: PaginationParams,
    filters?: {
      status?: ClientStatus;
      search?: string;
      tags?: string[];
      industry?: string;
    }
  ): Promise<PaginatedResult<Client>> {
    let filtered = Array.from(clients.values()).filter(c => c.tenantId === tenantId);
    
    // Apply filters
    if (filters?.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.company?.toLowerCase().includes(search)
      );
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      filtered = filtered.filter(c => 
        filters.tags!.some(tag => c.tags.includes(tag))
      );
    }
    
    if (filters?.industry) {
      filtered = filtered.filter(c => c.industry === filters.industry);
    }
    
    // Apply sorting
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortBy];
      const bVal = (b as Record<string, unknown>)[sortBy];
      
      if (aVal === bVal) return 0;
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / pagination.limit);
    
    const start = (pagination.page - 1) * pagination.limit;
    const data = filtered.slice(start, start + pagination.limit);
    
    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
    };
  }

  // Get clients by tenant
  async getClientsByTenant(tenantId: string): Promise<Client[]> {
    const result: Client[] = [];
    for (const client of clients.values()) {
      if (client.tenantId === tenantId) result.push(client);
    }
    return result;
  }

  // Update client status
  async updateClientStatus(id: string, status: ClientStatus): Promise<Client | null> {
    return this.updateClient(id, { status });
  }

  // Activate client
  async activateClient(id: string): Promise<Client | null> {
    return this.updateClientStatus(id, 'active');
  }

  // Deactivate client
  async deactivateClient(id: string): Promise<Client | null> {
    return this.updateClientStatus(id, 'inactive');
  }

  // Add contact to client
  async addContact(clientId: string, contact: Omit<ClientContact, 'id'>): Promise<Client | null> {
    const client = clients.get(clientId);
    if (!client) return null;
    
    const newContact: ClientContact = {
      ...contact,
      id: uuidv4(),
    };
    
    // If new contact is primary, unset other primary
    if (newContact.isPrimary) {
      client.contacts.forEach(c => c.isPrimary = false);
    }
    
    return this.updateClient(clientId, {
      contacts: [...client.contacts, newContact],
    });
  }

  // Update contact
  async updateContact(
    clientId: string, 
    contactId: string, 
    updates: Partial<ClientContact>
  ): Promise<Client | null> {
    const client = clients.get(clientId);
    if (!client) return null;
    
    const contactIndex = client.contacts.findIndex(c => c.id === contactId);
    if (contactIndex === -1) return null;
    
    // If setting this contact as primary, unset other primaries
    if (updates.isPrimary) {
      client.contacts.forEach(c => c.isPrimary = false);
    }
    
    const updatedContacts = [...client.contacts];
    updatedContacts[contactIndex] = {
      ...updatedContacts[contactIndex],
      ...updates,
      id: contactId,
    };
    
    return this.updateClient(clientId, { contacts: updatedContacts });
  }

  // Remove contact
  async removeContact(clientId: string, contactId: string): Promise<Client | null> {
    const client = clients.get(clientId);
    if (!client) return null;
    
    const updatedContacts = client.contacts.filter(c => c.id !== contactId);
    
    // Ensure at least one primary contact exists
    if (updatedContacts.length > 0 && !updatedContacts.some(c => c.isPrimary)) {
      updatedContacts[0].isPrimary = true;
    }
    
    return this.updateClient(clientId, { contacts: updatedContacts });
  }

  // Add tags to client
  async addTags(clientId: string, tags: string[]): Promise<Client | null> {
    const client = clients.get(clientId);
    if (!client) return null;
    
    const uniqueTags = [...new Set([...client.tags, ...tags])];
    return this.updateClient(clientId, { tags: uniqueTags });
  }

  // Remove tags from client
  async removeTags(clientId: string, tags: string[]): Promise<Client | null> {
    const client = clients.get(clientId);
    if (!client) return null;
    
    const updatedTags = client.tags.filter(t => !tags.includes(t));
    return this.updateClient(clientId, { tags: updatedTags });
  }

  // Update client settings
  async updateSettings(clientId: string, settings: Partial<ClientSettings>): Promise<Client | null> {
    const client = clients.get(clientId);
    if (!client) return null;
    
    return this.updateClient(clientId, {
      settings: { ...client.settings, ...settings },
    });
  }

  // Get client statistics for tenant
  async getClientStats(tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
    churned: number;
  }> {
    const tenantClients = await this.getClientsByTenant(tenantId);
    
    return {
      total: tenantClients.length,
      active: tenantClients.filter(c => c.status === 'active').length,
      inactive: tenantClients.filter(c => c.status === 'inactive').length,
      pending: tenantClients.filter(c => c.status === 'pending').length,
      churned: tenantClients.filter(c => c.status === 'churned').length,
    };
  }

  // Get primary contact for client
  async getPrimaryContact(clientId: string): Promise<ClientContact | null> {
    const client = clients.get(clientId);
    if (!client) return null;
    
    return client.contacts.find(c => c.isPrimary) || client.contacts[0] || null;
  }

  // Search clients
  async searchClients(
    tenantId: string,
    query: string,
    limit: number = 10
  ): Promise<Client[]> {
    const search = query.toLowerCase();
    
    const results: Client[] = [];
    for (const client of clients.values()) {
      if (client.tenantId !== tenantId) continue;
      
      if (
        client.name.toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search) ||
        client.company?.toLowerCase().includes(search)
      ) {
        results.push(client);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }
}

export const clientService = new ClientService();
export default clientService;
