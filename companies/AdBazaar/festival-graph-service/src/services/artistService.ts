import { Artist, IArtist } from '../models/index.js';
import { logger } from '../config/logger.js';
import { AddArtistInput } from './schemas.js';
import mongoose from 'mongoose';

export interface ArtistListResult {
  artists: IArtist[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ArtistService {
  async addToFestival(festivalId: string, input: AddArtistInput): Promise<IArtist> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const artistData = {
        ...input,
        festivalId: new mongoose.Types.ObjectId(festivalId),
        performanceTime: input.performanceTime
          ? {
              start: new Date(input.performanceTime.start as string),
              end: input.performanceTime.end ? new Date(input.performanceTime.end as string) : undefined,
            }
          : undefined,
      };

      const artist = new Artist(artistData);
      await artist.save();

      logger.info('Artist added to festival', {
        artistId: artist._id,
        festivalId,
        name: artist.name,
      });

      return artist;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to add artist to festival', {
        error: errorMessage,
        festivalId,
        input,
      });
      throw error;
    }
  }

  async getByFestival(festivalId: string, options?: { page?: number; limit?: number; genre?: string }): Promise<ArtistListResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {
        festivalId: new mongoose.Types.ObjectId(festivalId),
      };

      if (options?.genre) {
        filter.genre = { $in: [options.genre] };
      }

      const [artists, total] = await Promise.all([
        Artist.find(filter).sort({ popularity: -1, name: 1 }).skip(skip).limit(limit).lean(),
        Artist.countDocuments(filter),
      ]);

      return {
        artists: artists as IArtist[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get artists by festival', { error: errorMessage, festivalId, options });
      throw error;
    }
  }

  async getById(id: string): Promise<IArtist | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const artist = await Artist.findById(id).lean();
      return artist as IArtist | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get artist', { error: errorMessage, artistId: id });
      throw error;
    }
  }

  async update(id: string, input: Partial<AddArtistInput>): Promise<IArtist | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const updateData: Record<string, unknown> = { ...input };

      // Convert performance time dates
      if (input.performanceTime) {
        updateData.performanceTime = {
          start: new Date(input.performanceTime.start as string),
          end: input.performanceTime.end ? new Date(input.performanceTime.end as string) : undefined,
        };
      }

      const artist = await Artist.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      if (artist) {
        logger.info('Artist updated', { artistId: id });
      }

      return artist as IArtist | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update artist', { error: errorMessage, artistId: id, input });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }

      const result = await Artist.findByIdAndDelete(id);

      if (result) {
        logger.info('Artist deleted', { artistId: id });
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete artist', { error: errorMessage, artistId: id });
      throw error;
    }
  }

  async getTopArtists(festivalId: string, limit: number = 10): Promise<IArtist[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const artists = await Artist.find({
        festivalId: new mongoose.Types.ObjectId(festivalId),
      })
        .sort({ popularity: -1 })
        .limit(limit)
        .lean();

      return artists as IArtist[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get top artists', { error: errorMessage, festivalId, limit });
      throw error;
    }
  }

  async getByGenre(festivalId: string, genre: string): Promise<IArtist[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const artists = await Artist.find({
        festivalId: new mongoose.Types.ObjectId(festivalId),
        genre: { $in: [genre] },
      })
        .sort({ popularity: -1 })
        .lean();

      return artists as IArtist[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get artists by genre', { error: errorMessage, festivalId, genre });
      throw error;
    }
  }

  async updatePopularity(id: string, popularity: number): Promise<IArtist | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const artist = await Artist.findByIdAndUpdate(
        id,
        { $set: { popularity: Math.min(100, Math.max(0, popularity)) } },
        { new: true, runValidators: true }
      ).lean();

      if (artist) {
        logger.info('Artist popularity updated', { artistId: id, popularity });
      }

      return artist as IArtist | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update artist popularity', { error: errorMessage, artistId: id, popularity });
      throw error;
    }
  }
}

export const artistService = new ArtistService();