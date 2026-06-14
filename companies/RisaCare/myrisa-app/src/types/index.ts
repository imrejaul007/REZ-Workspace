/**
 * MyRisa App - Unified Consumer Interface
 * Personal Wellbeing Intelligence Platform
 */

import { z } from 'zod';

// ============================================
// USER & ONBOARDING
// ============================================

export const UserSchema = z.object({
  id: z.string(),
  corpId: z.string(),
  name: z.string(),
  email: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  createdAt: z.string(),
  lastActive: z.string()
});

export type User = z.infer<typeof UserSchema>;

// Onboarding Goals
export const OnboardingGoalSchema = z.object({
  goal: z.enum([
    'track_periods',
    'get_pregnant',
    'pregnancy_care',
    'manage_pcos',
    'menopause_support',
    'improve_mood',
    'reduce_stress',
    'better_sleep',
    'fitness',
    'weight_management',
    'family_health',
    'elder_care',
    'work_life_balance',
    'relationship_health'
  ),
  priority: z.number().min(1).max(10).default(5)
});

export type OnboardingGoal = z.infer<typeof OnboardingGoalSchema>;

// ============================================
// DASHBOARD
// ============================================

export const DashboardSchema = z.object({
  userId: z.string(),
  date: z.string(),
  overallScore: z.number().min(0).max(100),
  greeting: z.string(),
  todayFocus: z.string(),
  highlights: z.array(z.object({
    type: z.string(),
    title: z.string(),
    description: z.string(),
    actionLabel: z.string().optional(),
    actionUrl: z.string().optional()
  })),
  quickActions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    icon: z.string(),
    color: z.string(),
    action: z.string()
  })),
  domainScores: z.array(z.object({
    domain: z.string(),
    score: z.number(),
    trend: z.enum(['up', 'stable', 'down']),
    label: z.string()
  })),
  reminders: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    time: z.string(),
    enabled: z.boolean()
  })),
  insights: z.array(z.object({
    id: z.string(),
    type: z.enum(['positive', 'warning', 'info']),
    title: z.string(),
    description: z.string()
  })),
  timestamp: z.string()
});

export type Dashboard = z.infer<typeof DashboardSchema>;

// ============================================
// DOMAIN DATA
// ============================================

export interface PhysicalHealthData {
  lastPeriod?: string;
  cycleLength?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  weight?: number;
  sleepHours?: number;
}

export interface MentalWellnessData {
  moodScore: number;
  stressLevel: number;
  sleepQuality: string;
  therapyStatus: string;
}

export interface SexualWellnessData {
  libidoLevel: number;
  activeContraception?: string;
  lastSTDTest?: string;
}

export interface LifestyleData {
  sleepScore: number;
  exerciseMinutes: number;
  waterIntake: number;
  habitStreak: number;
}

export interface WorkLifeData {
  workHoursToday: number;
  energyLevel: number;
  burnoutRisk: string;
  ptoRemaining: number;
}

export interface FamilyData {
  memberCount: number;
  upcomingCareTasks: number;
}

export interface RelationshipData {
  status: string;
  qualityScore: number;
  lastInteraction?: string;
}

// ============================================
// COMPLETE USER STATE
// ============================================

export interface MyRisaUserState {
  user: User;
  goals: OnboardingGoal[];
  dashboard: Dashboard;
  domains: {
    physical: PhysicalHealthData;
    mental: MentalWellnessData;
    sexual: SexualWellnessData;
    lifestyle: LifestyleData;
    worklife: WorkLifeData;
    family: FamilyData;
    relationships: RelationshipData;
  };
  humanTwin: any;
  lastUpdated: string;
}

// ============================================
// API RESPONSE
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// ============================================
// INTEGRATION CLIENTS
// ============================================

export const ServiceUrls = {
  // MyRisa Services (New)
  womensHealth: process.env.WOMENS_HEALTH_URL || 'http://localhost:4820',
  sexualWellness: process.env.SEXUAL_WELLNESS_URL || 'http://localhost:4821',
  workLife: process.env.WORKLIFE_URL || 'http://localhost:4822',
  relationships: process.env.RELATIONSHIPS_URL || 'http://localhost:4823',
  humanTwin: process.env.HUMAN_TWIN_URL || 'http://localhost:4824',
  consultationCopilot: process.env.CONSULTATION_URL || 'http://localhost:4825',
  universalMemory: process.env.UNIVERSAL_MEMORY_URL || 'http://localhost:4800',

  // Existing RisaCare Services
  wellness: process.env.WELLNESS_URL || 'http://localhost:4703',
  mentalHealth: process.env.MENTAL_HEALTH_URL || 'http://localhost:4722',
  sleep: process.env.SLEEP_URL || 'http://localhost:4729',
  careCircle: process.env.CARE_CIRCLE_URL || 'http://localhost:4706',

  // External Services
  hojai: process.env.HOJAI_URL || 'http://localhost:4500',
  genie: process.env.GENIE_URL || 'http://localhost:4703',
  shab: process.env.SHAB_URL || 'http://localhost:4970'
} as const;