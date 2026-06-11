/**
 * PROPFLOW - Real Estate AI Operating System
 * AI Employee: Site Visit Agent (LLM-Powered)
 * Handles visit scheduling, reminders, and feedback collection
 * Upgraded from rule-based to LLM-powered scheduling
 */

import { SiteVisit, Lead, Property, User } from '../models';
import { logger } from '../config/logger';
import { ISiteVisit } from '../models';
import { AgentRuntime } from '@hojai/agent-runtime';

// ============================================
// Types
// ============================================

interface VisitSchedulingRequest {
  leadId: string;
  propertyId: string;
  preferredDates: Date[];
  preferredTimes?: string[];
  notes?: string;
  agentId?: string;
}

interface VisitSlot {
  date: string;
  time: string;
  available: boolean;
  agentId?: string;
  duration: number;
  score?: number;
  reason?: string;
}

interface VisitOptimization {
  optimalSlots: VisitSlot[];
  conflictWarnings: string[];
  travelTime?: number;
  groupedVisits?: Array<{
    date: string;
    visits: Array<{ propertyId: string; time: string; location: string }>;
  }>;
  routeOptimization?: {
    suggestedOrder: string[];
    totalDistance?: string;
    estimatedDuration: string;
  };
}

interface VisitReminder {
  visitId: string;
  type: '24h' | '2h' | '30min';
  message: string;
  recipient: { name: string; phone: string; email?: string };
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed';
}

interface VisitFeedback {
  visitId: string;
  overallRating: number;
  propertyRating: number;
  agentRating: number;
  comments: string;
  nextSteps: string;
  buyerSentiment: 'very-positive' | 'positive' | 'neutral' | 'negative' | 'very-negative';
}

// ============================================
// Site Visit Agent (LLM-Powered)
// ============================================

export class SiteVisitAgent {
  private runtime: AgentRuntime;
  private readonly BUSINESS_START_HOUR = 9;
  private readonly BUSINESS_END_HOUR = 20;
  private readonly SLOT_DURATION = 30;

  constructor() {
    this.runtime = new AgentRuntime();
    logger.info('Site Visit Agent (LLM) initialized');
  }

  /**
   * LLM-powered optimal slot finding
   */
  async findOptimalSlots(request: VisitSchedulingRequest): Promise<VisitOptimization> {
    try {
      logger.info('Site Visit Agent (LLM): Finding optimal slots', request);

      const [lead, property] = await Promise.all([
        Lead.findById(request.leadId),
        Property.findById(request.propertyId)
      ]);

      if (!lead || !property) {
        throw new Error('Lead or Property not found');
      }

      // Check for existing visits
      const existingVisits = await SiteVisit.find({
        date: { $in: request.preferredDates.map(d => new Date(d)) },
        status: { $in: ['scheduled', 'completed'] }
      });

      // Get available brokers
      const brokers = await User.find({ role: 'agent', isActive: true });

      try {
        // Use LLM for intelligent slot selection
        return await this.findSlotsWithLLM(request, lead, property, existingVisits, brokers);
      } catch (error) {
        logger.warn('Site Visit Agent (LLM): LLM scheduling failed, using fallback', { error });
        return this.findSlotsFallback(request, existingVisits);
      }

    } catch (error) {
      logger.error('Site Visit Agent (LLM): Slot finding failed', { error });
      throw error;
    }
  }

  /**
   * LLM-powered slot finding
   */
  private async findSlotsWithLLM(
    request: VisitSchedulingRequest,
    lead: any,
    property: any,
    existingVisits: any[],
    brokers: any[]
  ): Promise<VisitOptimization> {
    const prompt = this.buildSchedulingPrompt(request, lead, property, existingVisits, brokers);

    const response = await this.runtime.runAgent('Visit Scheduler', prompt, {
      custom: {
        existingVisits,
        brokers,
        lead,
        property
      }
    });

    return this.parseSchedulingResponse(response.content, request);
  }

  /**
   * Build scheduling prompt for LLM
   */
  private buildSchedulingPrompt(
    request: VisitSchedulingRequest,
    lead: any,
    property: any,
    existingVisits: any[],
    brokers: any[]
  ): string {
    const existingSlots = existingVisits.map(v => ({
      date: new Date(v.date).toISOString().split('T')[0],
      time: v.time,
      brokerId: v.agentId
    }));

    const brokerAvail = brokers.map(b => ({
      id: b._id,
      name: b.name,
      region: b.assignedRegion
    }));

    return `You are an expert property visit scheduler.

Find optimal visit slots for this scheduling request:

LEAD:
${JSON.stringify({ name: lead.name, phone: lead.phone, preferredTimes: request.preferredTimes })}

PROPERTY:
${JSON.stringify({ title: property.title, location: property.location, estimatedVisitDuration: 30 })}

PREFERRED DATES:
${request.preferredDates.map(d => new Date(d).toISOString().split('T')[0]).join(', ')}

BUSINESS HOURS: ${this.BUSINESS_START_HOUR}:00 - ${this.BUSINESS_END_HOUR}:00
SLOT DURATION: ${this.SLOT_DURATION} minutes

EXISTING BOOKED SLOTS:
${JSON.stringify(existingSlots)}

AVAILABLE BROKERS:
${JSON.stringify(brokerAvail)}

Generate available time slots for the next 7 days.
Consider:
1. Lead's preferred times
2. Broker availability
3. Optimal visiting hours (morning 9-12 best for property viewing)
4. Avoiding conflicts

Return as JSON:
{
  "optimalSlots": [
    { "date": "2026-01-15", "time": "10:00", "available": true, "score": 95, "reason": "Morning slot, optimal lighting" },
    ...
  ],
  "conflictWarnings": ["..."],
  "routeOptimization": { ... }
}`;
  }

  /**
   * Parse LLM scheduling response
   */
  private parseSchedulingResponse(content: string, request: VisitSchedulingRequest): VisitOptimization {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        optimalSlots: (parsed.optimalSlots || []).map((slot: any) => ({
          date: slot.date,
          time: slot.time,
          available: slot.available ?? true,
          agentId: slot.agentId,
          duration: this.SLOT_DURATION,
          score: slot.score,
          reason: slot.reason
        })),
        conflictWarnings: parsed.conflictWarnings || [],
        travelTime: parsed.travelTime,
        groupedVisits: parsed.groupedVisits,
        routeOptimization: parsed.routeOptimization
      };

    } catch (error) {
      logger.error('Site Visit Agent: Failed to parse scheduling response', { error });
      return this.findSlotsFallback(request, []);
    }
  }

  /**
   * Fallback slot finding
   */
  private findSlotsFallback(request: VisitSchedulingRequest, existingVisits: any[]): VisitOptimization {
    const optimalSlots: VisitSlot[] = [];
    const conflictWarnings: string[] = [];

    for (const date of request.preferredDates) {
      const dateStr = new Date(date).toISOString().split('T')[0];
      const dayOfWeek = new Date(date).getDay();

      if (dayOfWeek === 0) {
        conflictWarnings.push('Sunday - limited availability');
        continue;
      }

      for (let hour = this.BUSINESS_START_HOUR; hour < this.BUSINESS_END_HOUR; hour++) {
        for (let min = 0; min < 60; min += this.SLOT_DURATION) {
          const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

          const isConflict = existingVisits.some(visit => {
            const visitDate = new Date(visit.date).toISOString().split('T')[0];
            return visitDate === dateStr && visit.time === time;
          });

          if (!isConflict) {
            let available = true;
            if (request.preferredTimes?.length && !request.preferredTimes.includes(time)) {
              available = false;
            }

            if (available) {
              // Score based on optimal visiting hours
              let score = 50;
              if (hour >= 9 && hour < 12) score += 30; // Morning - best
              else if (hour >= 12 && hour < 15) score += 20; // Afternoon
              else if (hour >= 15 && hour < 18) score += 10; // Late afternoon

              optimalSlots.push({
                date: dateStr,
                time,
                available: true,
                duration: this.SLOT_DURATION,
                score,
                reason: hour >= 9 && hour < 12 ? 'Morning slot - optimal lighting' : 'Afternoon slot'
              });
            }
          } else {
            conflictWarnings.push(`Slot ${dateStr} ${time} already booked`);
          }
        }
      }
    }

    // Sort by score
    optimalSlots.sort((a, b) => (b.score || 0) - (a.score || 0));

    return { optimalSlots, conflictWarnings };
  }

  /**
   * Schedule a visit
   */
  async scheduleVisit(request: VisitSchedulingRequest): Promise<ISiteVisit> {
    try {
      logger.info('Site Visit Agent (LLM): Scheduling visit', request);

      const [lead, property] = await Promise.all([
        Lead.findById(request.leadId),
        Property.findById(request.propertyId)
      ]);

      if (!lead || !property) {
        throw new Error('Lead or Property not found');
      }

      // Find optimal slots
      const slots = await this.findOptimalSlots(request);
      if (slots.optimalSlots.length === 0) {
        throw new Error('No available slots found');
      }

      const selectedSlot = slots.optimalSlots[0];

      // Create the visit
      const visit = await SiteVisit.create({
        leadId: request.leadId,
        propertyId: request.propertyId,
        date: new Date(selectedSlot.date),
        time: selectedSlot.time,
        duration: this.SLOT_DURATION,
        status: 'scheduled',
        agentId: request.agentId || selectedSlot.agentId,
        notes: request.notes,
        reminderSent: false
      });

      // Update lead status
      if (lead.status === 'qualified') {
        await Lead.findByIdAndUpdate(request.leadId, {
          status: 'visiting',
          visitCount: lead.visitCount + 1
        });
      }

      logger.info('Site Visit Agent (LLM): Visit scheduled', { visitId: visit._id });
      return visit;

    } catch (error) {
      logger.error('Site Visit Agent (LLM): Scheduling failed', { error });
      throw error;
    }
  }

  /**
   * Reschedule a visit
   */
  async rescheduleVisit(visitId: string, newDate: Date, newTime: string): Promise<ISiteVisit> {
    try {
      const visit = await SiteVisit.findById(visitId);
      if (!visit) {
        throw new Error('Visit not found');
      }

      const conflictingVisit = await SiteVisit.findOne({
        _id: { $ne: visitId },
        date: newDate,
        time: newTime,
        status: { $in: ['scheduled', 'completed'] }
      });

      if (conflictingVisit) {
        throw new Error('Time slot not available');
      }

      visit.date = newDate;
      visit.time = newTime;
      visit.status = 'rescheduled';
      visit.reminderSent = false;
      await visit.save();

      logger.info('Site Visit Agent (LLM): Visit rescheduled', { visitId, newDate, newTime });
      return visit;

    } catch (error) {
      logger.error('Site Visit Agent (LLM): Rescheduling failed', { error });
      throw error;
    }
  }

  /**
   * Cancel a visit
   */
  async cancelVisit(visitId: string, reason?: string): Promise<ISiteVisit> {
    try {
      const visit = await SiteVisit.findById(visitId);
      if (!visit) {
        throw new Error('Visit not found');
      }

      visit.status = 'cancelled';
      if (reason) {
        visit.notes = visit.notes ? `${visit.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
      }

      await visit.save();
      logger.info('Site Visit Agent (LLM): Visit cancelled', { visitId });

      return visit;

    } catch (error) {
      logger.error('Site Visit Agent (LLM): Cancellation failed', { error });
      throw error;
    }
  }

  /**
   * Mark visit as completed
   */
  async completeVisit(visitId: string, feedback?: VisitFeedback): Promise<ISiteVisit> {
    try {
      const visit = await SiteVisit.findById(visitId);
      if (!visit) {
        throw new Error('Visit not found');
      }

      visit.status = 'completed';
      visit.confirmedAt = new Date();

      if (feedback) {
        visit.feedback = feedback.comments;
        visit.rating = feedback.overallRating;
      }

      await visit.save();

      const pendingVisits = await SiteVisit.countDocuments({
        leadId: visit.leadId,
        status: 'scheduled',
        _id: { $ne: visitId }
      });

      if (pendingVisits === 0) {
        await Lead.findByIdAndUpdate(visit.leadId, {
          lastContact: new Date(),
          nextFollowUp: feedback?.nextSteps ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : undefined
        });
      }

      logger.info('Site Visit Agent (LLM): Visit completed', { visitId });
      return visit;

    } catch (error) {
      logger.error('Site Visit Agent (LLM): Completion failed', { error });
      throw error;
    }
  }

  /**
   * Generate visit reminders (LLM-enhanced)
   */
  async generateReminders(): Promise<VisitReminder[]> {
    try {
      const now = new Date();
      const reminders: VisitReminder[] = [];

      const visits24h = await SiteVisit.find({
        status: 'scheduled',
        date: {
          $gte: now,
          $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000)
        }
      }).populate('leadId propertyId');

      for (const visit of visits24h) {
        const visitDateTime = new Date(visit.date);
        visitDateTime.setHours(parseInt(visit.time.split(':')[0]), parseInt(visit.time.split(':')[1]));

        const lead = visit.leadId as any;
        const property = visit.propertyId as any;

        const timeUntilVisit = visitDateTime.getTime() - now.getTime();
        const hoursUntil = timeUntilVisit / (1000 * 60 * 60);

        // Generate LLM-enhanced message
        let message = '';

        try {
          const response = await this.runtime.runAgent('Visit Scheduler', `
            Generate a personalized visit reminder message:

            LEAD: ${lead?.name}
            PROPERTY: ${property?.title}
            ADDRESS: ${property?.location?.address}
            TIME: ${visit.time}
            HOURS_UNTIL: ${Math.round(hoursUntil)}

            Return just the message text, keeping it friendly and professional.
          `);

          message = response.content.trim();
        } catch (error) {
          // Fallback message
          message = hoursUntil <= 2
            ? `Your site visit for ${property?.title || 'property'} is in 2 hours at ${visit.time}. Address: ${property?.location?.address || 'See details'}`
            : `Reminder: Site visit for ${property?.title || 'property'} scheduled tomorrow at ${visit.time}`;
        }

        if (hoursUntil <= 24 && hoursUntil > 2 && !visit.reminderSent) {
          reminders.push({
            visitId: visit._id.toString(),
            type: '24h',
            message,
            recipient: {
              name: lead?.name || 'Unknown',
              phone: lead?.phone || '',
              email: lead?.email
            },
            scheduledFor: new Date(visitDateTime.getTime() - 24 * 60 * 60 * 1000),
            status: 'pending'
          });
        }

        if (hoursUntil <= 2 && hoursUntil > 0.5) {
          reminders.push({
            visitId: visit._id.toString(),
            type: '2h',
            message,
            recipient: {
              name: lead?.name || 'Unknown',
              phone: lead?.phone || '',
              email: lead?.email
            },
            scheduledFor: new Date(visitDateTime.getTime() - 2 * 60 * 60 * 1000),
            status: 'pending'
          });
        }
      }

      return reminders;

    } catch (error) {
      logger.error('Site Visit Agent (LLM): Reminder generation failed', { error });
      throw error;
    }
  }

  /**
   * Optimize day schedule (LLM-enhanced)
   */
  async optimizeDaySchedule(date: Date, agentId?: string): Promise<VisitOptimization> {
    try {
      const query: any = { date, status: 'scheduled' };
      if (agentId) query.agentId = agentId;

      const visits = await SiteVisit.find(query).populate('propertyId leadId');

      if (visits.length <= 1) {
        return {
          optimalSlots: visits.map(v => ({
            date: new Date(v.date).toISOString().split('T')[0],
            time: v.time,
            available: true,
            agentId: v.agentId,
            duration: v.duration
          })),
          conflictWarnings: []
        };
      }

      // Sort by time
      const sortedVisits = [...visits].sort((a, b) => a.time.localeCompare(b.time));

      // Get LLM route optimization
      let routeOptimization;
      try {
        const response = await this.runtime.runAgent('Visit Scheduler', `
          Optimize this route for property visits:

          VISITS:
          ${JSON.stringify(visits.map(v => {
            const prop = v.propertyId as any;
            return {
              id: v._id,
              time: v.time,
              location: prop?.location,
              address: prop?.location?.address
            };
          }), null, 2)}

          Return as JSON:
          {
            "suggestedOrder": ["visitId1", "visitId2"],
            "estimatedDuration": "3 hours",
            "notes": "..."
          }
        `);

        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          routeOptimization = JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        logger.warn('Site Visit Agent: LLM route optimization failed', { error });
      }

      // Group visits by location
      const groupedVisits: Array<{
        date: string;
        visits: Array<{ propertyId: string; time: string; location: string }>;
      }> = [{
        date: new Date(date).toISOString().split('T')[0],
        visits: sortedVisits.map(v => {
          const property = v.propertyId as any;
          return {
            propertyId: v.propertyId.toString(),
            time: v.time,
            location: property?.location?.locality || 'Unknown'
          };
        })
      }];

      return {
        optimalSlots: sortedVisits.map(v => ({
          date: new Date(v.date).toISOString().split('T')[0],
          time: v.time,
          available: true,
          agentId: v.agentId,
          duration: v.duration
        })),
        conflictWarnings: [],
        groupedVisits,
        routeOptimization
      };

    } catch (error) {
      logger.error('Site Visit Agent (LLM): Day optimization failed', { error });
      throw error;
    }
  }

  /**
   * Get visit analytics
   */
  async getVisitAnalytics(startDate?: Date, endDate?: Date): Promise<{
    summary: {
      totalVisits: number;
      completed: number;
      cancelled: number;
      noShow: number;
      avgRating: number;
    };
    byAgent: Array<{ agentId: string; visits: number; avgRating: number }>;
    byProperty: Array<{ propertyId: string; visits: number }>;
    trends: Array<{ date: string; count: number }>;
    insights?: string[];
  }> {
    try {
      const query: any = {};
      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }

      const visits = await SiteVisit.find(query);
      const completedVisits = visits.filter(v => v.status === 'completed');

      const byAgentMap = new Map<string, { visits: number; totalRating: number }>();
      const byPropertyMap = new Map<string, number>();
      const dateMap = new Map<string, number>();

      visits.forEach(visit => {
        if (visit.agentId) {
          const agentData = byAgentMap.get(visit.agentId) || { visits: 0, totalRating: 0 };
          agentData.visits++;
          if (visit.rating) agentData.totalRating += visit.rating;
          byAgentMap.set(visit.agentId, agentData);
        }

        const propId = visit.propertyId.toString();
        byPropertyMap.set(propId, (byPropertyMap.get(propId) || 0) + 1);

        const dateStr = new Date(visit.date).toISOString().split('T')[0];
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      });

      // Get LLM insights
      let insights: string[] = [];
      try {
        const response = await this.runtime.runAgent('Visit Scheduler', `
          Analyze these visit analytics and provide insights:

          ${JSON.stringify({
            totalVisits: visits.length,
            completed: completedVisits.length,
            cancelled: visits.filter(v => v.status === 'cancelled').length,
            avgRating: completedVisits.length > 0
              ? completedVisits.reduce((sum, v) => sum + (v.rating || 0), 0) / completedVisits.length
              : 0
          })}

          Provide 3-5 actionable insights.

          Return as JSON:
          { "insights": ["insight1", "insight2"] }
        `);

        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          insights = JSON.parse(jsonMatch[0]).insights || [];
        }
      } catch (error) {
        logger.warn('Site Visit Agent: LLM analytics insights failed', { error });
      }

      return {
        summary: {
          totalVisits: visits.length,
          completed: completedVisits.length,
          cancelled: visits.filter(v => v.status === 'cancelled').length,
          noShow: visits.filter(v => v.status === 'no-show').length,
          avgRating: completedVisits.length > 0
            ? Math.round(completedVisits.reduce((sum, v) => sum + (v.rating || 0), 0) / completedVisits.length * 10) / 10
            : 0
        },
        byAgent: Array.from(byAgentMap.entries()).map(([agentId, data]) => ({
          agentId,
          visits: data.visits,
          avgRating: data.totalRating / data.visits
        })),
        byProperty: Array.from(byPropertyMap.entries()).map(([propertyId, visits]) => ({
          propertyId,
          visits
        })),
        trends: Array.from(dateMap.entries()).map(([date, count]) => ({ date, count })),
        insights
      };

    } catch (error) {
      logger.error('Site Visit Agent (LLM): Analytics failed', { error });
      throw error;
    }
  }

  /**
   * Process feedback (LLM-enhanced)
   */
  async processFeedback(visitId: string, feedback: VisitFeedback): Promise<void> {
    try {
      const visit = await SiteVisit.findByIdAndUpdate(visitId, {
        feedback: feedback.comments,
        rating: feedback.overallRating,
        status: 'completed',
        confirmedAt: new Date()
      }, { new: true });

      if (!visit) {
        throw new Error('Visit not found');
      }

      // Analyze feedback with LLM
      let sentimentAnalysis = feedback.buyerSentiment;
      try {
        const response = await this.runtime.runAgent('Visit Scheduler', `
          Analyze this visit feedback and determine next steps:

          FEEDBACK:
          - Overall Rating: ${feedback.overallRating}/5
          - Property Rating: ${feedback.propertyRating}/5
          - Agent Rating: ${feedback.agentRating}/5
          - Comments: ${feedback.comments}
          - Suggested Next Steps: ${feedback.nextSteps}

          Determine:
          1. Buyer sentiment (very-positive/positive/neutral/negative/very-negative)
          2. Recommended follow-up actions

          Return as JSON:
          { "sentiment": "...", "recommendedActions": ["..."] }
        `);

        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          sentimentAnalysis = parsed.sentiment || feedback.buyerSentiment;
          // Could use parsed.recommendedActions for further automation
        }
      } catch (error) {
        logger.warn('Site Visit Agent: LLM feedback analysis failed', { error });
      }

      // Update lead based on sentiment
      const lead = await Lead.findById(visit.leadId);
      if (lead) {
        let statusUpdate: string | undefined;
        let scoreAdjustment = 0;

        switch (sentimentAnalysis) {
          case 'very-positive':
            scoreAdjustment = 10;
            break;
          case 'positive':
            scoreAdjustment = 5;
            break;
          case 'negative':
            scoreAdjustment = -5;
            break;
          case 'very-negative':
            scoreAdjustment = -10;
            statusUpdate = 'closed-lost';
            break;
        }

        const updateData: any = {
          lastContact: new Date(),
          score: Math.max(0, Math.min(100, lead.score + scoreAdjustment))
        };

        if (statusUpdate) {
          updateData.status = statusUpdate;
        }

        await Lead.findByIdAndUpdate(lead._id, updateData);
      }

      logger.info('Site Visit Agent (LLM): Feedback processed', { visitId, sentiment: sentimentAnalysis });

    } catch (error) {
      logger.error('Site Visit Agent (LLM): Feedback processing failed', { error });
      throw error;
    }
  }

  /**
   * Get upcoming visits for a lead
   */
  async getLeadUpcomingVisits(leadId: string): Promise<ISiteVisit[]> {
    return SiteVisit.find({
      leadId,
      status: 'scheduled',
      date: { $gte: new Date() }
    }).populate('propertyId').sort({ date: 1, time: 1 });
  }

  /**
   * Get visits scheduled for today
   */
  async getTodayVisits(agentId?: string): Promise<ISiteVisit[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query: any = {
      date: { $gte: today, $lt: tomorrow },
      status: 'scheduled'
    };
    if (agentId) query.agentId = agentId;

    return SiteVisit.find(query).populate('leadId propertyId').sort({ time: 1 });
  }
}

export default new SiteVisitAgent();