import { z } from 'zod';

export const ClassTypeEnum = z.enum([
  'yoga', 'pilates', 'hiit', 'spinning', 'zumba', 'crossfit', 'boxing', 'swimming', 'personal_training', 'other'
]);

export const GymClassSchema = z.object({
  classId: z.string(),
  gymId: z.string(),
  name: z.string(),
  type: ClassTypeEnum,
  description: z.string().optional(),
  trainerId: z.string(),
  duration: z.number(),
  maxParticipants: z.number(),
  currentParticipants: z.number().default(0),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).default('all_levels'),
  schedule: z.object({
    dayOfWeek: z.number(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  price: z.number().default(0),
  room: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type IGymClass = z.infer<typeof GymClassSchema>;

export const TrainerSchema = z.object({
  trainerId: z.string(),
  gymId: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string(),
  specialization: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  bio: z.string().optional(),
  experience: z.number(),
  rating: z.number().default(0),
  isActive: z.boolean().default(true),
});

export type ITrainer = z.infer<typeof TrainerSchema>;
