import mongoose from 'mongoose';
import { Promotion, PromotionDocument, CompensationPackage, SalaryBand } from '../models/index.js';
import { CreatePromotionInput } from '../validators/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/AppError.js';
import { logger } from '../utils/index.js';

export class PromotionService {
  async create(data: CreatePromotionInput): Promise<PromotionDocument> {
    logger.info('Creating promotion', { employeeId: data.employeeId });

    // Validate band IDs
    if (!mongoose.Types.ObjectId.isValid(data.oldBandId)) {
      throw new ValidationError('Invalid old band ID');
    }
    if (!mongoose.Types.ObjectId.isValid(data.newBandId)) {
      throw new ValidationError('Invalid new band ID');
    }

    // Validate bands exist
    const [oldBand, newBand] = await Promise.all([
      SalaryBand.findById(data.oldBandId),
      SalaryBand.findById(data.newBandId),
    ]);

    if (!oldBand) {
      throw new NotFoundError('Old salary band not found');
    }
    if (!newBand) {
      throw new NotFoundError('New salary band not found');
    }

    // Validate salary is within new band range
    if (data.currentSalary < newBand.minSalary || data.currentSalary > newBand.maxSalary) {
      throw new ValidationError(
        `New salary must be between ${newBand.minSalary} and ${newBand.maxSalary} for band '${newBand.name}'`
      );
    }

    // Check for existing pending promotion
    const existingPending = await Promotion.findOne({
      employeeId: data.employeeId,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingPending) {
      throw new ConflictError('Employee already has a pending or approved promotion');
    }

    const promotion = new Promotion({
      employeeId: data.employeeId,
      oldBandId: data.oldBandId,
      newBandId: data.newBandId,
      oldSalary: data.currentSalary,
      newSalary: data.currentSalary,
      effectiveDate: new Date(data.effectiveDate),
      status: 'pending',
      approvedBy: data.approvedBy,
    });

    await promotion.save();

    logger.info('Promotion created', { id: promotion._id, employeeId: data.employeeId });
    return promotion;
  }

  async findAll(
    filters?: { employeeId?: string; status?: string },
    page: number = 1,
    limit: number = 20
  ): Promise<{ promotions: PromotionDocument[]; total: number }> {
    const query: Record<string, any> = {};

    if (filters?.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    const skip = (page - 1) * limit;

    const [promotions, total] = await Promise.all([
      Promotion.find(query)
        .populate('oldBandId')
        .populate('newBandId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Promotion.countDocuments(query),
    ]);

    return { promotions, total };
  }

  async findPending(): Promise<PromotionDocument[]> {
    return Promotion.find({ status: 'pending' })
      .populate('oldBandId')
      .populate('newBandId')
      .sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<PromotionDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Promotion not found');
    }

    const promotion = await Promotion.findById(id)
      .populate('oldBandId')
      .populate('newBandId');

    if (!promotion) {
      throw new NotFoundError('Promotion not found');
    }

    return promotion;
  }

  async findByEmployeeId(employeeId: string): Promise<PromotionDocument[]> {
    return Promotion.find({ employeeId })
      .populate('oldBandId')
      .populate('newBandId')
      .sort({ createdAt: -1 });
  }

  async approve(promotionId: string, approvedBy: string): Promise<PromotionDocument> {
    const promotion = await this.findById(promotionId);

    if (promotion.status !== 'pending') {
      throw new ConflictError(`Cannot approve promotion with status '${promotion.status}'`);
    }

    promotion.status = 'approved';
    promotion.approvedBy = approvedBy;
    promotion.approvedAt = new Date();

    await promotion.save();

    logger.info('Promotion approved', { id: promotion._id, approvedBy });
    return promotion;
  }

  async reject(
    promotionId: string,
    rejectedBy: string,
    reason: string
  ): Promise<PromotionDocument> {
    const promotion = await this.findById(promotionId);

    if (promotion.status !== 'pending') {
      throw new ConflictError(`Cannot reject promotion with status '${promotion.status}'`);
    }

    promotion.status = 'rejected';
    promotion.approvedBy = rejectedBy;
    promotion.approvedAt = new Date();
    promotion.rejectionReason = reason;

    await promotion.save();

    logger.info('Promotion rejected', { id: promotion._id, rejectedBy, reason });
    return promotion;
  }

  async process(
    promotionId: string,
    processedBy: string,
    newSalary: number
  ): Promise<PromotionDocument> {
    const promotion = await this.findById(promotionId);

    if (promotion.status !== 'approved') {
      throw new ConflictError(`Cannot process promotion with status '${promotion.status}'`);
    }

    // Validate new salary against new band
    const newBand = await SalaryBand.findById(promotion.newBandId);
    if (!newBand) {
      throw new NotFoundError('New salary band not found');
    }

    if (newSalary < newBand.minSalary || newSalary > newBand.maxSalary) {
      throw new ValidationError(
        `New salary must be between ${newBand.minSalary} and ${newBand.maxSalary} for band '${newBand.name}'`
      );
    }

    // Update promotion
    promotion.newSalary = newSalary;
    promotion.status = 'processed';
    promotion.processedBy = processedBy;
    promotion.processedAt = new Date();

    await promotion.save();

    // Update compensation package
    const compensation = await CompensationPackage.findOne({
      employeeId: promotion.employeeId,
    }).sort({ effectiveDate: -1 });

    if (compensation) {
      compensation.bandId = promotion.newBandId;
      compensation.salary = newSalary;
      compensation.effectiveDate = promotion.effectiveDate;
      await compensation.save();
    } else {
      // Create new compensation package
      const newCompensation = new CompensationPackage({
        employeeId: promotion.employeeId,
        bandId: promotion.newBandId,
        salary: newSalary,
        effectiveDate: promotion.effectiveDate,
      });
      await newCompensation.save();
    }

    logger.info('Promotion processed', {
      id: promotion._id,
      processedBy,
      newSalary,
      employeeId: promotion.employeeId,
    });

    return promotion;
  }
}

export const promotionService = new PromotionService();
