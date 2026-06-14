import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { TeamModel, ITeam, ITeamDocument } from '../models/team.model.js';
import logger from '../config/logger.js';
import { dbQueryDuration } from '../config/metrics.js';

export interface CreateTeamDto {
  eventId: string;
  name: string;
  logo?: string;
  fans?: number;
  ranking?: number;
  homeCity?: string;
  stats?: {
    wins?: number;
    losses?: number;
    draws?: number;
  };
  metadata?: Record<string, unknown>;
}

export class TeamService {
  async createTeam(data: CreateTeamDto): Promise<ITeamDocument> {
    const startTime = Date.now();

    try {
      const team = new TeamModel({
        ...data,
        eventId: new mongoose.Types.ObjectId(data.eventId)
      });
      await team.save();

      logger.info('Team created', { teamId: team._id, eventId: data.eventId, name: data.name });
      return team;
    } catch (error) {
      logger.error('Failed to create team', { error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'insert', collection: 'teams' }, (Date.now() - startTime) / 1000);
    }
  }

  async getTeamById(id: string): Promise<ITeamDocument | null> {
    const startTime = Date.now();

    try {
      return await TeamModel.findById(id).populate('players').lean();
    } catch (error) {
      logger.error('Failed to get team by ID', { id, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'findOne', collection: 'teams' }, (Date.now() - startTime) / 1000);
    }
  }

  async getTeamsByEventId(eventId: string): Promise<ITeamDocument[]> {
    const startTime = Date.now();

    try {
      return await TeamModel.find({ eventId: new mongoose.Types.ObjectId(eventId) })
        .sort({ ranking: 1, fans: -1 })
        .lean();
    } catch (error) {
      logger.error('Failed to get teams by event ID', { eventId, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'teams' }, (Date.now() - startTime) / 1000);
    }
  }

  async updateTeam(id: string, data: Partial<CreateTeamDto>): Promise<ITeamDocument | null> {
    const startTime = Date.now();

    try {
      const updateData = { ...data };
      if (data.eventId) {
        updateData.eventId = new mongoose.Types.ObjectId(data.eventId) as any;
      }

      return await TeamModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    } catch (error) {
      logger.error('Failed to update team', { id, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'updateOne', collection: 'teams' }, (Date.now() - startTime) / 1000);
    }
  }

  async deleteTeam(id: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const result = await TeamModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('Failed to delete team', { id, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'deleteOne', collection: 'teams' }, (Date.now() - startTime) / 1000);
    }
  }

  async getTopTeamsByFans(limit: number = 10): Promise<ITeamDocument[]> {
    const startTime = Date.now();

    try {
      return await TeamModel.find()
        .sort({ fans: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error('Failed to get top teams by fans', { error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'teams' }, (Date.now() - startTime) / 1000);
    }
  }

  async getTeamsByRanking(ranking: number): Promise<ITeamDocument[]> {
    const startTime = Date.now();

    try {
      return await TeamModel.find({ ranking: { $lte: ranking } })
        .sort({ ranking: 1 })
        .lean();
    } catch (error) {
      logger.error('Failed to get teams by ranking', { ranking, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'teams' }, (Date.now() - startTime) / 1000);
    }
  }
}

export const teamService = new TeamService();