import { Project, IProject, ProjectStatus } from '../models/Builder';
import { logger } from '../config/logger';

export class BuilderService {
  // Projects

  async createProject(data: Partial<IProject>): Promise<IProject> {
    const project = new Project(data);
    await project.save();
    logger.info('Project created', { projectId: project._id });
    return project;
  }

  async getProjects(builderId: string): Promise<IProject[]> {
    return Project.find({ builderId, deletedAt: null }).sort({ createdAt: -1 });
  }

  async getProject(id: string): Promise<IProject | null> {
    return Project.findOne({ _id: id, deletedAt: null });
  }

  async updateProject(id: string, updates: Partial<IProject>): Promise<IProject | null> {
    return Project.findByIdAndUpdate(id, { $set: updates }, { new: true });
  }

  async getProjectStats(projectId: string): Promise<{
    totalUnits: number;
    soldUnits: number;
    availableUnits: number;
    soldPercentage: number;
    revenue: number;
  }> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    return {
      totalUnits: project.totalUnits,
      soldUnits: project.soldUnits,
      availableUnits: project.availableUnits,
      soldPercentage: project.totalUnits > 0 ? (project.soldUnits / project.totalUnits) * 100 : 0,
      revenue: project.soldUnits * ((project.priceRange?.min || 0) + (project.priceRange?.max || 0)) / 2
    };
  }

  // Units

  async getUnits(projectId: string, filters: { status?: string; towerId?: string } = {}): Promise<any[]> {
    const query: any = { projectId, deletedAt: null };
    if (filters.status) query.status = filters.status;
    if (filters.towerId) query.towerId = filters.towerId;
    return (await import('../models/Builder')).Unit.find(query).sort({ floor: 1, unitNumber: 1 }).lean();
  }

  async updateUnitStatus(unitId: string, status: string, bookedBy?: string): Promise<any> {
    const update: any = { status };
    if (bookedBy) {
      update.bookedBy = bookedBy;
      update.bookedAt = new Date();
    }

    const { Unit } = await import('../models/Builder');
    const unit = await Unit.findByIdAndUpdate(unitId, { $set: update }, { new: true });

    if (unit && (status === 'booked' || status === 'sold')) {
      // Update project sold count
      await Project.findByIdAndUpdate(unit.projectId, { $inc: { soldUnits: 1, availableUnits: -1 } });
    }

    return unit;
  }

  // Dashboard

  async getDashboard(builderId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    totalUnits: number;
    soldUnits: number;
    revenue: number;
    upcomingPosessions: number;
  }> {
    const projects = await Project.find({ builderId, deletedAt: null });

    const totalUnits = projects.reduce((sum, p) => sum + p.totalUnits, 0);
    const soldUnits = projects.reduce((sum, p) => sum + p.soldUnits, 0);
    const revenue = projects.reduce((sum, p) => {
      return sum + (p.soldUnits * ((p.priceRange?.min || 0) + (p.priceRange?.max || 0)) / 2);
    }, 0);

    const now = new Date();
    const upcomingPosessions = projects.filter(p =>
      p.possessionDate && p.possessionDate > now && p.possessionDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status !== ProjectStatus.SOLD_OUT).length,
      totalUnits,
      soldUnits,
      revenue,
      upcomingPosessions
    };
  }
}

export const builderService = new BuilderService();
