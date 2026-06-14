import { EmployeeHealth, IEmployeeHealth } from '../models';
import { EmployeeHealthSync } from '../types';

export class EmployeeHealthService {
  /**
   * Sync employees with health data from CorpPerks to RisaCare
   */
  async syncEmployees(employees: EmployeeHealthSync[]): Promise<{
    synced: number;
    failed: number;
    errors: Array<{ employeeId: string; error: string }>;
    employees: IEmployeeHealth[];
  }> {
    const errors: Array<{ employeeId: string; error: string }> = [];
    const syncedEmployees: IEmployeeHealth[] = [];

    for (const employee of employees) {
      try {
        const existing = await EmployeeHealth.findOne({ employeeId: employee.employeeId });
        const now = new Date();

        if (existing) {
          existing.firstName = employee.firstName;
          existing.lastName = employee.lastName;
          existing.email = employee.email;
          existing.phone = employee.phone;
          existing.department = employee.department;
          existing.designation = employee.designation;
          existing.dateOfBirth = employee.dateOfBirth ? new Date(employee.dateOfBirth) : existing.dateOfBirth;
          existing.gender = employee.gender;
          existing.bloodType = employee.bloodType;
          existing.allergies = employee.allergies || existing.allergies;
          existing.conditions = employee.conditions || existing.conditions;
          existing.medications = employee.medications || existing.medications;
          existing.emergencyContact = employee.emergencyContact || existing.emergencyContact;
          existing.consentGiven = employee.consentGiven;
          existing.consentDate = employee.consentDate ? new Date(employee.consentDate) : existing.consentDate;
          existing.lastSyncedAt = now;
          existing.metadata = { ...existing.metadata, ...employee.metadata };

          await existing.save();
          syncedEmployees.push(existing);
        } else {
          const newEmployee = new EmployeeHealth({
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            companyId: employee.companyId,
            department: employee.department,
            designation: employee.designation,
            dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth) : undefined,
            gender: employee.gender,
            bloodType: employee.bloodType,
            allergies: employee.allergies || [],
            conditions: employee.conditions || [],
            medications: employee.medications || [],
            emergencyContact: employee.emergencyContact,
            consentGiven: employee.consentGiven,
            consentDate: employee.consentDate ? new Date(employee.consentDate) : undefined,
            syncedAt: now,
            lastSyncedAt: now,
            metadata: employee.metadata,
          });

          await newEmployee.save();
          syncedEmployees.push(newEmployee);
        }
      } catch (error) {
        errors.push({
          employeeId: employee.employeeId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      synced: employees.length - errors.length,
      failed: errors.length,
      errors,
      employees: syncedEmployees,
    };
  }

  /**
   * Get employee health record by ID
   */
  async getEmployee(employeeId: string): Promise<IEmployeeHealth | null> {
    return EmployeeHealth.findOne({ employeeId });
  }

  /**
   * Get employees by company with consent
   */
  async getEmployeesByCompany(companyId: string, options?: {
    consentOnly?: boolean;
    department?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ employees: IEmployeeHealth[]; total: number }> {
    const filter: Record<string, unknown> = { companyId };

    if (options?.consentOnly) {
      filter.consentGiven = true;
    }
    if (options?.department) {
      filter.department = options.department;
    }

    const [employees, total] = await Promise.all([
      EmployeeHealth.find(filter)
        .skip(options?.offset || 0)
        .limit(options?.limit || 50)
        .sort({ syncedAt: -1 }),
      EmployeeHealth.countDocuments(filter),
    ]);

    return { employees, total };
  }

  /**
   * Update consent status
   */
  async updateConsent(
    employeeId: string,
    consentGiven: boolean
  ): Promise<IEmployeeHealth | null> {
    return EmployeeHealth.findOneAndUpdate(
      { employeeId },
      {
        consentGiven,
        consentDate: consentGiven ? new Date() : undefined,
        lastSyncedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Update health profile
   */
  async updateHealthProfile(
    employeeId: string,
    data: Partial<{
      allergies: string[];
      conditions: string[];
      medications: string[];
      emergencyContact: { name: string; phone: string; relationship: string };
      bloodType: string;
    }>
  ): Promise<IEmployeeHealth | null> {
    const update: Record<string, unknown> = { lastSyncedAt: new Date() };

    if (data.allergies) update.allergies = data.allergies;
    if (data.conditions) update.conditions = data.conditions;
    if (data.medications) update.medications = data.medications;
    if (data.emergencyContact) update.emergencyContact = data.emergencyContact;
    if (data.bloodType) update.bloodType = data.bloodType;

    return EmployeeHealth.findOneAndUpdate(
      { employeeId },
      update,
      { new: true }
    );
  }

  /**
   * Get health statistics by company
   */
  async getStats(companyId?: string): Promise<{
    totalEmployees: number;
    withConsent: number;
    withoutConsent: number;
    byBloodType: Record<string, number>;
    commonAllergies: Array<{ allergy: string; count: number }>;
    commonConditions: Array<{ condition: string; count: number }>;
  }> {
    const filter = companyId ? { companyId } : {};

    const [employees, bloodTypeStats, allergyStats, conditionStats] = await Promise.all([
      EmployeeHealth.find(filter),
      EmployeeHealth.aggregate([
        { $match: { ...filter, bloodType: { $exists: true } } },
        { $group: { _id: '$bloodType', count: { $sum: 1 } } },
      ]),
      EmployeeHealth.aggregate([
        { $match: filter },
        { $unwind: '$allergies' },
        { $group: { _id: '$allergies', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      EmployeeHealth.aggregate([
        { $match: filter },
        { $unwind: '$conditions' },
        { $group: { _id: '$conditions', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const consentCounts = employees.reduce(
      (acc, e) => {
        if (e.consentGiven) acc.withConsent++;
        else acc.withoutConsent++;
        return acc;
      },
      { withConsent: 0, withoutConsent: 0 }
    );

    return {
      totalEmployees: employees.length,
      withConsent: consentCounts.withConsent,
      withoutConsent: consentCounts.withoutConsent,
      byBloodType: bloodTypeStats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {} as Record<string, number>),
      commonAllergies: allergyStats.map((s) => ({ allergy: s._id, count: s.count })),
      commonConditions: conditionStats.map((s) => ({ condition: s._id, count: s.count })),
    };
  }
}

export const employeeHealthService = new EmployeeHealthService();
