import mongoose, { Schema, Document, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Itinerary, ItineraryItem } from '../types';
import { logger } from '../utils/errors';

interface IItinerary extends Omit<Itinerary, 'id'>, Document {}

const ItineraryItemSchema = new Schema({
  type: { type: String, enum: ['flight', 'hotel', 'transfer', 'lounge', 'activity', 'restaurant'], required: true },
  title: { type: String, required: true },
  description: String,
  date: { type: String, required: true },
  time: String,
  location: String,
  bookingId: String,
  confirmationCode: String,
  status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'pending' },
  metadata: mongoose.Schema.Types.Mixed
}, { _id: true });

const ReminderSchema = new Schema({
  date: { type: String, required: true },
  message: { type: String, required: true },
  sent: { type: Boolean, default: false }
}, { _id: true });

const ItinerarySchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: String,
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  items: [ItineraryItemSchema],
  status: { type: String, enum: ['planning', 'confirmed', 'completed', 'cancelled'], default: 'planning' },
  sharedWith: [String],
  reminders: [ReminderSchema],
  notes: String
}, { timestamps: true });

export const ItineraryModel = model<IItinerary>('Itinerary', ItinerarySchema);

export class ItineraryService {
  async createItinerary(userId: string, title: string, startDate: string, endDate: string, description?: string): Promise<Itinerary> {
    logger.info('Creating itinerary', { userId, title });
    const itinerary = new ItineraryModel({ userId, title, startDate, endDate, description, items: [], status: 'planning', sharedWith: [], reminders: [] });
    await itinerary.save();
    return this.toResponse(itinerary);
  }

  async getItineraryById(id: string, userId?: string): Promise<Itinerary | null> {
    const query: Record<string, string> = { _id: id };
    if (userId) query.userId = userId;
    const itinerary = await ItineraryModel.findOne(query);
    return itinerary ? this.toResponse(itinerary) : null;
  }

  async getUserItineraries(userId: string, options: { page?: number; limit?: number; status?: string } = {}): Promise<{ itineraries: Itinerary[]; total: number }> {
    const page = options.page || 1, limit = options.limit || 20;
    const query: Record<string, unknown> = { userId };
    if (options.status) query.status = options.status;
    const [itineraries, total] = await Promise.all([
      ItineraryModel.find(query).sort({ startDate: -1 }).skip((page - 1) * limit).limit(limit),
      ItineraryModel.countDocuments(query)
    ]);
    return { itineraries: itineraries.map(i => this.toResponse(i)), total };
  }

  async addItem(itineraryId: string, item: Omit<ItineraryItem, 'id'>): Promise<Itinerary | null> {
    const itinerary = await ItineraryModel.findById(itineraryId);
    if (!itinerary) return null;
    itinerary.items.push({ ...item, id: uuidv4() } as any);
    await itinerary.save();
    return this.toResponse(itinerary);
  }

  async updateItem(itineraryId: string, itemId: string, updates: Partial<ItineraryItem>): Promise<Itinerary | null> {
    const itinerary = await ItineraryModel.findById(itineraryId);
    if (!itinerary) return null;
    const item = itinerary.items.find(i => i._id?.toString() === itemId);
    if (!item) return null;
    Object.assign(item, updates);
    await itinerary.save();
    return this.toResponse(itinerary);
  }

  async removeItem(itineraryId: string, itemId: string): Promise<Itinerary | null> {
    const itinerary = await ItineraryModel.findById(itineraryId);
    if (!itinerary) return null;
    itinerary.items = itinerary.items.filter(i => i._id?.toString() !== itemId);
    await itinerary.save();
    return this.toResponse(itinerary);
  }

  async shareItinerary(itineraryId: string, emails: string[]): Promise<Itinerary | null> {
    const itinerary = await ItineraryModel.findByIdAndUpdate(itineraryId, { $addToSet: { sharedWith: { $each: emails } } }, { new: true });
    return itinerary ? this.toResponse(itinerary) : null;
  }

  async addReminder(itineraryId: string, date: string, message: string): Promise<Itinerary | null> {
    const itinerary = await ItineraryModel.findById(itineraryId);
    if (!itinerary) return null;
    itinerary.reminders.push({ id: uuidv4(), date, message, sent: false } as any);
    await itinerary.save();
    return this.toResponse(itinerary);
  }

  async deleteItinerary(id: string, userId: string): Promise<boolean> {
    const result = await ItineraryModel.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }

  private toResponse(doc: IItinerary): Itinerary {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      title: doc.title,
      description: doc.description,
      startDate: doc.startDate,
      endDate: doc.endDate,
      items: doc.items.map(i => ({ id: i._id?.toString() || uuidv4(), ...i.toObject() })) as ItineraryItem[],
      status: doc.status as any,
      sharedWith: doc.sharedWith,
      reminders: doc.reminders.map(r => ({ id: r._id?.toString() || uuidv4(), ...r.toObject() })) as any,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
}

export const itineraryService = new ItineraryService();
export default itineraryService;