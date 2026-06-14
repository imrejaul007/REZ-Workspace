import { Speaker, ISpeakerDocument } from '../models';
import { AddSpeakerRequest } from '../types';
import { logger, cacheGet, cacheSet, CACHE_TTL, dbOperationDuration } from '../utils';
import { speakersAdded } from '../utils/metrics';

export class SpeakerService {
  /**
   * Add a speaker to a conference
   */
  async addSpeaker(conferenceId: string, data: AddSpeakerRequest): Promise<ISpeakerDocument> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'insert', collection: 'speakers' });

    try {
      const speaker = new Speaker({
        conferenceId,
        ...data,
        sessions: []
      });

      await speaker.save();

      speakersAdded.inc({ conference_id: conferenceId });
      logger.info('Speaker added to conference', { conferenceId, speakerId: speaker._id, name: speaker.name });

      return speaker;
    } catch (error) {
      logger.error('Error adding speaker', { conferenceId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      startTimer();
    }
  }

  /**
   * Get speakers by conference ID
   */
  async getByConference(conferenceId: string): Promise<ISpeakerDocument[]> {
    const cacheKey = `speakers:conference:${conferenceId}`;

    try {
      const cached = await cacheGet(cacheKey, 'speakers');
      if (cached) {
        return JSON.parse(cached);
      }

      const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'speakers' });
      const speakers = await Speaker.find({ conferenceId })
        .sort({ name: 1 })
        .lean();
      startTimer();

      await cacheSet(cacheKey, JSON.stringify(speakers), CACHE_TTL.SPEAKERS);

      return speakers as ISpeakerDocument[];
    } catch (error) {
      logger.error('Error getting speakers', { conferenceId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get speaker by ID
   */
  async getById(id: string): Promise<ISpeakerDocument | null> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'findOne', collection: 'speakers' });
    const speaker = await Speaker.findById(id).lean();
    startTimer();

    return speaker as ISpeakerDocument | null;
  }

  /**
   * Update speaker
   */
  async update(id: string, data: Partial<AddSpeakerRequest>): Promise<ISpeakerDocument | null> {
    try {
      const startTimer = dbOperationDuration.startTimer({ operation: 'updateOne', collection: 'speakers' });
      const speaker = await Speaker.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).lean();
      startTimer();

      if (speaker) {
        logger.info('Speaker updated', { speakerId: id });
      }

      return speaker as ISpeakerDocument | null;
    } catch (error) {
      logger.error('Error updating speaker', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Delete speaker
   */
  async delete(id: string): Promise<boolean> {
    try {
      const startTimer = dbOperationDuration.startTimer({ operation: 'deleteOne', collection: 'speakers' });
      const result = await Speaker.findByIdAndDelete(id);
      startTimer();

      if (result) {
        logger.info('Speaker deleted', { speakerId: id });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting speaker', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get top speakers by influence (followers)
   */
  async getTopSpeakers(conferenceId: string, limit: number = 10): Promise<ISpeakerDocument[]> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'speakers' });
    const speakers = await Speaker.find({ conferenceId })
      .sort({ 'followers.linkedin': -1, 'followers.twitter': -1 })
      .limit(limit)
      .lean();
    startTimer();

    return speakers as ISpeakerDocument[];
  }

  /**
   * Get top rated speakers
   */
  async getTopRatedSpeakers(conferenceId: string, limit: number = 10): Promise<ISpeakerDocument[]> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'speakers' });
    const speakers = await Speaker.find({ conferenceId, rating: { $gt: 0 } })
      .sort({ rating: -1 })
      .limit(limit)
      .lean();
    startTimer();

    return speakers as ISpeakerDocument[];
  }

  /**
   * Search speakers by expertise
   */
  async searchByExpertise(expertise: string[], conferenceId?: string): Promise<ISpeakerDocument[]> {
    const query: Record<string, unknown> = { expertise: { $in: expertise } };
    if (conferenceId) query.conferenceId = conferenceId;

    const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'speakers' });
    const speakers = await Speaker.find(query).lean();
    startTimer();

    return speakers as ISpeakerDocument[];
  }

  /**
   * Update speaker rating
   */
  async updateRating(id: string, rating: number): Promise<ISpeakerDocument | null> {
    try {
      const startTimer = dbOperationDuration.startTimer({ operation: 'updateOne', collection: 'speakers' });
      const speaker = await Speaker.findByIdAndUpdate(
        id,
        {
          $set: { rating },
          $inc: { 'sessions': 0 } // Trigger update
        },
        { new: true }
      ).lean();
      startTimer();

      return speaker as ISpeakerDocument | null;
    } catch (error) {
      logger.error('Error updating speaker rating', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Add session to speaker
   */
  async addSession(speakerId: string, sessionId: string): Promise<void> {
    try {
      await Speaker.findByIdAndUpdate(speakerId, {
        $addToSet: { sessions: sessionId }
      });
      logger.debug('Session added to speaker', { speakerId, sessionId });
    } catch (error) {
      logger.error('Error adding session to speaker', { speakerId, sessionId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
}

export const speakerService = new SpeakerService();
