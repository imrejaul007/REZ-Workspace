import { OffboardingInstance } from '../models';
import {
  StartOffboardingInput,
  CompleteOffboardingTaskInput,
  UpdateClearanceInput,
  ListOffboardingQuery
} from '../utils/validators';
import { generateId, calculateProgress, addBusinessDays } from '../utils/helpers';

/**
 * Start offboarding for an employee
 */
export async function startOffboarding(input: StartOffboardingInput): Promise<typeof OffboardingInstance> {
  const {
    employeeId,
    employeeName,
    employeeEmail,
    interviewId,
    department,
    role,
    managerId,
    lastWorkingDay,
    startDate
  } = input;

  // Check if employee already has active offboarding
  const existing = await OffboardingInstance.findOne({
    employeeId,
    status: { $in: ['not_started', 'in_progress'] }
  });

  if (existing) {
    throw new Error(`Employee ${employeeId} already has an active offboarding`);
  }

  const effectiveStartDate = startDate ? new Date(startDate) : new Date();
  const effectiveLastWorkingDay = new Date(lastWorkingDay);

  // Create standard offboarding tasks
  const tasks = [
    {
      taskId: generateId('OTSK'),
      title: 'Knowledge transfer - handover documentation',
      description: 'Create handover documents for all responsibilities',
      assigneeType: 'employee' as const,
      category: 'knowledge_transfer' as const,
      status: 'pending' as const,
      dueDate: addBusinessDays(effectiveLastWorkingDay, -5),
      order: 0,
      isRequired: true
    },
    {
      taskId: generateId('OTSK'),
      title: 'Knowledge transfer - team walkthrough',
      description: 'Conduct walkthrough sessions with team members',
      assigneeType: 'employee' as const,
      category: 'knowledge_transfer' as const,
      status: 'pending' as const,
      dueDate: addBusinessDays(effectiveLastWorkingDay, -3),
      order: 1,
      isRequired: true
    },
    {
      taskId: generateId('OTSK'),
      title: 'Return company equipment',
      description: 'Laptop, phone, access cards, etc.',
      assigneeType: 'employee' as const,
      category: 'equipment_return' as const,
      status: 'pending' as const,
      dueDate: effectiveLastWorkingDay,
      order: 2,
      isRequired: true
    },
    {
      taskId: generateId('OTSK'),
      title: 'Revoke system access',
      description: 'Disable email, Slack, and system accounts',
      assigneeType: 'it' as const,
      category: 'access_revocation' as const,
      status: 'pending' as const,
      dueDate: addBusinessDays(effectiveLastWorkingDay, 1),
      order: 3,
      isRequired: true
    },
    {
      taskId: generateId('OTSK'),
      title: 'Final payroll processing',
      description: 'Calculate final pay including leave encashment',
      assigneeType: 'finance' as const,
      category: 'final_payroll' as const,
      status: 'pending' as const,
      dueDate: addBusinessDays(effectiveLastWorkingDay, 3),
      order: 4,
      isRequired: true
    },
    {
      taskId: generateId('OTSK'),
      title: 'Manager clearance',
      description: 'Complete project handover sign-off',
      assigneeType: 'manager' as const,
      category: 'clearance' as const,
      status: 'pending' as const,
      dueDate: addBusinessDays(effectiveLastWorkingDay, -2),
      order: 5,
      isRequired: true
    },
    {
      taskId: generateId('OTSK'),
      title: 'HR exit interview',
      description: 'Conduct final exit interview',
      assigneeType: 'hr' as const,
      category: 'documentation' as const,
      status: 'pending' as const,
      dueDate: effectiveLastWorkingDay,
      order: 6,
      isRequired: true
    },
    {
      taskId: generateId('OTSK'),
      title: 'Benefits settlement',
      description: 'Settle PF, insurance, and other benefits',
      assigneeType: 'hr' as const,
      category: 'documentation' as const,
      status: 'pending' as const,
      dueDate: addBusinessDays(effectiveLastWorkingDay, 7),
      order: 7,
      isRequired: true
    }
  ];

  // Create clearance checklist
  const clearanceChecklist = [
    { category: 'Manager Clearance', cleared: false },
    { category: 'IT Clearance', cleared: false },
    { category: 'Finance Clearance', cleared: false },
    { category: 'HR Clearance', cleared: false }
  ];

  const instance = new OffboardingInstance({
    instanceId: generateId('OFB'),
    employeeId,
    employeeName,
    employeeEmail,
    interviewId,
    department,
    role,
    managerId,
    startDate: effectiveStartDate,
    targetEndDate: addBusinessDays(effectiveLastWorkingDay, 7),
    status: 'not_started',
    progress: 0,
    tasks,
    clearanceChecklist,
    notes: []
  });

  await instance.save();
  return instance;
}

/**
 * Get offboarding by ID
 */
export async function getOffboardingById(instanceId: string): Promise<typeof OffboardingInstance | null> {
  return OffboardingInstance.findOne({ instanceId });
}

/**
 * Get offboarding by employee ID
 */
export async function getOffboardingByEmployee(employeeId: string): Promise<typeof OffboardingInstance[]> {
  return OffboardingInstance.find({ employeeId }).sort({ startDate: -1 });
}

/**
 * Get active offboarding for employee
 */
export async function getActiveOffboarding(employeeId: string): Promise<typeof OffboardingInstance | null> {
  return OffboardingInstance.findOne({
    employeeId,
    status: { $in: ['not_started', 'in_progress'] }
  });
}

/**
 * List offboardings with filters
 */
export async function listOffboardings(query: ListOffboardingQuery) {
  const { employeeId, department, managerId, status, page, limit } = query;

  const filter: Record<string, unknown> = {};
  if (employeeId) filter.employeeId = employeeId;
  if (department) filter.department = department;
  if (managerId) filter.managerId = managerId;
  if (status) filter.status = status;

  const [instances, total] = await Promise.all([
    OffboardingInstance.find(filter)
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    OffboardingInstance.countDocuments(filter)
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
 * Complete an offboarding task
 */
export async function completeOffboardingTask(
  instanceId: string,
  taskId: string,
  input: CompleteOffboardingTaskInput,
  completedBy: string
): Promise<typeof OffboardingInstance | null> {
  const instance = await OffboardingInstance.findOne({ instanceId });
  if (!instance) return null;

  const task = instance.tasks.find(t => t.taskId === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
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

  // Update overall status
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
 * Update clearance status
 */
export async function updateClearance(
  instanceId: string,
  input: UpdateClearanceInput,
  clearedBy: string
): Promise<typeof OffboardingInstance | null> {
  const instance = await OffboardingInstance.findOne({ instanceId });
  if (!instance) return null;

  const item = instance.clearanceChecklist.find(c => c.category === input.category);
  if (!item) {
    throw new Error(`Clearance category ${input.category} not found`);
  }

  item.cleared = input.cleared;
  item.clearedBy = clearedBy;
  item.clearedAt = new Date();
  if (input.notes) {
    item.notes = input.notes;
  }

  // Update clearance flags
  const managerItem = instance.clearanceChecklist.find(c => c.category === 'Manager Clearance');
  const itItem = instance.clearanceChecklist.find(c => c.category === 'IT Clearance');
  const financeItem = instance.clearanceChecklist.find(c => c.category === 'Finance Clearance');

  instance.managerClearance = managerItem?.cleared || false;
  // IT and Finance would be handled by respective systems
  instance.financeClearance = financeItem?.cleared || false;

  instance.lastActivityAt = new Date();
  await instance.save();

  return instance;
}

/**
 * Add note to offboarding
 */
export async function addNote(
  instanceId: string,
  note: string
): Promise<typeof OffboardingInstance | null> {
  const instance = await OffboardingInstance.findOne({ instanceId });
  if (!instance) return null;

  instance.notes.push(note);
  instance.lastActivityAt = new Date();
  await instance.save();

  return instance;
}

/**
 * Cancel offboarding
 */
export async function cancelOffboarding(
  instanceId: string,
  reason: string
): Promise<typeof OffboardingInstance | null> {
  const instance = await OffboardingInstance.findOne({ instanceId });
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
): Promise<typeof OffboardingInstance[]> {
  const filter: Record<string, unknown> = {
    'tasks.assigneeId': userId,
    'tasks.assigneeType': assigneeType,
    status: { $in: ['not_started', 'in_progress'] }
  };

  if (status) {
    filter['tasks.status'] = status;
  }

  return OffboardingInstance.find(filter);
}

/**
 * Get offboarding statistics
 */
export async function getOffboardingStats(filters?: {
  department?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  const filter: Record<string, unknown> = {};
  if (filters?.department) filter.department = filters.department;
  if (filters?.fromDate || filters?.toDate) {
    filter.startDate = {};
    if (filters.fromDate) (filter.startDate as Record<string, Date>).$gte = filters.fromDate;
    if (filters.toDate) (filter.startDate as Record<string, Date>).$lte = filters.toDate;
  }

  const instances = await OffboardingInstance.find(filter);

  const stats = {
    total: instances.length,
    notStarted: instances.filter(i => i.status === 'not_started').length,
    inProgress: instances.filter(i => i.status === 'in_progress').length,
    completed: instances.filter(i => i.status === 'completed').length,
    cancelled: instances.filter(i => i.status === 'cancelled').length,
    avgProgress: 0,
    overdue: 0,
    clearancePending: {
      manager: 0,
      it: 0,
      finance: 0
    }
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

  instances.forEach(i => {
    if (!i.managerClearance) stats.clearancePending.manager++;
    const itCleared = i.clearanceChecklist.find(c => c.category === 'IT Clearance')?.cleared;
    if (!itCleared) stats.clearancePending.it++;
    if (!i.financeClearance) stats.clearancePending.finance++;
  });

  return stats;
}
