import { v4 as uuidv4 } from 'uuid';
import { Task, CreateTaskSchema, UpdateTaskSchema } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('TaskService');

// In-memory storage
const tasks: Map<string, Task> = new Map();

export class TaskService {
  async create(tenantId: string, data: unknown): Promise<Task> {
    const parsed = CreateTaskSchema.parse(data);

    const task: Task = {
      id: uuidv4(),
      tenantId,
      projectId: parsed.projectId,
      name: parsed.name,
      description: parsed.description,
      estimatedHours: parsed.estimatedHours,
      isActive: parsed.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tasks.set(task.id, task);
    logger.info('Task created', { taskId: task.id, tenantId, name: task.name, projectId: task.projectId });

    return task;
  }

  async findById(tenantId: string, id: string): Promise<Task | null> {
    const task = tasks.get(id);
    if (!task || task.tenantId !== tenantId) {
      return null;
    }
    return task;
  }

  async findByProject(tenantId: string, projectId: string, options?: { activeOnly?: boolean }): Promise<Task[]> {
    let result = Array.from(tasks.values())
      .filter(t => t.tenantId === tenantId && t.projectId === projectId);

    if (options?.activeOnly) {
      result = result.filter(t => t.isActive);
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async findAll(tenantId: string, options?: { activeOnly?: boolean }): Promise<Task[]> {
    let result = Array.from(tasks.values())
      .filter(t => t.tenantId === tenantId);

    if (options?.activeOnly) {
      result = result.filter(t => t.isActive);
    }

    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async update(tenantId: string, id: string, data: unknown): Promise<Task | null> {
    const existing = tasks.get(id);
    if (!existing || existing.tenantId !== tenantId) {
      return null;
    }

    const parsed = UpdateTaskSchema.parse(data);

    const updated: Task = {
      ...existing,
      ...parsed,
      id: existing.id,
      tenantId: existing.tenantId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    tasks.set(id, updated);
    logger.info('Task updated', { taskId: id, tenantId });

    return updated;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const task = tasks.get(id);
    if (!task || task.tenantId !== tenantId) {
      return false;
    }

    const deleted = tasks.delete(id);
    if (deleted) {
      logger.info('Task deleted', { taskId: id, tenantId });
    }
    return deleted;
  }

  async toggleActive(tenantId: string, id: string, isActive: boolean): Promise<Task | null> {
    return this.update(tenantId, id, { isActive });
  }
}

export const taskService = new TaskService();
