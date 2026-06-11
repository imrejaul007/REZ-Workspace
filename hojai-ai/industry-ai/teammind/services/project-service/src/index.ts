/**
 * Project Service - Project Management
 * Part of TEAMMIND - Team Management AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  description: string;
  managerId: string;
  managerName: string;
  teamMembers: string[];
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  endDate: string;
  budget: { allocated: number; spent: number };
  progress: number;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  tasks: string[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  actualHours?: number;
  dueDate?: string;
  dependencies?: string[];
}

export class ProjectService {
  private projects: Map<string, Project> = new Map();
  private tasks: Map<string, Task> = new Map();

  async createProject(data: Omit<Project, 'id' | 'projectCode' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const project: Project = {
      ...data,
      id: uuidv4(),
      projectCode: `PRJ${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.set(project.id, project);
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAll(filters?: { status?: Project['status']; managerId?: string }): Promise<Project[]> {
    let result = Array.from(this.projects.values());

    if (filters?.status) result = result.filter(p => p.status === filters.status);
    if (filters?.managerId) result = result.filter(p => p.managerId === filters.managerId);

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    Object.assign(project, updates, { updatedAt: new Date().toISOString() });
    this.projects.set(id, project);
    return project;
  }

  async addMilestone(projectId: string, milestone: Omit<Milestone, 'id'>): Promise<Project | undefined> {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    project.milestones.push({ ...milestone, id: uuidv4() });
    project.updatedAt = new Date().toISOString();
    this.projects.set(projectId, project);
    return project;
  }

  async createTask(data: Omit<Task, 'id'>): Promise<Task> {
    const task: Task = { ...data, id: uuidv4() };
    this.tasks.set(task.id, task);
    return task;
  }

  async getProjectTasks(projectId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.projectId === projectId)
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    task.status = status;
    if (status === 'done' && !task.actualHours) {
      task.actualHours = task.estimatedHours;
    }

    this.tasks.set(taskId, task);

    // Update project progress
    const projectTasks = Array.from(this.tasks.values()).filter(t => t.projectId === task.projectId);
    const doneTasks = projectTasks.filter(t => t.status === 'done').length;
    const progress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;

    const project = this.projects.get(task.projectId);
    if (project) {
      project.progress = progress;
      project.updatedAt = new Date().toISOString();
      this.projects.set(project.id, project);
    }

    return task;
  }

  async getProjectStats(projectId: string): Promise<{
    totalTasks: number;
    completed: number;
    inProgress: number;
    overdue: number;
    teamUtilization: number;
  }> {
    const projectTasks = Array.from(this.tasks.values()).filter(t => t.projectId === projectId);

    const now = new Date();
    const overdue = projectTasks.filter(t =>
      t.status !== 'done' &&
      t.dueDate &&
      new Date(t.dueDate) < now
    ).length;

    const totalHours = projectTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const usedHours = projectTasks.reduce((sum, t) => sum + (t.actualHours || 0), sum);
    const teamUtilization = totalHours > 0 ? Math.round((usedHours / totalHours) * 100) : 0;

    return {
      totalTasks: projectTasks.length,
      completed: projectTasks.filter(t => t.status === 'done').length,
      inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
      overdue,
      teamUtilization
    };
  }
}

export default ProjectService;