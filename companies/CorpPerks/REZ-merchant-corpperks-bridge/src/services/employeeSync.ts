import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import logger from '../config/logger';
import { EmployeeModel } from '../models';
import { Employee, HrisProvider, SyncResult, SyncEmployeesRequest } from '../types';

/**
 * HRIS Provider interfaces
 */
interface BambooHREmployee {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  workEmail?: string;
  mobilePhone?: string;
  department?: string;
  jobTitle?: string;
  workPhone?: string;
  dateOfBirth?: string;
  hireDate?: string;
  status?: string;
}

interface GreytHREmployee {
  emp_id: string;
  first_name: string;
  last_name: string;
  email_id: string;
  phone_number?: string;
  department?: string;
  designation?: string;
  date_of_join?: string;
  date_of_birth?: string;
  gender?: string;
  status?: string;
}

interface ZohoPeopleEmployee {
  EMPLOYEEID: string;
  FIRSTNAME: string;
  LASTNAME: string;
  Email?: string;
  Phone?: string;
  Department?: string;
  Designation?: string;
  Date_of_Joining?: string;
  Date_of_Birth?: string;
  Gender?: string;
  Status?: string;
}

/**
 * Employee Sync Service
 * Handles synchronization of employees from various HRIS providers to the merchant
 */
export class EmployeeSyncService {
  private bambooHRClient: AxiosInstance | null = null;
  private greytHRClient: AxiosInstance | null = null;
  private zohoClient: AxiosInstance | null = null;
  private merchantClient: AxiosInstance;

  constructor() {
    // Initialize merchant API client
    this.merchantClient = axios.create({
      baseURL: config.merchant.baseUrl,
      timeout: config.merchant.timeout,
      headers: {
        'X-Internal-Token': config.merchant.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Initialize BambooHR client
    if (config.hris.bambooHR.apiKey && config.hris.bambooHR.companyDomain) {
      this.bambooHRClient = axios.create({
        baseURL: `${config.hris.bambooHR.baseUrl}/${config.hris.bambooHR.companyDomain}/v1`,
        timeout: 30000,
        headers: {
          Authorization: `Basic ${Buffer.from(config.hris.bambooHR.apiKey + ':x').toString('base64')}`,
          Accept: 'application/json',
        },
      });
    }

    // Initialize GreytHR client
    if (config.hris.greytHR.apiKey) {
      this.greytHRClient = axios.create({
        baseURL: config.hris.greytHR.baseUrl,
        timeout: 30000,
        headers: {
          'x-api-key': config.hris.greytHR.apiKey,
          'Content-Type': 'application/json',
        },
      });
    }

    // Initialize Zoho People client
    if (config.hris.zohoPeople.apiKey) {
      this.zohoClient = axios.create({
        baseURL: config.hris.zohoPeople.baseUrl,
        timeout: 30000,
        headers: {
          Authorization: `Zoho-oauthtoken ${config.hris.zohoPeople.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  /**
   * Sync employees from a specific HRIS provider
   */
  async syncEmployees(request: SyncEmployeesRequest): Promise<SyncResult> {
    const startTime = new Date().toISOString();
    const errors: SyncResult['errors'] = [];
    const syncedEmployees: Employee[] = [];
    let syncedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    logger.info('Starting employee sync', {
      provider: request.provider,
      forceSync: request.forceSync,
    });

    try {
      let rawEmployees: unknown[];

      // Fetch employees based on provider
      switch (request.provider) {
        case 'bamboohr':
          rawEmployees = await this.fetchBambooHREmployees(request);
          break;
        case 'greythr':
          rawEmployees = await this.fetchGreytHREmployees(request);
          break;
        case 'zoho_people':
          rawEmployees = await this.fetchZohoPeopleEmployees(request);
          break;
        default:
          throw new Error(`Unsupported HRIS provider: ${request.provider}`);
      }

      // Transform and sync each employee
      for (const rawEmployee of rawEmployees) {
        try {
          const employee = await this.transformAndSyncEmployee(rawEmployee, request.provider, request.forceSync);

          if (employee) {
            syncedEmployees.push(employee);
            syncedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          failedCount++;
          errors.push({
            id: (rawEmployee as { id?: string }).id,
            message: error instanceof Error ? error.message : 'Unknown error',
            code: 'SYNC_ERROR',
          });

          logger.error('Failed to sync employee', {
            provider: request.provider,
            employeeId: (rawEmployee as { id?: string }).id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } catch (error) {
      logger.error('Employee sync failed', {
        provider: request.provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      errors.push({
        message: error instanceof Error ? error.message : 'Sync failed',
        code: 'PROVIDER_ERROR',
      });
    }

    const endTime = new Date().toISOString();

    const result: SyncResult = {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      skippedCount,
      errors,
      startTime,
      endTime,
      provider: request.provider,
      employees: syncedEmployees,
    };

    logger.info('Employee sync completed', {
      provider: request.provider,
      synced: syncedCount,
      failed: failedCount,
      skipped: skippedCount,
      duration: `${new Date(endTime).getTime() - new Date(startTime).getTime()}ms`,
    });

    return result;
  }

  /**
   * Fetch employees from BambooHR
   */
  private async fetchBambooHREmployees(request: SyncEmployeesRequest): Promise<BambooHREmployee[]> {
    if (!this.bambooHRClient) {
      throw new Error('BambooHR client not initialized');
    }

    const fields = [
      'id',
      'firstName',
      'lastName',
      'displayName',
      'workEmail',
      'mobilePhone',
      'department',
      'jobTitle',
      'workPhone',
      'dateOfBirth',
      'hireDate',
      'status',
    ].join(',');

    const response = await this.bambooHRClient.get<BambooHREmployee[]>(
      `/employees/directory?fields=${fields}`
    );

    let employees = response.data;

    // Filter by department if specified
    if (request.department) {
      employees = employees.filter(
        (emp) => emp.department?.toLowerCase() === request.department?.toLowerCase()
      );
    }

    // Filter by status if specified
    if (request.status) {
      employees = employees.filter(
        (emp) => emp.status?.toLowerCase() === request.status?.toLowerCase()
      );
    }

    // Filter by date if specified
    if (request.since) {
      const sinceDate = new Date(request.since);
      employees = employees.filter((emp) => {
        if (!emp.hireDate) return false;
        return new Date(emp.hireDate) >= sinceDate;
      });
    }

    return employees;
  }

  /**
   * Fetch employees from GreytHR
   */
  private async fetchGreytHREmployees(request: SyncEmployeesRequest): Promise<GreytHREmployee[]> {
    if (!this.greytHRClient) {
      throw new Error('GreytHR client not initialized');
    }

    const params: Record<string, string> = {};

    if (request.since) {
      params['from_date'] = request.since;
    }

    const response = await this.greytHRClient.get<{ employees: GreytHREmployee[] }>(
      `/v2/employee`,
      { params }
    );

    let employees = response.data.employees || [];

    // Filter by department if specified
    if (request.department) {
      employees = employees.filter(
        (emp) => emp.department?.toLowerCase() === request.department?.toLowerCase()
      );
    }

    // Filter by status if specified
    if (request.status) {
      employees = employees.filter(
        (emp) => emp.status?.toLowerCase() === request.status?.toLowerCase()
      );
    }

    return employees;
  }

  /**
   * Fetch employees from Zoho People
   */
  private async fetchZohoPeopleEmployees(request: SyncEmployeesRequest): Promise<ZohoPeopleEmployee[]> {
    if (!this.zohoClient) {
      throw new Error('Zoho People client not initialized');
    }

    const params: Record<string, string | number> = {
      orgId: config.hris.zohoPeople.orgId,
      mode: 'getEmployees',
    };

    const response = await this.zohoClient.get<{ data: ZohoPeopleEmployee[] }>(
      '/recruit/api/forms/employee/records',
      { params }
    );

    let employees = response.data.data || [];

    // Filter by department if specified
    if (request.department) {
      employees = employees.filter(
        (emp) => emp.Department?.toLowerCase() === request.department?.toLowerCase()
      );
    }

    // Filter by status if specified
    if (request.status) {
      employees = employees.filter(
        (emp) => emp.Status?.toLowerCase() === request.status?.toLowerCase()
      );
    }

    return employees;
  }

  /**
   * Transform HRIS employee data to standard format and sync
   */
  private async transformAndSyncEmployee(
    rawEmployee: unknown,
    provider: HrisProvider,
    forceSync: boolean
  ): Promise<Employee | null> {
    const transformedEmployee = this.transformEmployee(rawEmployee, provider);

    if (!transformedEmployee) {
      return null;
    }

    // Check if employee exists
    const existingEmployee = await EmployeeModel.findOne({
      hrisProvider: provider,
      hrisEmployeeId: transformedEmployee.hrisEmployeeId,
    });

    if (existingEmployee && !forceSync) {
      // Update existing employee if needed
      const needsUpdate = this.employeeNeedsUpdate(existingEmployee, transformedEmployee);

      if (!needsUpdate) {
        return existingEmployee.toJSON() as Employee;
      }

      Object.assign(existingEmployee, transformedEmployee, { syncedAt: new Date() });
      await existingEmployee.save();

      // Sync to merchant
      await this.syncToMerchant(existingEmployee);

      return existingEmployee.toJSON() as Employee;
    }

    // Create new employee
    const newEmployee = await EmployeeModel.create({
      ...transformedEmployee,
      syncedAt: new Date(),
    });

    // Sync to merchant
    await this.syncToMerchant(newEmployee);

    return newEmployee.toJSON() as Employee;
  }

  /**
   * Transform employee data from various HRIS formats to standard format
   */
  private transformEmployee(
    rawEmployee: unknown,
    provider: HrisProvider
  ): Partial<Employee> | null {
    switch (provider) {
      case 'bamboohr':
        return this.transformBambooHR(rawEmployee as BambooHREmployee);
      case 'greythr':
        return this.transformGreytHR(rawEmployee as GreytHREmployee);
      case 'zoho_people':
        return this.transformZohoPeople(rawEmployee as ZohoPeopleEmployee);
      default:
        return null;
    }
  }

  private transformBambooHR(emp: BambooHREmployee): Partial<Employee> {
    const now = new Date().toISOString();

    return {
      corpPerksId: uuidv4(),
      email: emp.workEmail || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@company.com`,
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.mobilePhone || emp.workPhone,
      department: emp.department,
      designation: emp.jobTitle,
      hrisProvider: 'bamboohr',
      hrisEmployeeId: emp.id,
      dateOfJoining: emp.hireDate ? new Date(emp.hireDate).toISOString() : undefined,
      dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString() : undefined,
      status: this.mapBambooHRStatus(emp.status),
      metadata: {
        displayName: emp.displayName,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  private transformGreytHR(emp: GreytHREmployee): Partial<Employee> {
    const now = new Date().toISOString();

    return {
      corpPerksId: uuidv4(),
      email: emp.email_id,
      firstName: emp.first_name,
      lastName: emp.last_name,
      phone: emp.phone_number,
      department: emp.department,
      designation: emp.designation,
      hrisProvider: 'greythr',
      hrisEmployeeId: emp.emp_id,
      dateOfJoining: emp.date_of_join ? new Date(emp.date_of_join).toISOString() : undefined,
      dateOfBirth: emp.date_of_birth ? new Date(emp.date_of_birth).toISOString() : undefined,
      gender: emp.gender as Employee['gender'],
      status: this.mapGreytHRStatus(emp.status),
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
  }

  private transformZohoPeople(emp: ZohoPeopleEmployee): Partial<Employee> {
    const now = new Date().toISOString();

    return {
      corpPerksId: uuidv4(),
      email: emp.Email || `${emp.FIRSTNAME.toLowerCase()}.${emp.LASTNAME.toLowerCase()}@company.com`,
      firstName: emp.FIRSTNAME,
      lastName: emp.LASTNAME,
      phone: emp.Phone,
      department: emp.Department,
      designation: emp.Designation,
      hrisProvider: 'zoho_people',
      hrisEmployeeId: emp.EMPLOYEEID,
      dateOfJoining: emp.Date_of_Joining ? new Date(emp.Date_of_Joining).toISOString() : undefined,
      dateOfBirth: emp.Date_of_Birth ? new Date(emp.Date_of_Birth).toISOString() : undefined,
      gender: emp.Gender as Employee['gender'],
      status: this.mapZohoStatus(emp.Status),
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Map HRIS status to CorpPerks status
   */
  private mapBambooHRStatus(status?: string): Employee['status'] {
    if (!status) return 'active';
    const statusMap: Record<string, Employee['status']> = {
      Active: 'active',
      Inactive: 'inactive',
      'On Leave': 'on_leave',
      Terminated: 'terminated',
    };
    return statusMap[status] || 'active';
  }

  private mapGreytHRStatus(status?: string): Employee['status'] {
    if (!status) return 'active';
    const statusMap: Record<string, Employee['status']> = {
      Active: 'active',
      Inactive: 'inactive',
      Leave: 'on_leave',
      Separated: 'terminated',
    };
    return statusMap[status] || 'active';
  }

  private mapZohoStatus(status?: string): Employee['status'] {
    if (!status) return 'active';
    const statusMap: Record<string, Employee['status']> = {
      'Active': 'active',
      'Inactive': 'inactive',
      'On Leave': 'on_leave',
      'Terminated': 'terminated',
    };
    return statusMap[status] || 'active';
  }

  /**
   * Check if employee needs update
   */
  private employeeNeedsUpdate(existing: Employee, updated: Partial<Employee>): boolean {
    const fieldsToCheck: Array<keyof Employee> = [
      'email',
      'firstName',
      'lastName',
      'phone',
      'department',
      'designation',
      'status',
    ];

    for (const field of fieldsToCheck) {
      if (updated[field] && updated[field] !== existing[field]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Sync employee to REZ Merchant
   */
  private async syncToMerchant(employee: InstanceType<typeof EmployeeModel>): Promise<void> {
    try {
      const merchantEmployeeData = {
        externalId: employee.corpPerksId,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        department: employee.department,
        designation: employee.designation,
        status: employee.status,
        metadata: employee.metadata,
      };

      const response = await this.merchantClient.post('/api/v1/employees', merchantEmployeeData);

      // Update with merchant employee ID
      if (response.data?.data?.id) {
        employee.merchantEmployeeId = response.data.data.id;
        await employee.save();
      }

      logger.info('Employee synced to merchant', {
        corpPerksId: employee.corpPerksId,
        merchantId: response.data?.data?.id,
      });
    } catch (error) {
      logger.error('Failed to sync employee to merchant', {
        corpPerksId: employee.corpPerksId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Don't throw - merchant sync failure shouldn't fail the whole sync
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployee(employeeId: string): Promise<Employee | null> {
    const employee = await EmployeeModel.findById(employeeId);
    return employee ? (employee.toJSON() as Employee) : null;
  }

  /**
   * Get employee by corpPerks ID
   */
  async getEmployeeByCorpPerksId(corpPerksId: string): Promise<Employee | null> {
    const employee = await EmployeeModel.findOne({ corpPerksId });
    return employee ? (employee.toJSON() as Employee) : null;
  }

  /**
   * Get all employees with pagination
   */
  async getEmployees(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: Employee['status'];
      department?: string;
      hrisProvider?: HrisProvider;
    }
  ): Promise<{ employees: Employee[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.department) {
      query.department = filters.department;
    }
    if (filters?.hrisProvider) {
      query.hrisProvider = filters.hrisProvider;
    }

    const total = await EmployeeModel.countDocuments(query);
    const employees = await EmployeeModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return {
      employees: employees.map((e) => e.toJSON() as Employee),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Deactivate employee
   */
  async deactivateEmployee(employeeId: string): Promise<Employee | null> {
    const employee = await EmployeeModel.findByIdAndUpdate(
      employeeId,
      {
        status: 'terminated',
        syncedAt: new Date(),
      },
      { new: true }
    );

    if (employee) {
      // Notify merchant about deactivation
      try {
        await this.merchantClient.patch(
          `/api/v1/employees/${employee.merchantEmployeeId}`,
          { status: 'terminated' }
        );
      } catch (error) {
        logger.error('Failed to notify merchant about employee deactivation', {
          corpPerksId: employee.corpPerksId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return employee ? (employee.toJSON() as Employee) : null;
  }
}

export default new EmployeeSyncService();
