/**
 * Operation Service for RisaCare Hospital Management
 * Handles surgical operations scheduling and management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Operation,
  OperationStatus,
  ScheduleOperationInput,
  UpdateOperationInput,
} from '../models/hospital.js';

class OperationService {
  private operations: Map<string, Operation> = new Map();

  /**
   * Schedule a new operation
   */
  async scheduleOperation(input: ScheduleOperationInput): Promise<Operation> {
    const now = new Date();

    const operation: Operation = {
      operationId: uuidv4(),
      patientId: input.patientId,
      surgeonId: input.surgeonId,
      operationType: input.operationType,
      description: input.description,
      scheduledAt: input.scheduledAt,
      duration: input.duration,
      operatingRoomId: input.operatingRoomId,
      status: OperationStatus.SCHEDULED,
      notes: input.notes,
      preOpInstructions: input.preOpInstructions,
      anesthesiologistId: input.anesthesiologistId,
      assistantSurgeonIds: input.assistantSurgeonIds,
      createdAt: now,
      updatedAt: now,
    };

    this.operations.set(operation.operationId, operation);

    return operation;
  }

  /**
   * Get operation by ID
   */
  async getOperation(operationId: string): Promise<Operation | null> {
    return this.operations.get(operationId) || null;
  }

  /**
   * Get all operations with filters
   */
  async getOperations(params: {
    patientId?: string;
    surgeonId?: string;
    status?: OperationStatus;
    startDate?: Date;
    endDate?: Date;
    operatingRoomId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    operations: Operation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      patientId,
      surgeonId,
      status,
      startDate,
      endDate,
      operatingRoomId,
      page = 1,
      limit = 20,
    } = params;

    let filteredOperations = Array.from(this.operations.values());

    // Apply filters
    if (patientId) {
      filteredOperations = filteredOperations.filter(o => o.patientId === patientId);
    }
    if (surgeonId) {
      filteredOperations = filteredOperations.filter(o => o.surgeonId === surgeonId);
    }
    if (status) {
      filteredOperations = filteredOperations.filter(o => o.status === status);
    }
    if (startDate) {
      filteredOperations = filteredOperations.filter(o => o.scheduledAt >= startDate);
    }
    if (endDate) {
      filteredOperations = filteredOperations.filter(o => o.scheduledAt <= endDate);
    }
    if (operatingRoomId) {
      filteredOperations = filteredOperations.filter(
        o => o.operatingRoomId === operatingRoomId
      );
    }

    // Sort by scheduled date
    filteredOperations.sort(
      (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
    );

    const total = filteredOperations.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    return {
      operations: filteredOperations.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get scheduled operations for a specific date
   */
  async getOperationsForDate(date: Date): Promise<Operation[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { operations } = await this.getOperations({
      startDate: startOfDay,
      endDate: endOfDay,
    });

    return operations;
  }

  /**
   * Get upcoming operations for a surgeon
   */
  async getSurgeonUpcomingOperations(surgeonId: string): Promise<Operation[]> {
    const now = new Date();

    const { operations } = await this.getOperations({
      surgeonId,
      startDate: now,
      status: OperationStatus.SCHEDULED,
    });

    return operations;
  }

  /**
   * Update operation status
   */
  async updateOperationStatus(
    operationId: string,
    status: OperationStatus,
    notes?: string
  ): Promise<Operation | null> {
    const operation = this.operations.get(operationId);

    if (!operation) {
      return null;
    }

    const updatedOperation: Operation = {
      ...operation,
      status,
      ...(notes && { notes: `${operation.notes || ''}\nStatus Update: ${notes}` }),
      updatedAt: new Date(),
    };

    this.operations.set(operationId, updatedOperation);

    return updatedOperation;
  }

  /**
   * Update operation details
   */
  async updateOperation(
    operationId: string,
    input: UpdateOperationInput
  ): Promise<Operation | null> {
    const operation = this.operations.get(operationId);

    if (!operation) {
      return null;
    }

    // Validate status transition
    if (input.status) {
      const validTransitions: Record<OperationStatus, OperationStatus[]> = {
        [OperationStatus.SCHEDULED]: [OperationStatus.IN_PROGRESS, OperationStatus.CANCELLED],
        [OperationStatus.IN_PROGRESS]: [OperationStatus.COMPLETED, OperationStatus.CANCELLED, OperationStatus.POSTPONED],
        [OperationStatus.COMPLETED]: [],
        [OperationStatus.CANCELLED]: [],
        [OperationStatus.POSTPONED]: [OperationStatus.SCHEDULED, OperationStatus.CANCELLED],
      };

      if (!validTransitions[operation.status]?.includes(input.status)) {
        return null; // Invalid status transition
      }
    }

    const updatedOperation: Operation = {
      ...operation,
      ...(input.status && { status: input.status }),
      ...(input.scheduledAt && { scheduledAt: input.scheduledAt }),
      ...(input.duration && { duration: input.duration }),
      ...(input.operatingRoomId && { operatingRoomId: input.operatingRoomId }),
      ...(input.complications && { complications: input.complications }),
      ...(input.notes && { notes: input.notes }),
      updatedAt: new Date(),
    };

    this.operations.set(operationId, updatedOperation);

    return updatedOperation;
  }

  /**
   * Start an operation
   */
  async startOperation(operationId: string): Promise<Operation | null> {
    return this.updateOperationStatus(operationId, OperationStatus.IN_PROGRESS, 'Operation started');
  }

  /**
   * Complete an operation
   */
  async completeOperation(
    operationId: string,
    complications?: string,
    postOpInstructions?: string[]
  ): Promise<Operation | null> {
    const operation = this.operations.get(operationId);

    if (!operation) {
      return null;
    }

    const updatedOperation: Operation = {
      ...operation,
      status: OperationStatus.COMPLETED,
      ...(complications && { complications }),
      ...(postOpInstructions && { postOpInstructions }),
      updatedAt: new Date(),
    };

    this.operations.set(operationId, updatedOperation);

    return updatedOperation;
  }

  /**
   * Cancel an operation
   */
  async cancelOperation(operationId: string, reason: string): Promise<Operation | null> {
    const operation = this.operations.get(operationId);

    if (!operation) {
      return null;
    }

    if (operation.status === OperationStatus.COMPLETED) {
      return null; // Cannot cancel completed operations
    }

    const updatedOperation: Operation = {
      ...operation,
      status: OperationStatus.CANCELLED,
      notes: `${operation.notes || ''}\nCancellation Reason: ${reason}`,
      updatedAt: new Date(),
    };

    this.operations.set(operationId, updatedOperation);

    return updatedOperation;
  }

  /**
   * Postpone an operation
   */
  async postponeOperation(
    operationId: string,
    newScheduledAt: Date,
    reason?: string
  ): Promise<Operation | null> {
    const operation = this.operations.get(operationId);

    if (!operation) {
      return null;
    }

    if (operation.status !== OperationStatus.SCHEDULED) {
      return null;
    }

    const updatedOperation: Operation = {
      ...operation,
      status: OperationStatus.POSTPONED,
      scheduledAt: newScheduledAt,
      notes: `${operation.notes || ''}\nPostponed: ${reason || 'No reason provided'}`,
      updatedAt: new Date(),
    };

    this.operations.set(operationId, updatedOperation);

    return updatedOperation;
  }

  /**
   * Reschedule a postponed operation
   */
  async rescheduleOperation(
    operationId: string,
    newScheduledAt: Date
  ): Promise<Operation | null> {
    const operation = this.operations.get(operationId);

    if (!operation) {
      return null;
    }

    if (operation.status !== OperationStatus.POSTPONED) {
      return null;
    }

    const updatedOperation: Operation = {
      ...operation,
      status: OperationStatus.SCHEDULED,
      scheduledAt: newScheduledAt,
      updatedAt: new Date(),
    };

    this.operations.set(operationId, updatedOperation);

    return updatedOperation;
  }

  /**
   * Get operation statistics
   */
  async getOperationStats(params?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalOperations: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    postponed: number;
    averageDuration: number;
    completionRate: number;
    bySurgeon: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const { startDate, endDate } = params || {};

    let operations = Array.from(this.operations.values());

    if (startDate) {
      operations = operations.filter(o => o.scheduledAt >= startDate);
    }
    if (endDate) {
      operations = operations.filter(o => o.scheduledAt <= endDate);
    }

    const totalOperations = operations.length;
    const scheduled = operations.filter(o => o.status === OperationStatus.SCHEDULED).length;
    const inProgress = operations.filter(o => o.status === OperationStatus.IN_PROGRESS).length;
    const completed = operations.filter(o => o.status === OperationStatus.COMPLETED).length;
    const cancelled = operations.filter(o => o.status === OperationStatus.CANCELLED).length;
    const postponed = operations.filter(o => o.status === OperationStatus.POSTPONED).length;

    // Calculate average duration for completed operations
    const completedOps = operations.filter(o => o.status === OperationStatus.COMPLETED);
    const averageDuration =
      completedOps.length > 0
        ? completedOps.reduce((sum, op) => sum + op.duration, 0) / completedOps.length
        : 0;

    // By surgeon
    const bySurgeon: Record<string, number> = {};
    for (const op of operations) {
      bySurgeon[op.surgeonId] = (bySurgeon[op.surgeonId] || 0) + 1;
    }

    // By type
    const byType: Record<string, number> = {};
    for (const op of operations) {
      byType[op.operationType] = (byType[op.operationType] || 0) + 1;
    }

    return {
      totalOperations,
      scheduled,
      inProgress,
      completed,
      cancelled,
      postponed,
      averageDuration: Math.round(averageDuration),
      completionRate:
        totalOperations > 0 ? Math.round((completed / totalOperations) * 100) : 0,
      bySurgeon,
      byType,
    };
  }

  /**
   * Check operating room availability
   */
  async isOperatingRoomAvailable(
    operatingRoomId: string,
    scheduledAt: Date,
    duration: number
  ): Promise<boolean> {
    const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);

    const operations = Array.from(this.operations.values()).filter(
      o =>
        o.operatingRoomId === operatingRoomId &&
        (o.status === OperationStatus.SCHEDULED ||
          o.status === OperationStatus.IN_PROGRESS)
    );

    for (const op of operations) {
      const opEndTime = new Date(op.scheduledAt.getTime() + op.duration * 60 * 1000);

      // Check for time overlap
      if (scheduledAt < opEndTime && endTime > op.scheduledAt) {
        return false; // Room is not available
      }
    }

    return true;
  }
}

export const operationService = new OperationService();
