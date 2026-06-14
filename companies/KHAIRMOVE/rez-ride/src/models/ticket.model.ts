import mongoose from 'mongoose';

export interface ITicket extends mongoose.Document {
  ticketId: string;
  userId: string;
  rideId?: string;
  type: 'complaint' | 'refund' | 'feedback' | 'lost_found' | 'safety' | 'billing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  subject: string;
  description: string;
  assignedTo?: string;
  messages: TicketMessage[];
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface TicketMessage {
  id?: string;
  sender: 'user' | 'agent';
  text: string;
  attachments?: string[];
  createdAt: Date;
}

export interface TicketResponse {
  id: string;
  userId: string;
  rideId?: string;
  type: string;
  subject: string;
  priority: string;
  status: string;
}

const TicketMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'agent'], required: true },
  text: { type: String, required: true },
  attachments: [String],
}, { timestamps: true });

const TicketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  userId: { type: String, required: true, index: true },
  rideId: String,
  type: { type: String, enum: ['complaint', 'refund', 'feedback', 'lost_found', 'safety', 'billing'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'pending', 'resolved', 'closed'], default: 'open', index: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: String,
  messages: [TicketMessageSchema],
  resolution: String,
  resolvedAt: Date,
}, { timestamps: true });

TicketSchema.index({ userId: 1, status: 1 });
TicketSchema.index({ type: 1, createdAt: -1 });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);

// Type alias for TypeScript
export type Ticket = ITicket;
