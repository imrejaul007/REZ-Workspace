/**
 * Genie Bridge
 *
 * Connects GlamAI to Genie services:
 * - Genie Memory (port 4703)
 * - Genie Briefing (port 4704)
 * - Genie Personal OS
 *
 * Enables beauty-specific Genie conversations
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../../../utils/logger.js';

const GENIE_MEMORY_URL = process.env.GENIE_MEMORY_URL || 'http://localhost:4703';
const GENIE_BRIEFING_URL = process.env.GENIE_BRIEFING_URL || 'http://localhost:4704';

export class GenieBridge {
  private memory: AxiosInstance;
  private briefing: AxiosInstance;

  constructor() {
    this.memory = axios.create({
      baseURL: GENIE_MEMORY_URL,
      timeout: 10000
    });
    this.briefing = axios.create({
      baseURL: GENIE_BRIEFING_URL,
      timeout: 10000
    });
  }

  // ==================== Memory Bridge ====================

  /**
   * Store memory in Genie
   */
  async storeMemory(userId: string, memory: {
    content: string;
    category: 'fact' | 'preference' | 'event' | 'decision';
    importance?: 'high' | 'medium' | 'low';
    tags?: string[];
  }): Promise<boolean> {
    try {
      await this.memory.post('/api/memories', {
        userId,
        ...memory
      });
      return true;
    } catch (error: any) {
      logger.warn(`Genie memory store failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get memories for user
   */
  async getMemories(userId: string, category?: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await this.memory.get('/api/memories', {
        params: { userId, category, limit }
      });
      return response.data.data || [];
    } catch (error: any) {
      logger.warn(`Genie memory get failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Search memories
   */
  async searchMemories(userId: string, query: string): Promise<any[]> {
    try {
      const response = await this.memory.get('/api/memories/search', {
        params: { userId, query }
      });
      return response.data.data || [];
    } catch (error: any) {
      logger.warn(`Genie memory search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get related memories
   */
  async getRelatedMemories(userId: string, memoryId: string): Promise<any[]> {
    try {
      const response = await this.memory.get(`/api/memories/${memoryId}/related`, {
        params: { userId }
      });
      return response.data.data || [];
    } catch (error: any) {
      logger.warn(`Genie related memories failed: ${error.message}`);
      return [];
    }
  }

  // ==================== Briefing Bridge ====================

  /**
   * Generate morning briefing
   */
  async generateMorningBriefing(userId: string): Promise<{
    greeting: string;
    sections: Array<{
      type: string;
      title: string;
      items: string[];
    }>;
    summary: string;
  }> {
    try {
      const response = await this.briefing.post('/api/briefings/morning', { userId });
      return response.data.data;
    } catch (error: any) {
      logger.warn(`Genie morning briefing failed: ${error.message}`);
      return {
        greeting: 'Good morning!',
        sections: [],
        summary: 'Your day looks clear.'
      };
    }
  }

  /**
   * Generate evening briefing
   */
  async generateEveningBriefing(userId: string): Promise<{
    greeting: string;
    sections: Array<{
      type: string;
      title: string;
      items: string[];
    }>;
    summary: string;
  }> {
    try {
      const response = await this.briefing.post('/api/briefings/evening', { userId });
      return response.data.data;
    } catch (error: any) {
      logger.warn(`Genie evening briefing failed: ${error.message}`);
      return {
        greeting: 'Good evening!',
        sections: [],
        summary: 'Hope you had a great day.'
      };
    }
  }

  // ==================== Beauty-Specific Genie ====================

  /**
   * Store beauty-related memory
   */
  async storeBeautyMemory(userId: string, memory: {
    type: 'hair_color' | 'skin_care' | 'treatment' | 'product' | 'stylist';
    content: string;
    metadata?: any;
  }): Promise<boolean> {
    const categoryMap = {
      'hair_color': 'fact',
      'skin_care': 'fact',
      'treatment': 'event',
      'product': 'preference',
      'stylist': 'fact'
    };

    return this.storeMemory(userId, {
      content: `[Beauty] ${memory.content}`,
      category: categoryMap[memory.type] as any,
      importance: 'high',
      tags: ['beauty', memory.type]
    });
  }

  /**
   * Get beauty reminders for customer
   */
  async getBeautyReminders(customerId: string): Promise<{
    reminders: Array<{
      type: string;
      message: string;
      dueDate: Date;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    try {
      // Get beauty-related memories
      const memories = await this.getMemories(customerId, undefined, 100);
      const beautyMemories = memories.filter(m =>
        m.tags?.includes('beauty') || m.content?.includes('[Beauty]')
      );

      const reminders: any[] = [];

      // Generate reminders from memories
      for (const memory of beautyMemories) {
        if (memory.content?.includes('color') && memory.content?.includes('touch-up')) {
          reminders.push({
            type: 'color_touchup',
            message: 'Time for a hair color touch-up!',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
            priority: 'medium'
          });
        }
        if (memory.content?.includes('keratin')) {
          reminders.push({
            type: 'keratin_maintenance',
            message: 'Keratin treatment maintenance due',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
            priority: 'low'
          });
        }
      }

      return { reminders };
    } catch (error: any) {
      logger.warn(`Genie beauty reminders failed: ${error.message}`);
      return { reminders: [] };
    }
  }

  /**
   * Send beauty follow-up message
   */
  async sendBeautyFollowUp(customerId: string, context: {
    type: 'rebooking' | 'product' | 'birthday' | 'seasonal';
    message: string;
    offer?: {
      type: string;
      value: number;
      description: string;
    };
  }): Promise<boolean> {
    try {
      // Store the follow-up as a memory
      await this.storeBeautyMemory(customerId, {
        type: 'treatment',
        content: `Follow-up sent: ${context.message}`,
        metadata: context
      });

      // TODO: Integrate with WhatsApp/Notification service
      logger.info(`Beauty follow-up queued for ${customerId}: ${context.type}`);

      return true;
    } catch (error: any) {
      logger.warn(`Genie beauty follow-up failed: ${error.message}`);
      return false;
    }
  }

  // ==================== Health Check ====================

  /**
   * Check Genie services health
   */
  async healthCheck(): Promise<{
    memory: boolean;
    briefing: boolean;
  }> {
    const check = async (client: AxiosInstance, name: string): Promise<boolean> => {
      try {
        await client.get('/health', { timeout: 3000 });
        return true;
      } catch {
        logger.warn(`Genie ${name} health check failed`);
        return false;
      }
    };

    const [memory, briefing] = await Promise.all([
      check(this.memory, 'memory'),
      check(this.briefing, 'briefing')
    ]);

    return { memory, briefing };
  }
}

export const genieBridge = new GenieBridge();
