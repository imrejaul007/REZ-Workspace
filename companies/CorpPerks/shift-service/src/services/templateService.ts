import { ShiftTemplate } from '../models';
import { CreateShiftTemplateInput, UpdateShiftTemplateInput } from '../types/schemas';
import { IShiftTemplate } from '../types';

export class TemplateService {
  /**
   * Calculate duration in minutes between two times
   */
  private calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Handle overnight shifts (e.g., 22:00 - 06:00)
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }

    return durationMinutes;
  }

  /**
   * Create a new shift template
   */
  async createTemplate(input: CreateShiftTemplateInput): Promise<IShiftTemplate> {
    const duration = this.calculateDuration(input.startTime, input.endTime);

    const template = new ShiftTemplate({
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      duration,
    });

    await template.save();
    return template;
  }

  /**
   * Get all shift templates
   */
  async getTemplates(
    page: number = 1,
    limit: number = 20
  ): Promise<{ templates: IShiftTemplate[]; total: number }> {
    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      ShiftTemplate.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      ShiftTemplate.countDocuments(),
    ]);

    return { templates, total };
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<IShiftTemplate | null> {
    return ShiftTemplate.findById(id);
  }

  /**
   * Update a template
   */
  async updateTemplate(
    id: string,
    input: UpdateShiftTemplateInput
  ): Promise<IShiftTemplate | null> {
    const template = await ShiftTemplate.findById(id);

    if (!template) {
      return null;
    }

    // Update fields
    if (input.name !== undefined) {
      template.name = input.name;
    }
    if (input.startTime !== undefined) {
      template.startTime = input.startTime;
    }
    if (input.endTime !== undefined) {
      template.endTime = input.endTime;
    }

    // Recalculate duration if times changed
    if (input.startTime || input.endTime) {
      template.duration = this.calculateDuration(
        template.startTime,
        template.endTime
      );
    }

    await template.save();
    return template;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const result = await ShiftTemplate.findByIdAndDelete(id);
    return result !== null;
  }
}

export const templateService = new TemplateService();
