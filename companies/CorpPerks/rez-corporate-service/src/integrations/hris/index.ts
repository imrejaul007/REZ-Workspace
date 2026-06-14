import { HRISConnection, Employee } from '../../models';
import { HRISProvider, SyncStatus } from '../../types';
import { GreytHRService, SyncResult as GreytHRSyncResult } from './greytHRService';
import { BambooHRService, SyncResult as BambooHRSyncResult } from './bambooHRService';
import { ZohoHRService, SyncResult as ZohoHRSyncResult } from './zohoHRService';
import { logger } from '../../config/logger';
import cron from 'node-cron';

export class HRISService {
  private services: Map<string, any> = new Map();

  constructor() {
    this.initializeServices();
    this.setupCronJobs();
  }

  private initializeServices(): void {
    this.services.set(HRISProvider.GREYTHR, GreytHRService);
    this.services.set(HRISProvider.BAMBOOHR, BambooHRService);
    this.services.set(HRISProvider.ZOHO, ZohoHRService);
  }

  private setupCronJobs(): void {
    // Sync every hour
    cron.schedule('0 * * * *', async () => {
      logger.info('Running scheduled HRIS sync');
      await this.syncAllConnections();
    });
  }

  async createConnection(params: {
    companyId: string;
    provider: HRISProvider;
    credentials: {
      clientId?: string;
      clientSecret?: string;
      subdomain?: string; // For BambooHR
      refreshToken?: string; // For Zoho
      username?: string;
      password?: string;
    };
    fieldMappings?: Record<string, string>;
  }): Promise<any> {
    const connection = new HRISConnection({
      companyId: params.companyId,
      provider: params.provider,
      status: SyncStatus.DISCONNECTED,
      credentials: params.credentials,
      fieldMappings: params.fieldMappings || {},
      syncHistory: []
    });

    await connection.save();

    logger.info('HRIS connection created', {
      connectionId: connection._id,
      provider: params.provider
    });

    return connection;
  }

  async connect(connectionId: string): Promise<boolean> {
    const connection = await HRISConnection.findById(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const ServiceClass = this.services.get(connection.provider);
    if (!ServiceClass) {
      throw new Error(`Unknown provider: ${connection.provider}`);
    }

    const service = new ServiceClass(connection);
    const success = await service.testConnection();

    if (success) {
      connection.status = SyncStatus.CONNECTED;
      await connection.save();
      logger.info('HRIS connected', { connectionId });
    }

    return success;
  }

  async sync(connectionId: string): Promise<GreytHRSyncResult | BambooHRSyncResult | ZohoHRSyncResult> {
    const connection = await HRISConnection.findById(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const ServiceClass = this.services.get(connection.provider);
    if (!ServiceClass) {
      throw new Error(`Unknown provider: ${connection.provider}`);
    }

    connection.status = SyncStatus.SYNCING;
    await connection.save();

    const service = new ServiceClass(connection);
    const result = await service.syncEmployees(connection.companyId.toString());

    return result;
  }

  async syncAllConnections(): Promise<void> {
    const connections = await HRISConnection.find({
      status: { $in: [SyncStatus.CONNECTED, SyncStatus.ERROR] }
    });

    logger.info(`Starting sync for ${connections.length} HRIS connections`);

    for (const connection of connections) {
      try {
        await this.sync(connection._id.toString());
      } catch (error: any) {
        logger.error(`HRIS sync failed for ${connection._id}`, {
          error: error.message
        });
      }
    }
  }

  async getConnection(connectionId: string): Promise<any> {
    return HRISConnection.findById(connectionId);
  }

  async getCompanyConnections(companyId: string): Promise<any[]> {
    return HRISConnection.find({ companyId });
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const connection = await HRISConnection.findById(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Delete associated employees
    await Employee.deleteMany({
      hrisConnectionId: connectionId
    });

    await HRISConnection.deleteOne({ _id: connectionId });

    logger.info('HRIS connection deleted', { connectionId });
  }

  async getEmployees(companyId: string, params?: {
    department?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    employees: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = { companyId };

    if (params?.department) {
      query.department = params.department;
    }
    if (params?.status) {
      query.status = params.status;
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .sort({ firstName: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Employee.countDocuments(query)
    ]);

    return {
      employees,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getEmployeeById(companyId: string, employeeId: string): Promise<any> {
    return Employee.findOne({ companyId, _id: employeeId });
  }

  async getDepartments(companyId: string): Promise<string[]> {
    const employees = await Employee.find({ companyId }).distinct('department');
    return employees.sort();
  }

  async getSyncHistory(connectionId: string, limit: number = 10): Promise<any[]> {
    const connection = await HRISConnection.findById(connectionId);
    return connection?.syncHistory?.slice(-limit).reverse() || [];
  }

  async updateFieldMappings(connectionId: string, mappings: Record<string, string>): Promise<void> {
    await HRISConnection.updateOne(
      { _id: connectionId },
      { $set: { fieldMappings: mappings } }
    );
  }

  async handleWebhook(provider: HRISProvider, event: {
    type: string;
    employeeId?: string;
    data?: any;
  }): Promise<void> {
    logger.info('HRIS webhook received', { provider, type: event.type });

    switch (event.type) {
      case 'employee.created':
      case 'employee.updated':
        if (event.employeeId) {
          await this.syncEmployeeFromHRIS(provider, event.employeeId);
        }
        break;

      case 'employee.terminated':
        if (event.employeeId) {
          await this.handleEmployeeTermination(event.employeeId);
        }
        break;

      default:
        logger.warn('Unknown HRIS webhook type', { type: event.type });
    }
  }

  private async syncEmployeeFromHRIS(provider: HRISProvider, employeeId: string): Promise<void> {
    const connection = await HRISConnection.findOne({ provider });
    if (!connection) return;

    const ServiceClass = this.services.get(provider);
    if (!ServiceClass) return;

    const service = new ServiceClass(connection);
    const employee = await service.getEmployeeById(employeeId);

    if (employee) {
      const existing = await Employee.findOne({
        externalId: employeeId,
        hrisConnectionId: connection._id
      });

      if (existing) {
        Object.assign(existing, service.transformEmployee(employee, connection.companyId.toString()));
        existing.syncedAt = new Date();
        await existing.save();
      } else {
        const newEmployee = new Employee({
          ...service.transformEmployee(employee, connection.companyId.toString()),
          companyId: connection.companyId,
          hrisConnectionId: connection._id
        });
        await newEmployee.save();
      }
    }
  }

  private async handleEmployeeTermination(externalId: string): Promise<void> {
    await Employee.updateMany(
      { externalId },
      {
        $set: {
          status: 'terminated',
          syncedAt: new Date()
        }
      }
    );
  }
}

export const hrisService = new HRISService();
