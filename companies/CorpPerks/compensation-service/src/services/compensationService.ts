import mongoose from 'mongoose';
import { CompensationPackage, CompensationPackageDocument, SalaryBand } from '../models/index.js';
import { CreateCompensationInput, UpdateCompensationInput } from '../validators/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/AppError.js';
import { logger } from '../utils/index.js';

export class CompensationService {
  async create(data: CreateCompensationInput): Promise<CompensationPackageDocument> {
    logger.info('Creating compensation package', { employeeId: data.employeeId });

    // Validate band exists
    if (!mongoose.Types.ObjectId.isValid(data.bandId)) {
      throw new ValidationError('Invalid band ID');
    }

    const band = await SalaryBand.findById(data.bandId);
    if (!band) {
      throw new NotFoundError('Salary band not found');
    }

    // Validate salary is within band range
    if (data.salary < band.minSalary || data.salary > band.maxSalary) {
      throw new ValidationError(
        `Salary must be between ${band.minSalary} and ${band.maxSalary} for band '${band.name}'`
      );
    }

    // Check for existing compensation
    const existing = await CompensationPackage.findOne({
      employeeId: data.employeeId,
      bandId: data.bandId,
    });

    if (existing) {
      throw new ConflictError('Compensation package already exists for this employee and band');
    }

    const compensation = new CompensationPackage({
      ...data,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
    });

    await compensation.save();

    logger.info('Compensation package created', { id: compensation._id, employeeId: data.employeeId });
    return compensation;
  }

  async findByEmployeeId(employeeId: string): Promise<CompensationPackageDocument[]> {
    return CompensationPackage.find({ employeeId }).sort({ effectiveDate: -1 });
  }

  async findCurrentByEmployeeId(employeeId: string): Promise<CompensationPackageDocument | null> {
    return CompensationPackage.findOne({ employeeId }).sort({ effectiveDate: -1 });
  }

  async findById(id: string): Promise<CompensationPackageDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Compensation package not found');
    }

    const compensation = await CompensationPackage.findById(id).populate('bandId');
    if (!compensation) {
      throw new NotFoundError('Compensation package not found');
    }

    return compensation;
  }

  async update(id: string, data: UpdateCompensationInput): Promise<CompensationPackageDocument> {
    const compensation = await this.findById(id);

    // Validate salary if being updated
    if (data.salary !== undefined) {
      const band = await SalaryBand.findById(compensation.bandId);
      if (band && (data.salary < band.minSalary || data.salary > band.maxSalary)) {
        throw new ValidationError(
          `Salary must be between ${band.minSalary} and ${band.maxSalary} for band '${band.name}'`
        );
      }
    }

    Object.assign(compensation, data);

    if (data.effectiveDate) {
      (compensation as any).effectiveDate = new Date(data.effectiveDate);
    }

    await compensation.save();

    logger.info('Compensation package updated', { id: compensation._id });
    return compensation;
  }

  async getEmployeeCompensationDetails(employeeId: string): Promise<{
    current: CompensationPackageDocument | null;
    history: CompensationPackageDocument[];
    band: any;
  }> {
    const current = await this.findCurrentByEmployeeId(employeeId);
    const history = await this.findByEmployeeId(employeeId);

    let band = null;
    if (current) {
      band = await SalaryBand.findById(current.bandId);
    }

    return {
      current,
      history,
      band,
    };
  }

  async delete(id: string): Promise<void> {
    const compensation = await this.findById(id);
    await CompensationPackage.deleteOne({ _id: compensation._id });

    logger.info('Compensation package deleted', { id });
  }
}

export const compensationService = new CompensationService();
