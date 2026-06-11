/**
 * Scheduler AI - Meeting & Calendar Management
 * Part of TEAMMIND - Team Management AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';
import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4882;

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  organizerId: string;
  organizerName: string;
  participants: { id: string; name: string; email: string; response: 'pending' | 'accepted' | 'declined' | 'tentative' }[];
  startTime: string;
  endTime: string;
  timezone: string;
  location?: string;
  meetingLink?: string;
  recurring?: { frequency: 'daily' | 'weekly' | 'monthly'; endDate?: string };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  reminders: number[];
  notes?: string;
  createdAt: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  conflictReason?: string;
}

export interface ScheduleRequest {
  participantIds: string[];
  duration: number; // minutes
  dateRange: { start: string; end: string };
  preferences?: { earliestTime?: string; latestTime?: string };
}

const meetings = new Map<string, Meeting>();
const calendar = new Map<string, Meeting[]>(); // date -> meetings

export class SchedulerAI {
  private readonly workingHours = { start: 9, end: 18 };
  private readonly meetingBuffer = 15; // minutes between meetings

  /**
   * Schedule a new meeting
   */
  async scheduleMeeting(data: Omit<Meeting, 'id' | 'status' | 'createdAt'>): Promise<{ meeting: Meeting; message: string; conflicts?: string[] }> {
    // Check for conflicts
    const conflicts = this.findConflicts(data.startTime, data.endTime, data.participants.map(p => p.id));

    const meeting: Meeting = {
      ...data,
      id: `MTG-${uuidv4().slice(0, 8).toUpperCase()}`,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    meetings.set(meeting.id, meeting);

    // Add to calendar
    const dateKey = meeting.startTime.split('T')[0];
    if (!calendar.has(dateKey)) {
      calendar.set(dateKey, []);
    }
    calendar.get(dateKey)!.push(meeting);

    const message = this.generateSchedulingMessage(meeting);
    return { meeting, message, conflicts: conflicts.length > 0 ? conflicts : undefined };
  }

  /**
   * Find available time slots
   */
  async findAvailableSlots(request: ScheduleRequest): Promise<{ slots: TimeSlot[]; message: string }> {
    const slots: TimeSlot[] = [];
    const startDate = new Date(request.dateRange.start);
    const endDate = new Date(request.dateRange.end);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

      for (let hour = this.workingHours.start; hour < this.workingHours.end; hour++) {
        const slotStart = new Date(d);
        slotStart.setHours(hour, 0, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + request.duration);

        if (slotEnd.getHours() > this.workingHours.end) continue;

        const conflicts = this.findConflicts(
          slotStart.toISOString(),
          slotEnd.toISOString(),
          request.participantIds
        );

        const earliestTime = request.preferences?.earliestTime ? parseInt(request.preferences.earliestTime.split(':')[0]) : this.workingHours.start;
        const latestTime = request.preferences?.latestTime ? parseInt(request.preferences.latestTime.split(':')[0]) : this.workingHours.end;

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: conflicts.length === 0 && hour >= earliestTime && hour + (request.duration / 60) <= latestTime,
          conflictReason: conflicts.length > 0 ? `Conflicts with ${conflicts.length} meeting(s)` : undefined
        });
      }
    }

    const availableCount = slots.filter(s => s.available).length;
    const message = `Found ${availableCount} available slots out of ${slots.length} total slots.`;

    return { slots: slots.filter(s => s.available).slice(0, 10), message };
  }

  /**
   * Reschedule a meeting
   */
  async reschedule(meetingId: string, newStartTime: string, newEndTime: string): Promise<{ meeting: Meeting; message: string }> {
    const meeting = meetings.get(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const oldDateKey = meeting.startTime.split('T')[0];
    calendar.get(oldDateKey)?.filter(m => m.id !== meetingId);

    meeting.startTime = newStartTime;
    meeting.endTime = newEndTime;
    meeting.updatedAt = new Date().toISOString();

    const newDateKey = newStartTime.split('T')[0];
    if (!calendar.has(newDateKey)) {
      calendar.set(newDateKey, []);
    }
    calendar.get(newDateKey)!.push(meeting);

    return { meeting, message: `Meeting rescheduled to ${newStartTime}` };
  }

  /**
   * Cancel a meeting
   */
  async cancelMeeting(meetingId: string, reason?: string): Promise<{ message: string; notifications: string[] }> {
    const meeting = meetings.get(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    meeting.status = 'cancelled';

    const notifications = meeting.participants.map(p =>
      `Notification sent to ${p.name} at ${p.email}`
    );

    return {
      message: `Meeting "${meeting.title}" has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
      notifications
    };
  }

  /**
   * Get daily schedule
   */
  async getDailySchedule(date: string, employeeId?: string): Promise<{ schedule: Meeting[]; message: string }> {
    const dayMeetings = calendar.get(date) || [];

    const filtered = employeeId
      ? dayMeetings.filter(m => m.participants.some(p => p.id === employeeId))
      : dayMeetings;

    const sorted = filtered
      .filter(m => m.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const totalHours = sorted.reduce((acc, m) => {
      const start = new Date(m.startTime);
      const end = new Date(m.endTime);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    return {
      schedule: sorted,
      message: `${sorted.length} meetings totaling ${totalHours.toFixed(1)} hours`
    };
  }

  private findConflicts(startTime: string, endTime: string, participantIds: string[]): string[] {
    const conflicts: string[] = [];
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    meetings.forEach(meeting => {
      if (meeting.status === 'cancelled') return;

      const meetingStart = new Date(meeting.startTime).getTime();
      const meetingEnd = new Date(meeting.endTime).getTime();

      const hasOverlap = start < meetingEnd && end > meetingStart;
      const hasCommonParticipant = meeting.participants.some(p => participantIds.includes(p.id));

      if (hasOverlap && hasCommonParticipant) {
        conflicts.push(`${meeting.title} (${meeting.startTime})`);
      }
    });

    return conflicts;
  }

  private generateSchedulingMessage(meeting: Meeting): string {
    const date = new Date(meeting.startTime).toLocaleDateString();
    const startTime = new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `Meeting "${meeting.title}" scheduled for ${date} from ${startTime} to ${endTime}. ${meeting.participants.length} participants invited.`;
  }
}

const scheduler = new SchedulerAI();

// ============================================
// API ROUTES
// ============================================

app.post('/api/meetings', async (req, res) => {
  try {
    const result = await scheduler.scheduleMeeting(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule meeting' });
  }
});

app.get('/api/slots', async (req, res) => {
  try {
    const request: ScheduleRequest = {
      participantIds: (req.query.participantIds as string).split(','),
      duration: parseInt(req.query.duration as string) || 60,
      dateRange: {
        start: req.query.start as string,
        end: req.query.end as string
      },
      preferences: req.query.earliestTime ? {
        earliestTime: req.query.earliestTime as string,
        latestTime: req.query.latestTime as string
      } : undefined
    };
    const result = await scheduler.findAvailableSlots(request);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to find slots' });
  }
});

app.get('/api/meetings/:meetingId', async (req, res) => {
  try {
    const meeting = meetings.get(req.params.meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get meeting' });
  }
});

app.patch('/api/meetings/:meetingId/reschedule', async (req, res) => {
  try {
    const { newStartTime, newEndTime } = req.body;
    const result = await scheduler.reschedule(req.params.meetingId, newStartTime, newEndTime);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reschedule' });
  }
});

app.delete('/api/meetings/:meetingId', async (req, res) => {
  try {
    const reason = req.query.reason as string;
    const result = await scheduler.cancelMeeting(req.params.meetingId, reason);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel meeting' });
  }
});

app.get('/api/schedule/:date', async (req, res) => {
  try {
    const employeeId = req.query.employeeId as string;
    const result = await scheduler.getDailySchedule(req.params.date, employeeId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Scheduler AI',
    version: '1.0.0',
    port: PORT,
    totalMeetings: meetings.size
  });
});

app.listen(PORT, () => {
  console.log(`\n  Scheduler AI running on port ${PORT}\n`);
});

export default app;
