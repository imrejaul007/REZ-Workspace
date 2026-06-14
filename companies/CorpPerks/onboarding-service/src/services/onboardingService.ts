import { OnboardingInstance, OnboardingTemplate } from '../models';
import { StartOnboardingInput, CompleteTaskInput, ListOnboardingQuery } from '../utils/validators';
import { generateId, calculateProgress, addBusinessDays } from '../utils/helpers';

/**
 * Start onboarding for a new employee
 */
export async function startOnboarding(input: StartOnboardingInput): Promise<typeof OnboardingInstance> {
  const {
    employeeId,
    employeeName,
    employeeEmail,
    templateId,
    startDate,
    managerId,
    hrId,
    department,
    role
  } = input;

  // Check if employee already has active onboarding
  const existing = await OnboardingInstance.findOne({
    employeeId,
    status: { $in: ['not_started', 'in_progress'] }
  });

  if (existing) {
    throw new Error(`Employee ${employeeId} already has an active onboarding instance`);
  }

  // Get the template
  const template = await OnboardingTemplate.findOne({ templateId, isActive: true });
  if (!template) {
    throw new Error(`Template ${templateId} not found or inactive`);
  }

  // Calculate target end date
  const effectiveStartDate = startDate ? new Date(startDate) : new Date();
  const targetEndDate = addBusinessDays(effectiveStartDate, template.defaultDuration);

  // Create tasks from template
  const tasks = template.tasks.map(task => ({
    taskId: generateId('TSK'),
    templateTaskId: task.taskId,
    title: task.title,
    description: task.description,
    assigneeType: task.assigneeType,
    category: task.category,
    status: 'pending' as const,
    dueDate: addBusinessDays(effectiveStartDate, task.estimatedDuration),
    order: task.order,
    isRequired: task.isRequired
  }));

  // Create the onboarding instance
  const instance = new OnboardingInstance({
    instanceId: generateId('ONB'),
    employeeId,
    employeeName,
    employeeEmail,
    templateId: template.templateId,
    templateName: template.name,
    startDate: effectiveStartDate,
    targetEndDate,
    status: 'not_started',
    progress: 0,
    tasks,
    currentStep: 0,
    completedSteps: [],
    managerId,
    hrId,
    department,
    role,
    notes: []
  });

  await instance.save();
  return instance;
}

/**
 * Get onboarding instance by ID
 */
export async function getOnboardingById(instanceId: string): Promise<typeof OnboardingInstance | null> {
  return OnboardingInstance.findOne({ instanceId });
}

/**
 * Get onboarding by employee ID
 */
export async function getOnboardingByEmployee(employeeId: string): Promise<typeof OnboardingInstance[]> {
  return OnboardingInstance.find({ employeeId })
    .sort({ startDate: -1 });
}

/**
 * Get active onboarding for employee
 */
export async function getActiveOnboarding(employeeId: string): Promise<typeof OnboardingInstance | null> {
  return OnboardingInstance.findOne({
    employeeId,
    status: { $in: ['not_started', 'in_progress'] }
  });
}

/**
 * List onboarding instances with filters
 */
export async function listOnboardings(query: ListOnboardingQuery) {
  const { employeeId, templateId, status, department, managerId, page, limit } = query;

  const filter: Record<string, unknown> = {};
  if (employeeId) filter.employeeId = employeeId;
  if (templateId) filter.templateId = templateId;
  if (status) filter.status = status;
  if (department) filter.department = department;
  if (managerId) filter.managerId = managerId;

  const [instances, total] = await Promise.all([
    OnboardingInstance.find(filter)
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    OnboardingInstance.countDocuments(filter)
  ]);

  return {
    items: instances,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Complete a task
 */
export async function completeTask(
  instanceId: string,
  taskId: string,
  input: CompleteTaskInput,
  completedBy: string
): Promise<typeof OnboardingInstance | null> {
  const instance = await OnboardingInstance.findOne({ instanceId });
  if (!instance) return null;

  const task = instance.tasks.find(t => t.taskId === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found in instance ${instanceId}`);
  }

  const newStatus = input.status || 'completed';
  task.status = newStatus;

  if (newStatus === 'completed') {
    task.completedAt = new Date();
    task.completedBy = completedBy;
  }

  if (input.notes) {
    task.notes = input.notes;
  }

  // Recalculate progress
  const completedCount = instance.tasks.filter(
    t => t.status === 'completed' || t.status === 'skipped'
  ).length;
  instance.progress = calculateProgress(completedCount, instance.tasks.length);

  // Update status if needed
  if (instance.status === 'not_started') {
    instance.status = 'in_progress';
  }

  // Check if all required tasks are done
  const requiredTasks = instance.tasks.filter(t => t.isRequired);
  const requiredCompleted = requiredTasks.every(
    t => t.status === 'completed' || t.status === 'skipped'
  );

  if (requiredCompleted) {
    instance.status = 'completed';
    instance.actualEndDate = new Date();
  }

  instance.lastActivityAt = new Date();
  await instance.save();

  return instance;
}

/**
 * Add note to onboarding
 */
export async function addNote(
  instanceId: string,
  note: string
): Promise<typeof OnboardingInstance | null> {
  const instance = await OnboardingInstance.findOne({ instanceId });
  if (!instance) return null;

  instance.notes.push(note);
  instance.lastActivityAt = new Date();
  await instance.save();

  return instance;
}

/**
 * Cancel onboarding
 */
export async function cancelOnboarding(
  instanceId: string,
  reason: string
): Promise<typeof OnboardingInstance | null> {
  const instance = await OnboardingInstance.findOne({ instanceId });
  if (!instance) return null;

  instance.status = 'cancelled';
  instance.notes.push(`Cancelled: ${reason}`);
  instance.lastActivityAt = new Date();
  await instance.save();

  return instance;
}

/**
 * Get tasks assigned to a user
 */
export async function getTasksForUser(
  userId: string,
  assigneeType: string,
  status?: string
): Promise<typeof OnboardingInstance[]> {
  const filter: Record<string, unknown> = {
    'tasks.assigneeId': userId,
    'tasks.assigneeType': assigneeType,
    status: { $in: ['not_started', 'in_progress'] }
  };

  if (status) {
    filter['tasks.status'] = status;
  }

  return OnboardingInstance.find(filter);
}

/**
 * Get onboarding statistics
 */
export async function getOnboardingStats(filters?: {
  department?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
}) {
  const filter: Record<string, unknown> = {};
  if (filters?.department) filter.department = filters.department;
  if (filters?.startDateFrom || filters?.startDateTo) {
    filter.startDate = {};
    if (filters.startDateFrom) (filter.startDate as Record<string, Date>).$gte = filters.startDateFrom;
    if (filters.startDateTo) (filter.startDate as Record<string, Date>).$lte = filters.startDateTo;
  }

  const instances = await OnboardingInstance.find(filter);

  const stats = {
    total: instances.length,
    notStarted: instances.filter(i => i.status === 'not_started').length,
    inProgress: instances.filter(i => i.status === 'in_progress').length,
    completed: instances.filter(i => i.status === 'completed').length,
    cancelled: instances.filter(i => i.status === 'cancelled').length,
    blocked: instances.filter(i => i.status === 'blocked').length,
    avgProgress: 0,
    overdue: 0
  };

  if (instances.length > 0) {
    stats.avgProgress = Math.round(
      instances.reduce((sum, i) => sum + i.progress, 0) / instances.length
    );
  }

  const now = new Date();
  stats.overdue = instances.filter(
    i => i.status === 'in_progress' && i.targetEndDate < now
  ).length;

  return stats;
}
