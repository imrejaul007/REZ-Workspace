import { v4 as uuidv4 } from 'uuid';
import { ClientNote, IClientNote } from '../models';
import { logger } from '../utils';
import { ClientNoteInfo } from '../types';

export class NoteService {
  /**
   * Create a new note for a client
   */
  async createNote(data: {
    clientId: string;
    author: {
      id: string;
      name: string;
      role: string;
    };
    content: string;
    type?: 'general' | 'meeting' | 'strategy' | 'issue' | 'update';
    isPinned?: boolean;
    tags?: string[];
    attachments?: {
      name: string;
      url: string;
      type: string;
    }[];
    mentions?: string[];
  }): Promise<ClientNoteInfo> {
    try {
      const noteId = `note_${uuidv4()}`;

      const note = new ClientNote({
        noteId,
        clientId: data.clientId,
        author: data.author,
        content: data.content,
        type: data.type || 'general',
        isPinned: data.isPinned || false,
        tags: data.tags || [],
        attachments: data.attachments || [],
        mentions: data.mentions || [],
      });

      await note.save();

      logger.info('Note created', {
        noteId,
        clientId: data.clientId,
        authorId: data.author.id,
        type: data.type,
      });

      return this.formatNote(note);
    } catch (error) {
      logger.error('Failed to create note', { error, data });
      throw error;
    }
  }

  /**
   * Get note by ID
   */
  async getNote(noteId: string): Promise<ClientNoteInfo | null> {
    try {
      const note = await ClientNote.findOne({ noteId });

      if (!note) {
        logger.warn('Note not found', { noteId });
        return null;
      }

      return this.formatNote(note);
    } catch (error) {
      logger.error('Failed to get note', { error, noteId });
      throw error;
    }
  }

  /**
   * Get all notes for a client
   */
  async getClientNotes(
    clientId: string,
    options?: {
      type?: string;
      page?: number;
      limit?: number;
      includePinned?: boolean;
    }
  ): Promise<{ notes: ClientNoteInfo[]; total: number; pinnedCount: number }> {
    try {
      const filter: any = { clientId };

      if (options?.type) {
        filter.type = options.type;
      }

      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const skip = (page - 1) * limit;

      // Get pinned notes separately
      const pinnedNotes = await ClientNote.find({ clientId, isPinned: true })
        .sort({ createdAt: -1 })
        .lean();

      // Get non-pinned notes
      const query = ClientNote.find({ ...filter, isPinned: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const [notes, total, pinnedCount] = await Promise.all([
        query,
        ClientNote.countDocuments(filter),
        ClientNote.countDocuments({ clientId, isPinned: true }),
      ]);

      // Combine pinned and regular notes
      const allNotes = [
        ...pinnedNotes.map(n => this.formatNote(n as IClientNote)),
        ...notes.map(n => this.formatNote(n as IClientNote)),
      ];

      return {
        notes: allNotes,
        total: total + pinnedCount,
        pinnedCount,
      };
    } catch (error) {
      logger.error('Failed to get client notes', { error, clientId });
      throw error;
    }
  }

  /**
   * Update a note
   */
  async updateNote(
    noteId: string,
    data: {
      content?: string;
      type?: 'general' | 'meeting' | 'strategy' | 'issue' | 'update';
      isPinned?: boolean;
      tags?: string[];
      attachments?: {
        name: string;
        url: string;
        type: string;
      }[];
      mentions?: string[];
    }
  ): Promise<ClientNoteInfo | null> {
    try {
      const note = await ClientNote.findOne({ noteId });

      if (!note) {
        logger.warn('Note not found for update', { noteId });
        return null;
      }

      if (data.content !== undefined) note.content = data.content;
      if (data.type !== undefined) note.type = data.type;
      if (data.isPinned !== undefined) note.isPinned = data.isPinned;
      if (data.tags !== undefined) note.tags = data.tags;
      if (data.attachments !== undefined) note.attachments = data.attachments;
      if (data.mentions !== undefined) note.mentions = data.mentions;

      await note.save();

      logger.info('Note updated', { noteId, updates: Object.keys(data) });

      return this.formatNote(note);
    } catch (error) {
      logger.error('Failed to update note', { error, noteId });
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<boolean> {
    try {
      const note = await ClientNote.findOneAndDelete({ noteId });

      if (!note) {
        return false;
      }

      logger.info('Note deleted', { noteId });
      return true;
    } catch (error) {
      logger.error('Failed to delete note', { error, noteId });
      throw error;
    }
  }

  /**
   * Search notes
   */
  async searchNotes(
    query: string,
    options?: { clientId?: string; type?: string; limit?: number }
  ): Promise<ClientNoteInfo[]> {
    try {
      const filter: any = {
        $or: [
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
        ],
      };

      if (options?.clientId) {
        filter.clientId = options.clientId;
      }

      if (options?.type) {
        filter.type = options.type;
      }

      const notes = await ClientNote.find(filter)
        .sort({ createdAt: -1 })
        .limit(options?.limit || 20)
        .lean();

      return notes.map(n => this.formatNote(n as IClientNote));
    } catch (error) {
      logger.error('Failed to search notes', { error, query });
      throw error;
    }
  }

  /**
   * Get notes by author
   */
  async getNotesByAuthor(
    authorId: string,
    options?: { clientId?: string; page?: number; limit?: number }
  ): Promise<{ notes: ClientNoteInfo[]; total: number }> {
    try {
      const filter: any = { 'author.id': authorId };

      if (options?.clientId) {
        filter.clientId = options.clientId;
      }

      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const skip = (page - 1) * limit;

      const [notes, total] = await Promise.all([
        ClientNote.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ClientNote.countDocuments(filter),
      ]);

      return {
        notes: notes.map(n => this.formatNote(n as IClientNote)),
        total,
      };
    } catch (error) {
      logger.error('Failed to get notes by author', { error, authorId });
      throw error;
    }
  }

  /**
   * Get recent notes across all clients for an agency
   */
  async getRecentNotes(
    agencyId: string,
    options?: { limit?: number; type?: string }
  ): Promise<ClientNoteInfo[]> {
    try {
      // In a real system, we'd filter by agency through client lookup
      // For now, return recent notes from all clients
      const filter: any = {};

      if (options?.type) {
        filter.type = options.type;
      }

      const notes = await ClientNote.find(filter)
        .sort({ createdAt: -1 })
        .limit(options?.limit || 20)
        .lean();

      return notes.map(n => this.formatNote(n as IClientNote));
    } catch (error) {
      logger.error('Failed to get recent notes', { error });
      throw error;
    }
  }

  /**
   * Get note statistics for a client
   */
  async getNoteStats(clientId: string): Promise<any> {
    try {
      const [total, byType, pinned, recent] = await Promise.all([
        ClientNote.countDocuments({ clientId }),
        ClientNote.aggregate([
          { $match: { clientId } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        ClientNote.countDocuments({ clientId, isPinned: true }),
        ClientNote.findOne({ clientId }).sort({ createdAt: -1 }),
      ]);

      const typeBreakdown: Record<string, number> = {};
      byType.forEach((item: any) => {
        typeBreakdown[item._id] = item.count;
      });

      return {
        total,
        pinned: pinned,
        byType: typeBreakdown,
        lastNote: recent ? this.formatNote(recent) : null,
      };
    } catch (error) {
      logger.error('Failed to get note stats', { error, clientId });
      throw error;
    }
  }

  /**
   * Add attachment to note
   */
  async addAttachment(
    noteId: string,
    attachment: { name: string; url: string; type: string }
  ): Promise<ClientNoteInfo | null> {
    try {
      const note = await ClientNote.findOne({ noteId });

      if (!note) {
        return null;
      }

      note.attachments.push(attachment);
      await note.save();

      logger.info('Attachment added to note', { noteId, attachmentName: attachment.name });

      return this.formatNote(note);
    } catch (error) {
      logger.error('Failed to add attachment', { error, noteId });
      throw error;
    }
  }

  /**
   * Remove attachment from note
   */
  async removeAttachment(
    noteId: string,
    attachmentIndex: number
  ): Promise<ClientNoteInfo | null> {
    try {
      const note = await ClientNote.findOne({ noteId });

      if (!note) {
        return null;
      }

      if (attachmentIndex >= 0 && attachmentIndex < note.attachments.length) {
        note.attachments.splice(attachmentIndex, 1);
        await note.save();
      }

      return this.formatNote(note);
    } catch (error) {
      logger.error('Failed to remove attachment', { error, noteId });
      throw error;
    }
  }

  /**
   * Format note document
   */
  private formatNote(note: any): ClientNoteInfo {
    return {
      noteId: note.noteId,
      clientId: note.clientId,
      author: note.author,
      content: note.content,
      type: note.type,
      isPinned: note.isPinned,
      tags: note.tags || [],
      attachments: note.attachments || [],
      mentions: note.mentions || [],
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}

export const noteService = new NoteService();
export default noteService;