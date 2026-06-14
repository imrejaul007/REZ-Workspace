import { v4 as uuidv4 } from 'uuid';
import {
  AutoReplyTemplate,
  AutoResponseLog,
  KeywordTrigger,
  Schedule,
  TimeDelay,
  ResponseChannel,
  ResponsePlatform,
  TriggerMatchType,
  TriggerType,
  CreateTemplateInput,
  UpdateTemplateInput,
  ProcessMessageInput
} from '../types';
import logger from '../utils/logger';

class ResponderService {
  private templates: Map<string, AutoReplyTemplate> = new Map();
  private responseLogs: Map<string, AutoResponseLog> = new Map();
  private schedules: Map<string, Schedule> = new Map();
  private userResponseCounts: Map<string, { date: string; count: number }> = new Map();

  // Template CRUD
  createTemplate(input: CreateTemplateInput, tenantId: string): AutoReplyTemplate {
    const id = uuidv4();
    const now = new Date();

    const triggers: KeywordTrigger[] = (input.triggers ?? []).map(t => ({
      id: uuidv4(),
      keyword: t.keyword,
      matchType: t.matchType ?? TriggerMatchType.CONTAINS,
      caseSensitive: t.caseSensitive ?? false,
      isActive: true
    }));

    const template: AutoReplyTemplate = {
      id,
      name: input.name,
      channel: input.channel,
      platforms: input.platforms ?? [],
      triggers,
      hashtags: input.hashtags ?? [],
      responseText: input.responseText,
      responseMedia: input.responseMedia ?? [],
      useAiResponse: input.useAiResponse ?? false,
      aiPrompt: input.aiPrompt,
      delayMinutes: input.delayMinutes ?? 0,
      priority: input.priority ?? 0,
      isActive: true,
      responseLimit: input.responseLimit,
      responsesToday: 0,
      createdAt: now,
      updatedAt: now
    };

    this.templates.set(`${tenantId}:${id}`, template);
    logger.info(`Auto-reply template created: ${id}, name: ${input.name}`);
    return template;
  }

  getTemplate(id: string, tenantId: string): AutoReplyTemplate | undefined {
    return this.templates.get(`${tenantId}:${id}`);
  }

  getTemplates(
    tenantId: string,
    options?: {
      channel?: ResponseChannel;
      platform?: ResponsePlatform;
      isActive?: boolean;
      page?: number;
      limit?: number;
    }
  ): { templates: AutoReplyTemplate[]; total: number } {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    let templates: AutoReplyTemplate[] = [];
    this.templates.forEach((template, key) => {
      if (!key.startsWith(`${tenantId}:`)) return;

      if (options?.channel && template.channel !== options.channel && template.channel !== ResponseChannel.BOTH) return;
      if (options?.platform && !template.platforms.includes(options.platform) && template.platforms.length > 0) return;
      if (options?.isActive !== undefined && template.isActive !== options.isActive) return;

      templates.push(template);
    });

    const total = templates.length;
    templates = templates
      .sort((a, b) => b.priority - a.priority)
      .slice((page - 1) * limit, page * limit);

    return { templates, total };
  }

  getAllTemplates(tenantId: string): AutoReplyTemplate[] {
    const templates: AutoReplyTemplate[] = [];
    this.templates.forEach((template, key) => {
      if (key.startsWith(`${tenantId}:`)) {
        templates.push(template);
      }
    });
    return templates.sort((a, b) => b.priority - a.priority);
  }

  updateTemplate(id: string, input: UpdateTemplateInput, tenantId: string): AutoReplyTemplate | undefined {
    const key = `${tenantId}:${id}`;
    const template = this.templates.get(key);

    if (!template) {
      return undefined;
    }

    const updatedTemplate: AutoReplyTemplate = {
      ...template,
      name: input.name ?? template.name,
      channel: input.channel ?? template.channel,
      platforms: input.platforms ?? template.platforms,
      triggers: input.triggers
        ? input.triggers.map(t => ({
            id: uuidv4(),
            keyword: t.keyword,
            matchType: t.matchType ?? TriggerMatchType.CONTAINS,
            caseSensitive: t.caseSensitive ?? false,
            isActive: t.isActive ?? true
          }))
        : template.triggers,
      hashtags: input.hashtags ?? template.hashtags,
      responseText: input.responseText ?? template.responseText,
      responseMedia: input.responseMedia ?? template.responseMedia,
      useAiResponse: input.useAiResponse ?? template.useAiResponse,
      aiPrompt: input.aiPrompt ?? template.aiPrompt,
      delayMinutes: input.delayMinutes ?? template.delayMinutes,
      priority: input.priority ?? template.priority,
      isActive: input.isActive ?? template.isActive,
      responseLimit: input.responseLimit ?? template.responseLimit,
      updatedAt: new Date()
    };

    this.templates.set(key, updatedTemplate);
    logger.info(`Auto-reply template updated: ${id}`);
    return updatedTemplate;
  }

  deleteTemplate(id: string, tenantId: string): boolean {
    return this.templates.delete(`${tenantId}:${id}`);
  }

  toggleTemplate(id: string, tenantId: string): AutoReplyTemplate | undefined {
    const template = this.templates.get(`${tenantId}:${id}`);
    if (!template) return undefined;

    template.isActive = !template.isActive;
    template.updatedAt = new Date();
    this.templates.set(`${tenantId}:${id}`, template);

    logger.info(`Auto-reply template toggled: ${id}, isActive: ${template.isActive}`);
    return template;
  }

  // Message Processing
  processMessage(input: ProcessMessageInput, tenantId: string): {
    matched: boolean;
    template?: AutoReplyTemplate;
    response?: {
      content: string;
      mediaUrls: string[];
      channel: ResponseChannel;
      delayMinutes: number;
    };
    status: 'sent' | 'skipped' | 'rate_limited' | 'no_match';
    reason?: string;
  } {
    const templates = this.getAllTemplates(tenantId);

    // Filter by channel, platform, and active status
    const eligibleTemplates = templates.filter(t => {
      if (!t.isActive) return false;
      if (t.channel !== ResponseChannel.BOTH && t.channel !== input.channel) return false;
      if (t.platforms.length > 0 && !t.platforms.includes(input.platform)) return false;
      return true;
    });

    if (eligibleTemplates.length === 0) {
      return { matched: false, status: 'no_match', reason: 'No active templates for this channel/platform' };
    }

    // Check for keyword matches
    for (const template of eligibleTemplates) {
      // Check response limit
      if (template.responseLimit !== undefined && template.responseLimit > 0) {
        const today = new Date().toISOString().split('T')[0];
        const userKey = `${tenantId}:${input.authorId}:${today}`;
        const userCount = this.userResponseCounts.get(userKey)?.count ?? 0;

        if (userCount >= template.responseLimit) {
          return { matched: false, status: 'rate_limited', reason: `Response limit reached for user today (${template.responseLimit})` };
        }
      }

      // Check keyword triggers
      const matchedTrigger = this.matchTrigger(template, input);
      if (matchedTrigger) {
        // Generate response
        let responseContent = template.responseText;

        // Replace variables
        responseContent = responseContent
          .replace(/\{\{author\}\}/g, input.authorHandle)
          .replace(/\{\{message\}\}/g, input.content)
          .replace(/\{\{platform\}\}/g, input.platform);

        // Log the response
        const log = this.createResponseLog(template, matchedTrigger, input, {
          content: responseContent,
          mediaUrls: template.responseMedia,
          channel: input.channel
        }, 'sent');

        // Update response counts
        if (template.responseLimit !== undefined && template.responseLimit > 0) {
          const today = new Date().toISOString().split('T')[0];
          const userKey = `${tenantId}:${input.authorId}:${today}`;
          const current = this.userResponseCounts.get(userKey) ?? { date: today, count: 0 };
          this.userResponseCounts.set(userKey, { date: today, count: current.count + 1 });
        }

        return {
          matched: true,
          template,
          response: {
            content: responseContent,
            mediaUrls: template.responseMedia,
            channel: input.channel,
            delayMinutes: template.delayMinutes
          },
          status: 'sent'
        };
      }

      // Check hashtag triggers
      if (template.hashtags.length > 0 && input.hashtags) {
        const matchedHashtag = template.hashtags.find(h =>
          input.hashtags!.some(ih => ih.toLowerCase() === h.toLowerCase())
        );

        if (matchedHashtag) {
          const responseContent = template.responseText
            .replace(/\{\{author\}\}/g, input.authorHandle)
            .replace(/\{\{message\}\}/g, input.content);

          this.createResponseLog(template, { type: TriggerType.HASHTAG, value: matchedHashtag }, input, {
            content: responseContent,
            mediaUrls: template.responseMedia,
            channel: input.channel
          }, 'sent');

          return {
            matched: true,
            template,
            response: {
              content: responseContent,
              mediaUrls: template.responseMedia,
              channel: input.channel,
              delayMinutes: template.delayMinutes
            },
            status: 'sent'
          };
        }
      }
    }

    return { matched: false, status: 'no_match', reason: 'No trigger matched' };
  }

  private matchTrigger(template: AutoReplyTemplate, input: ProcessMessageInput): { type: string; value: string } | null {
    const content = template.triggers.some(t => t.caseSensitive)
      ? input.content
      : input.content.toLowerCase();

    for (const trigger of template.triggers) {
      if (!trigger.isActive) continue;

      const keyword = trigger.caseSensitive ? trigger.keyword : trigger.keyword.toLowerCase();
      let matched = false;

      switch (trigger.matchType) {
        case TriggerMatchType.EXACT:
          matched = content === keyword;
          break;
        case TriggerMatchType.CONTAINS:
          matched = content.includes(keyword);
          break;
        case TriggerMatchType.STARTS_WITH:
          matched = content.startsWith(keyword);
          break;
        case TriggerMatchType.ENDS_WITH:
          matched = content.endsWith(keyword);
          break;
        case TriggerMatchType.REGEX:
          try {
            matched = new RegExp(trigger.keyword, trigger.caseSensitive ? '' : 'i').test(input.content);
          } catch {
            matched = false;
          }
          break;
      }

      if (matched) {
        return { type: TriggerType.KEYWORD, value: trigger.keyword };
      }
    }

    return null;
  }

  private createResponseLog(
    template: AutoReplyTemplate,
    triggerMatch: { type: string; value: string },
    sourceMessage: ProcessMessageInput,
    response: { content: string; mediaUrls: string[]; channel: ResponseChannel },
    status: 'sent' | 'failed' | 'skipped' | 'rate_limited'
  ): AutoResponseLog {
    const log: AutoResponseLog = {
      id: uuidv4(),
      templateId: template.id,
      triggerMatch,
      sourceMessage: {
        id: sourceMessage.messageId,
        platform: sourceMessage.platform,
        authorHandle: sourceMessage.authorHandle,
        content: sourceMessage.content
      },
      responseSent: {
        content: response.content,
        mediaUrls: response.mediaUrls,
        channel: response.channel,
        sentAt: new Date()
      },
      status,
      createdAt: new Date()
    };

    this.responseLogs.set(log.id, log);
    return log;
  }

  // Response Logs
  getResponseLogs(
    tenantId: string,
    options?: {
      templateId?: string;
      status?: string;
      platform?: ResponsePlatform;
      page?: number;
      limit?: number;
    }
  ): { logs: AutoResponseLog[]; total: number } {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    let logs: AutoResponseLog[] = [];
    this.responseLogs.forEach((log) => {
      if (options?.templateId && log.templateId !== options.templateId) return;
      if (options?.status && log.status !== options.status) return;
      if (options?.platform && log.sourceMessage.platform !== options.platform) return;
      logs.push(log);
    });

    const total = logs.length;
    logs = logs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * limit, page * limit);

    return { logs, total };
  }

  // Statistics
  getStats(tenantId: string): {
    totalTemplates: number;
    activeTemplates: number;
    totalResponses: number;
    responsesToday: number;
    responsesByStatus: { sent: number; failed: number; skipped: number; rate_limited: number };
    responsesByChannel: { comment: number; dm: number };
    topTemplates: { templateId: string; name: string; responseCount: number }[];
  } {
    let totalTemplates = 0;
    let activeTemplates = 0;
    let totalResponses = 0;
    let responsesToday = 0;
    const responsesByStatus = { sent: 0, failed: 0, skipped: 0, rate_limited: 0 };
    const responsesByChannel = { comment: 0, dm: 0 };
    const templateCounts = new Map<string, number>();

    const today = new Date().toISOString().split('T')[0];

    this.templates.forEach((template, key) => {
      if (!key.startsWith(`${tenantId}:`)) return;
      totalTemplates++;
      if (template.isActive) activeTemplates++;
    });

    this.responseLogs.forEach((log) => {
      totalResponses++;
      responsesByStatus[log.status]++;
      responsesByChannel[log.sourceMessage.platform]++;

      if (log.createdAt.toISOString().split('T')[0] === today) {
        responsesToday++;
      }

      const count = templateCounts.get(log.templateId) ?? 0;
      templateCounts.set(log.templateId, count + 1);
    });

    // Get top templates
    const topTemplates: { templateId: string; name: string; responseCount: number }[] = [];
    templateCounts.forEach((count, templateId) => {
      const template = this.templates.get(`${tenantId}:${templateId}`);
      if (template) {
        topTemplates.push({
          templateId,
          name: template.name,
          responseCount: count
        });
      }
    });

    topTemplates.sort((a, b) => b.responseCount - a.responseCount);
    topTemplates.splice(5);

    return {
      totalTemplates,
      activeTemplates,
      totalResponses,
      responsesToday,
      responsesByStatus,
      responsesByChannel,
      topTemplates
    };
  }

  // Schedule Management
  addSchedule(templateId: string, schedule: Omit<Schedule, 'id'>, tenantId: string): Schedule | undefined {
    const template = this.getTemplate(templateId, tenantId);
    if (!template) return undefined;

    const id = uuidv4();
    const newSchedule: Schedule = { ...schedule, id };
    this.schedules.set(`${tenantId}:${id}`, newSchedule);

    logger.info(`Schedule added to template: ${templateId}`);
    return newSchedule;
  }

  getSchedules(tenantId: string): Schedule[] {
    const schedules: Schedule[] = [];
    this.schedules.forEach((schedule, key) => {
      if (key.startsWith(`${tenantId}:`)) {
        schedules.push(schedule);
      }
    });
    return schedules;
  }

  deleteSchedule(id: string, tenantId: string): boolean {
    return this.schedules.delete(`${tenantId}:${id}`);
  }

  // Test template
  testTemplate(templateId: string, testContent: string, tenantId: string): {
    success: boolean;
    matched: boolean;
    response?: string;
    errors?: string[];
  } {
    const template = this.getTemplate(templateId, tenantId);
    if (!template) {
      return { success: false, matched: false, errors: ['Template not found'] };
    }

    const errors: string[] = [];
    if (!template.triggers.length && !template.hashtags.length) {
      errors.push('No triggers configured');
    }
    if (!template.responseText) {
      errors.push('No response text configured');
    }

    if (errors.length > 0) {
      return { success: false, matched: false, errors };
    }

    const result = this.processMessage({
      content: testContent,
      platform: ResponsePlatform.INSTAGRAM,
      channel: ResponseChannel.COMMENT,
      authorHandle: 'test_user',
      authorId: 'test-id',
      messageId: 'test-message-id',
      hashtags: []
    }, tenantId);

    return {
      success: true,
      matched: result.matched,
      response: result.response?.content
    };
  }
}

export default new ResponderService();
