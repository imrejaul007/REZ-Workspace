import mongoose, { Schema, Document } from 'mongoose';
import type { TicketStatus, TicketPriority, TicketCategory, TicketSource, TicketComment, TicketAttachment } from '../types/index.js';

export interface ITicket extends Document {
  ticketId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  companyId: string;
  department?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  source: TicketSource;
  subject: string;
  description: string;
  attachments: TicketAttachment[];
  comments: TicketComment[];
  assignedTo?: string;
  assignedToName?: string;
  resolution?: string;
  slaDeadline?: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  tags: string[];
  metadata?: Record<string, unknown>;
  satisfactionRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TicketAttachmentSchema = new Schema(
  {
    id: { type: String, required: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TicketCommentSchema = new Schema(
  {
    id: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, enum: ['employee', 'agent', 'bot'], required: true },
    content: { type: String, required: true },
    attachments: [TicketAttachmentSchema],
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    department: { type: String },
    category: {
      type: String,
      enum: ['benefits', 'enrollment', 'claims', 'payroll', 'hr_policy', 'technical', 'feedback', 'other'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent', 'critical'],
      default: 'normal',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'pending_customer', 'resolved', 'closed', 'escalated'],
      default: 'open',
      index: true,
    },
    source: {
      type: String,
      enum: ['app', 'chat', 'whatsapp', 'email', 'phone', 'chatbot'],
      default: 'app',
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    attachments: [TicketAttachmentSchema],
    comments: [TicketCommentSchema],
    assignedTo: { type: String, index: true },
    assignedToName: { type: String },
    resolution: { type: String },
    slaDeadline: { type: Date },
    firstResponseAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    tags: [String],
    metadata: { type: Schema.Types.Mixed },
    satisfactionRating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

TicketSchema.index({ employeeId: 1, companyId: 1 });
TicketSchema.index({ status: 1, updatedAt: -1 });
TicketSchema.index({ companyId: 1, status: 1, category: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
