/**
 * PROPFLOW - Calendar Check Tool
 * Tool for checking broker and lead availability
 */

import { BaseTool } from '@hojai/agent-runtime';
import { AgentContext, ToolResult } from '@hojai/agent-runtime';
import { SiteVisit, User } from '../../models';

export class CalendarCheckTool extends BaseTool {
  name = 'calendarCheck';
  description = 'Check availability for scheduling visits';

  parameters = [
    {
      name: 'date',
      type: 'string',
      description: 'Date to check (YYYY-MM-DD format)',
      required: true
    },
    {
      name: 'agentId',
      type: 'string',
      description: 'Agent ID to check availability for',
      required: false
    },
    {
      name: 'excludeVisitId',
      type: 'string',
      description: 'Visit ID to exclude from check (for rescheduling)',
      required: false
    }
  ];

  async execute(params: Record<string, any>, context: AgentContext): Promise<ToolResult> {
    try {
      const { date, agentId, excludeVisitId } = params;
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      // Build query
      const query: any = {
        date: { $gte: dateStart, $lte: dateEnd },
        status: { $in: ['scheduled', 'completed'] }
      };

      if (agentId) {
        query.agentId = agentId;
      }

      if (excludeVisitId) {
        query._id = { $ne: excludeVisitId };
      }

      const existingVisits = await SiteVisit.find(query).lean();

      // Generate available slots
      const businessStartHour = 9;
      const businessEndHour = 20;
      const slotDuration = 30;

      const bookedSlots = new Set(
        existingVisits.map(v => `${v.time}`)
      );

      const availableSlots: Array<{
        time: string;
        available: boolean;
        reason?: string;
      }> = [];

      for (let hour = businessStartHour; hour < businessEndHour; hour++) {
        for (let min = 0; min < 60; min += slotDuration) {
          const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          const isBooked = bookedSlots.has(time);

          availableSlots.push({
            time,
            available: !isBooked,
            reason: isBooked ? 'Already booked' : undefined
          });
        }
      }

      // Get agents available on this day
      const availableAgents = agentId ? [] : await User.find({
        role: 'agent',
        isActive: true
      }).lean();

      return {
        result: {
          date,
          totalSlots: availableSlots.length,
          availableSlots: availableSlots.filter(s => s.available).length,
          bookedSlots: availableSlots.filter(s => !s.available).length,
          slots: availableSlots,
          existingVisits: existingVisits.map(v => ({
            id: v._id,
            time: v.time,
            agentId: v.agentId
          })),
          availableAgents: availableAgents.map(a => ({
            id: a._id,
            name: a.name
          }))
        }
      };
    } catch (error) {
      return {
        result: null,
        error: `Calendar check failed: ${error}`
      };
    }
  }
}

export default new CalendarCheckTool();