import { v4 as uuidv4 } from 'uuid';
import { Project, CreateProjectSchema, UpdateProjectSchema } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProjectService');

// In-memory storage
const projects: Map<string, Project> = new Map();

export class ProjectService {
  async create(tenantId: string, data: unknown): Promise<Project> {
    const parsed = CreateProjectSchema.parse(data);

    const project: Project = {
      id: uuidv4(),
      tenantId,
      name: parsed.name,
      description: parsed.description,
      clientName: parsed.clientName,
      hourlyRate: parsed.hourlyRate,
      isActive: parsed.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    projects.set(project.id, project);
    logger.info('Project created', { projectId: project.id, tenantId, name: project.name });

    return project;
  }

  async findById(tenantId: string, id: string): Promise<Project | null> {
    const project = projects.get(id);
    if (!project || project.tenantId !== tenantId) {
      return null;
    }
    return project;
  }

  async findAll(tenantId: string, options?: { activeOnly?: boolean }): Promise<Project[]> {
    let result = Array.from(projects.values())
      .filter(p => p.tenantId === tenantId);

    if (options?.activeOnly) {
      result = result.filter(p => p.isActive);
    }

    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async update(tenantId: string, id: string, data: unknown): Promise<Project | null> {
    const existing = projects.get(id);
    if (!existing || existing.tenantId !== tenantId) {
      return null;
    }

    const parsed = UpdateProjectSchema.parse(data);

    const updated: Project = {
      ...existing,
      ...parsed,
      id: existing.id,
      tenantId: existing.tenantId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    projects.set(id, updated);
    logger.info('Project updated', { projectId: id, tenantId });

    return updated;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const project = projects.get(id);
    if (!project || project.tenantId !== tenantId) {
      return false;
    }

    const deleted = projects.delete(id);
    if (deleted) {
      logger.info('Project deleted', { projectId: id, tenantId });
    }
    return deleted;
  }

  async toggleActive(tenantId: string, id: string, isActive: boolean): Promise<Project | null> {
    return this.update(tenantId, id, { isActive });
  }

  async getByClient(tenantId: string, clientName: string): Promise<Project[]> {
    return Array.from(projects.values())
      .filter(p => p.tenantId === tenantId && p.clientName === clientName);
  }
}

export const projectService = new ProjectService();
