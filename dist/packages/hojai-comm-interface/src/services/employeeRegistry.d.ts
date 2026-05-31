import { Employee, EmployeeStatus } from '../types/index.js';
export interface EmployeeRegistration {
    tenantId: string;
    name: string;
    role: string;
    description?: string;
    avatar?: string;
    capabilities?: string[];
    skills?: string[];
    languages?: string[];
    workingHours?: {
        start: string;
        end: string;
        timezone?: string;
    };
    metadata?: Record<string, unknown>;
}
export interface EmployeeUpdate {
    name?: string;
    role?: string;
    description?: string;
    avatar?: string;
    capabilities?: string[];
    skills?: string[];
    languages?: string[];
    workingHours?: {
        start: string;
        end: string;
        timezone?: string;
    };
    metadata?: Record<string, unknown>;
}
declare class EmployeeRegistry {
    private initialized;
    initialize(): Promise<void>;
    register(data: EmployeeRegistration): Promise<Employee>;
    findById(id: string, tenantId: string): Promise<Employee | null>;
    findByRole(tenantId: string, role: string): Promise<Employee[]>;
    findByCapability(tenantId: string, capability: string): Promise<Employee[]>;
    findByStatus(tenantId: string, status: EmployeeStatus): Promise<Employee[]>;
    findAvailable(tenantId: string): Promise<Employee[]>;
    listByTenant(tenantId: string): Promise<Employee[]>;
    update(id: string, tenantId: string, updates: EmployeeUpdate): Promise<Employee | null>;
    updateStatus(id: string, tenantId: string, status: EmployeeStatus): Promise<Employee | null>;
    delete(id: string, tenantId: string): Promise<boolean>;
    countByTenant(tenantId: string): Promise<number>;
    countByStatus(tenantId: string): Promise<Record<EmployeeStatus, number>>;
    /**
     * Find the best available employee based on skills and availability
     */
    findBestMatch(tenantId: string, requiredSkills: string[], preferredRole?: string): Promise<Employee | null>;
}
export declare const employeeRegistry: EmployeeRegistry;
export {};
//# sourceMappingURL=employeeRegistry.d.ts.map