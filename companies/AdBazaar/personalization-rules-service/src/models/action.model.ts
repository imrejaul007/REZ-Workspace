import mongoose, { Document, Schema } from 'mongoose';

export interface IAction extends Document {
  actionId: string;
  name: string;
  description?: string;
  type: 'show_content' | 'hide_content' | 'personalize' | 'recommend' | 'redirect' | 'modify_price' | 'apply_banner' | 'send_notification';
  configSchema: Record<string, unknown>;
  createdAt: Date;
}

const actionDefSchema = new Schema<IAction>({
  actionId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['show_content', 'hide_content', 'personalize', 'recommend', 'redirect', 'modify_price', 'apply_banner', 'send_notification'],
    required: true
  },
  configSchema: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

actionDefSchema.index({ actionId: 1 });
actionDefSchema.index({ type: 1 });

export const ActionDefinition = mongoose.model<IAction>('ActionDefinition', actionDefSchema);