import mongoose, { Schema, Document } from 'mongoose';

export interface IWhatsAppSession {
  sessionId: string;
  name: string;
  industry: string;
  status: 'pending' | 'authenticated' | 'disconnected' | 'error';
  qrCode?: string;
  qrExpiresAt?: Date;
  lastConnectedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppSessionSchema = new Schema<IWhatsAppSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    industry: { type: String, required: true, enum: ['restaurant', 'hotel', 'salon', 'fitness', 'healthcare', 'retail', 'generic'] },
    status: {
      type: String,
      enum: ['pending', 'authenticated', 'disconnected', 'error'],
      default: 'pending',
    },
    qrCode: { type: String },
    qrExpiresAt: { type: Date },
    lastConnectedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

WhatsAppSessionSchema.index({ industry: 1, status: 1 });

export const WhatsAppSession = mongoose.model<IWhatsAppSession>('WhatsAppSession', WhatsAppSessionSchema);

// WhatsApp Message template types
export interface IWhatsAppTemplate {
  _id?: mongoose.Types.ObjectId;
  templateId: string;
  name: string;
  industry: string;
  category: 'order' | 'booking' | 'reminder' | 'notification' | 'marketing' | 'otp' | 'custom';
  type: 'text' | 'template' | 'media' | 'interactive';
  content: {
    body: string;
    footer?: string;
    mediaUrl?: string;
    buttons?: Array<{ type: string; text: string; url?: string; phoneNumber?: string }>;
    header?: string;
  };
  variables: string[]; // Variable names like {{customer_name}}, {{booking_time}}
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppTemplateSchema = new Schema<IWhatsAppTemplate>({
  templateId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  industry: { type: String, required: true },
  category: {
    type: String,
    enum: ['order', 'booking', 'reminder', 'notification', 'marketing', 'otp', 'custom'],
    required: true,
  },
  type: { type: String, enum: ['text', 'template', 'media', 'interactive'], default: 'text' },
  content: {
    body: { type: String, required: true },
    footer: { type: String },
    mediaUrl: { type: String },
    buttons: [
      {
        type: { type: String },
        text: { type: String },
        url: { type: String },
        phoneNumber: { type: String },
      },
    ],
    header: { type: String },
  },
  variables: [String],
  active: { type: Boolean, default: true },
  createdBy: { type: String },
});

WhatsAppTemplateSchema.index({ industry: 1, category: 1, active: 1 });

export const WhatsAppTemplate = mongoose.model<IWhatsAppTemplate>('WhatsAppTemplate', WhatsAppTemplateSchema);

// WhatsApp Message Log
export interface IWhatsAppMessage {
  _id?: mongoose.Types.ObjectId;
  messageId: string;
  sessionId: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'template' | 'interactive';
  content: {
    body?: string;
    mediaUrl?: string;
    caption?: string;
    buttons?: Array<{ index: number; text: string }>;
    selectedButton?: number;
    location?: { latitude: number; longitude: number; description?: string };
  };
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, any>;
  error?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'template', 'interactive'],
      required: true,
    },
    content: {
      body: { type: String },
      mediaUrl: { type: String },
      caption: { type: String },
      buttons: [{ index: Number, text: String }],
      selectedButton: { type: Number },
      location: {
        latitude: Number,
        longitude: Number,
        description: String,
      },
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'queued',
    },
    metadata: { type: Schema.Types.Mixed },
    error: { type: String },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

WhatsAppMessageSchema.index({ sessionId: 1, createdAt: -1 });
WhatsAppMessageSchema.index({ to: 1, createdAt: -1 });
WhatsAppMessageSchema.index({ status: 1, createdAt: 1 });

export const WhatsAppMessage = mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);

// WhatsApp Conversation (for session management)
export interface IWhatsAppConversation {
  _id?: mongoose.Types.ObjectId;
  phone: string;
  sessionId: string;
  industry: string;
  merchantId?: string;
  state: string;
  context: Record<string, any>;
  lastMessageAt: Date;
  lastMessageType: string;
  messageCount: number;
  tags: string[];
  blocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppConversationSchema = new Schema<IWhatsAppConversation>(
  {
    phone: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    industry: { type: String, required: true },
    merchantId: { type: String, index: true },
    state: { type: String, default: 'initial' },
    context: { type: Schema.Types.Mixed, default: {} },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageType: { type: String },
    messageCount: { type: Number, default: 0 },
    tags: [String],
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

WhatsAppConversationSchema.index({ sessionId: 1, lastMessageAt: -1 });
WhatsAppConversationSchema.index({ merchantId: 1, lastMessageAt: -1 });

export const WhatsAppConversation = mongoose.model<IWhatsAppConversation>(
  'WhatsAppConversation',
  WhatsAppConversationSchema
);

export default {
  WhatsAppSession,
  WhatsAppTemplate,
  WhatsAppMessage,
  WhatsAppConversation,
};
