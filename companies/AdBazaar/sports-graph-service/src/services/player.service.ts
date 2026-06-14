import mongoose from 'mongoose';
import { PlayerModel, IPlayer, IPlayerDocument } from '../models/player.model.js';
import logger from '../config/logger.js';
import { dbQueryDuration } from '../config/metrics.js';

export interface CreatePlayerDto {
  eventId: string;
  teamId: string;
  name: string;
  position?: string;
  jerseyNumber?: number;
  stats?: {
    matches?: number;
    goals?: number;
    assists?: number;
    points?: number;
    rebounds?: number;
    wickets?: number;
    runs?: number;
  };
  nationality?: string;
  age?: number;
  metadata?: Record<string, unknown>;
}

export class PlayerService {
  async createPlayer(data: CreatePlayerDto): Promise<IPlayerDocument> {
    const startTime = Date.now();

    try {
      const player = new PlayerModel({
        ...data,
        eventId: new mongoose.Types.ObjectId(data.eventId),
        teamId: new mongoose.Types.ObjectId(data.teamId)
      });
      await player.save();

      logger.info('Player created', { playerId: player._id, name: data.name });
      return player;
    } catch (error) {
      logger.error('Failed to create player', { error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'insert', collection: 'players' }, (Date.now() - startTime) / 1000);
    }
  }

  async createPlayers(data: CreatePlayerDto[]): Promise<IPlayerDocument[]> {
    const startTime = Date.now();

    try {
      const players = await PlayerModel.insertMany(data.map(p => ({
        ...p,
        eventId: new mongoose.Types.ObjectId(p.eventId),
        teamId: new mongoose.Types.ObjectId(p.teamId)
      })));

      logger.info('Players created', { count: players.length });
      return players as unknown as IPlayerDocument[];
    } catch (error) {
      logger.error('Failed to create players', { error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'insertMany', collection: 'players' }, (Date.now() - startTime) / 1000);
    }
  }

  async getPlayerById(id: string): Promise<IPlayerDocument | null> {
    const startTime = Date.now();

    try {
      return await PlayerModel.findById(id).lean();
    } catch (error) {
      logger.error('Failed to get player by ID', { id, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'findOne', collection: 'players' }, (Date.now() - startTime) / 1000);
    }
  }

  async getPlayersByEventId(eventId: string): Promise<IPlayerDocument[]> {
    const startTime = Date.now();

    try {
      return await PlayerModel.find({ eventId: new mongoose.Types.ObjectId(eventId) })
        .populate('teamId', 'name logo')
        .sort({ name: 1 })
        .lean();
    } catch (error) {
      logger.error('Failed to get players by event ID', { eventId, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'players' }, (Date.now() - startTime) / 1000);
    }
  }

  async getPlayersByTeamId(teamId: string): Promise<IPlayerDocument[]> {
    const startTime = Date.now();

    try {
      return await PlayerModel.find({ teamId: new mongoose.Types.ObjectId(teamId) })
        .sort({ jerseyNumber: 1 })
        .lean();
    } catch (error) {
      logger.error('Failed to get players by team ID', { teamId, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'players' }, (Date.now() - startTime) / 1000);
    }
  }

  async updatePlayer(id: string, data: Partial<CreatePlayerDto>): Promise<IPlayerDocument | null> {
    const startTime = Date.now();

    try {
      const updateData = { ...data };
      if (data.eventId) {
        updateData.eventId = new mongoose.Types.ObjectId(data.eventId) as any;
      }
      if (data.teamId) {
        updateData.teamId = new mongoose.Types.ObjectId(data.teamId) as any;
      }

      return await PlayerModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    } catch (error) {
      logger.error('Failed to update player', { id, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'updateOne', collection: 'players' }, (Date.now() - startTime) / 1000);
    }
  }

  async deletePlayer(id: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const result = await PlayerModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('Failed to delete player', { id, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'deleteOne', collection: 'players' }, (Date.now() - startTime) / 1000);
    }
  }

  async searchPlayers(query: string): Promise<IPlayerDocument[]> {
    const startTime = Date.now();

    try {
      return await PlayerModel.find({
        $text: { $search: query }
      })
        .sort({ score: { $meta: 'textScore' } })
        .limit(50)
        .lean();
    } catch (error) {
      logger.error('Failed to search players', { query, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'players' }, (Date.now() - startTime) / 1000);
    }
  }

  async getPlayersByPosition(position: string): Promise<IPlayerDocument[]> {
    const startTime = Date.now();

    try {
      return await PlayerModel.find({ position })
        .sort({ name: 1 })
        .lean();
    } catch (error) {
      logger.error('Failed to get players by position', { position, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'players' }, (Date.now() - startTime) / 1000);
    }
  }
}

export const playerService = new PlayerService();