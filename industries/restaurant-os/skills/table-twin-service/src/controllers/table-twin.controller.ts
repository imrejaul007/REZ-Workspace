import { Request, Response } from 'express';
import { tableTwinService } from '../services/table-twin.service';
import { logger } from '../utils/logger';
import {
  CreateTableTwinRequest,
  UpdateTableStatusRequest,
  SeatTableRequest,
  ClearTableRequest,
  UpdateTurnTimeRequest,
  ListTablesRequest,
  GetTableAvailabilityRequest,
  TableStatus,
  TableZone
} from '../schemas/table-twin.schema';

export class TableTwinController {
  async createTableTwin(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateTableTwinRequest = req.body;

      if (!request.tableId || !request.restaurantId || !request.tableNumber || !request.seats) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: tableId, restaurantId, tableNumber, seats'
          }
        });
        return;
      }

      const result = await tableTwinService.createTableTwin(request);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error creating Table Twin', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message
        }
      });
    }
  }

  async getTableTwin(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;

      if (!tableId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'tableId is required'
          }
        });
        return;
      }

      const result = await tableTwinService.getTableTwin(tableId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error fetching Table Twin', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  async updateTableStatus(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const request: UpdateTableStatusRequest = req.body;

      if (!tableId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'tableId is required'
          }
        });
        return;
      }

      if (!request.status) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'status is required'
          }
        });
        return;
      }

      const validStatuses = Object.values(TableStatus);
      if (!validStatuses.includes(request.status)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
          }
        });
        return;
      }

      const result = await tableTwinService.updateTableStatus(tableId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating Table Twin status', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  async seatTable(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const request: SeatTableRequest = req.body;

      if (!tableId || !request.sessionId || !request.customerCount) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: tableId, sessionId, customerCount'
          }
        });
        return;
      }

      const result = await tableTwinService.seatTable(tableId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      if (message.includes('not available')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message
          }
        });
        return;
      }
      logger.error('Error seating table', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  async clearTable(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const request: ClearTableRequest = req.body;

      if (!tableId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'tableId is required'
          }
        });
        return;
      }

      const result = await tableTwinService.clearTable(tableId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error clearing table', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  async updateTurnTime(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const request: UpdateTurnTimeRequest = req.body;

      if (!tableId || !request.turnTimeType) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: tableId, turnTimeType'
          }
        });
        return;
      }

      await tableTwinService.updateTurnTime(tableId, request);

      res.status(200).json({
        success: true,
        message: 'Turn time updated successfully'
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating turn time', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  async listTables(req: Request, res: Response): Promise<void> {
    try {
      const request: ListTablesRequest = {
        restaurantId: req.query.restaurantId as string,
        status: req.query.status as TableStatus,
        zone: req.query.zone as TableZone,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      if (!request.restaurantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'restaurantId is required'
          }
        });
        return;
      }

      const result = await tableTwinService.listTables(request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error listing Table Twins', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message
        }
      });
    }
  }

  async getTableAvailability(req: Request, res: Response): Promise<void> {
    try {
      const request: GetTableAvailabilityRequest = {
        restaurantId: req.query.restaurantId as string,
        partySize: parseInt(req.query.partySize as string),
        date: req.query.date as string
      };

      if (!request.restaurantId || !request.partySize) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: restaurantId, partySize'
          }
        });
        return;
      }

      const result = await tableTwinService.getTableAvailability(request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting table availability', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message
        }
      });
    }
  }

  async deleteTableTwin(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;

      if (!tableId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'tableId is required'
          }
        });
        return;
      }

      await tableTwinService.deleteTableTwin(tableId);

      res.status(200).json({
        success: true,
        message: 'Table Twin deleted successfully'
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error deleting Table Twin', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }
}

export const tableTwinController = new TableTwinController();