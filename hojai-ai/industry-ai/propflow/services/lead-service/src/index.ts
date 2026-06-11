/**
 * HOJAI Real Estate Lead Service
 * Lead management, agent assignment, status tracking
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4911;

app.use(express.json());

// In-memory storage
interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  source: 'website' | 'whatsapp' | 'phone' | 'referral' | 'agent' | 'social';
  propertyInterest?: string;
  budget: { min: number; max: number };
  requirements: {
    propertyType?: string[];
    bedrooms?: number;
    locations?: string[];
    amenities?: string[];
  };
  status: 'new' | 'contacted' | 'qualified' | 'visiting' | 'negotiating' | 'closed_won' | 'closed_lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  stageHistory: Array<{ stage: string; timestamp: string; note?: string }>;
  notes: string[];
  followUpDate?: string;
  nextAction?: string;
  createdAt: string;
  updatedAt: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string[];
  activeLeads: number;
  maxLeads: number;
  status: 'available' | 'busy' | 'offline';
}

interface ActivityLog {
  id: string;
  leadId: string;
  agentId?: string;
  action: string;
  details: string;
  timestamp: string;
}

const leads = new Map<string, Lead>();
const agents = new Map<string, Agent>();
const activityLogs = new Map<string, ActivityLog>();

// Initialize sample agents
const sampleAgents: Agent[] = [
  { id: uuidv4(), name: 'Rajesh Kumar', email: 'rajesh@propflow.com', phone: '+919876543210', specialty: ['residential', 'luxury'], activeLeads: 0, maxLeads: 15, status: 'available' },
  { id: uuidv4(), name: 'Priya Sharma', email: 'priya@propflow.com', phone: '+919876543211', specialty: ['commercial', 'investment'], activeLeads: 0, maxLeads: 12, status: 'available' },
  { id: uuidv4(), name: 'Amit Verma', email: 'amit@propflow.com', phone: '+919876543212', specialty: ['plots', 'affordable'], activeLeads: 0, maxLeads: 20, status: 'available' },
];
sampleAgents.forEach(a => agents.set(a.id, a));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'lead-service', port: PORT });
});

// Lead CRUD Operations

// Create lead
app.post('/leads', (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();
    const lead: Lead = {
      id: uuidv4(),
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      source: req.body.source || 'website',
      propertyInterest: req.body.propertyInterest,
      budget: req.body.budget || { min: 0, max: 0 },
      requirements: req.body.requirements || {},
      status: 'new',
      priority: req.body.priority || 'medium',
      assignedAgent: req.body.assignedAgent,
      stageHistory: [{ stage: 'new', timestamp: now }],
      notes: [],
      followUpDate: req.body.followUpDate,
      nextAction: req.body.nextAction,
      createdAt: now,
      updatedAt: now,
    };

    leads.set(lead.id, lead);
    logActivity(lead.id, undefined, 'lead_created', `Lead ${lead.name} created from ${lead.source}`);

    res.status(201).json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Get all leads with filtering
app.get('/leads', (req: Request, res: Response) => {
  try {
    const { status, priority, agentId, minBudget, maxBudget, source } = req.query;
    let result = Array.from(leads.values());

    if (status) result = result.filter(l => l.status === status);
    if (priority) result = result.filter(l => l.priority === priority);
    if (agentId) result = result.filter(l => l.assignedAgent === agentId);
    if (source) result = result.filter(l => l.source === source);
    if (minBudget) result = result.filter(l => l.budget.max >= parseInt(minBudget as string));
    if (maxBudget) result = result.filter(l => l.budget.min <= parseInt(maxBudget as string));

    result.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    res.json({ leads: result, count: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get single lead
app.get('/leads/:id', (req: Request, res: Response) => {
  try {
    const lead = leads.get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const logs = Array.from(activityLogs.values()).filter(log => log.leadId === lead.id);
    res.json({ lead, activityLog: logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// Update lead
app.put('/leads/:id', (req: Request, res: Response) => {
  try {
    const lead = leads.get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { status, priority, notes, followUpDate, nextAction, requirements } = req.body;
    const now = new Date().toISOString();

    // Track status changes
    if (status && status !== lead.status) {
      lead.stageHistory.push({ stage: status, timestamp: now, note: req.body.stageNote });
      logActivity(lead.id, lead.assignedAgent, 'status_change', `Status changed from ${lead.status} to ${status}`);
    }

    const updated: Lead = {
      ...lead,
      ...req.body,
      id: lead.id,
      stageHistory: lead.stageHistory,
      notes: notes ? [...lead.notes, ...notes] : lead.notes,
      updatedAt: now,
    };

    leads.set(lead.id, updated);
    res.json({ success: true, lead: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Delete lead
app.delete('/leads/:id', (req: Request, res: Response) => {
  try {
    if (!leads.has(req.params.id)) return res.status(404).json({ error: 'Lead not found' });
    leads.delete(req.params.id);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Agent Assignment

// Get all agents
app.get('/agents', (_req: Request, res: Response) => {
  try {
    const agentList = Array.from(agents.values());
    res.json({ agents: agentList, count: agentList.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get available agents
app.get('/agents/available', (_req: Request, res: Response) => {
  try {
    const available = Array.from(agents.values()).filter(a =>
      a.status === 'available' && a.activeLeads < a.maxLeads
    );
    res.json({ agents: available, count: available.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available agents' });
  }
});

// Assign lead to agent (auto or manual)
app.post('/leads/:id/assign', (req: Request, res: Response) => {
  try {
    const lead = leads.get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { agentId, autoAssign } = req.body;
    let assignedAgent: Agent | undefined;

    if (autoAssign) {
      // Auto-assign to agent with lowest workload
      const availableAgents = Array.from(agents.values()).filter(a =>
        a.status === 'available' && a.activeLeads < a.maxLeads
      );
      if (availableAgents.length === 0) {
        return res.status(400).json({ error: 'No available agents' });
      }
      assignedAgent = availableAgents.sort((a, b) => a.activeLeads - b.activeLeads)[0];
    } else if (agentId) {
      assignedAgent = agents.get(agentId);
      if (!assignedAgent) return res.status(404).json({ error: 'Agent not found' });
    }

    if (!assignedAgent) return res.status(400).json({ error: 'No agent specified' });

    // Update lead
    lead.assignedAgent = assignedAgent.id;
    lead.updatedAt = new Date().toISOString();
    leads.set(lead.id, lead);

    // Update agent workload
    assignedAgent.activeLeads++;
    agents.set(assignedAgent.id, assignedAgent);

    logActivity(lead.id, assignedAgent.id, 'agent_assigned', `Assigned to ${assignedAgent.name}`);

    res.json({ success: true, lead, agent: assignedAgent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign agent' });
  }
});

// Reassign lead
app.post('/leads/:id/reassign', (req: Request, res: Response) => {
  try {
    const lead = leads.get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    if (!lead.assignedAgent) return res.status(400).json({ error: 'Lead has no assigned agent' });

    const { newAgentId } = req.body;
    const oldAgent = agents.get(lead.assignedAgent);
    const newAgent = agents.get(newAgentId);

    if (!newAgent) return res.status(404).json({ error: 'New agent not found' });

    // Update old agent workload
    if (oldAgent) {
      oldAgent.activeLeads = Math.max(0, oldAgent.activeLeads - 1);
      agents.set(oldAgent.id, oldAgent);
    }

    // Update new agent workload
    newAgent.activeLeads++;
    agents.set(newAgent.id, newAgent);

    // Update lead
    lead.assignedAgent = newAgent.id;
    lead.updatedAt = new Date().toISOString();
    leads.set(lead.id, lead);

    logActivity(lead.id, newAgent.id, 'lead_reassigned', `Reassigned from ${oldAgent?.name || 'unassigned'} to ${newAgent.name}`);

    res.json({ success: true, lead, newAgent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reassign lead' });
  }
});

// Status tracking

// Get leads by status
app.get('/leads/status/:status', (req: Request, res: Response) => {
  try {
    const result = Array.from(leads.values()).filter(l => l.status === req.params.status);
    res.json({ leads: result, count: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Update lead status
app.patch('/leads/:id/status', (req: Request, res: Response) => {
  try {
    const lead = leads.get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { status, note } = req.body;
    const now = new Date().toISOString();

    const oldStatus = lead.status;
    lead.status = status;
    lead.stageHistory.push({ stage: status, timestamp: now, note });
    lead.updatedAt = now;

    leads.set(lead.id, lead);
    logActivity(lead.id, lead.assignedAgent, 'status_updated', `Status: ${oldStatus} → ${status}. ${note || ''}`);

    // If closed, free up agent
    if (status === 'closed_won' || status === 'closed_lost') {
      const agent = agents.get(lead.assignedAgent || '');
      if (agent) {
        agent.activeLeads = Math.max(0, agent.activeLeads - 1);
        agents.set(agent.id, agent);
      }
    }

    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Add note to lead
app.post('/leads/:id/notes', (req: Request, res: Response) => {
  try {
    const lead = leads.get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { note, agentId } = req.body;
    lead.notes.push(note);
    lead.updatedAt = new Date().toISOString();
    leads.set(lead.id, lead);

    logActivity(lead.id, agentId, 'note_added', note);

    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Get activity logs
app.get('/leads/:id/activity', (req: Request, res: Response) => {
  try {
    const logs = Array.from(activityLogs.values())
      .filter(log => log.leadId === req.params.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Dashboard / Stats
app.get('/dashboard/stats', (_req: Request, res: Response) => {
  try {
    const leadArray = Array.from(leads.values());
    const agentArray = Array.from(agents.values());

    const statusCounts = {
      new: leadArray.filter(l => l.status === 'new').length,
      contacted: leadArray.filter(l => l.status === 'contacted').length,
      qualified: leadArray.filter(l => l.status === 'qualified').length,
      visiting: leadArray.filter(l => l.status === 'visiting').length,
      negotiating: leadArray.filter(l => l.status === 'negotiating').length,
      closed_won: leadArray.filter(l => l.status === 'closed_won').length,
      closed_lost: leadArray.filter(l => l.status === 'closed_lost').length,
    };

    const priorityCounts = {
      urgent: leadArray.filter(l => l.priority === 'urgent').length,
      high: leadArray.filter(l => l.priority === 'high').length,
      medium: leadArray.filter(l => l.priority === 'medium').length,
      low: leadArray.filter(l => l.priority === 'low').length,
    };

    const sourceCounts = {
      website: leadArray.filter(l => l.source === 'website').length,
      whatsapp: leadArray.filter(l => l.source === 'whatsapp').length,
      phone: leadArray.filter(l => l.source === 'phone').length,
      referral: leadArray.filter(l => l.source === 'referral').length,
      agent: leadArray.filter(l => l.source === 'agent').length,
      social: leadArray.filter(l => l.source === 'social').length,
    };

    const conversionRate = leadArray.length > 0
      ? Math.round((statusCounts.closed_won / leadArray.length) * 100)
      : 0;

    res.json({
      totalLeads: leadArray.length,
      statusCounts,
      priorityCounts,
      sourceCounts,
      conversionRate,
      agents: {
        total: agentArray.length,
        available: agentArray.filter(a => a.status === 'available').length,
        busy: agentArray.filter(a => a.status === 'busy').length,
        offline: agentArray.filter(a => a.status === 'offline').length,
        totalActiveLeads: agentArray.reduce((sum, a) => sum + a.activeLeads, 0),
      },
      followUps: {
        today: leadArray.filter(l => l.followUpDate === new Date().toISOString().split('T')[0]).length,
        overdue: leadArray.filter(l => l.followUpDate && l.followUpDate < new Date().toISOString().split('T')[0] && !['closed_won', 'closed_lost'].includes(l.status)).length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Helper function
function logActivity(leadId: string, agentId: string | undefined, action: string, details: string) {
  const log: ActivityLog = {
    id: uuidv4(),
    leadId,
    agentId,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  activityLogs.set(log.id, log);
}

// Start server
app.listen(PORT, () => {
  console.log(`🏠 Lead Service running on port ${PORT}`);
  console.log(`   - Lead CRUD operations`);
  console.log(`   - Agent assignment & management`);
  console.log(`   - Status tracking & pipeline`);
  console.log(`   - Activity logging`);
});

export { app, leads, agents };