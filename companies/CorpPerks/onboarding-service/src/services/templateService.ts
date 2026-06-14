import { OnboardingTemplate, OnboardingInstance } from '../models';
import { CreateTemplateInput, UpdateTemplateInput, ListTemplatesQuery } from '../utils/validators';
import { generateId } from '../utils/helpers';

/**
 * Create a new onboarding template
 */
export async function createTemplate(
  input: CreateTemplateInput,
  createdBy: string
): Promise<typeof OnboardingTemplate> {
  const templateId = generateId('TPL');

  const template = new OnboardingTemplate({
    templateId,
    ...input,
    createdBy,
    isActive: true,
    version: 1
  });

  await template.save();
  return template;
}

/**
 * Get template by ID
 */
export async function getTemplateById(templateId: string): Promise<typeof OnboardingTemplate | null> {
  return OnboardingTemplate.findOne({ templateId, isActive: true });
}

/**
 * Get all templates with optional filters
 */
export async function listTemplates(query: ListTemplatesQuery) {
  const { department, role, isActive, page, limit } = query;

  const filter: Record<string, unknown> = {};
  if (department) filter.department = department;
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;

  const [templates, total] = await Promise.all([
    OnboardingTemplate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    OnboardingTemplate.countDocuments(filter)
  ]);

  return {
    items: templates,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string,
  input: UpdateTemplateInput
): Promise<typeof OnboardingTemplate | null> {
  const template = await OnboardingTemplate.findOne({ templateId });
  if (!template) return null;

  Object.assign(template, input);
  template.version += 1;
  await template.save();

  return template;
}

/**
 * Delete a template (soft delete)
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
  const result = await OnboardingTemplate.updateOne(
    { templateId },
    { isActive: false }
  );
  return result.modifiedCount > 0;
}

/**
 * Get templates by department
 */
export async function getTemplatesByDepartment(department: string) {
  return OnboardingTemplate.find({ department, isActive: true })
    .sort({ name: 1 });
}

/**
 * Get template statistics
 */
export async function getTemplateStats(templateId: string) {
  const [template, instances] = await Promise.all([
    OnboardingTemplate.findOne({ templateId }),
    OnboardingInstance.find({ templateId })
  ]);

  if (!template) return null;

  const stats = {
    totalInstances: instances.length,
    completed: instances.filter(i => i.status === 'completed').length,
    inProgress: instances.filter(i => i.status === 'in_progress').length,
    avgDuration: 0,
    avgProgress: 0
  };

  const completedInstances = instances.filter(i => i.actualEndDate);
  if (completedInstances.length > 0) {
    const totalDays = completedInstances.reduce((sum, i) => {
      const days = (i.actualEndDate!.getTime() - i.startDate.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    stats.avgDuration = Math.round(totalDays / completedInstances.length);
  }

  if (instances.length > 0) {
    stats.avgProgress = Math.round(
      instances.reduce((sum, i) => sum + i.progress, 0) / instances.length
    );
  }

  return { template, stats };
}
