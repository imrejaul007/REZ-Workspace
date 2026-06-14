import { v4 as uuidv4 } from 'uuid';
import { Collaborator, CollaborationEvent, CollaborationAction, AddCollaboratorSchema } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('CollaborationService');

// In-memory storage
const collaborators: Map<string, Map<string, Collaborator>> = new Map(); // contentId -> userId -> Collaborator
const events: Map<string, CollaborationEvent[]> = new Map(); // contentId -> events

export class CollaborationService {
  async addCollaborator(contentItemId: string, tenantId: string, data: unknown): Promise<Collaborator> {
    const parsed = AddCollaboratorSchema.parse(data);

    if (!collaborators.has(contentItemId)) {
      collaborators.set(contentItemId, new Map());
    }

    const contentCollaborators = collaborators.get(contentItemId)!;

    if (contentCollaborators.has(parsed.userId)) {
      throw new Error('User is already a collaborator');
    }

    const collaborator: Collaborator = {
      userId: parsed.userId,
      name: parsed.name,
      email: parsed.email,
      avatar: parsed.avatar,
    };

    contentCollaborators.set(collaborator.userId, collaborator);

    // Record event
    this.recordEvent(contentItemId, tenantId, parsed.userId, collaborator, 'edited');

    logger.info('Collaborator added', { contentItemId, userId: parsed.userId, tenantId });

    return collaborator;
  }

  async removeCollaborator(contentItemId: string, tenantId: string, userId: string): Promise<boolean> {
    const contentCollaborators = collaborators.get(contentItemId);
    if (!contentCollaborators) {
      return false;
    }

    const collaborator = contentCollaborators.get(userId);
    if (!collaborator) {
      return false;
    }

    contentCollaborators.delete(userId);

    // Record event
    this.recordEvent(contentItemId, tenantId, userId, collaborator, 'edited');

    logger.info('Collaborator removed', { contentItemId, userId, tenantId });

    return true;
  }

  async getCollaborators(contentItemId: string): Promise<Collaborator[]> {
    const contentCollaborators = collaborators.get(contentItemId);
    if (!contentCollaborators) {
      return [];
    }
    return Array.from(contentCollaborators.values());
  }

  async isCollaborator(contentItemId: string, userId: string): Promise<boolean> {
    const contentCollaborators = collaborators.get(contentItemId);
    if (!contentCollaborators) {
      return false;
    }
    return contentCollaborators.has(userId);
  }

  recordEvent(
    contentItemId: string,
    tenantId: string,
    userId: string,
    collaborator: Collaborator,
    action: CollaborationAction,
    versionId?: string,
    details?: Record<string, unknown>
  ): CollaborationEvent {
    const event: CollaborationEvent = {
      id: uuidv4(),
      contentItemId,
      tenantId,
      userId,
      collaborator,
      action,
      versionId,
      timestamp: new Date(),
      details,
    };

    if (!events.has(contentItemId)) {
      events.set(contentItemId, []);
    }

    const contentEvents = events.get(contentItemId)!;
    contentEvents.push(event);

    // Keep only last 100 events per content item
    if (contentEvents.length > 100) {
      events.set(contentItemId, contentEvents.slice(-100));
    }

    logger.debug('Collaboration event recorded', {
      eventId: event.id,
      contentItemId,
      action,
      userId,
    });

    return event;
  }

  async getEvents(contentItemId: string, options?: {
    limit?: number;
    since?: Date;
    action?: CollaborationAction;
  }): Promise<CollaborationEvent[]> {
    let contentEvents = events.get(contentItemId) || [];

    if (options?.since) {
      contentEvents = contentEvents.filter(e => e.timestamp >= options.since!);
    }

    if (options?.action) {
      contentEvents = contentEvents.filter(e => e.action === options.action);
    }

    contentEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      contentEvents = contentEvents.slice(0, options.limit);
    }

    return contentEvents;
  }

  async getRecentActivity(tenantId: string, options?: {
    limit?: number;
    hours?: number;
  }): Promise<CollaborationEvent[]> {
    const allEvents: CollaborationEvent[] = [];

    for (const [, contentEvents] of events) {
      allEvents.push(...contentEvents.filter(e => e.tenantId === tenantId));
    }

    // Filter by hours if specified
    if (options?.hours) {
      const since = new Date(Date.now() - options.hours * 60 * 60 * 1000);
      allEvents.filter(e => e.timestamp >= since);
    }

    allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      return allEvents.slice(0, options.limit);
    }

    return allEvents;
  }
}

export const collaborationService = new CollaborationService();
