import Handlebars from 'handlebars';
import { v4 as uuidv4 } from 'uuid';
import { database } from './database';
import { cacheService } from './cache';
import {
  NotificationTemplate,
  TemplateContent,
  TemplateVariable,
  NotificationChannel,
} from '../types';
import { CreateTemplateInput, UpdateTemplateInput } from '../utils/validators';
import logger from '../utils/logger';

export class TemplateService {
  constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Custom Handlebars helpers
    Handlebars.registerHelper('uppercase', (str: string) =>
      str ? str.toUpperCase() : ''
    );

    Handlebars.registerHelper('lowercase', (str: string) =>
      str ? str.toLowerCase() : ''
    );

    Handlebars.registerHelper('capitalize', (str: string) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''
    );

    Handlebars.registerHelper('formatDate', (date: string | Date, format: string) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    Handlebars.registerHelper('formatCurrency', (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(amount);
    });

    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (!str) return '';
      return str.length > length ? str.substring(0, length) + '...' : str;
    });
  }

  async createTemplate(input: CreateTemplateInput): Promise<NotificationTemplate> {
    const id = uuidv4();
    const now = new Date();

    const template: NotificationTemplate = {
      id,
      name: input.name,
      description: input.description,
      channel: input.channel,
      category: input.category,
      content: input.content,
      variables: input.variables || [],
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await database.query(
      `INSERT INTO templates (id, name, description, channel, category, content, variables, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        template.id,
        template.name,
        template.description,
        template.channel,
        template.category,
        JSON.stringify(template.content),
        JSON.stringify(template.variables),
        template.isActive,
      ]
    );

    logger.info('Template created', { templateId: id, name: input.name });

    return template;
  }

  async getTemplateById(id: string): Promise<NotificationTemplate | null> {
    // Try cache first
    const cached = await cacheService.getTemplate<NotificationTemplate>(id);
    if (cached) {
      return cached;
    }

    const result = await database.query<NotificationTemplate>(
      `SELECT * FROM templates WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const template = this.mapRowToTemplate(result.rows[0]);
    await cacheService.cacheTemplate(id, template);

    return template;
  }

  async getTemplateByName(name: string): Promise<NotificationTemplate | null> {
    const result = await database.query<NotificationTemplate>(
      `SELECT * FROM templates WHERE name = $1`,
      [name]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTemplate(result.rows[0]);
  }

  async updateTemplate(
    id: string,
    input: UpdateTemplateInput
  ): Promise<NotificationTemplate | null> {
    const existing = await this.getTemplateById(id);
    if (!existing) {
      return null;
    }

    const updated: NotificationTemplate = {
      ...existing,
      ...input,
      content: input.content || existing.content,
      variables: input.variables || existing.variables,
      updatedAt: new Date(),
    };

    await database.query(
      `UPDATE templates
       SET name = $1, description = $2, channel = $3, category = $4,
           content = $5, variables = $6, is_active = $7, updated_at = $8
       WHERE id = $9`,
      [
        updated.name,
        updated.description,
        updated.channel,
        updated.category,
        JSON.stringify(updated.content),
        JSON.stringify(updated.variables),
        updated.isActive,
        updated.updatedAt,
        id,
      ]
    );

    // Invalidate cache
    await cacheService.delete(`template:${id}`);

    logger.info('Template updated', { templateId: id });

    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await database.query(
      `DELETE FROM templates WHERE id = $1`,
      [id]
    );

    if (result.rowCount > 0) {
      await cacheService.delete(`template:${id}`);
      logger.info('Template deleted', { templateId: id });
      return true;
    }

    return false;
  }

  async listTemplates(filters?: {
    channel?: NotificationChannel;
    category?: string;
    isActive?: boolean;
  }): Promise<NotificationTemplate[]> {
    let query = 'SELECT * FROM templates WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.channel) {
      query += ` AND channel = $${paramIndex++}`;
      params.push(filters.channel);
    }

    if (filters?.category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters?.isActive !== undefined) {
      query += ` AND is_active = $${paramIndex++}`;
      params.push(filters.isActive);
    }

    query += ' ORDER BY name ASC';

    const result = await database.query<NotificationTemplate>(query, params);
    return result.rows.map((row) => this.mapRowToTemplate(row));
  }

  async getCategories(): Promise<string[]> {
    const result = await database.query<{ category: string }>(
      `SELECT DISTINCT category FROM templates ORDER BY category`
    );
    return result.rows.map((r) => r.category);
  }

  renderTemplate(
    template: NotificationTemplate,
    variables: Record<string, string>
  ): string {
    const { content } = template;

    // Render subject if present
    let renderedContent = '';

    if (content.subject) {
      const subjectTemplate = Handlebars.compile(content.subject);
      renderedContent += `Subject: ${subjectTemplate(variables)}\n\n`;
    }

    // Render body
    const bodyTemplate = Handlebars.compile(content.body);
    renderedContent += bodyTemplate(variables);

    return renderedContent;
  }

  renderTemplateWithHtml(
    template: NotificationTemplate,
    variables: Record<string, string>
  ): TemplateContent {
    const { content } = template;

    const result: TemplateContent = {
      body: '',
    };

    if (content.subject) {
      const subjectTemplate = Handlebars.compile(content.subject);
      result.subject = subjectTemplate(variables);
    }

    const bodyTemplate = Handlebars.compile(content.body);
    result.body = bodyTemplate(variables);

    if (content.htmlBody) {
      const htmlTemplate = Handlebars.compile(content.htmlBody);
      result.htmlBody = htmlTemplate(variables);
    }

    if (content.actionUrl) {
      const urlTemplate = Handlebars.compile(content.actionUrl);
      result.actionUrl = urlTemplate(variables);
    }

    if (content.actionText) {
      const actionTemplate = Handlebars.compile(content.actionText);
      result.actionText = actionTemplate(variables);
    }

    return result;
  }

  validateVariables(
    template: NotificationTemplate,
    providedVariables: Record<string, string>
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const variable of template.variables) {
      if (variable.required && !providedVariables[variable.name]) {
        missing.push(variable.name);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  private mapRowToTemplate(row: Record<string, unknown>): NotificationTemplate {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      channel: row.channel as NotificationChannel,
      category: row.category as string,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
      variables:
        typeof row.variables === 'string'
          ? JSON.parse(row.variables)
          : (row.variables as TemplateVariable[]),
      isActive: row.is_active as boolean,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}

export const templateService = new TemplateService();
export default templateService;
