import { ClinicModel } from '../models/Clinic';
import { DepartmentModel } from '../models/Department';
import { Clinic, Department } from '../types';

export class ClinicService {
  async createClinic(data: Partial<Clinic>): Promise<Clinic> {
    const clinic = new ClinicModel(data);
    await clinic.save();
    return clinic.toJSON();
  }

  async getClinics(): Promise<Clinic[]> {
    const clinics = await ClinicModel.find({ status: 'active' });
    return clinics.map(c => c.toJSON());
  }

  async getClinicById(id: string): Promise<Clinic | null> {
    const clinic = await ClinicModel.findById(id);
    return clinic?.toJSON() || null;
  }

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const department = new DepartmentModel(data);
    await department.save();
    return department.toJSON();
  }

  async getDepartments(): Promise<Department[]> {
    const departments = await DepartmentModel.find({ status: 'active' });
    return departments.map(d => d.toJSON());
  }
}

export const clinicService = new ClinicService();
