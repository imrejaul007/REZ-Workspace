import { Handover, IChecklistItem } from '../models/handover.model';
import { DEFAULT_CHECKLIST } from '../utils/checklist';
import { NotFoundError } from '../utils/errors';
import logger from '../config/logger';

export class ChecklistService {
  /**
   * Initialize checklist for a handover with default items
   */
  static async initializeChecklist(handoverId: string): Promise<IChecklistItem[]> {
    const handover = await Handover.findById(handoverId);
    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    const checklist = DEFAULT_CHECKLIST.map((item) => ({
      item: item.item,
      category: item.category,
      required: item.required,
      completed: false,
      completedAt: undefined,
      verifiedBy: undefined,
      notes: undefined,
    }));

    handover.checklist = checklist;
    await handover.save();

    logger.info(`Checklist initialized for handover ${handoverId}`);
    return checklist;
  }

  /**
   * Get checklist for a handover
   */
  static async getChecklist(handoverId: string): Promise<IChecklistItem[]> {
    const handover = await Handover.findById(handoverId).select('checklist');
    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    if (handover.checklist.length === 0) {
      return this.initializeChecklist(handoverId);
    }

    return handover.checklist;
  }

  /**
   * Update a checklist item
   */
  static async updateChecklistItem(
    handoverId: string,
    itemId: string,
    updates: {
      completed?: boolean;
      verifiedBy?: string;
      notes?: string;
    }
  ): Promise<IChecklistItem> {
    const handover = await Handover.findById(handoverId);
    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    const itemIndex = handover.checklist.findIndex(
      (item) => item._id?.toString() === itemId
    );

    if (itemIndex === -1) {
      throw new NotFoundError('Checklist item not found');
    }

    const item = handover.checklist[itemIndex];

    if (updates.completed !== undefined) {
      item.completed = updates.completed;
      item.completedAt = updates.completed ? new Date() : undefined;
    }

    if (updates.verifiedBy) {
      item.verifiedBy = updates.verifiedBy;
    }

    if (updates.notes !== undefined) {
      item.notes = updates.notes;
    }

    await handover.save();

    logger.info(`Checklist item ${itemId} updated for handover ${handoverId}`);
    return item;
  }

  /**
   * Mark all checklist items as complete
   */
  static async completeChecklist(handoverId: string, verifiedBy: string): Promise<IChecklistItem[]> {
    const handover = await Handover.findById(handoverId);
    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    handover.checklist.forEach((item) => {
      item.completed = true;
      item.completedAt = new Date();
      item.verifiedBy = verifiedBy;
    });

    await handover.save();

    logger.info(`All checklist items completed for handover ${handoverId}`);
    return handover.checklist;
  }

  /**
   * Get checklist progress
   */
  static async getChecklistProgress(handoverId: string): Promise<{
    total: number;
    completed: number;
    required: number;
    requiredCompleted: number;
    progressPercentage: number;
    requiredProgressPercentage: number;
  }> {
    const handover = await Handover.findById(handoverId).select('checklist');
    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    const checklist = handover.checklist.length > 0 ? handover.checklist : DEFAULT_CHECKLIST;

    const total = checklist.length;
    const completed = checklist.filter((item) => item.completed).length;
    const required = checklist.filter((item) => item.required).length;
    const requiredCompleted = checklist.filter((item) => item.required && item.completed).length;

    const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
    const requiredProgressPercentage = required > 0 ? (requiredCompleted / required) * 100 : 0;

    return {
      total,
      completed,
      required,
      requiredCompleted,
      progressPercentage,
      requiredProgressPercentage,
    };
  }

  /**
   * Get incomplete checklist items
   */
  static async getIncompleteItems(handoverId: string): Promise<IChecklistItem[]> {
    const handover = await Handover.findById(handoverId).select('checklist');
    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    return handover.checklist.filter((item) => !item.completed && item.required);
  }

  /**
   * Add custom checklist item
   */
  static async addChecklistItem(
    handoverId: string,
    item: {
      item: string;
      category: 'interior' | 'exterior' | 'utilities' | 'documents' | 'keys' | 'other';
      required?: boolean;
      notes?: string;
    }
  ): Promise<IChecklistItem> {
    const handover = await Handover.findById(handoverId);
    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    const newItem: IChecklistItem = {
      item: item.item,
      category: item.category,
      required: item.required ?? false,
      completed: false,
      notes: item.notes,
    };

    handover.checklist.push(newItem as any);
    await handover.save();

    logger.info(`Custom checklist item added to handover ${handoverId}`);
    return handover.checklist[handover.checklist.length - 1];
  }

  /**
   * Remove checklist item
   */
  static async removeChecklistItem(
    handoverId: string,
    itemId: string
  ): Promise<void> {
    const handover = await Handover.findById(handoverId);
    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    const itemIndex = handover.checklist.findIndex(
      (item) => item._id?.toString() === itemId
    );

    if (itemIndex === -1) {
      throw new NotFoundError('Checklist item not found');
    }

    const item = handover.checklist[itemIndex];
    if (item.required) {
      throw new Error('Cannot remove required checklist item');
    }

    handover.checklist.splice(itemIndex, 1);
    await handover.save();

    logger.info(`Checklist item ${itemId} removed from handover ${handoverId}`);
  }
}

export default ChecklistService;