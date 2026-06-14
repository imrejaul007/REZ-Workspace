import { Project, Task, Milestone, Sprint, TimeEntry } from '../models/index.js';
import { generateProjectId, generateMilestoneId, generateSprintId } from '../utils/idGenerator.js';
import { detectRisks } from './aiIntelligence.js';
import { createLogger } from '../utils/logger.js';
import type {
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectFilters,
  ManagerDashboard,
  AIRisk,
  TeamUtilization,
  SprintCreateInput
} from '../types/index.js';

const logger = createLogger('project-service');

// Helper to convert string dates to Date objects
function toDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  return new Date(value);
}

// ============================================================================
// PROJECT CRUD
// ============================================================================

export async function createProject(input: ProjectCreateInput): Promise<typeof Project.prototype> {
  try {
    const projectId = generateProjectId();

    const project = new Project({
      name: input.name,
      description: input.description || '',
      departmentId: input.departmentId,
      managerId: input.managerId,
      teamMembers: input.teamMembers || [],
      startDate: toDate(input.startDate) || new Date(),
      endDate: toDate(input.endDate) || new Date(),
      budget: input.budget || 0,
      priority: input.priority || 'medium',
      clientId: input.clientId,
      clientName: input.clientName,
      tags: input.tags || [],
      projectId,
      status: 'planning',
      health: 100,
      completionPercentage: 0,
      spentAmount: 0,
      aiRisks: []
    });

    await project.save();
    logger.info(`Created project: ${projectId} - ${input.name}`);

    return project;
  } catch (error) {
    logger.error('Error creating project:', error);
    throw error;
  }
}

export async function getProject(projectId: string): Promise<typeof Project.prototype | null> {
  try {
    const project = await Project.findOne({ projectId });
    return project;
  } catch (error) {
    logger.error('Error getting project:', error);
    throw error;
  }
}

export async function getProjects(
  filters: ProjectFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{ projects: typeof Project.prototype[]; total: number }> {
  try {
    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.departmentId) query.departmentId = filters.departmentId;
    if (filters.managerId) query.managerId = filters.managerId;
    if (filters.teamMemberId) query.teamMembers = filters.teamMemberId;
    if (filters.clientId) query.clientId = filters.clientId;

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    if (filters.startDate || filters.endDate) {
      query.startDate = {};
      if (filters.startDate) (query.startDate as Record<string, Date>).$gte = filters.startDate;
      if (filters.endDate) (query.startDate as Record<string, Date>).$lte = filters.endDate;
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Project.countDocuments(query)
    ]);

    return { projects, total };
  } catch (error) {
    logger.error('Error getting projects:', error);
    throw error;
  }
}

export async function updateProject(
  projectId: string,
  input: ProjectUpdateInput
): Promise<typeof Project.prototype | null> {
  try {
    const project = await Project.findOneAndUpdate(
      { projectId },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (project) {
      logger.info(`Updated project: ${projectId}`);
    }

    return project;
  } catch (error) {
    logger.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    const result = await Project.deleteOne({ projectId });

    // Also delete related data
    await Promise.all([
      Task.deleteMany({ projectId }),
      Milestone.deleteMany({ projectId }),
      Sprint.deleteMany({ projectId }),
      TimeEntry.deleteMany({ projectId })
    ]);

    logger.info(`Deleted project: ${projectId}`);
    return result.deletedCount > 0;
  } catch (error) {
    logger.error('Error deleting project:', error);
    throw error;
  }
}

// ============================================================================
// PROJECT ANALYTICS
// ============================================================================

export async function getProjectTeamUtilization(projectId: string): Promise<TeamUtilization[]> {
  try {
    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const tasks = await Task.find({ projectId });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const timeEntries = await TimeEntry.aggregate([
      {
        $match: {
          projectId,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$employeeId',
          employeeName: { $first: '$employeeName' },
          totalHours: { $sum: '$hours' }
        }
      }
    ]);

    const hoursByEmployee: Record<string, { name: string; hours: number }> = {};
    for (const entry of timeEntries) {
      hoursByEmployee[entry._id] = { name: entry.employeeName, hours: entry.totalHours };
    }

    const utilization: TeamUtilization[] = [];

    for (const memberId of project.teamMembers) {
      const memberTasks = tasks.filter(t => t.assigneeId === memberId);
      const activeTasks = memberTasks.filter(t => t.status === 'in_progress').length;
      const hoursInfo = hoursByEmployee[memberId] || { name: memberId, hours: 0 };

      // Assume 160 hours/month per person
      const allocatedHours = 160;
      const utilizationPercent = (hoursInfo.hours / allocatedHours) * 100;

      utilization.push({
        employeeId: memberId,
        employeeName: hoursInfo.name,
        projectId,
        projectName: project.name,
        allocatedHours,
        loggedHours: hoursInfo.hours,
        utilization: Math.round(utilizationPercent),
        taskCount: memberTasks.length,
        activeTaskCount: activeTasks
      });
    }

    return utilization;
  } catch (error) {
    logger.error('Error getting team utilization:', error);
    throw error;
  }
}

export async function getProjectRisks(projectId: string): Promise<AIRisk[]> {
  try {
    const risks = await detectRisks(projectId);

    // Update project's stored risks
    await Project.findOneAndUpdate(
      { projectId },
      { $set: { aiRisks: risks } }
    );

    return risks;
  } catch (error) {
    logger.error('Error getting project risks:', error);
    throw error;
  }
}

export async function refreshProjectHealth(projectId: string): Promise<number> {
  try {
    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const tasks = await Task.find({ projectId });
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
      return 100;
    }

    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionPercentage = (completedTasks / totalTasks) * 100;

    // Calculate health based on multiple factors
    let health = 100;

    // Deduct for overdue tasks
    const overdueTasks = tasks.filter(t =>
      t.status !== 'done' && new Date(t.dueDate) < new Date()
    );
    health -= (overdueTasks.length / totalTasks) * 20;

    // Deduct for blocked tasks
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    health -= (blockedTasks.length / totalTasks) * 15;

    // Deduct for behind schedule
    const daysIntoProject = Math.ceil(
      (new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.ceil(
      (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedProgress = (daysIntoProject / totalDays) * 100;
    const progressBehind = expectedProgress - completionPercentage;
    if (progressBehind > 0) {
      health -= progressBehind * 0.3;
    }

    health = Math.max(0, Math.min(100, Math.round(health)));

    // Update project
    await Project.findOneAndUpdate(
      { projectId },
      {
        health,
        completionPercentage: Math.round(completionPercentage)
      }
    );

    logger.info(`Refreshed project ${projectId} health: ${health}%`);
    return health;
  } catch (error) {
    logger.error('Error refreshing project health:', error);
    throw error;
  }
}

// ============================================================================
// MANAGER DASHBOARD
// ============================================================================

export async function getManagerDashboard(managerId: string): Promise<ManagerDashboard> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const projects = await Project.find({
      managerId,
      status: { $in: ['active', 'planning', 'paused'] }
    });

    const completedThisMonth = await Project.countDocuments({
      managerId,
      status: 'completed',
      updatedAt: { $gte: startOfMonth }
    });

    // Calculate delayed projects
    const delayedProjects = projects.filter(p => {
      const daysRemaining = Math.ceil(
        (new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysRemaining < 0 && p.completionPercentage < 100;
    });

    // Calculate at-risk projects (health < 60)
    const atRiskProjects = projects.filter(p => p.health < 60);

    // Get all team members
    const teamMemberSet = new Set<string>();
    projects.forEach(p => p.teamMembers.forEach(m => teamMemberSet.add(m)));

    // Calculate total budget and spent
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spentAmount, 0);

    // Get upcoming deadlines (next 7 days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = projects
      .filter(p => {
        const endDate = new Date(p.endDate);
        return endDate >= now && endDate <= sevenDaysFromNow;
      })
      .map(p => ({
        projectId: p.projectId,
        projectName: p.name,
        deadline: p.endDate,
        daysRemaining: Math.ceil(
          (new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Get recent completions
    const recentCompletions = await Project.find({
      managerId,
      status: 'completed'
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('projectId name updatedAt');

    // Get AI alerts from all active projects
    const aiAlerts: ManagerDashboard['aiAlerts'] = [];
    for (const project of projects) {
      const risks = project.aiRisks || [];
      for (const risk of risks) {
        if (risk.severity === 'high' || risk.severity === 'critical') {
          aiAlerts.push({
            severity: risk.severity,
            message: `${project.name}: ${risk.description}`,
            projectId: project.projectId
          });
        }
      }
    }

    // Sort alerts by severity
    aiAlerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const averageProjectHealth = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.health, 0) / projects.length)
      : 0;

    const dashboard: ManagerDashboard = {
      activeProjects: projects.filter(p => p.status === 'active').length,
      delayedProjects: delayedProjects.length,
      atRiskProjects: atRiskProjects.length,
      completedThisMonth,
      totalTeamMembers: teamMemberSet.size,
      averageProjectHealth,
      totalBudget,
      totalSpent,
      upcomingDeadlines,
      recentCompletions: recentCompletions.map(p => ({
        projectId: p.projectId,
        projectName: p.name,
        completedAt: p.updatedAt
      })),
      aiAlerts: aiAlerts.slice(0, 10) // Top 10 alerts
    };

    return dashboard;
  } catch (error) {
    logger.error('Error getting manager dashboard:', error);
    throw error;
  }
}

// ============================================================================
// MILESTONE MANAGEMENT
// ============================================================================

export async function createMilestone(
  projectId: string,
  data: { name: string; description: string; dueDate: Date; deliverables?: string[] }
): Promise<typeof Milestone.prototype> {
  try {
    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const milestone = new Milestone({
      milestoneId: generateMilestoneId(),
      projectId,
      ...data,
      status: 'pending',
      completionPercentage: 0,
      deliverables: data.deliverables || []
    });

    await milestone.save();
    logger.info(`Created milestone: ${milestone.milestoneId} for project ${projectId}`);

    return milestone;
  } catch (error) {
    logger.error('Error creating milestone:', error);
    throw error;
  }
}

export async function getProjectMilestones(projectId: string): Promise<typeof Milestone.prototype[]> {
  try {
    const milestones = await Milestone.find({ projectId })
      .sort({ dueDate: 1 });
    return milestones;
  } catch (error) {
    logger.error('Error getting milestones:', error);
    throw error;
  }
}

// ============================================================================
// SPRINT MANAGEMENT
// ============================================================================

export async function createSprint(input: SprintCreateInput): Promise<typeof Sprint.prototype> {
  try {
    const project = await Project.findOne({ projectId: input.projectId });
    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    const sprint = new Sprint({
      sprintId: generateSprintId(),
      ...input,
      status: 'planning',
      plannedPoints: 0,
      completedPoints: 0,
      velocity: 0
    });

    await sprint.save();
    logger.info(`Created sprint: ${sprint.sprintId} for project ${input.projectId}`);

    return sprint;
  } catch (error) {
    logger.error('Error creating sprint:', error);
    throw error;
  }
}

export async function startSprint(sprintId: string): Promise<typeof Sprint.prototype | null> {
  try {
    // Complete any existing active sprint
    await Sprint.updateMany(
      { status: 'active' },
      { status: 'completed' }
    );

    const sprint = await Sprint.findOneAndUpdate(
      { sprintId, status: 'planning' },
      { status: 'active' },
      { new: true }
    );

    if (sprint) {
      logger.info(`Started sprint: ${sprintId}`);
    }

    return sprint;
  } catch (error) {
    logger.error('Error starting sprint:', error);
    throw error;
  }
}

export async function completeSprint(sprintId: string): Promise<typeof Sprint.prototype | null> {
  try {
    const sprint = await Sprint.findOne({ sprintId });
    if (!sprint) {
      return null;
    }

    // Calculate completed points from tasks
    const tasks = await Task.find({
      sprintId,
      status: 'done',
      completionDate: {
        $gte: sprint.startDate,
        $lte: sprint.endDate
      }
    });

    const completedPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const velocity = completedPoints;

    const updatedSprint = await Sprint.findOneAndUpdate(
      { sprintId },
      {
        status: 'completed',
        completedPoints,
        velocity
      },
      { new: true }
    );

    if (updatedSprint) {
      logger.info(`Completed sprint: ${sprintId} with velocity ${velocity}`);
    }

    return updatedSprint;
  } catch (error) {
    logger.error('Error completing sprint:', error);
    throw error;
  }
}
