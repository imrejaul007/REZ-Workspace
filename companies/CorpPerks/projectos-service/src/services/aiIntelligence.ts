import { Project, Task, TimeEntry, WorkLog } from '../models/index.js';
import { createLogger } from '../utils/logger.js';
import type {
  AIRisk,
  DelayPrediction,
  DeliveryForecast,
  Bottleneck,
  EmployeeProductivity
} from '../types/index.js';

const logger = createLogger('ai-intelligence');

// ============================================================================
// DELAY PREDICTION
// ============================================================================

/**
 * Predict if a project will be delayed based on:
 * - Task completion rate
 * - Overtime hours
 * - Blocker history
 * - Attendance patterns
 * - Resource utilization
 */
export async function predictDelay(projectId: string): Promise<DelayPrediction> {
  try {
    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const tasks = await Task.find({ projectId });
    const now = new Date();
    const daysIntoProject = Math.ceil(
      (now.getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.ceil(
      (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedProgress = Math.min(100, (daysIntoProject / totalDays) * 100);

    // Calculate task completion rate
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const totalTasks = tasks.length;
    const actualProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const progressDelta = actualProgress - expectedProgress;

    // Calculate overtime impact
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const timeEntries = await TimeEntry.find({
      projectId,
      date: { $gte: weekAgo },
      type: 'overtime'
    });
    const totalOvertime = timeEntries.reduce((sum, e) => sum + e.hours, 0);
    const overtimeRisk = totalOvertime > 20 ? 1 : totalOvertime / 20;

    // Calculate blocker impact
    const blockedTasks = tasks.filter(t => {
      const daysBlocked = Math.ceil(
        (now.getTime() - new Date(t.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return t.status === 'blocked' || daysBlocked > 3;
    });
    const blockerImpact = blockedTasks.length / Math.max(totalTasks, 1);

    // Check recent work logs for blockers
    const workLogs = await WorkLog.find({
      employeeId: { $in: project.teamMembers },
      date: { $gte: weekAgo }
    });
    const blockerCount = workLogs.filter(w => w.blockers && w.blockers.length > 10).length;
    const blockerRate = blockerCount / Math.max(workLogs.length, 1);

    // Calculate reasons and suggestions
    const reasons: string[] = [];
    const suggestions: string[] = [];

    if (progressDelta < -10) {
      reasons.push(`Progress is ${Math.abs(progressDelta).toFixed(1)}% behind schedule`);
      suggestions.push('Consider adding resources or extending deadline');
    }

    if (overtimeRisk > 0.5) {
      reasons.push(`High overtime detected (${totalOvertime.toFixed(1)}h this week)`);
      suggestions.push('Team may be burning out - consider workload rebalancing');
    }

    if (blockerImpact > 0.2) {
      reasons.push(`${blockedTasks.length} tasks blocked or stagnant for 3+ days`);
      suggestions.push('Review blocked tasks and unblock dependencies');
    }

    if (blockerRate > 0.3) {
      reasons.push(`High blocker reporting rate (${(blockerRate * 100).toFixed(0)}%)`);
      suggestions.push('Schedule sync meeting to address blockers');
    }

    // Calculate delay estimate
    let estimatedDelayDays = 0;
    let willDelay = false;

    if (progressDelta < 0) {
      // Linear extrapolation of delay
      estimatedDelayDays = Math.ceil(Math.abs(progressDelta) * totalDays / 100);
      willDelay = estimatedDelayDays > 0;
    }

    // Adjust based on risk factors
    const riskMultiplier = 1 + (overtimeRisk * 0.5) + (blockerImpact * 0.3) + (blockerRate * 0.2);
    estimatedDelayDays = Math.ceil(estimatedDelayDays * riskMultiplier);

    // Calculate confidence (0-1)
    let confidence = 0.7;
    if (totalTasks > 10) confidence += 0.1;
    if (daysIntoProject > totalDays * 0.3) confidence += 0.1;
    if (overtimeRisk > 0.5) confidence -= 0.1;
    confidence = Math.max(0.5, Math.min(0.95, confidence));

    logger.info(`Delay prediction for ${projectId}: delay=${willDelay}, days=${estimatedDelayDays}, confidence=${confidence}`);

    return {
      projectId,
      willDelay,
      estimatedDelayDays,
      confidence,
      reasons,
      suggestions
    };
  } catch (error) {
    logger.error('Error predicting delay:', error);
    throw error;
  }
}

// ============================================================================
// RISK DETECTION
// ============================================================================

/**
 * Detect various risks in a project:
 * - Blocked tasks (>3 days)
 * - Inactive contributors (>5 days no activity)
 * - Dependency issues
 * - Overtime burnout (>20 hrs/week)
 * - Attendance impact
 */
export async function detectRisks(projectId: string): Promise<AIRisk[]> {
  try {
    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const risks: AIRisk[] = [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const tasks = await Task.find({ projectId });
    const timeEntries = await TimeEntry.find({
      projectId,
      date: { $gte: weekAgo }
    });

    // 1. Check for blocked/stagnant tasks
    const blockedTasks = tasks.filter(t => {
      if (t.status === 'blocked') return true;
      if (t.status !== 'done') {
        const daysSinceUpdate = Math.ceil(
          (now.getTime() - new Date(t.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceUpdate > 3;
      }
      return false;
    });

    if (blockedTasks.length > 0) {
      const severity = blockedTasks.length > 5 ? 'critical' :
                       blockedTasks.length > 3 ? 'high' : 'medium';
      risks.push({
        type: 'blocked_tasks',
        severity,
        description: `${blockedTasks.length} task(s) blocked or stagnant for 3+ days`,
        affectedTaskIds: blockedTasks.map(t => t.taskId),
        suggestedAction: 'Review and unblock tasks or escalate dependencies',
        detectedAt: now
      });
    }

    // 2. Check for inactive contributors
    for (const memberId of project.teamMembers) {
      const memberTasks = tasks.filter(t => t.assigneeId === memberId);
      const memberTimeEntries = timeEntries.filter(e => e.employeeId === memberId);

      const hasRecentActivity =
        memberTasks.some(t => new Date(t.updatedAt) > fiveDaysAgo) ||
        memberTimeEntries.length > 0;

      if (!hasRecentActivity && memberTasks.length > 0) {
        risks.push({
          type: 'inactive_contributor',
          severity: 'medium',
          description: `No activity from team member in 5+ days`,
          affectedTaskIds: memberTasks.map(t => t.taskId),
          suggestedAction: 'Reach out to team member for status update',
          detectedAt: now
        });
      }
    }

    // 3. Check for dependency issues
    const doneTaskIds = new Set(tasks.filter(t => t.status === 'done').map(t => t.taskId));
    const blockedByUndone: { task: typeof tasks[0]; deps: string[] }[] = [];

    for (const task of tasks.filter(t => t.status !== 'done')) {
      const undoneDeps = task.dependencies.filter(dep => !doneTaskIds.has(dep));
      if (undoneDeps.length > 0) {
        blockedByUndone.push({ task, deps: undoneDeps });
      }
    }

    if (blockedByUndone.length > 0) {
      risks.push({
        type: 'dependency_issue',
        severity: 'high',
        description: `${blockedByUndone.length} task(s) blocked by incomplete dependencies`,
        affectedTaskIds: blockedByUndone.map(b => b.task.taskId),
        suggestedAction: 'Review dependency chain and prioritize blocking tasks',
        detectedAt: now
      });
    }

    // 4. Check for overtime burnout
    const overtimeByEmployee: Record<string, number> = {};
    for (const entry of timeEntries.filter(e => e.type === 'overtime')) {
      overtimeByEmployee[entry.employeeId] = (overtimeByEmployee[entry.employeeId] || 0) + entry.hours;
    }

    for (const [employeeId, hours] of Object.entries(overtimeByEmployee)) {
      if (hours > 20) {
        const affectedTasks = tasks.filter(t => t.assigneeId === employeeId && t.status !== 'done');
        risks.push({
          type: 'overtime_burnout',
          severity: hours > 30 ? 'critical' : 'high',
          description: `${hours.toFixed(1)} overtime hours logged this week`,
          affectedTaskIds: affectedTasks.map(t => t.taskId),
          suggestedAction: 'Consider redistributing workload or adjusting scope',
          detectedAt: now
        });
      }
    }

    // 5. Check for task concentration (single person bottleneck)
    const tasksByAssignee: Record<string, number> = {};
    for (const task of tasks.filter(t => t.status !== 'done')) {
      tasksByAssignee[task.assigneeId] = (tasksByAssignee[task.assigneeId] || 0) + 1;
    }

    for (const [assigneeId, count] of Object.entries(tasksByAssignee)) {
      if (count > 5) {
        risks.push({
          type: 'dependency_issue',
          severity: count > 8 ? 'high' : 'medium',
          description: `${count} active tasks assigned to single person (bottleneck risk)`,
          affectedTaskIds: tasks.filter(t => t.assigneeId === assigneeId && t.status !== 'done').map(t => t.taskId),
          suggestedAction: 'Consider redistributing tasks to balance workload',
          detectedAt: now
        });
      }
    }

    logger.info(`Detected ${risks.length} risks for project ${projectId}`);
    return risks;
  } catch (error) {
    logger.error('Error detecting risks:', error);
    throw error;
  }
}

// ============================================================================
// DELIVERY FORECAST
// ============================================================================

/**
 * Forecast project delivery based on current velocity and trends
 */
export async function forecastDelivery(projectId: string): Promise<DeliveryForecast> {
  try {
    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const tasks = await Task.find({ projectId });
    const now = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const remainingTasks = totalTasks - completedTasks;

    // Calculate current velocity (tasks completed per day)
    const daysElapsed = Math.max(1, Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ));
    const currentVelocity = completedTasks / daysElapsed;

    // Calculate recent velocity (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentTasks = tasks.filter(t =>
      t.completionDate && new Date(t.completionDate) >= sevenDaysAgo
    );
    const recentVelocity = recentTasks.length / 7;

    // Use weighted velocity (recent is more important)
    const effectiveVelocity = (currentVelocity * 0.3 + recentVelocity * 0.7);

    // Calculate expected completion date
    let expectedCompletionDate: Date;
    if (effectiveVelocity > 0) {
      const daysToComplete = remainingTasks / effectiveVelocity;
      expectedCompletionDate = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
    } else {
      // No velocity, assume current pace continues
      expectedCompletionDate = new Date(endDate.getTime());
    }

    // Calculate risk score
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysNeeded = Math.ceil(
      (expectedCompletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let riskScore = 0;
    const factors: DeliveryForecast['factors'] = [];

    // On-track factor
    if (expectedCompletionDate <= endDate) {
      factors.push({ name: 'On schedule', impact: 'positive', weight: 0.2 });
      riskScore += 20;
    } else {
      const delayDays = Math.ceil(
        (expectedCompletionDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      factors.push({ name: `Delayed by ${delayDays} days`, impact: 'negative', weight: -0.3 });
      riskScore += Math.min(80, delayDays * 5);
    }

    // Team velocity factor
    if (effectiveVelocity > 0.5) {
      factors.push({ name: 'Good velocity', impact: 'positive', weight: 0.15 });
      riskScore += 15;
    } else if (effectiveVelocity < 0.2) {
      factors.push({ name: 'Low velocity', impact: 'negative', weight: -0.2 });
      riskScore -= 20;
    }

    // Task complexity factor (estimated vs actual hours)
    const tasksWithHours = tasks.filter(t => t.estimatedHours > 0);
    if (tasksWithHours.length > 0) {
      const avgRatio = tasksWithHours.reduce((sum, t) => {
        return sum + (t.actualHours / t.estimatedHours);
      }, 0) / tasksWithHours.length;

      if (avgRatio > 1.3) {
        factors.push({ name: 'Tasks taking longer than estimated', impact: 'negative', weight: -0.2 });
        riskScore -= 20;
      } else if (avgRatio < 0.8) {
        factors.push({ name: 'Tasks completed faster than estimated', impact: 'positive', weight: 0.1 });
        riskScore += 10;
      }
    }

    // Resource factor
    const activeTasks = tasks.filter(t => t.status === 'in_progress');
    if (activeTasks.length < Math.min(3, totalTasks * 0.1)) {
      factors.push({ name: 'Low active task count', impact: 'negative', weight: -0.1 });
      riskScore -= 10;
    }

    // Normalize risk score to 0-100
    riskScore = Math.max(0, Math.min(100, 50 + riskScore));

    // Calculate confidence
    let confidenceScore = 0.5;
    if (totalTasks > 10) confidenceScore += 0.1;
    if (daysElapsed > (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) * 0.3) {
      confidenceScore += 0.15;
    }
    if (completedTasks > totalTasks * 0.2) confidenceScore += 0.1;
    confidenceScore = Math.max(0.3, Math.min(0.95, confidenceScore));

    logger.info(`Delivery forecast for ${projectId}: expected=${expectedCompletionDate.toISOString()}, risk=${riskScore}`);

    return {
      projectId,
      expectedCompletionDate,
      originalEndDate: endDate,
      riskScore,
      confidenceScore,
      factors
    };
  } catch (error) {
    logger.error('Error forecasting delivery:', error);
    throw error;
  }
}

// ============================================================================
// BOTTLENECK DETECTION
// ============================================================================

/**
 * Detect team bottlenecks
 */
export async function detectBottlenecks(departmentId?: string): Promise<Bottleneck[]> {
  try {
    const query: Record<string, unknown> = {};
    if (departmentId) {
      query.departmentId = departmentId;
    }

    const projects = await Project.find({
      ...query,
      status: 'active'
    });

    const bottlenecks: Bottleneck[] = [];

    for (const project of projects) {
      const tasks = await Task.find({ projectId: project.projectId });
      const teamMemberWorkload: Record<string, { active: number; total: number; name: string }> = {};

      // Initialize workload tracking
      for (const memberId of project.teamMembers) {
        teamMemberWorkload[memberId] = { active: 0, total: 0, name: memberId };
      }

      // Count active and total tasks per member
      for (const task of tasks) {
        if (teamMemberWorkload[task.assigneeId]) {
          teamMemberWorkload[task.assigneeId].total++;
          if (task.status === 'in_progress') {
            teamMemberWorkload[task.assigneeId].active++;
          }
        }
      }

      // Check for overloaded members
      for (const [memberId, workload] of Object.entries(teamMemberWorkload)) {
        if (workload.total > 8) {
          bottlenecks.push({
            type: 'person',
            severity: workload.total > 12 ? 'high' : 'medium',
            description: `${workload.name} has ${workload.total} assigned tasks (${workload.active} active)`,
            affectedEntity: memberId,
            suggestedResolution: 'Redistribute tasks to balance workload'
          });
        }
      }

      // Check for blocked tasks bottleneck
      const blockedTasks = tasks.filter(t => t.status === 'blocked');
      if (blockedTasks.length > 2) {
        bottlenecks.push({
          type: 'task',
          severity: blockedTasks.length > 5 ? 'high' : 'medium',
          description: `${blockedTasks.length} tasks blocked across project`,
          affectedEntity: project.projectId,
          suggestedResolution: 'Review blocked tasks and resolve dependencies'
        });
      }
    }

    logger.info(`Detected ${bottlenecks.length} bottlenecks`);
    return bottlenecks;
  } catch (error) {
    logger.error('Error detecting bottlenecks:', error);
    throw error;
  }
}

// ============================================================================
// EMPLOYEE PRODUCTIVITY
// ============================================================================

/**
 * Calculate employee productivity metrics
 */
export async function getEmployeeProductivity(employeeId: string): Promise<EmployeeProductivity> {
  try {
    const tasks = await Task.find({ assigneeId: employeeId });
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    const totalTasksAssigned = tasks.length;
    const tasksCompleted = tasks.filter(t => t.status === 'done').length;
    const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
    const tasksOverdue = tasks.filter(t =>
      t.status !== 'done' && new Date(t.dueDate) < now
    ).length;

    const completionRate = totalTasksAssigned > 0
      ? (tasksCompleted / totalTasksAssigned) * 100
      : 0;

    const tasksWithHours = tasks.filter(t => t.actualHours > 0);
    const averageHoursPerTask = tasksWithHours.length > 0
      ? tasksWithHours.reduce((sum, t) => sum + t.actualHours, 0) / tasksWithHours.length
      : 0;

    // Get overtime hours for last week
    const timeEntries = await TimeEntry.find({
      employeeId,
      date: { $gte: weekAgo }
    });
    const overtimeHours = timeEntries
      .filter(e => e.type === 'overtime')
      .reduce((sum, e) => sum + e.hours, 0);

    // Calculate utilization (hours logged vs expected 40h week)
    const weeklyHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
    const utilizationRate = Math.min(100, (weeklyHours / 40) * 100);

    // Get weekly data for last 4 weeks
    const weeklyData: EmployeeProductivity['weeklyData'] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const weekTasks = tasks.filter(t =>
        t.completionDate &&
        new Date(t.completionDate) >= weekStart &&
        new Date(t.completionDate) < weekEnd
      );

      const weekEntries = timeEntries.filter(e =>
        new Date(e.date) >= weekStart &&
        new Date(e.date) < weekEnd
      );

      weeklyData.push({
        week: weekStart.toISOString().split('T')[0],
        tasksCompleted: weekTasks.length,
        hoursLogged: weekEntries.reduce((sum, e) => sum + e.hours, 0)
      });
    }

    // Get employee name from first task
    const employeeName = tasks[0]?.assigneeName || employeeId;

    logger.info(`Calculated productivity for ${employeeId}: ${completionRate.toFixed(1)}% completion rate`);

    return {
      employeeId,
      employeeName,
      totalTasksAssigned,
      tasksCompleted,
      tasksInProgress,
      tasksOverdue,
      completionRate,
      averageHoursPerTask,
      overtimeHours,
      utilizationRate,
      weeklyData: weeklyData.reverse()
    };
  } catch (error) {
    logger.error('Error calculating employee productivity:', error);
    throw error;
  }
}
