import mongoose, { Document } from 'mongoose';
import { Memory, TimelineEvent, Context, Profile, ConversationMessage } from '../types/index.js';
export interface MemoryDocument extends Omit<Memory, 'id'>, Document {
    _id: mongoose.Types.ObjectId;
}
export declare const MemoryModel: mongoose.Model<MemoryDocument, {}, {}, {}, mongoose.Document<unknown, {}, MemoryDocument, {}, {}> & MemoryDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface TimelineEventDocument extends Omit<TimelineEvent, 'id'>, Document {
    _id: mongoose.Types.ObjectId;
}
export declare const TimelineEventModel: mongoose.Model<TimelineEventDocument, {}, {}, {}, mongoose.Document<unknown, {}, TimelineEventDocument, {}, {}> & TimelineEventDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ContextDocument extends Omit<Context, 'id'>, Document {
    _id: mongoose.Types.ObjectId;
}
export declare const ContextModel: mongoose.Model<ContextDocument, {}, {}, {}, mongoose.Document<unknown, {}, ContextDocument, {}, {}> & ContextDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ProfileDocument extends Omit<Profile, 'id'>, Document {
    _id: mongoose.Types.ObjectId;
}
export declare const ProfileModel: mongoose.Model<ProfileDocument, {}, {}, {}, mongoose.Document<unknown, {}, ProfileDocument, {}, {}> & ProfileDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ConversationDocument extends Document {
    tenantId: string;
    userId: string;
    type: string;
    status: string;
    messages: ConversationMessage[];
    lastMessageAt: Date;
}
export declare const ConversationModel: mongoose.Model<ConversationDocument, {}, {}, {}, mongoose.Document<unknown, {}, ConversationDocument, {}, {}> & ConversationDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=memoryModel.d.ts.map