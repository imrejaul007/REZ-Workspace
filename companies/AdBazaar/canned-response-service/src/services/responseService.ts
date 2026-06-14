/**
 * Response Service - Business logic for canned response operations
 */

import { v4 as uuidv4 } from 'uuid';
import { CannedResponse, ICannedResponse, ResponseStatus } from '../models/CannedResponse';
import { Category } from '../models/Category';
import { Tag } from '../models/Tag';
import logger from '../utils/logger';

export interface CreateResponseInput {
  title: string;
  content: string;
  shortcut?: string;
  categoryId: string;
  tags?: string[];
  authorId: string;
  authorName: string;
  variables?: string[];
  isGlobal?: boolean;
}

export interface ResponseFilter {
  status?: ResponseStatus;
  categoryId?: string;
  tags?: string[];
  authorId?: string;
}

export class ResponseService {
  /**
   * Create a new canned response
   */
  async createResponse(input: CreateResponseInput): Promise<ICannedResponse> {
    // Validate shortcut uniqueness
    if (input.shortcut) {
      const existing = await CannedResponse.findOne({ shortcut: input.shortcut, status: ResponseStatus.ACTIVE }).exec();
      if (existing) {
        throw new Error(`Shortcut '${input.shortcut}' is already in use`);
      }
    }

    // Extract variables from content (e.g., {{customer_name}}, {{ticket_id}})
    const variables = input.variables || this.extractVariables(input.content);

    const responseData: Partial<ICannedResponse> = {
      responseId: `CFR-${uuidv4().slice(0, 8).toUpperCase()}`,
      title: input.title,
      content: input.content,
      shortcut: input.shortcut,
      categoryId: input.categoryId,
      tags: input.tags || [],
      status: ResponseStatus.ACTIVE,
      authorId: input.authorId,
      authorName: input.authorName,
      usageCount: 0,
      variables,
      isGlobal: input.isGlobal || false,
    };

    const response = new CannedResponse(responseData);
    await response.save();

    // Update category response count
    await Category.findOneAndUpdate(
      { categoryId: input.categoryId },
      { $inc: { responseCount: 1 } }
    );

    // Update tag usage
    if (input.tags && input.tags.length > 0) {
      await Tag.updateMany(
        { name: { $in: input.tags } },
        { $inc: { usageCount: 1 } }
      );
    }

    logger.info('Canned response created', { responseId: response.responseId, title: input.title });
    return response;
  }

  /**
   * Get response by ID
   */
  async getResponseById(responseId: string): Promise<ICannedResponse | null> {
    return CannedResponse.findOne({ responseId }).exec();
  }

  /**
   * Get response by shortcut
   */
  async getResponseByShortcut(shortcut: string): Promise<ICannedResponse | null> {
    return CannedResponse.findOne({ shortcut, status: ResponseStatus.ACTIVE }).exec();
  }

  /**
   * Get responses with filters
   */
  async getResponses(
    filter: ResponseFilter,
    page = 1,
    limit = 20
  ): Promise<{ responses: ICannedResponse[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = {};

    if (filter.status) query.status = filter.status;
    if (filter.categoryId) query.categoryId = filter.categoryId;
    if (filter.tags && filter.tags.length > 0) query.tags = { $in: filter.tags };
    if (filter.authorId) query.authorId = filter.authorId;

    const skip = (page - 1) * limit;
    const [responses, total] = await Promise.all([
      CannedResponse.find(query).sort({ usageCount: -1, title: 1 }).skip(skip).limit(limit).exec(),
      CannedResponse.countDocuments(query).exec(),
    ]);

    return {
      responses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Search responses
   */
  async searchResponses(
    query: string,
    categoryId?: string,
    tags?: string[],
    limit = 20
  ): Promise<{ responses: ICannedResponse[]; total: number }> {
    const searchQuery: Record<string, unknown> = {
      status: ResponseStatus.ACTIVE,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { shortcut: { $regex: query, $options: 'i' } },
      ],
    };

    if (categoryId) searchQuery.categoryId = categoryId;
    if (tags && tags.length > 0) searchQuery.tags = { $in: tags };

    const responses = await CannedResponse.find(searchQuery)
      .sort({ usageCount: -1 })
      .limit(limit)
      .exec();

    return { responses, total: responses.length };
  }

  /**
   * Update response
   */
  async updateResponse(responseId: string, updates: Partial<ICannedResponse>): Promise<ICannedResponse | null> {
    // Validate shortcut uniqueness if changing
    if (updates.shortcut) {
      const existing = await CannedResponse.findOne({
        shortcut: updates.shortcut,
        status: ResponseStatus.ACTIVE,
        responseId: { $ne: responseId },
      }).exec();
      if (existing) {
        throw new Error(`Shortcut '${updates.shortcut}' is already in use`);
      }
    }

    // Re-extract variables if content is changing
    if (updates.content) {
      updates.variables = this.extractVariables(updates.content);
    }

    const updated = await CannedResponse.findOneAndUpdate(
      { responseId },
      { $set: updates },
      { new: true }
    ).exec();

    if (updated) {
      logger.info('Canned response updated', { responseId, updates: Object.keys(updates) });
    }
    return updated;
  }

  /**
   * Delete response (soft delete - archive)
   */
  async deleteResponse(responseId: string): Promise<boolean> {
    const response = await CannedResponse.findOneAndUpdate(
      { responseId },
      { $set: { status: ResponseStatus.ARCHIVED } },
      { new: true }
    ).exec();

    if (response) {
      // Update category count
      await Category.findOneAndUpdate(
        { categoryId: response.categoryId },
        { $inc: { responseCount: -1 } }
      );
      logger.info('Canned response archived', { responseId });
      return true;
    }
    return false;
  }

  /**
   * Record response usage
   */
  async recordUsage(responseId: string): Promise<ICannedResponse | null> {
    return CannedResponse.findOneAndUpdate(
      { responseId },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: new Date() },
      },
      { new: true }
    ).exec();
  }

  /**
   * Get popular responses
   */
  async getPopularResponses(limit = 10): Promise<ICannedResponse[]> {
    return CannedResponse.find({ status: ResponseStatus.ACTIVE })
      .sort({ usageCount: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get responses by category
   */
  async getResponsesByCategory(categoryId: string): Promise<ICannedResponse[]> {
    return CannedResponse.find({
      categoryId,
      status: ResponseStatus.ACTIVE,
    }).sort({ order: 1, title: 1 }).exec();
  }

  /**
   * Get responses by shortcut prefix
   */
  async getResponsesByShortcutPrefix(prefix: string): Promise<ICannedResponse[]> {
    return CannedResponse.find({
      shortcut: { $regex: `^${prefix}`, $options: 'i' },
      status: ResponseStatus.ACTIVE,
    }).sort({ shortcut: 1 }).exec();
  }

  /**
   * Extract variables from content (e.g., {{customer_name}})
   */
  private extractVariables(content: string): string[] {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * Render response with variables
   */
  renderResponse(content: string, variables: Record<string, string>): string {
    let rendered = content;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return rendered;
  }
}

export const responseService = new ResponseService();
export default responseService;