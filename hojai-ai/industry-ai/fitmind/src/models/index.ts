/**
 * FITMIND - Fitness AI Operating System
 * Production-Ready MongoDB Models
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// MEMBER MODEL
// ============================================

export interface IMember extends Document {
  name: string;
  phone: string;
  email?: string;
  joinDate: Date;
  membershipPlan: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'paused' | 'cancelled';
  fitnessGoals: string[];
  preferences: string[];
  attendanceCount: number;
  lastVisit?: Date;
  assignedTrainer?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true },
    joinDate: { type: Date, default: Date.now },
    membershipPlan: { type: Schema.Types.ObjectId, ref: 'MembershipPlan' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'paused', 'cancelled'],
      default: 'active'
    },
    fitnessGoals: [{ type: String }],
    preferences: [{ type: String }],
    attendanceCount: { type: Number, default: 0 },
    lastVisit: { type: Date },
    assignedTrainer: { type: String }
  },
  { timestamps: true }
);

MemberSchema.index({ phone: 1 });
MemberSchema.index({ status: 1 });

// ============================================
// MEMBERSHIP PLAN MODEL
// ============================================

export interface IMembershipPlan extends Document {
  name: string;
  duration: string;
  price: number;
  features: string[];
  category: 'basic' | 'premium' | 'elite';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipPlanSchema = new Schema<IMembershipPlan>(
  {
    name: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    features: [{ type: String }],
    category: {
      type: String,
      enum: ['basic', 'premium', 'elite'],
      required: true
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

MembershipPlanSchema.index({ category: 1 });
MembershipPlanSchema.index({ isActive: 1 });

// ============================================
// CLASS MODEL
// ============================================

export interface IClass extends Document {
  name: string;
  instructor: string;
  type: 'yoga' | 'hiit' | 'strength' | 'cardio' | 'dance' | 'spinning' | 'pilates' | 'zumba';
  schedule: string;
  duration: number;
  capacity: number;
  enrolled: number;
  room: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true },
    instructor: { type: String, required: true },
    type: {
      type: String,
      enum: ['yoga', 'hiit', 'strength', 'cardio', 'dance', 'spinning', 'pilates', 'zumba'],
      required: true
    },
    schedule: { type: String, required: true },
    duration: { type: Number, required: true },
    capacity: { type: Number, required: true },
    enrolled: { type: Number, default: 0 },
    room: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

ClassSchema.index({ type: 1 });
ClassSchema.index({ instructor: 1 });
ClassSchema.index({ schedule: 1 });

// ============================================
// ATTENDANCE MODEL
// ============================================

export interface IAttendance extends Document {
  memberId: mongoose.Types.ObjectId;
  memberName: string;
  checkIn: Date;
  checkOut?: Date;
  classAttended?: string;
  duration?: number;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    memberName: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date },
    classAttended: { type: String },
    duration: { type: Number }
  },
  { timestamps: true }
);

AttendanceSchema.index({ memberId: 1 });
AttendanceSchema.index({ checkIn: 1 });

// ============================================
// WORKOUT PLAN MODEL
// ============================================

export interface IExercise {
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  equipment?: string;
  videoUrl?: string;
}

export interface IWorkoutPlan extends Document {
  memberId: mongoose.Types.ObjectId;
  trainer: string;
  focus: string;
  duration: number;
  exercises: IExercise[];
  createdAt: Date;
  status: 'active' | 'completed' | 'paused';
}

const WorkoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    trainer: { type: String, required: true },
    focus: { type: String, required: true },
    duration: { type: Number, required: true },
    exercises: [{
      name: { type: String },
      sets: { type: Number },
      reps: { type: Number },
      restSeconds: { type: Number },
      equipment: { type: String },
      videoUrl: { type: String }
    }],
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active'
    }
  },
  { timestamps: true }
);

WorkoutPlanSchema.index({ memberId: 1 });
WorkoutPlanSchema.index({ status: 1 });

// ============================================
// NUTRITION PLAN MODEL
// ============================================

export interface IMealItem {
  food: string;
  calories: number;
  protein: number;
}

export interface IMeal {
  name: string;
  items: IMealItem[];
}

export interface INutritionPlan extends Document {
  memberId: mongoose.Types.ObjectId;
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  meals: IMeal[];
  createdAt: Date;
}

const NutritionPlanSchema = new Schema<INutritionPlan>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    calories: { type: Number, required: true },
    macros: {
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number }
    },
    meals: [{
      name: { type: String },
      items: [{
        food: { type: String },
        calories: { type: Number },
        protein: { type: Number }
      }]
    }]
  },
  { timestamps: true }
);

NutritionPlanSchema.index({ memberId: 1 });

// ============================================
// SUBSCRIPTION MODEL
// ============================================

export interface ISubscription extends Document {
  memberId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active'
    },
    autoRenew: { type: Boolean, default: false }
  },
  { timestamps: true }
);

SubscriptionSchema.index({ memberId: 1 });
SubscriptionSchema.index({ endDate: 1 });

// ============================================
// EXPORT ALL MODELS
// ============================================

export const Member = mongoose.model<IMember>('Member', MemberSchema);
export const MembershipPlan = mongoose.model<IMembershipPlan>('MembershipPlan', MembershipPlanSchema);
export const Class = mongoose.model<IClass>('Class', ClassSchema);
export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export const WorkoutPlan = mongoose.model<IWorkoutPlan>('WorkoutPlan', WorkoutPlanSchema);
export const NutritionPlan = mongoose.model<INutritionPlan>('NutritionPlan', NutritionPlanSchema);
export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export const Models = {
  Member,
  MembershipPlan,
  Class,
  Attendance,
  WorkoutPlan,
  NutritionPlan,
  Subscription
};

export default Models;