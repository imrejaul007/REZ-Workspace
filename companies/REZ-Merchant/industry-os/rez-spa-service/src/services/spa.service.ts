import { SpaServiceModel } from '../models/SpaService';
import { TherapistModel } from '../models/Therapist';
import { SpaService, Therapist, ServiceCategory } from '../types';

export class SpaServiceService {
  // Service Management
  async createService(data: Partial<SpaService>): Promise<SpaService> {
    const service = new SpaServiceModel(data);
    await service.save();
    return service.toJSON();
  }

  async getServiceById(id: string): Promise<SpaService | null> {
    const service = await SpaServiceModel.findById(id)
      .populate('therapists', 'name avatar rating')
      .populate('products', 'name brand');
    return service?.toJSON() || null;
  }

  async getServices(filters: {
    category?: ServiceCategory;
    status?: string;
    isPopular?: boolean;
    isFeatured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ services: SpaService[]; total: number }> {
    const {
      category,
      status,
      isPopular,
      isFeatured,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const query: Record<string, unknown> = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (isPopular !== undefined) query.isPopular = isPopular;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (search) query.$text = { $search: search };

    const [services, total] = await Promise.all([
      SpaServiceModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('therapists', 'name avatar'),
      SpaServiceModel.countDocuments(query)
    ]);

    return {
      services: services.map(s => s.toJSON()),
      total
    };
  }

  async updateService(id: string, data: Partial<SpaService>): Promise<SpaService | null> {
    const service = await SpaServiceModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    return service?.toJSON() || null;
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await SpaServiceModel.findByIdAndDelete(id);
    return !!result;
  }

  async getServicesByCategory(category: ServiceCategory): Promise<SpaService[]> {
    const services = await SpaServiceModel.findByCategory(category);
    return services.map(s => s.toJSON());
  }

  async getPopularServices(limit = 10): Promise<SpaService[]> {
    const services = await SpaServiceModel.findPopular(limit);
    return services.map(s => s.toJSON());
  }

  async getFeaturedServices(limit = 10): Promise<SpaService[]> {
    const services = await SpaServiceModel.findFeatured(limit);
    return services.map(s => s.toJSON());
  }

  async getRelatedServices(serviceId: string, limit = 5): Promise<SpaService[]> {
    const service = await SpaServiceModel.findById(serviceId);
    if (!service) return [];

    const services = await SpaServiceModel.find({
      _id: { $ne: serviceId },
      category: service.category,
      status: 'active'
    }).limit(limit);

    return services.map(s => s.toJSON());
  }

  // Therapist Management
  async createTherapist(data: Partial<Therapist>): Promise<Therapist> {
    const therapist = new TherapistModel(data);
    await therapist.save();
    return therapist.toJSON();
  }

  async getTherapistById(id: string): Promise<Therapist | null> {
    const therapist = await TherapistModel.findById(id)
      .populate('services', 'name category duration price');
    return therapist?.toJSON() || null;
  }

  async getTherapists(filters: {
    specialty?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ therapists: Therapist[]; total: number }> {
    const {
      specialty,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const query: Record<string, unknown> = {};

    if (specialty) query.specialties = specialty;
    if (status) query.status = status;

    const [therapists, total] = await Promise.all([
      TherapistModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit),
      TherapistModel.countDocuments(query)
    ]);

    return {
      therapists: therapists.map(t => t.toJSON()),
      total
    };
  }

  async updateTherapist(id: string, data: Partial<Therapist>): Promise<Therapist | null> {
    const therapist = await TherapistModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    return therapist?.toJSON() || null;
  }

  async deleteTherapist(id: string): Promise<boolean> {
    const result = await TherapistModel.findByIdAndDelete(id);
    return !!result;
  }

  async getAvailableTherapists(): Promise<Therapist[]> {
    const therapists = await TherapistModel.findAvailable();
    return therapists.map(t => t.toJSON());
  }

  async getTherapistsBySpecialty(specialty: string): Promise<Therapist[]> {
    const therapists = await TherapistModel.findBySpecialty(specialty as any);
    return therapists.map(t => t.toJSON());
  }

  async getTherapistsByService(serviceId: string): Promise<Therapist[]> {
    const therapists = await TherapistModel.findByService(serviceId);
    return therapists.map(t => t.toJSON());
  }

  async updateTherapistStatus(id: string, status: string): Promise<Therapist | null> {
    const therapist = await TherapistModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    return therapist?.toJSON() || null;
  }

  async addServiceToTherapist(therapistId: string, serviceId: string): Promise<Therapist | null> {
    const therapist = await TherapistModel.findByIdAndUpdate(
      therapistId,
      { $addToSet: { services: serviceId } },
      { new: true }
    );

    // Also update the service to include this therapist
    await SpaServiceModel.findByIdAndUpdate(
      serviceId,
      { $addToSet: { therapists: therapistId } }
    );

    return therapist?.toJSON() || null;
  }

  async removeServiceFromTherapist(therapistId: string, serviceId: string): Promise<Therapist | null> {
    const therapist = await TherapistModel.findByIdAndUpdate(
      therapistId,
      { $pull: { services: serviceId } },
      { new: true }
    );

    // Also update the service to remove this therapist
    await SpaServiceModel.findByIdAndUpdate(
      serviceId,
      { $pull: { therapists: therapistId } }
    );

    return therapist?.toJSON() || null;
  }

  // Analytics
  async getServiceStats(serviceId: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    therapistCount: number;
  }> {
    const service = await SpaServiceModel.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    return {
      totalBookings: 0, // Would integrate with booking service
      totalRevenue: 0, // Would integrate with booking service
      averageRating: 0, // Would integrate with review service
      therapistCount: service.therapists.length
    };
  }

  async getTherapistStats(therapistId: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    servicesCount: number;
  }> {
    const therapist = await TherapistModel.findById(therapistId);
    if (!therapist) {
      throw new Error('Therapist not found');
    }

    return {
      totalBookings: 0, // Would integrate with booking service
      totalRevenue: 0, // Would integrate with booking service
      averageRating: therapist.rating,
      servicesCount: therapist.services.length
    };
  }
}

export const spaService = new SpaServiceService();
