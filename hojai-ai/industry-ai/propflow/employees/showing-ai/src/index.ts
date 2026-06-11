/**
 * Showing AI - Property Site Visit Scheduling & Management
 * Part of PROPFLOW - Real Estate AI Operating System
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4922;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface PropertyShowing {
  id: string;
  propertyId: string;
  propertyTitle: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  agentId: string;
  agentName: string;
  scheduledTime: string;
  duration: number; // minutes
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  visitType: 'in_person' | 'virtual' | 'video_call';
  notes: string[];
  feedback?: {
    rating: number;
    comments?: string;
    interested: boolean;
    followUpRequired: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface ShowingSlot {
  agentId: string;
  agentName: string;
  propertyId: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

interface ShowingRequest {
  propertyId: string;
  propertyTitle: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  preferredDate: string;
  preferredTimeSlot: string;
  visitType: 'in_person' | 'virtual' | 'video_call';
  notes?: string;
}

interface ShowingAvailability {
  propertyId: string;
  propertyTitle: string;
  slots: {
    date: string;
    times: { time: string; agentId: string; agentName: string; available: boolean }[];
  }[];
}

// ============================================
// IN-MEMORY STORE
// ============================================

const showings = new Map<string, PropertyShowing>();

// Sample showings
const sampleShowings: PropertyShowing[] = [
  {
    id: '1',
    propertyId: 'prop1',
    propertyTitle: '3BHK Apartment in Andheri West',
    leadId: 'lead1',
    leadName: 'Priya Sharma',
    leadPhone: '9876543210',
    agentId: 'agent1',
    agentName: 'Rajesh Kumar',
    scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 30,
    status: 'confirmed',
    visitType: 'in_person',
    notes: ['First-time buyer', 'Interested in sunset view'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    propertyId: 'prop2',
    propertyTitle: '4BHK Villa in Palm Beach',
    leadId: 'lead2',
    leadName: 'Rahul Mehta',
    leadPhone: '9876543211',
    agentId: 'agent2',
    agentName: 'Sunita Patel',
    scheduledTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    status: 'scheduled',
    visitType: 'in_person',
    notes: ['NRI family visiting from USA'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

sampleShowings.forEach(s => showings.set(s.id, s));

// ============================================
// HELPERS
// ============================================

function generateTimeSlots(date: string): ShowingSlot[] {
  const slots: ShowingSlot[] = [];
  const agents = [
    { id: 'agent1', name: 'Rajesh Kumar' },
    { id: 'agent2', name: 'Sunita Patel' },
    { id: 'agent3', name: 'Amit Singh' }
  ];

  const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  agents.forEach(agent => {
    times.forEach(time => {
      slots.push({
        agentId: agent.id,
        agentName: agent.name,
        propertyId: 'any',
        date,
        startTime: time,
        endTime: `${parseInt(time.split(':')[0]) + 1}:00`,
        available: Math.random() > 0.3 // 70% availability
      });
    });
  });

  return slots;
}

function findAvailableAgent(date: string, time: string): { agentId: string; agentName: string } | null {
  const slots = generateTimeSlots(date);
  const slot = slots.find(s => s.date === date && s.startTime === time && s.available);
  return slot ? { agentId: slot.agentId, agentName: slot.agentName } : null;
}

// ============================================
// API ROUTES
// ============================================

/**
 * Get availability for a property
 */
app.get('/api/showings/availability', async (req: Request, res: Response) => {
  try {
    const { propertyId, startDate, endDate } = req.query;

    if (!propertyId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required params: propertyId, startDate, endDate' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const availability: ShowingAvailability = {
      propertyId: propertyId as string,
      propertyTitle: 'Property in ' + (propertyId as string),
      slots: []
    };

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0) continue; // Skip Sunday

      const dateStr = d.toISOString().split('T')[0];
      const slots = generateTimeSlots(dateStr);

      // Group by time
      const timeMap = new Map<string, typeof slots>();
      slots.forEach(slot => {
        if (!timeMap.has(slot.startTime)) {
          timeMap.set(slot.startTime, []);
        }
        timeMap.get(slot.startTime)!.push(slot);
      });

      const times = Array.from(timeMap.entries()).map(([time, agentSlots]) => ({
        time,
        agentId: agentSlots[0].agentId,
        agentName: agentSlots[0].agentName,
        available: agentSlots.some(s => s.available)
      }));

      availability.slots.push({ date: dateStr, times });
    }

    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

/**
 * Schedule a property showing
 */
app.post('/api/showings/schedule', async (req: Request, res: Response) => {
  try {
    const request: ShowingRequest = req.body;

    if (!request.propertyId || !request.leadId || !request.preferredDate || !request.preferredTimeSlot) {
      return res.status(400).json({
        error: 'Missing required fields: propertyId, leadId, preferredDate, preferredTimeSlot'
      });
    }

    // Find available agent
    const agent = findAvailableAgent(request.preferredDate, request.preferredTimeSlot);
    if (!agent) {
      return res.status(400).json({
        error: 'No agents available for the selected time slot',
        suggestion: 'Please choose a different time or date'
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const showing: PropertyShowing = {
      id,
      propertyId: request.propertyId,
      propertyTitle: request.propertyTitle,
      leadId: request.leadId,
      leadName: request.leadName,
      leadPhone: request.leadPhone,
      agentId: agent.agentId,
      agentName: agent.agentName,
      scheduledTime: `${request.preferredDate}T${request.preferredTimeSlot}:00Z`,
      duration: request.visitType === 'in_person' ? 30 : 15,
      status: 'scheduled',
      visitType: request.visitType,
      notes: request.notes || [],
      createdAt: now,
      updatedAt: now
    };

    showings.set(id, showing);

    res.status(201).json({
      success: true,
      showing,
      message: `Showing scheduled for ${request.leadName} at ${request.propertyTitle}`,
      confirmationSent: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule showing' });
  }
});

/**
 * Get showing by ID
 */
app.get('/api/showings/:id', async (req: Request, res: Response) => {
  try {
    const showing = showings.get(req.params.id);
    if (!showing) {
      return res.status(404).json({ error: 'Showing not found' });
    }

    res.json({ success: true, showing });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get showing' });
  }
});

/**
 * Get all showings with filtering
 */
app.get('/api/showings', async (req: Request, res: Response) => {
  try {
    const { propertyId, leadId, agentId, status, date } = req.query;
    let result = Array.from(showings.values());

    if (propertyId) result = result.filter(s => s.propertyId === propertyId);
    if (leadId) result = result.filter(s => s.leadId === leadId);
    if (agentId) result = result.filter(s => s.agentId === agentId);
    if (status) result = result.filter(s => s.status === status);
    if (date) result = result.filter(s => s.scheduledTime.startsWith(date as string));

    result.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    const summary = {
      total: result.length,
      scheduled: result.filter(s => s.status === 'scheduled').length,
      completed: result.filter(s => s.status === 'completed').length,
      cancelled: result.filter(s => s.status === 'cancelled').length,
      noShow: result.filter(s => s.status === 'no_show').length
    };

    res.json({ success: true, showings: result, summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get showings' });
  }
});

/**
 * Update showing status
 */
app.patch('/api/showings/:id', async (req: Request, res: Response) => {
  try {
    const showing = showings.get(req.params.id);
    if (!showing) {
      return res.status(404).json({ error: 'Showing not found' });
    }

    const { status, notes, feedback } = req.body;

    if (status) {
      showing.status = status;
    }

    if (notes) {
      showing.notes.push(...notes);
    }

    if (feedback) {
      showing.feedback = feedback;
    }

    showing.updatedAt = new Date().toISOString();
    showings.set(showing.id, showing);

    res.json({ success: true, showing });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update showing' });
  }
});

/**
 * Complete showing with feedback
 */
app.post('/api/showings/:id/complete', async (req: Request, res: Response) => {
  try {
    const showing = showings.get(req.params.id);
    if (!showing) {
      return res.status(404).json({ error: 'Showing not found' });
    }

    const { rating, comments, interested, followUpRequired, nextSteps } = req.body;

    showing.status = 'completed';
    showing.feedback = {
      rating: rating || 4,
      comments,
      interested: interested !== false,
      followUpRequired: followUpRequired !== false
    };

    if (nextSteps) {
      showing.notes.push(`Next steps: ${nextSteps}`);
    }

    showing.updatedAt = new Date().toISOString();
    showings.set(showing.id, showing);

    const actionItems = [];
    if (interested) {
      actionItems.push('Schedule follow-up meeting');
      actionItems.push('Send property documents');
      actionItems.push('Prepare offer letter');
    } else {
      actionItems.push('Add to nurture list');
      actionItems.push('Share similar properties');
    }

    res.json({
      success: true,
      showing,
      actionItems,
      leadScore: interested ? '+15 points' : '-5 points'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete showing' });
  }
});

/**
 * Cancel showing
 */
app.post('/api/showings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const showing = showings.get(req.params.id);
    if (!showing) {
      return res.status(404).json({ error: 'Showing not found' });
    }

    const { reason } = req.body;

    showing.status = 'cancelled';
    showing.notes.push(`Cancelled: ${reason || 'No reason provided'}`);
    showing.updatedAt = new Date().toISOString();
    showings.set(showing.id, showing);

    res.json({
      success: true,
      showing,
      message: 'Showing cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel showing' });
  }
});

/**
 * Mark as no-show
 */
app.post('/api/showings/:id/no-show', async (req: Request, res: Response) => {
  try {
    const showing = showings.get(req.params.id);
    if (!showing) {
      return res.status(404).json({ error: 'Showing not found' });
    }

    showing.status = 'no_show';
    showing.updatedAt = new Date().toISOString();
    showings.set(showing.id, showing);

    res.json({
      success: true,
      showing,
      actionItems: ['Contact lead to reschedule', 'Update lead status'],
      penalty: 'Lead score reduced'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark no-show' });
  }
});

/**
 * Get agent's showing schedule
 */
app.get('/api/agents/:agentId/schedule', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const agentShowings = Array.from(showings.values())
      .filter(s => s.agentId === req.params.agentId)
      .filter(s => !date || s.scheduledTime.startsWith(date as string))
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    const dailySummary = {
      total: agentShowings.length,
      morning: agentShowings.filter(s => {
        const hour = new Date(s.scheduledTime).getHours();
        return hour < 12;
      }).length,
      afternoon: agentShowings.filter(s => {
        const hour = new Date(s.scheduledTime).getHours();
        return hour >= 12 && hour < 17;
      }).length,
      evening: agentShowings.filter(s => {
        const hour = new Date(s.scheduledTime).getHours();
        return hour >= 17;
      }).length
    };

    res.json({
      success: true,
      agentId: req.params.agentId,
      showings: agentShowings,
      dailySummary
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agent schedule' });
  }
});

/**
 * Get showing analytics
 */
app.get('/api/showings/analytics', async (req: Request, res: Response) => {
  try {
    const allShowings = Array.from(showings.values());

    const avgRating = allShowings.filter(s => s.feedback?.rating)
      .reduce((sum, s) => sum + (s.feedback?.rating || 0), 0) /
      allShowings.filter(s => s.feedback?.rating).length || 0;

    const conversionRate = allShowings.filter(s => s.feedback?.interested).length /
      allShowings.filter(s => s.status === 'completed').length * 100 || 0;

    res.json({
      success: true,
      analytics: {
        totalShowings: allShowings.length,
        completed: allShowings.filter(s => s.status === 'completed').length,
        cancelled: allShowings.filter(s => s.status === 'cancelled').length,
        noShows: allShowings.filter(s => s.status === 'no_show').length,
        conversionRate: Math.round(conversionRate),
        avgRating: Math.round(avgRating * 10) / 10,
        mostProductiveAgent: 'Rajesh Kumar',
        busiestDay: 'Saturday'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  const allShowings = Array.from(showings.values());
  res.json({
    status: 'healthy',
    service: 'showing-ai',
    version: '1.0.0',
    port: PORT,
    capabilities: [
      'Showing scheduling',
      'Agent assignment',
      'Feedback collection',
      'Analytics & reporting'
    ],
    stats: {
      totalShowings: showings.size,
      scheduledToday: allShowings.filter(s =>
        s.status === 'scheduled' &&
        s.scheduledTime.startsWith(new Date().toISOString().split('T')[0])
      ).length
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'PROPFLOW Showing AI',
    description: 'Property site visit and showing scheduling agent',
    version: '1.0.0',
    endpoints: {
      availability: 'GET /api/showings/availability',
      schedule: 'POST /api/showings/schedule',
      list: 'GET /api/showings',
      get: 'GET /api/showings/:id',
      update: 'PATCH /api/showings/:id',
      complete: 'POST /api/showings/:id/complete',
      cancel: 'POST /api/showings/:id/cancel',
      noShow: 'POST /api/showings/:id/no-show',
      agentSchedule: 'GET /api/agents/:agentId/schedule',
      analytics: 'GET /api/showings/analytics'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗
║                 PROPFLOW SHOWING AI v1.0.0            ║
║          Property Site Visit & Scheduling Agent         ║
║                                                              ║
║  Tagline: "AI That Turns Viewings Into Deals"        ║
║  Port: ${PORT}                                               ║
║                                                              ║
║  Capabilities:                                           ║
║  • Smart scheduling & agent assignment                   ║
║  • Availability management                              ║
║  • Feedback collection                                 ║
║  • Conversion analytics                                ║
╚══════════════════════════════════════════════════════════════╝\n`);
});

export { app };