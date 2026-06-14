/**
 * BIZORA Business Command Center
 * Unified "Mission Control" for businesses
 * Shows all KPIs, alerts, AI recommendations in ONE screen
 */

import express, { Request, Response } from 'express';
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 4060;

// Service URLs
const SERVICES = {
  taxflow: 'http://localhost:4004',
  invoiceflow: 'http://localhost:4005',
  restaurant: 'http://localhost:4010',
  people: 'http://localhost:4013',
  vendor: 'http://localhost:4020',
  advisor: 'http://localhost:4021',
  finance: 'http://localhost:4022',
};

// ============================================================================
// Types
// ============================================================================

interface CommandCenterData {
  timestamp: string;
  business: {
    name: string;
    industry: string;
    health: {
      score: number;
      trend: number;
    };
  };
  metrics: {
    revenue: Metric;
    compliance: Metric;
    marketing: Metric;
    employees: Metric;
    tasks: Metric;
  };
  alerts: Alert[];
  recommendations: Recommendation[];
  pendingActions: Action[];
  quickStats: Record<string, number>;
}

interface Metric {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface Alert {
  id: string;
  type: 'compliance' | 'payment' | 'marketing' | 'hr' | 'inventory' | 'ai';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  action?: string;
  dueDate?: string;
}

interface Recommendation {
  id: string;
  type: 'ai' | 'compliance' | 'marketing' | 'growth';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'quick' | 'medium' | 'major';
  automatable: boolean;
}

interface Action {
  id: string;
  service: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dueDate?: string;
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockData(businessId?: string): CommandCenterData {
  const revenue = Math.random() * 100000 + 50000;
  const expenses = revenue * (0.5 + Math.random() * 0.3);

  return {
    timestamp: new Date().toISOString(),
    business: {
      name: 'The Burger Joint',
      industry: 'Restaurant',
      health: {
        score: 85 + Math.floor(Math.random() * 15),
        trend: Math.floor(Math.random() * 10) - 5,
      },
    },
    metrics: {
      revenue: {
        value: revenue,
        change: Math.floor(Math.random() * 20) - 5,
        trend: 'up',
        status: 'good',
      },
      compliance: {
        value: 95,
        change: 0,
        trend: 'stable',
        status: 'good',
      },
      marketing: {
        value: 72,
        change: 12,
        trend: 'up',
        status: 'good',
      },
      employees: {
        value: 88,
        change: 5,
        trend: 'up',
        status: 'good',
      },
      tasks: {
        value: 65,
        change: -10,
        trend: 'down',
        status: 'warning',
      },
    },
    alerts: [
      {
        id: 'alert-1',
        type: 'compliance',
        priority: 'high',
        title: 'GST Filing Due in 3 Days',
        description: 'GSTR-3B for May 2026 due on 20th June 2026',
        action: 'File Now',
        dueDate: '2026-06-20',
      },
      {
        id: 'alert-2',
        type: 'payment',
        priority: 'medium',
        title: 'Invoice #INV-234 Overdue',
        description: '₹45,000 overdue from 15 days',
        action: 'Send Reminder',
        dueDate: '2026-06-25',
      },
      {
        id: 'alert-3',
        type: 'hr',
        priority: 'medium',
        title: '2 Leave Requests Pending',
        description: 'Team members waiting for approval',
        action: 'Review Requests',
      },
      {
        id: 'alert-4',
        type: 'ai',
        priority: 'low',
        title: 'Marketing Opportunity',
        description: 'Weekend campaign potential - 23% higher footfall expected',
        action: 'View Campaign',
      },
    ],
    recommendations: [
      {
        id: 'rec-1',
        type: 'ai',
        title: 'Launch Weekend Special',
        description: 'Your sales peak during weekends. AI suggests a 15% discount for Saturday to boost by 20%.',
        impact: 'high',
        effort: 'quick',
        automatable: true,
      },
      {
        id: 'rec-2',
        type: 'growth',
        title: 'Delivery Expansion',
        description: 'Zomato orders up 40%. Consider Swiggy to double delivery reach.',
        impact: 'high',
        effort: 'medium',
        automatable: false,
      },
      {
        id: 'rec-3',
        type: 'marketing',
        title: 'Instagram Reels Strategy',
        description: 'Food content performs 3x better. AI suggests daily reels posting.',
        impact: 'medium',
        effort: 'quick',
        automatable: true,
      },
      {
        id: 'rec-4',
        type: 'compliance',
        title: 'FSSAI Renewal',
        description: 'License expires in 45 days. Start renewal process now.',
        impact: 'high',
        effort: 'medium',
        automatable: false,
      },
      {
        id: 'rec-5',
        type: 'ai',
        title: 'Dynamic Pricing',
        description: 'Adjust prices based on demand. AI predicts 18% revenue increase.',
        impact: 'high',
        effort: 'quick',
        automatable: true,
      },
    ],
    pendingActions: [
      { id: 'act-1', service: 'taxflow', title: 'Review GSTR-3B draft', status: 'pending' },
      { id: 'act-2', service: 'marketplace', title: 'Approve leave requests', status: 'pending' },
      { id: 'act-3', service: 'vendor', title: 'Follow up vendor delivery', status: 'in_progress' },
      { id: 'act-4', service: 'invoiceflow', title: 'Send payment reminders', status: 'pending' },
    ],
    quickStats: {
      todayOrders: 47,
      weekRevenue: 125000,
      pendingCompliance: 2,
      activeEmployees: 12,
      openTasks: 8,
      unreadMessages: 5,
      campaigns: 3,
      insights: 12,
    },
  };
}

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'business-command-center',
    timestamp: new Date().toISOString(),
  });
});

// Main command center endpoint - aggregates all data
app.get('/api/command-center', async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;

    // In production, fetch from all services in parallel
    const data = generateMockData(businessId);

    // Enrich with real data from services (mock for now)
    res.json(data);
  } catch (error) {
    logger.error('Command center error:', error);
    res.status(500).json({ error: 'Failed to fetch command center data' });
  }
});

// Revenue specific metrics
app.get('/api/metrics/revenue', (req: Request, res: Response) => {
  const data = generateMockData();
  res.json({
    total: data.metrics.revenue.value,
    trend: data.metrics.revenue.trend,
    change: data.metrics.revenue.change,
    breakdown: {
      dineIn: data.metrics.revenue.value * 0.4,
      delivery: data.metrics.revenue.value * 0.35,
      takeaway: data.metrics.revenue.value * 0.15,
      catering: data.metrics.revenue.value * 0.1,
    },
    projections: {
      thisWeek: data.quickStats.weekRevenue * 1.1,
      thisMonth: data.quickStats.weekRevenue * 4,
    },
  });
});

// Compliance status
app.get('/api/metrics/compliance', (_req: Request, res: Response) => {
  res.json({
    score: 95,
    status: 'compliant',
    filings: {
      gst: { status: 'pending', dueDate: '2026-06-20' },
      tds: { status: 'pending', dueDate: '2026-06-30' },
      pf: { status: 'filed', filedDate: '2026-05-31' },
    },
    alerts: [
      { type: 'gst_due', message: 'GSTR-3B due in 3 days', priority: 'high' },
      { type: 'tds_due', message: 'TDS payment due', priority: 'medium' },
    ],
  });
});

// AI recommendations
app.get('/api/recommendations', (_req: Request, res: Response) => {
  const data = generateMockData();
  res.json({
    recommendations: data.recommendations,
    summary: {
      automatable: data.recommendations.filter(r => r.automatable).length,
      highImpact: data.recommendations.filter(r => r.impact === 'high').length,
    },
  });
});

// Tasks & actions
app.get('/api/tasks', (_req: Request, res: Response) => {
  const data = generateMockData();
  res.json({
    pending: data.pendingActions.length,
    tasks: data.pendingActions,
    alerts: data.alerts,
  });
});

// Business health score
app.get('/api/health', (_req: Request, res: Response) => {
  const data = generateMockData();
  res.json({
    overall: data.business.health,
    metrics: data.metrics,
    verdict: data.business.health.score >= 80 ? 'Excellent' : data.business.health.score >= 60 ? 'Good' : 'Needs Attention',
    summary: 'Your business is performing well across all areas.',
  });
});

// Quick actions (automatable tasks)
app.get('/api/quick-actions', (_req: Request, res: Response) => {
  res.json({
    actions: [
      { id: 'file_gst', label: 'File GST Return', icon: '📜', service: 'taxflow' },
      { id: 'send_reminder', label: 'Send Payment Reminder', icon: '💰', service: 'invoiceflow' },
      { id: 'approve_leave', label: 'Approve Leave', icon: '✅', service: 'people' },
      { id: 'send_campaign', label: 'Launch Campaign', icon: '📢', service: 'marketing' },
      { id: 'review_ai_insight', label: 'Review AI Insight', icon: '🤖', service: 'advisor' },
      { id: 'follow_vendor', label: 'Follow Up Vendor', icon: '📦', service: 'vendor' },
    ],
  });
});

// ============================================================================
// Start
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎯 Business Command Center                            ║
║   Mission Control for Your Business                   ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Status: Running                                        ║
║                                                           ║
║   Endpoints:                                           ║
║   • GET /api/command-center - Full dashboard            ║
║   • GET /api/metrics/revenue - Revenue data             ║
║   • GET /api/metrics/compliance - Compliance status   ║
║   • GET /api/recommendations - AI suggestions        ║
║   • GET /api/health - Business health score          ║
║   • GET /api/quick-actions - One-tap actions         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
