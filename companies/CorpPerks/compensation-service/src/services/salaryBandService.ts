import mongoose, { FilterQuery } from 'mongoose';
import { SalaryBand, SalaryBandDocument } from '../models/index.js';
import { CreateSalaryBandInput, UpdateSalaryBandInput } from '../validators/index.js';
import { NotFoundError, ConflictError } from '../utils/AppError.js';
import { logger } from '../utils/index.js';

export class SalaryBandService {
  async create(data: CreateSalaryBandInput): Promise<SalaryBandDocument> {
    logger.info('Creating salary band', { name: data.name });

    const existing = await SalaryBand.findOne({ name: data.name });
    if (existing) {
      throw new ConflictError(`Salary band with name '${data.name}' already exists`);
    }

    const salaryBand = new SalaryBand(data);
    await salaryBand.save();

    logger.info('Salary band created successfully', { id: salaryBand._id });
    return salaryBand;
  }

  async findAll(
    filters?: FilterQuery<SalaryBandDocument>,
    page: number = 1,
    limit: number = 20
  ): Promise<{ bands: SalaryBandDocument[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = filters || {};
    const [bands, total] = await Promise.all([
      SalaryBand.find(query).sort({ level: 1, minSalary: 1 }).skip(skip).limit(limit),
      SalaryBand.countDocuments(query),
    ]);

    return { bands, total };
  }

  async findById(id: string): Promise<SalaryBandDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Salary band not found');
    }

    const band = await SalaryBand.findById(id);
    if (!band) {
      throw new NotFoundError('Salary band not found');
    }

    return band;
  }

  async findByName(name: string): Promise<SalaryBandDocument | null> {
    return SalaryBand.findOne({ name });
  }

  async findByLevel(level: string): Promise<SalaryBandDocument[]> {
    return SalaryBand.find({ level }).sort({ minSalary: 1 });
  }

  async update(id: string, data: UpdateSalaryBandInput): Promise<SalaryBandDocument> {
    const band = await this.findById(id);

    if (data.name && data.name !== band.name) {
      const existing = await SalaryBand.findOne({ name: data.name });
      if (existing) {
        throw new ConflictError(`Salary band with name '${data.name}' already exists`);
      }
    }

    if (data.minSalary !== undefined && data.maxSalary !== undefined) {
      if (data.maxSalary <= data.minSalary) {
        throw new ConflictError('maxSalary must be greater than minSalary');
      }
    }

    Object.assign(band, data);
    await band.save();

    logger.info('Salary band updated', { id: band._id });
    return band;
  }

  async delete(id: string): Promise<void> {
    const band = await this.findById(id);
    await SalaryBand.deleteOne({ _id: band._id });

    logger.info('Salary band deleted', { id });
  }
}

export const salaryBandService = new SalaryBandService();
