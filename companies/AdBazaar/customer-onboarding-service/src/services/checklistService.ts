/**
 * Checklist Service - Checklist management
 */

import { ChecklistModel, IChecklist } from '../models/checklist';
import { logger } from 'utils/logger.js';

export class ChecklistService {
  /**
   * Create a new checklist
   */
  async createChecklist(data: {
    name: string;
    type: 'standard' | 'enterprise' | 'agency' | 'publisher' | 'creator';
    description: string;
    steps: {
      order: number;
      name: string;
      description: string;
      required: boolean;
      category: string;
      estimatedMinutes: number;
      dependencies: string[];
      resources: { title: string; url?: string; type: 'video' | 'doc' | 'link' }[];
    }[];
    version: string;
  }): Promise<IChecklist> {
    logger.info(`Creating checklist: ${data.name}`);

    // Deactivate existing checklists of same type
    await ChecklistModel.updateMany(
      { type: data.type, active: true },
      { active: false }
    );

    const checklist = await ChecklistModel.create({
      ...data,
      active: true,
    });

    logger.info(`Checklist created: ${checklist._id}`);
    return checklist;
  }

  /**
   * Get checklist by ID
   */
  async getChecklist(checklistId: string): Promise<IChecklist | null> {
    return ChecklistModel.findById(checklistId).lean();
  }

  /**
   * Get active checklist by type
   */
  async getActiveChecklist(type: string): Promise<IChecklist | null> {
    return ChecklistModel.findOne({ type, active: true }).lean();
  }

  /**
   * Get all checklists
   */
  async getAllChecklists(activeOnly: boolean = false): Promise<IChecklist[]> {
    const query = activeOnly ? { active: true } : {};
    return ChecklistModel.find(query).sort({ name: 1 }).lean();
  }

  /**
   * Update checklist
   */
  async updateChecklist(
    checklistId: string,
    updates: Partial<IChecklist>
  ): Promise<IChecklist | null> {
    const checklist = await ChecklistModel.findByIdAndUpdate(
      checklistId,
      updates,
      { new: true }
    ).lean();

    if (checklist) {
      logger.info(`Checklist ${checklistId} updated`);
    }

    return checklist;
  }

  /**
   * Deactivate checklist
   */
  async deactivateChecklist(checklistId: string): Promise<IChecklist | null> {
    return this.updateChecklist(checklistId, { active: false });
  }

  /**
   * Duplicate checklist
   */
  async duplicateChecklist(
    sourceId: string,
    newName: string,
    newType: string
  ): Promise<IChecklist> {
    const source = await ChecklistModel.findById(sourceId);
    if (!source) {
      throw new Error('Source checklist not found');
    }

    return this.createChecklist({
      name: newName,
      type: newType as any,
      description: source.description,
      steps: source.steps.map(s => ({
        order: s.order,
        name: s.name,
        description: s.description,
        required: s.required,
        category: s.category,
        estimatedMinutes: s.estimatedMinutes,
        dependencies: s.dependencies,
        resources: s.resources,
      })),
      version: '1.0.0',
    });
  }
}

export const checklistService = new ChecklistService();