import mongoose, { Document, Schema } from 'mongoose';

export interface IClientNote extends Document {
  _id: mongoose.Types.ObjectId;
  noteId: string;
  clientId: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  content: string;
  type: 'general' | 'meeting' | 'strategy' | 'issue' | 'update';
  isPinned: boolean;
  tags: string[];
  attachments: {
    name: string;
    url: string;
    type: string;
  }[];
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ClientNoteSchema = new Schema<IClientNote>(
  {
    noteId: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, required: true, index: true },
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['general', 'meeting', 'strategy', 'issue', 'update'],
      default: 'general',
      index: true,
    },
    isPinned: { type: Boolean, default: false },
    tags: [{ type: String }],
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
      },
    ],
    mentions: [{ type: String }],
  },
  { timestamps: true }
);

// Indexes
ClientNoteSchema.index({ clientId: 1, createdAt: -1 });
ClientNoteSchema.index({ clientId: 1, type: 1 });
ClientNoteSchema.index({ clientId: 1, isPinned: -1 });
ClientNoteSchema.index({ content: 'text' });

export const ClientNote = mongoose.model<IClientNote>('ClientNote', ClientNoteSchema);