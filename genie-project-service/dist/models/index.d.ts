/**
 * GENIE Project Service - MongoDB Models
 * Version: 1.0.0 | Date: May 31, 2026
 * Purpose: Mongoose models for project storage
 */
import mongoose, { Document, Model } from 'mongoose';
import { ProjectStatus, ProjectPriority, TaskStatus, TaskPriority, RecurringType } from '../types.js';
/**
 * Project Schema
 */
export interface IProjectDocument extends Document {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    priority: ProjectPriority;
    tags: string[];
    start_date?: Date;
    due_date?: Date;
    completed_at?: Date;
    progress: number;
    task_count: number;
    completed_task_count: number;
    owner_id?: string;
    team_members: string[];
    created_at: Date;
    updated_at: Date;
}
/**
 * Task Schema
 */
export interface ITaskDocument extends Document {
    id: string;
    project_id: string;
    user_id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    tags: string[];
    assignee_id?: string;
    due_date?: Date;
    estimated_hours?: number;
    actual_hours?: number;
    subtasks: Array<{
        id: string;
        title: string;
        completed: boolean;
    }>;
    recurring?: {
        type: RecurringType;
        interval: number;
        end_date?: Date;
    };
    dependencies: string[];
    completed_at?: Date;
    created_at: Date;
    updated_at: Date;
}
/**
 * Milestone Schema
 */
export interface IMilestoneDocument extends Document {
    id: string;
    project_id: string;
    name: string;
    description?: string;
    due_date: Date;
    completed: boolean;
    completed_at?: Date;
    created_at: Date;
}
declare let ProjectModel: Model<IProjectDocument>;
declare let TaskModel: Model<ITaskDocument>;
declare let MilestoneModel: Model<IMilestoneDocument>;
export { ProjectModel, TaskModel, MilestoneModel };
declare const _default: {
    ProjectModel: mongoose.Model<IProjectDocument, {}, {}, {}, mongoose.Document<unknown, {}, IProjectDocument, {}, {}> & IProjectDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
    TaskModel: mongoose.Model<ITaskDocument, {}, {}, {}, mongoose.Document<unknown, {}, ITaskDocument, {}, {}> & ITaskDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
    MilestoneModel: mongoose.Model<IMilestoneDocument, {}, {}, {}, mongoose.Document<unknown, {}, IMilestoneDocument, {}, {}> & IMilestoneDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map