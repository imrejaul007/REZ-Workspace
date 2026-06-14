import { v4 as uuidv4 } from 'uuid';
import { Integration, CreateIntegrationSchema } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('IntegrationService');

// In-memory storage
const integrations: Map<string, Integration> = new Map();

export class IntegrationService {
  async create(tenantId: string, data: unknown): Promise<Integration> {
    const parsed = CreateIntegrationSchema.parse(data);

    const integration: Integration = {
      id: uuidv4(),
      tenantId,
      name: parsed.name,
      type: parsed.type,
      authType: parsed.authType,
      credentials: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    integrations.set(integration.id, integration);
    logger.info('Integration created', { integrationId: integration.id, tenantId, type: integration.type });

    return integration;
  }

  async findById(id: string): Promise<Integration | null> {
    return integrations.get(id) || null;
  }

  async findByTenant(tenantId: string): Promise<Integration[]> {
    return Array.from(integrations.values())
      .filter(i => i.tenantId === tenantId);
  }

  async findByType(tenantId: string, type: Integration['type']): Promise<Integration[]> {
    return Array.from(integrations.values())
      .filter(i => i.tenantId === tenantId && i.type === type);
  }

  async update(id: string, updates: Partial<Integration>): Promise<Integration | null> {
    const existing = integrations.get(id);
    if (!existing) {
      return null;
    }

    const updated: Integration = {
      ...existing,
      ...updates,
      id: existing.id,
      tenantId: existing.tenantId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    integrations.set(id, updated);
    logger.info('Integration updated', { integrationId: id });

    return updated;
  }

  async updateCredentials(id: string, credentials: Partial<Integration['credentials']>): Promise<Integration | null> {
    const existing = integrations.get(id);
    if (!existing) {
      return null;
    }

    const updated: Integration = {
      ...existing,
      credentials: {
        ...existing.credentials,
        ...credentials,
      },
      updatedAt: new Date(),
    };

    integrations.set(id, updated);
    logger.info('Integration credentials updated', { integrationId: id });

    return updated;
  }

  async toggleActive(id: string, isActive: boolean): Promise<Integration | null> {
    return this.update(id, { isActive });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = integrations.delete(id);
    if (deleted) {
      logger.info('Integration deleted', { integrationId: id });
    }
    return deleted;
  }
}

export const integrationService = new IntegrationService();
