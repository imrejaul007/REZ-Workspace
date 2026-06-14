import mongoose, { Schema, Document } from 'mongoose';

export type InteractionType =
  | 'visit'
  | 'appointment_scheduled'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'campaign_received'
  | 'campaign_clicked'
  | 'campaign_converted'
  | 'feedback_submitted'
  | 'review_submitted'
  | 'birthday_sms_sent'
  | 'anniversary_sms_sent'
  | 'reengagement_sms_sent'
  | 'promotional_email_sent'
  | 'loyalty_reward_sent'
  | 'note_added'
  | 'preference_updated'
  | 'tier_changed';

export interface IInteraction extends Document {
  interactionId: string;
  customerId: string;
  type: InteractionType;
  channel?: 'sms' | 'email' | 'in-app' | 'phone' | 'in-person';
  campaignId?: string;
  metadata: Record<string, unknown>;
  description?: string;
  createdAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    interactionId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'visit',
        'appointment_scheduled',
        'appointment_cancelled',
        'appointment_completed',
        'campaign_received',
        'campaign_clicked',
        'campaign_converted',
        'feedback_submitted',
        'review_submitted',
        'birthday_sms_sent',
        'anniversary_sms_sent',
        'reengagement_sms_sent',
        'promotional_email_sent',
        'loyalty_reward_sent',
        'note_added',
        'preference_updated',
        'tier_changed',
      ],
      index: true,
    },
    channel: {
      type: String,
      enum: ['sms', 'email', 'in-app', 'phone', 'in-person'],
    },
    campaignId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    description: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for common queries
InteractionSchema.index({ customerId: 1, createdAt: -1 });
InteractionSchema.index({ type: 1, createdAt: -1 });
InteractionSchema.index({ customerId: 1, type: 1 });

export const Interaction = mongoose.model<IInteraction>(
  'Interaction',
  InteractionSchema
);
