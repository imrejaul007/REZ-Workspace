import { Session, ISessionDocument, Speaker } from '../models';
import { AddSessionRequest } from '../types';
import { logger, cacheGet, cacheSet, CACHE_TTL, dbOperationDuration } from '../utils';
import { sessionsCreated } from '../utils/metrics';
import { speakerService } from './speakerService';

export class SessionService {
  /**
   * Add a session to a conference
   */
  async addSession(conferenceId: string, data: AddSessionRequest): Promise<ISessionDocument> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'insert', collection: 'sessions' });

    try {
      const session = new Session({
        conferenceId,
        ...data,
        date: new Date(data.date),
        registeredCount: 0,
        feedback: {
          rating: 0,
          count: 0
        }
      });

      await session.save();

      // Update speakers with session reference
      for (const speakerId of data.speakerIds) {
        await speakerService.addSession(speakerId, session._id.toString());
      }

      sessionsCreated.inc({ conference_id: conferenceId, type: data.type });
      logger.info('Session added to conference', { conferenceId, sessionId: session._id, title: session.title });

      return session;
    } catch (error) {
      logger.error('Error adding session', { conferenceId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      startTimer();
    }
  }

  /**
   * Get sessions by conference ID
   */
  async getByConference(conferenceId: string): Promise<ISessionDocument[]> {
    const cacheKey = `sessions:conference:${conferenceId}`;

    try {
      const cached = await cacheGet(cacheKey, 'sessions');
      if (cached) {
        return JSON.parse(cached);
      }

      const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'sessions' });
      const sessions = await Session.find({ conferenceId })
        .populate('speakerIds')
        .sort({ date: 1, startTime: 1 })
        .lean();
      startTimer();

      await cacheSet(cacheKey, JSON.stringify(sessions), CACHE_TTL.SESSIONS);

      return sessions as ISessionDocument[];
    } catch (error) {
      logger.error('Error getting sessions', { conferenceId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getById(id: string): Promise<ISessionDocument | null> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'findOne', collection: 'sessions' });
    const session = await Session.findById(id)
      .populate('speakerIds')
      .lean();
    startTimer();

    return session as ISessionDocument | null;
  }

  /**
   * Update session
   */
  async update(id: string, data: Partial<AddSessionRequest>): Promise<ISessionDocument | null> {
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (data.date) {
        updateData.date = new Date(data.date);
      }

      const startTimer = dbOperationDuration.startTimer({ operation: 'updateOne', collection: 'sessions' });
      const session = await Session.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('speakerIds').lean();
      startTimer();

      if (session) {
        logger.info('Session updated', { sessionId: id });
      }

      return session as ISessionDocument | null;
    } catch (error) {
      logger.error('Error updating session', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Delete session
   */
  async delete(id: string): Promise<boolean> {
    try {
      const startTimer = dbOperationDuration.startTimer({ operation: 'deleteOne', collection: 'sessions' });
      const result = await Session.findByIdAndDelete(id);
      startTimer();

      if (result) {
        logger.info('Session deleted', { sessionId: id });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting session', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get sessions by type
   */
  async getByType(conferenceId: string, type: string): Promise<ISessionDocument[]> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'sessions' });
    const sessions = await Session.find({ conferenceId, type })
      .populate('speakerIds')
      .sort({ date: 1, startTime: 1 })
      .lean();
    startTimer();

    return sessions as ISessionDocument[];
  }

  /**
   * Get sessions by room
   */
  async getByRoom(conferenceId: string, room: string): Promise<ISessionDocument[]> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'sessions' });
    const sessions = await Session.find({ conferenceId, room })
      .populate('speakerIds')
      .sort({ date: 1, startTime: 1 })
      .lean();
    startTimer();

    return sessions as ISessionDocument[];
  }

  /**
   * Get top rated sessions
   */
  async getTopRated(conferenceId: string, limit: number = 10): Promise<ISessionDocument[]> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'find', collection: 'sessions' });
    const sessions = await Session.find({ conferenceId, 'feedback.count': { $gt: 0 } })
      .populate('speakerIds')
      .sort({ 'feedback.rating': -1 })
      .limit(limit)
      .lean();
    startTimer();

    return sessions as ISessionDocument[];
  }

  /**
   * Update session registration count
   */
  async updateRegistrationCount(id: string, increment: number = 1): Promise<void> {
    try {
      await Session.findByIdAndUpdate(id, {
        $inc: { registeredCount: increment }
      });
      logger.debug('Session registration count updated', { sessionId: id, increment });
    } catch (error) {
      logger.error('Error updating session registration count', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Update session feedback
   */
  async updateFeedback(id: string, rating: number): Promise<void> {
    try {
      const session = await Session.findById(id);
      if (!session) return;

      const currentRating = session.feedback.rating;
      const currentCount = session.feedback.count;
      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + rating) / newCount;

      await Session.findByIdAndUpdate(id, {
        $set: {
          'feedback.rating': newRating,
          'feedback.count': newCount
        }
      });

      logger.debug('Session feedback updated', { sessionId: id, newRating, newCount });
    } catch (error) {
      logger.error('Error updating session feedback', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Add materials to session
   */
  async addMaterials(id: string, materials: Array<{ name: string; url: string; type: string }>): Promise<void> {
    try {
      await Session.findByIdAndUpdate(id, {
        $push: { materials: { $each: materials } }
      });
      logger.debug('Materials added to session', { sessionId: id, count: materials.length });
    } catch (error) {
      logger.error('Error adding materials to session', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
}

export const sessionService = new SessionService();
