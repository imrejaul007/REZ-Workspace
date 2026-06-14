import { GymClass } from '../models/GymClass';
import { Trainer } from '../models/Trainer';

export async function getClassesByDay(gymId: string, dayOfWeek: number): Promise<GymClass[]> {
  return GymClass.find({ gymId, 'schedule.dayOfWeek': dayOfWeek, isActive: true })
    .sort({ 'schedule.startTime': 1 });
}

export async function getClassesByTrainer(trainerId: string): Promise<GymClass[]> {
  return GymClass.find({ trainerId, isActive: true })
    .sort({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 });
}

export async function getAvailableSlots(classId: string): Promise<number> {
  const gymClass = await GymClass.findOne({ classId });
  if (!gymClass) return 0;
  return Math.max(0, gymClass.maxParticipants - gymClass.currentParticipants);
}

export async function bookClassSlot(classId: string): Promise<void> {
  await GymClass.findOneAndUpdate(
    { classId, currentParticipants: { $lt: '$maxParticipants' } },
    { $inc: { currentParticipants: 1 } }
  );
}

export async function cancelClassSlot(classId: string): Promise<void> {
  await GymClass.findOneAndUpdate(
    { classId, currentParticipants: { $gt: 0 } },
    { $inc: { currentParticipants: -1 } }
  );
}

export async function getTrainerSchedule(trainerId: string): Promise<Record<number, GymClass[]>> {
  const classes = await GymClass.find({ trainerId, isActive: true });
  const schedule: Record<number, GymClass[]> = {};
  for (let i = 0; i < 7; i++) schedule[i] = [];
  for (const c of classes) schedule[c.schedule.dayOfWeek].push(c);
  return schedule;
}
