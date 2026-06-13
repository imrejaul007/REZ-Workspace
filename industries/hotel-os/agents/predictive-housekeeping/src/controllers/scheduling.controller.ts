import { Request, Response, NextFunction } from 'express';
import { schedulingService } from '../services/scheduling.service';
import { ScheduleRequestSchema } from '../schemas/twin.schemas';
import logger from '../utils/logger';

export class SchedulingController {
  // ============================================================================
  // Housekeeper Endpoints
  // ============================================================================

  async createHousekeeper(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const housekeeper = await schedulingService.createHousekeeper(req.body);

      res.status(201).json({
        success: true,
        data: housekeeper,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHousekeeper(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { staffId } = req.params;
      const housekeeper = await schedulingService.getHousekeeper(staffId);

      res.json({
        success: true,
        data: housekeeper,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHousekeepersByProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const housekeepers = await schedulingService.getHousekeepersByProperty(propertyId);

      res.json({
        success: true,
        data: housekeepers,
        count: housekeepers.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Cleaning Task Endpoints
  // ============================================================================

  async createCleaningTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await schedulingService.createCleaningTask(req.body);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCleaningTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const task = await schedulingService.getCleaningTask(taskId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTasksByRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomId } = req.params;
      const tasks = await schedulingService.getTasksByRoom(roomId);

      res.json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTasksByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.params;
      const tasks = await schedulingService.getTasksByStatus(status as any);

      res.json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const tasks = await schedulingService.getPendingTasks(propertyId);

      res.json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const { housekeeperId, scheduledTime } = req.body;
      const task = await schedulingService.assignTask(taskId, housekeeperId, scheduledTime);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async completeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const task = await schedulingService.completeTask(taskId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const task = await schedulingService.cancelTask(taskId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Schedule Endpoints
  // ============================================================================

  async generateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = ScheduleRequestSchema.parse(req.body);
      const schedule = await schedulingService.generateSchedule(validatedData);

      res.status(201).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const schedule = await schedulingService.getSchedule(scheduleId);

      if (!schedule) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Schedule not found: ${scheduleId}`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSchedulesByProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { date } = req.query;
      const schedules = await schedulingService.getSchedulesByProperty(
        propertyId,
        date as string | undefined
      );

      res.json({
        success: true,
        data: schedules,
        count: schedules.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Predictive Analytics Endpoints
  // ============================================================================

  async predictOccupancy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { date } = req.query;
      const targetDate = (date as string) || new Date().toISOString().split('T')[0];

      const forecast = await schedulingService.predictOccupancy(propertyId, targetDate);

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error) {
      next(error);
    }
  }

  async predictMaintenanceNeeds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const predictions = await schedulingService.predictMaintenanceNeeds(propertyId);

      res.json({
        success: true,
        data: predictions,
        count: predictions.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const schedulingController = new SchedulingController();