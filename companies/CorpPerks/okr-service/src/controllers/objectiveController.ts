import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Objective, IObjective } from '../models/Objective';
import {
  CreateObjectiveSchema,
  UpdateObjectiveSchema,
  UpdateKeyResultProgressSchema,
  AddKeyResultSchema,
  AddMilestoneSchema,
  ObjectiveQuerySchema
} from '../models/schemas';

export class ObjectiveController {
  // Create a new objective
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = CreateObjectiveSchema.parse(req.body);

      const keyResults = (validatedData.keyResults || []).map(kr => ({
        ...kr,
        objectiveId: new mongoose.Types.ObjectId(),
        status: 'on_track' as const
      }));

      const milestones = (validatedData.milestones || []).map(m => ({
        ...m,
        keyResultId: keyResults[0]?.objectiveId || new mongoose.Types.ObjectId(),
        completed: false
      }));

      const objective = new Objective({
        ...validatedData,
        keyResults,
        milestones
      });

      await objective.save();

      res.status(201).json({
        success: true,
        data: objective
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // List objectives with filters
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ObjectiveQuerySchema.parse(req.query);

      const filter: Record<string, unknown> = {};
      if (query.ownerId) filter.ownerId = query.ownerId;
      if (query.departmentId) filter.departmentId = query.departmentId;
      if (query.type) filter.type = query.type;
      if (query.status) filter.status = query.status;
      if (query.quarter) filter.quarter = query.quarter;
      if (query.year) filter.year = query.year;

      const skip = (query.page - 1) * query.limit;

      const [objectives, total] = await Promise.all([
        Objective.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(query.limit)
          .lean(),
        Objective.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: objectives,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit)
        }
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Get single objective
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid objective ID'
        });
        return;
      }

      const objective = await Objective.findById(id).lean();

      if (!objective) {
        res.status(404).json({
          success: false,
          error: 'Objective not found'
        });
        return;
      }

      res.json({
        success: true,
        data: objective
      });
    } catch (error) {
      next(error);
    }
  }

  // Update objective
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateObjectiveSchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid objective ID'
        });
        return;
      }

      const objective = await Objective.findByIdAndUpdate(
        id,
        { $set: validatedData },
        { new: true, runValidators: true }
      );

      if (!objective) {
        res.status(404).json({
          success: false,
          error: 'Objective not found'
        });
        return;
      }

      res.json({
        success: true,
        data: objective
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Delete objective
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid objective ID'
        });
        return;
      }

      const objective = await Objective.findByIdAndDelete(id);

      if (!objective) {
        res.status(404).json({
          success: false,
          error: 'Objective not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Objective deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update key result progress
  async updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { keyResultId, current, notes } = UpdateKeyResultProgressSchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid objective ID'
        });
        return;
      }

      const objective = await Objective.findById(id);

      if (!objective) {
        res.status(404).json({
          success: false,
          error: 'Objective not found'
        });
        return;
      }

      const keyResultIndex = objective.keyResults.findIndex(
        (kr) => kr._id.toString() === keyResultId
      );

      if (keyResultIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Key result not found'
        });
        return;
      }

      // Update key result
      objective.keyResults[keyResultIndex].current = current;

      // Calculate status based on progress
      const kr = objective.keyResults[keyResultIndex];
      const progress = kr.target > 0
        ? ((current - kr.startValue) / (kr.target - kr.startValue)) * 100
        : 0;

      if (progress >= 100) {
        kr.status = 'completed';
      } else if (progress >= 70) {
        kr.status = 'on_track';
      } else if (progress >= 40) {
        kr.status = 'at_risk';
      } else {
        kr.status = 'behind';
      }

      await objective.save();

      res.json({
        success: true,
        data: {
          objectiveId: objective._id,
          progress: objective.progress,
          updatedKeyResult: {
            id: kr._id,
            title: kr.title,
            current: kr.current,
            target: kr.target,
            status: kr.status,
            progress: Math.round(progress)
          }
        }
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Add key result to objective
  async addKeyResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = AddKeyResultSchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid objective ID'
        });
        return;
      }

      const objective = await Objective.findById(id);

      if (!objective) {
        res.status(404).json({
          success: false,
          error: 'Objective not found'
        });
        return;
      }

      if (objective.keyResults.length >= 10) {
        res.status(400).json({
          success: false,
          error: 'Maximum 10 key results per objective'
        });
        return;
      }

      const newKeyResult = {
        objectiveId: objective._id,
        title: validatedData.title,
        target: validatedData.target,
        current: validatedData.current,
        unit: validatedData.unit,
        weight: validatedData.weight,
        startValue: validatedData.startValue,
        status: 'on_track' as const
      };

      objective.keyResults.push(newKeyResult as any);
      await objective.save();

      res.status(201).json({
        success: true,
        data: objective.keyResults[objective.keyResults.length - 1]
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Add milestone
  async addMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = AddMilestoneSchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid objective ID'
        });
        return;
      }

      const objective = await Objective.findById(id);

      if (!objective) {
        res.status(404).json({
          success: false,
          error: 'Objective not found'
        });
        return;
      }

      const keyResultExists = objective.keyResults.some(
        (kr) => kr._id.toString() === validatedData.keyResultId
      );

      if (!keyResultExists) {
        res.status(404).json({
          success: false,
          error: 'Key result not found'
        });
        return;
      }

      const newMilestone = {
        keyResultId: new mongoose.Types.ObjectId(validatedData.keyResultId),
        title: validatedData.title,
        deadline: new Date(validatedData.deadline),
        completed: false
      };

      objective.milestones.push(newMilestone as any);
      await objective.save();

      res.status(201).json({
        success: true,
        data: objective.milestones[objective.milestones.length - 1]
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }

  // Toggle milestone completion
  async toggleMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, milestoneId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid objective ID'
        });
        return;
      }

      const objective = await Objective.findById(id);

      if (!objective) {
        res.status(404).json({
          success: false,
          error: 'Objective not found'
        });
        return;
      }

      const milestone = objective.milestones.find(
        (m) => m._id.toString() === milestoneId
      );

      if (!milestone) {
        res.status(404).json({
          success: false,
          error: 'Milestone not found'
        });
        return;
      }

      milestone.completed = !milestone.completed;
      if (milestone.completed) {
        milestone.completedAt = new Date();
      } else {
        milestone.completedAt = undefined;
      }

      await objective.save();

      res.json({
        success: true,
        data: milestone
      });
    } catch (error) {
      next(error);
    }
  }

  // Dashboard - OKR overview
  async dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ownerId, departmentId, quarter, year } = req.query;

      const filter: Record<string, unknown> = { status: { $ne: 'cancelled' } };
      if (ownerId) filter.ownerId = ownerId;
      if (departmentId) filter.departmentId = departmentId;
      if (quarter) filter.quarter = parseInt(quarter as string);
      if (year) filter.year = parseInt(year as string);

      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
      const currentYear = new Date().getFullYear();

      const [
        objectives,
        totalObjectives,
        companyObjectives,
        departmentObjectives,
        individualObjectives
      ] = await Promise.all([
        Objective.find(filter)
          .sort({ progress: -1 })
          .limit(20)
          .lean(),
        Objective.countDocuments(filter),
        Objective.countDocuments({ ...filter, type: 'company' }),
        Objective.countDocuments({ ...filter, type: 'department' }),
        Objective.countDocuments({ ...filter, type: 'individual' })
      ]);

      // Calculate aggregated metrics
      const onTrack = objectives.filter(o => o.progress >= 70).length;
      const atRisk = objectives.filter(o => o.progress >= 40 && o.progress < 70).length;
      const behind = objectives.filter(o => o.progress < 40).length;
      const completed = objectives.filter(o => o.progress >= 100).length;

      // Key results stats
      let totalKeyResults = 0;
      let krOnTrack = 0;
      let krAtRisk = 0;
      let krBehind = 0;

      objectives.forEach(obj => {
        obj.keyResults.forEach(kr => {
          totalKeyResults++;
          if (kr.status === 'on_track' || kr.status === 'completed') krOnTrack++;
          else if (kr.status === 'at_risk') krAtRisk++;
          else krBehind++;
        });
      });

      res.json({
        success: true,
        data: {
          summary: {
            totalObjectives,
            companyObjectives,
            departmentObjectives,
            individualObjectives,
            currentQuarter,
            currentYear,
            filterApplied: filter
          },
          progress: {
            overallProgress: objectives.length > 0
              ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
              : 0,
            onTrack,
            atRisk,
            behind,
            completed
          },
          keyResults: {
            total: totalKeyResults,
            onTrack: krOnTrack,
            atRisk: krAtRisk,
            behind: krBehind
          },
          recentObjectives: objectives.slice(0, 10)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Company OKRs
  async companyOKRs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { quarter, year } = req.query;

      const filter: Record<string, unknown> = {
        type: 'company',
        status: { $ne: 'cancelled' }
      };

      if (quarter) filter.quarter = parseInt(quarter as string);
      if (year) filter.year = parseInt(year as string);

      const objectives = await Objective.find(filter)
        .sort({ progress: -1 })
        .lean();

      // Calculate overall company progress
      const overallProgress = objectives.length > 0
        ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
        : 0;

      res.json({
        success: true,
        data: {
          overallProgress,
          objectivesCount: objectives.length,
          objectives
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get objectives by owner
  async getByOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ownerId } = req.params;
      const { quarter, year } = req.query;

      const filter: Record<string, unknown> = { ownerId };
      if (quarter) filter.quarter = parseInt(quarter as string);
      if (year) filter.year = parseInt(year as string);

      const objectives = await Objective.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: objectives
      });
    } catch (error) {
      next(error);
    }
  }

  // Get objectives by department
  async getByDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId } = req.params;
      const { quarter, year } = req.query;

      const filter: Record<string, unknown> = { departmentId };
      if (quarter) filter.quarter = parseInt(quarter as string);
      if (year) filter.year = parseInt(year as string);

      const objectives = await Objective.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: objectives
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk update progress
  async bulkUpdateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Updates array is required'
        });
        return;
      }

      const results = [];

      for (const update of updates) {
        const { objectiveId, keyResultId, current } = UpdateKeyResultProgressSchema.parse(update);

        const objective = await Objective.findById(objectiveId);
        if (!objective) {
          results.push({ objectiveId, success: false, error: 'Objective not found' });
          continue;
        }

        const keyResult = objective.keyResults.find(
          (kr) => kr._id.toString() === keyResultId
        );

        if (!keyResult) {
          results.push({ objectiveId, keyResultId, success: false, error: 'Key result not found' });
          continue;
        }

        keyResult.current = current;
        const progress = keyResult.target > 0
          ? ((current - keyResult.startValue) / (keyResult.target - keyResult.startValue)) * 100
          : 0;

        if (progress >= 100) keyResult.status = 'completed';
        else if (progress >= 70) keyResult.status = 'on_track';
        else if (progress >= 40) keyResult.status = 'at_risk';
        else keyResult.status = 'behind';

        await objective.save();
        results.push({ objectiveId, keyResultId, success: true, progress: Math.round(progress) });
      }

      res.json({
        success: true,
        data: { results }
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error
        });
        return;
      }
      next(error);
    }
  }
}

export const objectiveController = new ObjectiveController();
