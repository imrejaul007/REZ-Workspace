/**
 * Task Manager AI - Team Task Assignment & Tracking
 * Part of TEAMMIND - Team Management AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';
import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4881;

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId?: string;
  assigneeName?: string;
  projectId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  dueDate?: string;
  estimatedHours?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TaskFilter {
  assigneeId?: string;
  projectId?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueBefore?: string;
  dueAfter?: string;
}

const tasks = new Map<string, Task>();
const taskIdCounter = 1000;

export class TaskManagerAI {
  private workloadThreshold = 8; // hours per day

  /**
   * Create a new task
   */
  async createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ task: Task; message: string }> {
    const task: Task = {
      ...data,
      id: `TASK-${taskIdCounter + tasks.size + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.set(task.id, task);
    const message = this.generateTaskCreatedMessage(task);
    return { task, message };
  }

  /**
   * Assign task to team member with workload balancing
   */
  async assignTask(taskId: string, assigneeId: string, assigneeName: string): Promise<{ task: Task; message: string; warning?: string }> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Calculate workload
    const currentWorkload = this.calculateWorkload(assigneeId);
    const estimatedLoad = currentWorkload + (task.estimatedHours || 1);

    task.assigneeId = assigneeId;
    task.assigneeName = assigneeName;
    task.updatedAt = new Date().toISOString();

    let warning: string | undefined;
    if (estimatedLoad > this.workloadThreshold * 5) {
      warning = `${assigneeName} may be overloaded. Current workload: ${currentWorkload}h, adding ${task.estimatedHours || 1}h more.`;
    }

    const message = `Task "${task.title}" assigned to ${assigneeName}.`;
    return { task, message, warning };
  }

  /**
   * Update task status
   */
  async updateStatus(taskId: string, status: Task['status']): Promise<{ task: Task; message: string }> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (status === 'done' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }

    const message = this.generateStatusUpdateMessage(task);
    return { task, message };
  }

  /**
   * Get tasks with filtering
   */
  async getTasks(filters: TaskFilter): Promise<Task[]> {
    let result = Array.from(tasks.values());

    if (filters.assigneeId) {
      result = result.filter(t => t.assigneeId === filters.assigneeId);
    }
    if (filters.projectId) {
      result = result.filter(t => t.projectId === filters.projectId);
    }
    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters.dueBefore) {
      result = result.filter(t => t.dueDate && t.dueDate <= filters.dueBefore!);
    }
    if (filters.dueAfter) {
      result = result.filter(t => t.dueDate && t.dueDate >= filters.dueAfter!);
    }

    return result.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get AI recommendations for task distribution
   */
  async getDistributionRecommendations(): Promise<{ recommendations: Array<{ employeeId: string; employeeName: string; recommendedTasks: number; reason: string }> }> {
    const employeeWorkloads = new Map<string, { name: string; tasks: number; hours: number }>();

    tasks.forEach(task => {
      if (task.assigneeId) {
        const current = employeeWorkloads.get(task.assigneeId) || { name: task.assigneeName || 'Unknown', tasks: 0, hours: 0 };
        current.tasks++;
        current.hours += task.estimatedHours || 1;
        employeeWorkloads.set(task.assigneeId, current);
      }
    });

    const recommendations = Array.from(employeeWorkloads.entries()).map(([id, data]) => ({
      employeeId: id,
      employeeName: data.name,
      recommendedTasks: Math.max(0, 3 - data.tasks),
      reason: data.tasks > 3 ? 'High workload - reduce tasks' : 'Available for more tasks'
    }));

    return { recommendations };
  }

  private calculateWorkload(assigneeId: string): number {
    let total = 0;
    tasks.forEach(task => {
      if (task.assigneeId === assigneeId && task.status !== 'done') {
        total += task.estimatedHours || 1;
      }
    });
    return total;
  }

  private generateTaskCreatedMessage(task: Task): string {
    let message = `New task created: "${task.title}"`;
    if (task.priority === 'urgent' || task.priority === 'high') {
      message += ` [${task.priority.toUpperCase()} priority]`;
    }
    if (task.dueDate) {
      message += ` - Due: ${task.dueDate}`;
    }
    return message;
  }

  private generateStatusUpdateMessage(task: Task): string {
    const statusMessages: Record<string, string> = {
      todo: 'marked as To Do',
      in_progress: 'is now in progress',
      review: 'moved to review',
      done: 'has been completed',
      blocked: 'is now blocked'
    };
    return `"${task.title}" ${statusMessages[task.status]}`;
  }
}

const taskManager = new TaskManagerAI();

// ============================================
// API ROUTES
// ============================================

app.post('/api/tasks', async (req, res) => {
  try {
    const result = await taskManager.createTask(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const filters: TaskFilter = {
      assigneeId: req.query.assigneeId as string,
      projectId: req.query.projectId as string,
      status: req.query.status as Task['status'],
      priority: req.query.priority as Task['priority'],
      dueBefore: req.query.dueBefore as string,
      dueAfter: req.query.dueAfter as string
    };
    const tasks = await taskManager.getTasks(filters);
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

app.post('/api/tasks/:taskId/assign', async (req, res) => {
  try {
    const { assigneeId, assigneeName } = req.body;
    const result = await taskManager.assignTask(req.params.taskId, assigneeId, assigneeName);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

app.patch('/api/tasks/:taskId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await taskManager.updateStatus(req.params.taskId, status);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

app.get('/api/ai/recommendations', async (req, res) => {
  try {
    const recommendations = await taskManager.getDistributionRecommendations();
    res.json({ success: true, ...recommendations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Task Manager AI',
    version: '1.0.0',
    port: PORT,
    totalTasks: tasks.size
  });
});

app.listen(PORT, () => {
  console.log(`\n  Task Manager AI running on port ${PORT}\n`);
});

export default app;
