import {
  HousekeeperModel,
  IHousekeeper,
  CleaningTaskModel,
  ICleaningTask,
  ScheduleModel,
  ISchedule,
  RoomTwinModel,
} from '../models/twin.models';
import {
  Housekeeper,
  CleaningTask,
  ScheduleRequest,
  ScheduleResponse,
  OccupancyForecast,
  MaintenancePrediction,
} from '../schemas/twin.schemas';
import {
  generateTaskId,
  generateScheduleId,
  calculateCleaningDuration,
  calculateEfficiencyScore,
  determineTaskPriority,
  addMinutesToTime,
  formatDate,
} from '../utils/helpers';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class SchedulingService {
  // ============================================================================
  // Housekeeper Management
  // ============================================================================

  async createHousekeeper(data: Omit<Housekeeper, 'created_at' | 'updated_at'>): Promise<Housekeeper> {
    logger.info('Creating housekeeper', { staff_id: data.staff_id });

    const housekeeper = new HousekeeperModel(data);
    await housekeeper.save();

    return this.formatHousekeeper(housekeeper);
  }

  async getHousekeeper(staffId: string): Promise<Housekeeper> {
    const housekeeper = await HousekeeperModel.findOne({ staff_id: staffId });
    if (!housekeeper) {
      throw new NotFoundError(`Housekeeper not found: ${staffId}`);
    }
    return this.formatHousekeeper(housekeeper);
  }

  async getHousekeepersByProperty(propertyId: string): Promise<Housekeeper[]> {
    const housekeepers = await HousekeeperModel.find({ property_id: propertyId });
    return housekeepers.map(h => this.formatHousekeeper(h));
  }

  async getAvailableHousekeepers(propertyId: string, date: string): Promise<Housekeeper[]> {
    const housekeepers = await HousekeeperModel.find({
      property_id: propertyId,
      $expr: {
        $lt: [
          { $size: { $ifNull: ['$shifts', []] } },
          '$max_rooms_per_shift'
        ]
      }
    });
    return housekeepers.map(h => this.formatHousekeeper(h));
  }

  async updateHousekeeper(
    staffId: string,
    updates: Partial<Housekeeper>
  ): Promise<Housekeeper> {
    const housekeeper = await HousekeeperModel.findOneAndUpdate(
      { staff_id: staffId },
      updates,
      { new: true }
    );
    if (!housekeeper) {
      throw new NotFoundError(`Housekeeper not found: ${staffId}`);
    }
    return this.formatHousekeeper(housekeeper);
  }

  async deleteHousekeeper(staffId: string): Promise<void> {
    const result = await HousekeeperModel.deleteOne({ staff_id: staffId });
    if (result.deletedCount === 0) {
      throw new NotFoundError(`Housekeeper not found: ${staffId}`);
    }
  }

  // ============================================================================
  // Cleaning Task Management
  // ============================================================================

  async createCleaningTask(data: {
    room_id: string;
    room_number: string;
    room_type: CleaningTask['room_type'];
    priority?: CleaningTask['priority'];
    task_type: CleaningTask['task_type'];
    special_requirements?: string[];
    estimated_duration_minutes?: number;
  }): Promise<CleaningTask> {
    logger.info('Creating cleaning task', { room_id: data.room_id });

    const estimatedDuration = data.estimated_duration_minutes
      || calculateCleaningDuration(data.room_type, data.task_type);

    const task = new CleaningTaskModel({
      task_id: generateTaskId(),
      room_id: data.room_id,
      room_number: data.room_number,
      room_type: data.room_type,
      priority: data.priority || 'medium',
      task_type: data.task_type,
      estimated_duration_minutes: estimatedDuration,
      special_requirements: data.special_requirements || [],
      status: 'pending',
    });

    await task.save();
    logger.info('Cleaning task created', { task_id: task.task_id });

    return this.formatCleaningTask(task);
  }

  async getCleaningTask(taskId: string): Promise<CleaningTask> {
    const task = await CleaningTaskModel.findOne({ task_id: taskId });
    if (!task) {
      throw new NotFoundError(`Cleaning task not found: ${taskId}`);
    }
    return this.formatCleaningTask(task);
  }

  async getTasksByRoom(roomId: string): Promise<CleaningTask[]> {
    const tasks = await CleaningTaskModel.find({ room_id: roomId })
      .sort({ created_at: -1 });
    return tasks.map(t => this.formatCleaningTask(t));
  }

  async getTasksByStatus(status: CleaningTask['status']): Promise<CleaningTask[]> {
    const tasks = await CleaningTaskModel.find({ status });
    return tasks.map(t => this.formatCleaningTask(t));
  }

  async getTasksByProperty(propertyId: string, date?: string): Promise<CleaningTask[]> {
    const query: Record<string, unknown> = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.created_at = { $gte: startOfDay, $lte: endOfDay };
    }

    const rooms = await RoomTwinModel.find({ property_id: propertyId }).select('room_id');
    const roomIds = rooms.map(r => r.room_id);
    query.room_id = { $in: roomIds };

    const tasks = await CleaningTaskModel.find(query).sort({ priority: 1, created_at: 1 });
    return tasks.map(t => this.formatCleaningTask(t));
  }

  async getPendingTasks(propertyId: string): Promise<CleaningTask[]> {
    const rooms = await RoomTwinModel.find({ property_id: propertyId }).select('room_id');
    const roomIds = rooms.map(r => r.room_id);

    const tasks = await CleaningTaskModel.find({
      room_id: { $in: roomIds },
      status: 'pending',
    }).sort({ priority: 1, estimated_duration_minutes: -1 });

    return tasks.map(t => this.formatCleaningTask(t));
  }

  async assignTask(taskId: string, housekeeperId: string, scheduledTime: string): Promise<CleaningTask> {
    logger.info('Assigning cleaning task', { task_id: taskId, housekeeper_id: housekeeperId });

    const task = await CleaningTaskModel.findOneAndUpdate(
      { task_id: taskId, status: 'pending' },
      {
        assigned_to: housekeeperId,
        scheduled_time: scheduledTime,
        status: 'pending',
      },
      { new: true }
    );

    if (!task) {
      throw new NotFoundError(`Cleaning task not found or already assigned: ${taskId}`);
    }

    return this.formatCleaningTask(task);
  }

  async completeTask(taskId: string): Promise<CleaningTask> {
    logger.info('Completing cleaning task', { task_id: taskId });

    const task = await CleaningTaskModel.findOneAndUpdate(
      { task_id: taskId, status: { $in: ['pending', 'in_progress'] } },
      {
        status: 'completed',
        completed_at: new Date().toISOString(),
      },
      { new: true }
    );

    if (!task) {
      throw new NotFoundError(`Cleaning task not found or already completed: ${taskId}`);
    }

    // Update room's last_cleaned timestamp
    await RoomTwinModel.updateOne(
      { room_id: task.room_id },
      { 'housekeeping.last_cleaned': new Date().toISOString() }
    );

    return this.formatCleaningTask(task);
  }

  async cancelTask(taskId: string): Promise<CleaningTask> {
    const task = await CleaningTaskModel.findOneAndUpdate(
      { task_id: taskId, status: 'pending' },
      { status: 'cancelled' },
      { new: true }
    );

    if (!task) {
      throw new NotFoundError(`Cleaning task not found or already in progress: ${taskId}`);
    }

    return this.formatCleaningTask(task);
  }

  // ============================================================================
  // Schedule Generation
  // ============================================================================

  async generateSchedule(request: ScheduleRequest): Promise<ScheduleResponse> {
    logger.info('Generating cleaning schedule', {
      property_id: request.property_id,
      date: request.date,
    });

    const scheduleId = generateScheduleId();
    const { shift_start, shift_end } = request;

    // Get available housekeepers
    const housekeepers = await HousekeeperModel.find({
      staff_id: { $in: request.available_staff },
    });

    if (housekeepers.length === 0) {
      throw new ValidationError('No available housekeepers found');
    }

    // Get pending tasks for the property
    const pendingTasks = await this.getPendingTasks(request.property_id);

    if (pendingTasks.length === 0) {
      return {
        schedule_id: scheduleId,
        property_id: request.property_id,
        date: request.date,
        shift_start,
        shift_end,
        assignments: [],
        unassigned_tasks: [],
        total_tasks: 0,
        completed_tasks: 0,
        efficiency_score: 100,
        generated_at: new Date().toISOString(),
      };
    }

    // Sort tasks by priority (high first) and duration (longer first)
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimated_duration_minutes - a.estimated_duration_minutes;
    });

    // Assign tasks to housekeepers using a greedy algorithm
    const assignments: ScheduleResponse['assignments'] = [];
    const unassignedTasks: CleaningTask[] = [];
    const housekeeperWorkloads: Map<string, number> = new Map();

    // Initialize workloads
    housekeepers.forEach(h => {
      housekeeperWorkloads.set(h.staff_id, 0);
    });

    for (const task of sortedTasks) {
      // Find the best available housekeeper
      let bestHousekeeper: IHousekeeper | null = null;
      let minWorkload = Infinity;

      for (const housekeeper of housekeepers) {
        const currentWorkload = housekeeperWorkloads.get(housekeeper.staff_id) || 0;
        const effectiveCapacity = housekeeper.max_rooms_per_shift * 25; // base minutes

        if (currentWorkload + task.estimated_duration_minutes <= effectiveCapacity) {
          if (currentWorkload < minWorkload) {
            minWorkload = currentWorkload;
            bestHousekeeper = housekeeper;
          }
        }
      }

      if (bestHousekeeper) {
        const startMinutes = (housekeeperWorkloads.get(bestHousekeeper.staff_id) || 0);
        const startTime = addMinutesToTime(shift_start, startMinutes);
        const endTime = addMinutesToTime(
          startTime,
          task.estimated_duration_minutes
        );

        assignments.push({
          task: this.formatCleaningTask(task),
          housekeeper: this.formatHousekeeper(bestHousekeeper),
          start_time: `${request.date}T${startTime}:00.000Z`,
          end_time: `${request.date}T${endTime}:00.000Z`,
        });

        housekeeperWorkloads.set(
          bestHousekeeper.staff_id,
          startMinutes + task.estimated_duration_minutes
        );

        // Update task status
        await CleaningTaskModel.updateOne(
          { task_id: task.task_id },
          {
            assigned_to: bestHousekeeper.staff_id,
            scheduled_time: `${request.date}T${startTime}:00.000Z`,
            status: 'pending',
          }
        );
      } else {
        unassignedTasks.push(this.formatCleaningTask(task));
      }
    }

    // Calculate efficiency score
    const totalTasks = sortedTasks.length;
    const completedTasks = assignments.length;
    const usedTime = Array.from(housekeeperWorkloads.values()).reduce((a, b) => a + b, 0);
    const [startH, startM] = shift_start.split(':').map(Number);
    const [endH, endM] = shift_end.split(':').map(Number);
    const availableTime = (endH * 60 + endM) - (startH * 60 + startM);
    const efficiencyScore = calculateEfficiencyScore(completedTasks, totalTasks, usedTime, availableTime);

    // Save schedule
    const schedule = new ScheduleModel({
      schedule_id: scheduleId,
      property_id: request.property_id,
      date: request.date,
      shift_start,
      shift_end,
      assignments: assignments.map(a => ({
        task_id: a.task.task_id,
        housekeeper_id: a.housekeeper.staff_id,
        start_time: a.start_time,
        end_time: a.end_time,
      })),
      unassigned_task_ids: unassignedTasks.map(t => t.task_id),
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      efficiency_score: efficiencyScore,
      generated_at: new Date(),
    });

    await schedule.save();

    logger.info('Schedule generated', {
      schedule_id: scheduleId,
      total_tasks: totalTasks,
      assigned: completedTasks,
      efficiency_score: efficiencyScore,
    });

    return {
      schedule_id: scheduleId,
      property_id: request.property_id,
      date: request.date,
      shift_start,
      shift_end,
      assignments,
      unassigned_tasks: unassignedTasks,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      efficiency_score: efficiencyScore,
      generated_at: new Date().toISOString(),
    };
  }

  async getSchedule(scheduleId: string): Promise<ScheduleResponse | null> {
    const schedule = await ScheduleModel.findOne({ schedule_id: scheduleId });
    if (!schedule) return null;

    const assignments = await Promise.all(
      schedule.assignments.map(async (a) => {
        const task = await CleaningTaskModel.findOne({ task_id: a.task_id });
        const housekeeper = await HousekeeperModel.findOne({ staff_id: a.housekeeper_id });
        return {
          task: task ? this.formatCleaningTask(task) : {} as CleaningTask,
          housekeeper: housekeeper ? this.formatHousekeeper(housekeeper) : {} as Housekeeper,
          start_time: a.start_time,
          end_time: a.end_time,
        };
      })
    );

    const unassignedTasks = await CleaningTaskModel.find({
      task_id: { $in: schedule.unassigned_task_ids },
    });

    return {
      schedule_id: schedule.schedule_id,
      property_id: schedule.property_id,
      date: schedule.date,
      shift_start: schedule.shift_start,
      shift_end: schedule.shift_end,
      assignments,
      unassigned_tasks: unassignedTasks.map(t => this.formatCleaningTask(t)),
      total_tasks: schedule.total_tasks,
      completed_tasks: schedule.completed_tasks,
      efficiency_score: schedule.efficiency_score,
      generated_at: schedule.generated_at.toISOString(),
    };
  }

  async getSchedulesByProperty(propertyId: string, date?: string): Promise<ScheduleResponse[]> {
    const query: Record<string, unknown> = { property_id: propertyId };
    if (date) {
      query.date = date;
    }

    const schedules = await ScheduleModel.find(query).sort({ date: -1 });
    return Promise.all(schedules.map(async (s) => {
      const result = await this.getSchedule(s.schedule_id);
      return result!;
    }));
  }

  // ============================================================================
  // Predictive Analytics
  // ============================================================================

  async predictOccupancy(propertyId: string, targetDate: string): Promise<OccupancyForecast> {
    logger.info('Predicting occupancy', { property_id: propertyId, date: targetDate });

    // Get historical data for prediction
    const historicalSchedules = await ScheduleModel.find({
      property_id: propertyId,
    }).sort({ date: -1 }).limit(30);

    // Calculate averages from historical data
    const avgCheckouts = historicalSchedules.length > 0
      ? historicalSchedules.reduce((sum, s) => sum + s.unassigned_task_ids.length, 0) / historicalSchedules.length
      : 5;

    const avgCheckins = avgCheckouts * 0.9; // Assume 90% of checkouts become checkins

    // Identify high priority rooms based on task history
    const highPriorityTasks = await CleaningTaskModel.find({
      room_id: { $in: [] }, // Would need to filter by property
      priority: 'high',
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const highPriorityRoomIds = [...new Set(highPriorityTasks.map(t => t.room_id))];

    // Calculate confidence based on data availability
    const confidenceScore = Math.min(95, 50 + (historicalSchedules.length * 1.5));

    return {
      property_id: propertyId,
      date: targetDate,
      predicted_checkouts: Math.round(avgCheckouts),
      predicted_checkins: Math.round(avgCheckins),
      net_occupancy_change: Math.round(avgCheckins - avgCheckouts),
      high_priority_rooms: highPriorityRoomIds,
      confidence_score: confidenceScore,
    };
  }

  async predictMaintenanceNeeds(propertyId: string): Promise<MaintenancePrediction[]> {
    logger.info('Predicting maintenance needs', { property_id: propertyId });

    const predictions: MaintenancePrediction[] = [];

    // Get rooms with recent maintenance tasks
    const recentMaintenanceTasks = await CleaningTaskModel.find({
      task_type: 'maintenance',
      created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    // Group by room
    const roomMaintenanceMap = new Map<string, number>();
    recentMaintenanceTasks.forEach(task => {
      const count = roomMaintenanceMap.get(task.room_id) || 0;
      roomMaintenanceMap.set(task.room_id, count + 1);
    });

    // Get rooms for this property
    const rooms = await RoomTwinModel.find({ property_id: propertyId });

    for (const room of rooms) {
      const maintenanceCount = roomMaintenanceMap.get(room.room_id) || 0;

      // Predict based on maintenance history and room age
      if (maintenanceCount > 2) {
        predictions.push({
          room_id: room.room_id,
          room_number: room.room_number,
          property_id: propertyId,
          issue_type: 'general',
          severity: maintenanceCount > 4 ? 'high' : 'medium',
          predicted_occurrence: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          confidence_score: Math.min(90, 50 + maintenanceCount * 10),
          recommended_action: 'Schedule preventive maintenance inspection',
          estimated_repair_time_minutes: 30,
        });
      }

      // Check for equipment-specific predictions
      if (room.amenities.smart_tv && maintenanceCount > 1) {
        predictions.push({
          room_id: room.room_id,
          room_number: room.room_number,
          property_id: propertyId,
          issue_type: 'iot',
          severity: 'low',
          predicted_occurrence: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          confidence_score: 60,
          recommended_action: 'Check smart TV connectivity and updates',
          estimated_repair_time_minutes: 15,
        });
      }
    }

    return predictions.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  // ============================================================================
  // Formatting Helpers
  // ============================================================================

  private formatHousekeeper(housekeeper: IHousekeeper): Housekeeper {
    return {
      staff_id: housekeeper.staff_id,
      name: housekeeper.name,
      property_id: housekeeper.property_id,
      department: housekeeper.department,
      level: housekeeper.level,
      certifications: housekeeper.certifications,
      languages: housekeeper.languages,
      max_rooms_per_shift: housekeeper.max_rooms_per_shift,
      efficiency_rating: housekeeper.efficiency_rating,
    };
  }

  private formatCleaningTask(task: ICleaningTask): CleaningTask {
    return {
      task_id: task.task_id,
      room_id: task.room_id,
      room_number: task.room_number,
      room_type: task.room_type,
      priority: task.priority,
      task_type: task.task_type,
      estimated_duration_minutes: task.estimated_duration_minutes,
      special_requirements: task.special_requirements,
      assigned_to: task.assigned_to,
      scheduled_time: task.scheduled_time,
      completed_at: task.completed_at,
      status: task.status,
    };
  }
}

export const schedulingService = new SchedulingService();