import mongoose, { Document, Schema } from 'mongoose';

// Department Model
export interface IDepartment extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  managerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);

// Employee Model
export interface IEmployee extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  departmentId: mongoose.Types.ObjectId;
  role: 'employee' | 'manager' | 'admin';
  position: string;
  joiningDate: Date;
  status: 'active' | 'inactive' | 'on_leave';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    role: { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee' },
    position: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' },
    avatar: { type: String },
  },
  { timestamps: true }
);

// Attendance Model
export type AttendanceType = 'check_in' | 'check_out' | 'break_start' | 'break_end';

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  type: AttendanceType;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  deviceInfo?: string;
  createdAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: { type: String, enum: ['check_in', 'check_out', 'break_start', 'break_end'], required: true },
    timestamp: { type: Date, required: true },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    deviceInfo: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Leave Model
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'sick' | 'casual' | 'earned' | 'unpaid' | 'maternity' | 'paternity' | 'bereavement';

export interface ILeave extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: { type: String, enum: ['sick', 'casual', 'earned', 'unpaid', 'maternity', 'paternity', 'bereavement'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// OKR/Objective Model
export type ObjectiveStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface IObjective extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  employeeId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  quarter: string;
  year: number;
  progress: number;
  status: ObjectiveStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const objectiveSchema = new Schema<IObjective>(
  {
    title: { type: String, required: true },
    description: { type: String },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    quarter: { type: String, required: true },
    year: { type: Number, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['draft', 'active', 'completed', 'cancelled'], default: 'draft' },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// Project Model
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  departmentId: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  budget?: number;
  teamMembers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    status: { type: String, enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'], default: 'planning' },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    budget: { type: Number },
    teamMembers: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  },
  { timestamps: true }
);

// Task Model
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  projectId: mongoose.Types.ObjectId;
  assigneeId?: mongoose.Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['todo', 'in_progress', 'review', 'done', 'blocked'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    dueDate: { type: Date },
    estimatedHours: { type: Number },
    actualHours: { type: Number },
  },
  { timestamps: true }
);

// Announcement Model
export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'hr' | 'it' | 'finance' | 'events';
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    category: { type: String, enum: ['general', 'hr', 'it', 'finance', 'events'], default: 'general' },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Notification Model
export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'attendance' | 'leave' | 'project' | 'task' | 'announcement' | 'system';
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    category: { type: String, enum: ['attendance', 'leave', 'project', 'task', 'announcement', 'system'], default: 'info' },
    isRead: { type: Boolean, default: false },
    actionUrl: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Export models
export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
export const Leave = mongoose.model<ILeave>('Leave', leaveSchema);
export const Objective = mongoose.model<IObjective>('Objective', objectiveSchema);
export const Project = mongoose.model<IProject>('Project', projectSchema);
export const Task = mongoose.model<ITask>('Task', taskSchema);
export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
