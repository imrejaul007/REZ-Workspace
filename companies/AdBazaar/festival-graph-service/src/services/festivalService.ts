import { Festival, IFestival } from '../models/index.js';
import { logger } from '../config/logger.js';
import { CreateFestivalInput, UpdateFestivalInput } from './schemas.js';
import mongoose from 'mongoose';

export interface FestivalListResult {
  festivals: IFestival[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class FestivalService {
  async create(input: CreateFestivalInput): Promise<IFestival> {
    try {
      const festivalData = {
        ...input,
        date: new Date(input.date),
        endDate: input.endDate ? new Date(input.endDate as string) : undefined,
      };

      const festival = new Festival(festivalData);
      await festival.save();

      logger.info('Festival created', { festivalId: festival._id, name: festival.name });
      return festival;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create festival', { error: errorMessage, input });
      throw error;
    }
  }

  async getById(id: string): Promise<IFestival | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const festival = await Festival.findById(id).lean();
      return festival as IFestival | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get festival', { error: errorMessage, festivalId: id });
      throw error;
    }
  }

  async list(query: {
    page?: number;
    limit?: number;
    city?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    tags?: string;
  }): Promise<FestivalListResult> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};

      if (query.city) {
        filter['venue.city'] = new RegExp(query.city, 'i');
      }
      if (query.type) {
        filter.type = query.type;
      }
      if (query.status) {
        filter.status = query.status;
      }
      if (query.startDate || query.endDate) {
        filter.date = {};
        if (query.startDate) {
          (filter.date as Record<string, Date>).$gte = new Date(query.startDate);
        }
        if (query.endDate) {
          (filter.date as Record<string, Date>).$lte = new Date(query.endDate);
        }
      }
      if (query.tags) {
        const tagsArray = query.tags.split(',').map((t) => t.trim());
        filter.tags = { $all: tagsArray };
      }

      const [festivals, total] = await Promise.all([
        Festival.find(filter).sort({ date: 1 }).skip(skip).limit(limit).lean(),
        Festival.countDocuments(filter),
      ]);

      return {
        festivals: festivals as IFestival[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list festivals', { error: errorMessage, query });
      throw error;
    }
  }

  async update(id: string, input: UpdateFestivalInput): Promise<IFestival | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const updateData: Record<string, unknown> = { ...input };

      // Convert date strings to Date objects
      if (input.date) {
        updateData.date = new Date(input.date as string);
      }
      if (input.endDate) {
        updateData.endDate = new Date(input.endDate as string);
      }

      const festival = await Festival.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      if (festival) {
        logger.info('Festival updated', { festivalId: id });
      }

      return festival as IFestival | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update festival', { error: errorMessage, festivalId: id, input });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }

      const result = await Festival.findByIdAndDelete(id);

      if (result) {
        logger.info('Festival deleted', { festivalId: id });
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete festival', { error: errorMessage, festivalId: id });
      throw error;
    }
  }

  async getUpcoming(withinDays: number, options?: { city?: string; type?: string; page?: number; limit?: number }): Promise<FestivalListResult> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const skip = (page - 1) * limit;

      const now = new Date();
      const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

      const filter: Record<string, unknown> = {
        date: {
          $gte: now,
          $lte: futureDate,
        },
        status: { $nin: ['cancelled', 'completed'] },
      };

      if (options?.city) {
        filter['venue.city'] = new RegExp(options.city, 'i');
      }
      if (options?.type) {
        filter.type = options.type;
      }

      const [festivals, total] = await Promise.all([
        Festival.find(filter).sort({ date: 1 }).skip(skip).limit(limit).lean(),
        Festival.countDocuments(filter),
      ]);

      return {
        festivals: festivals as IFestival[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get upcoming festivals', { error: errorMessage, withinDays, options });
      throw error;
    }
  }

  async getByCity(city: string): Promise<IFestival[]> {
    try {
      const festivals = await Festival.find({
        'venue.city': new RegExp(city, 'i'),
        date: { $gte: new Date() },
        status: { $nin: ['cancelled', 'completed'] },
      })
        .sort({ date: 1 })
        .lean();

      return festivals as IFestival[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get festivals by city', { error: errorMessage, city });
      throw error;
    }
  }

  async updateStatus(id: string, status: IFestival['status']): Promise<IFestival | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const festival = await Festival.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
      ).lean();

      if (festival) {
        logger.info('Festival status updated', { festivalId: id, status });
      }

      return festival as IFestival | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update festival status', { error: errorMessage, festivalId: id, status });
      throw error;
    }
  }
}

export const festivalService = new FestivalService();