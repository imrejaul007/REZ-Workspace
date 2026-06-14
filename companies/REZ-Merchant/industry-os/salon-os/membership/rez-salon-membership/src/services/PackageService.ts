import { v4 as uuidv4 } from 'uuid';
import { Package, IPackage, PackageStatus } from '../models/Package';
import { CreatePackageInput, UpdatePackageInput, PackageQueryInput } from '../schemas/package.schemas';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class PackageService {
  /**
   * Create a new package
   */
  async createPackage(input: CreatePackageInput): Promise<IPackage> {
    const packageId = `PKG-${uuidv4()}`;

    const pkg = new Package({
      ...input,
      packageId,
      status: input.status || PackageStatus.ACTIVE,
    });

    await pkg.save();
    logger.info('Package created', { packageId, name: input.name });

    return pkg;
  }

  /**
   * Get package by ID
   */
  async getPackageById(packageId: string): Promise<IPackage> {
    const pkg = await Package.findOne({ packageId });

    if (!pkg) {
      throw new AppError('Package not found', 404);
    }

    return pkg;
  }

  /**
   * Get package by ID or throw error
   */
  async getActivePackage(packageId: string): Promise<IPackage> {
    const pkg = await Package.findOne({ packageId, status: PackageStatus.ACTIVE });

    if (!pkg) {
      throw new AppError('Package not found or inactive', 404);
    }

    return pkg;
  }

  /**
   * Update package
   */
  async updatePackage(packageId: string, input: UpdatePackageInput): Promise<IPackage> {
    const pkg = await Package.findOneAndUpdate(
      { packageId },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!pkg) {
      throw new AppError('Package not found', 404);
    }

    logger.info('Package updated', { packageId });
    return pkg;
  }

  /**
   * Delete package (soft delete - set status to discontinued)
   */
  async deletePackage(packageId: string): Promise<IPackage> {
    const pkg = await Package.findOneAndUpdate(
      { packageId },
      { $set: { status: PackageStatus.DISCONTINUED } },
      { new: true }
    );

    if (!pkg) {
      throw new AppError('Package not found', 404);
    }

    logger.info('Package discontinued', { packageId });
    return pkg;
  }

  /**
   * List packages with filtering and pagination
   */
  async listPackages(query: PackageQueryInput): Promise<{ packages: IPackage[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {};

    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;
    if (query.familyPlan !== undefined) filter.familyPlan = query.familyPlan;
    if (query.corporateEligible !== undefined) filter.corporateEligible = query.corporateEligible;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    if (query.tags) {
      const tags = query.tags.split(',').map((t) => t.trim());
      filter.tags = { $in: tags };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [packages, total] = await Promise.all([
      Package.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Package.countDocuments(filter),
    ]);

    return { packages, total, page, limit };
  }

  /**
   * Get packages by type
   */
  async getPackagesByType(type: string): Promise<IPackage[]> {
    return Package.find({ type, status: PackageStatus.ACTIVE }).sort({ price: 1 });
  }

  /**
   * Get hair packages (cut+wash+style, color+cut, etc.)
   */
  async getHairPackages(): Promise<IPackage[]> {
    return Package.find({
      type: 'hair',
      status: PackageStatus.ACTIVE,
    }).sort({ price: 1 });
  }

  /**
   * Get prepaid cards
   */
  async getPrepaidCards(): Promise<IPackage[]> {
    return Package.find({
      isPrepaidCard: true,
      status: PackageStatus.ACTIVE,
    }).sort({ prepaidCardValue: 1 });
  }

  /**
   * Get family plans
   */
  async getFamilyPlans(): Promise<IPackage[]> {
    return Package.find({
      familyPlan: true,
      status: PackageStatus.ACTIVE,
    }).sort({ price: 1 });
  }

  /**
   * Get corporate eligible packages
   */
  async getCorporatePackages(): Promise<IPackage[]> {
    return Package.find({
      corporateEligible: true,
      status: PackageStatus.ACTIVE,
    }).sort({ price: 1 });
  }

  /**
   * Calculate corporate price
   */
  calculateCorporatePrice(pkg: IPackage, discount?: number): number {
    if (!pkg.corporateEligible) {
      throw new AppError('Package is not eligible for corporate discount', 400);
    }

    const discountPercent = discount || pkg.corporateDiscount || 0;
    return pkg.price * (1 - discountPercent / 100);
  }

  /**
   * Check if package is valid for redemption
   */
  async isPackageValid(packageId: string): Promise<boolean> {
    const pkg = await Package.findOne({ packageId, status: PackageStatus.ACTIVE });
    return pkg !== null;
  }
}

export const packageService = new PackageService();
