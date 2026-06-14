/**
 * TalentOS Database Schemas
 * MongoDB Models
 */

import mongoose from 'mongoose';

// User Schema
export const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  password: String,
  name: String,
  phone: String,
  role: { type: String, enum: ['admin', 'employer', 'employee', 'candidate'] },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  department: String,
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  permissions: [String],
  avatar: String,
  department: String,
  joiningDate: Date,
  status: { type: String, enum: ['active', 'inactive', 'onboarding'] },
  createdAt: { type: Date, default: Date.now }
});

// Company Schema
export const CompanySchema = new mongoose.Schema({
  name: String,
  size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
  industry: String,
  website: String,
  logo: String,
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  settings: {
    leavePolicy: { cl: Number, sl: Number, pl: Number },
    workingDays: [String],
    officeHours: { start: String, end: String }
  },
  integrations: [String],
  createdAt: { type: Date, default: Date.now }
});

// Employee Schema
export const EmployeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  employeeId: String,
  designation: String,
  department: String,
  reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateOfJoining: Date,
  employmentType: { type: String, enum: ['fulltime', 'parttime', 'contract'] },
  compensation: {
    ctc: Number,
    salary: Number
  },
  bank: {
    accountNumber: String,
    ifsc: String
  },
  documents: [String],
  status: { type: String, enum: ['active', 'probation', 'notice', 'relieved']
});

// Leave Schema
export const LeaveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  type: { type: String, enum: ['cl', 'sl', 'pl', 'unpaid'] },
  from: Date,
  to: Date,
  reason: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'] },
  managerApproved: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appliedAt: { type: Date, default: Date.now }
});

// Attendance Schema
export const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  company: { type: mongoose.Schema.TypesId, ref: 'Company' },
  date: Date,
  checkIn: Date,
  checkOut: Date,
  hours: Number,
  location: { type: String, coordinates: [Number] },
  device: String
});

// Expense Schema
export const ExpenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  amount: Number,
  category: String,
  receipt: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'] },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Announcement Schema
export const AnnouncementSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  title: String,
  content: String,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'] },
  attachments: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Goal Schema
export const GoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  targetDate: Date,
  progress: Number,
  status: { type: String, enum: ['active', 'completed', 'at_risk']
});

// Performance Review Schema
export const ReviewSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cycle: String,
  ratings: {
    productivity: Number,
    quality: Number,
    communication: Number,
    teamwork: Number
  },
  status: { type: String, enum: ['draft', 'submitted', 'acknowledged'] }
});

// Skills Graph Schema
export const SkillSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  skill: String,
  level: { type: String, enum: ['beginner', 'intermediate', 'expert'] },
  certified: Boolean,
  endorsedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Notification Schema
export const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Offer Letter Schema
export const OfferSchema = new mongoose.Schema({
  candidate: { type: String, email: String, name: String },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  position: String,
  ctc: Number,
  joining: Date,
  status: { type: String, enum: ['pending', 'accepted', 'rejected'] },
  createdAt: { type: Date, default: Date.now }
});

export const TalentOSModels = {
  User: mongoose.model('User', UserSchema),
  Company: mongoose.model('Company', CompanySchema),
  Employee: mongoose.model('Employee', EmployeeSchema),
  Leave: mongoose.model('Leave', LeaveSchema),
  Attendance: mongoose.model('Attendance', AttendanceSchema),
  Expense: mongoose.model('Expense', ExpenseSchema),
  Announcement: mongoose.model('Announcement', AnnouncementSchema),
  Goal: mongoose.model('Goal', GoalSchema),
  Review: mongoose.model('Review', ReviewSchema),
  Skill: mongoose.model('Skill', SkillSchema),
  Notification: mongoose.model('Notification', NotificationSchema),
  Offer: mongoose.model('Offer', OfferSchema)
};

export type TalentOSModels = typeof TalentOSModels;
