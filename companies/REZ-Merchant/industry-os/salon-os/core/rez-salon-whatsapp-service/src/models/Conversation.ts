import mongoose, { Document, Schema } from 'mongoose';

export enum ConversationState {
  GREETING = 'greeting',
  BOOKING_SERVICE = 'booking_service',
  SELECTING_STYLIST = 'selecting_stylist',
  SELECTING_DATE = 'selecting_date',
  SELECTING_TIME = 'selecting_time',
  CONFIRMING_BOOKING = 'confirming_booking',
  CANCEL_BOOKING = 'cancel_booking',
  VIEW_HISTORY = 'view_history',
  PAYMENT = 'payment',
  COMPLETED = 'completed',
  FALLBACK = 'fallback'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  BUTTON = 'button',
  INTERACTIVE = 'interactive'
}

export interface IMessage {
  from: string;
  to: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  mediaUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface IBookingDetails {
  serviceId?: string;
  serviceName?: string;
  stylistId?: string;
  stylistName?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  estimatedPrice?: number;
  estimatedDuration?: number;
}

export interface IConversation extends Document {
  phoneNumber: string;
  customerId?: string;
  state: ConversationState;
  bookingDetails: IBookingDetails;
  lastMessage?: IMessage;
  conversationHistory: IMessage[];
  reminderSent: boolean;
  reminderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  context: Record<string, unknown>;
}

const BookingDetailsSchema = new Schema<IBookingDetails>(
  {
    serviceId: { type: String },
    serviceName: { type: String },
    stylistId: { type: String },
    stylistName: { type: String },
    preferredDate: { type: String },
    preferredTime: { type: String },
    notes: { type: String },
    estimatedPrice: { type: Number },
    estimatedDuration: { type: Number }
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: Object.values(MessageType), default: MessageType.TEXT },
    timestamp: { type: Date, default: Date.now },
    mediaUrl: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    phoneNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, index: true },
    state: { type: String, enum: Object.values(ConversationState), default: ConversationState.GREETING },
    bookingDetails: { type: BookingDetailsSchema, default: () => ({}) },
    lastMessage: { type: MessageSchema },
    conversationHistory: [MessageSchema],
    reminderSent: { type: Boolean, default: false },
    reminderDate: { type: Date },
    context: { type: Schema.Types.Mixed, default: () => ({}) }
  },
  { timestamps: true }
);

ConversationSchema.index({ createdAt: -1 });
ConversationSchema.index({ 'bookingDetails.preferredDate': 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
