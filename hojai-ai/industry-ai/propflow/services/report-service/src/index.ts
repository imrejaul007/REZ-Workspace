/**
 * HOJAI Real Estate Report Service
 * Analytics, reports, dashboards for property, leads, and sales
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4912;

app.use(express.json());

// In-memory data store (simulates data from other services)
interface Property {
  id: string;
  title: string;
  type: string;
  status: string;
  price: number;
  location: { city: string; locality: string };
  area: { value: number; unit: string };
  listedAt: string;
  soldAt?: string;
  soldPrice?: number;
  daysOnMarket?: number;
}

interface Lead {
  id: string;
  name: string;
  source: string;
  status: string;
  priority: string;
  budget: { min: number; max: number };
  assignedAgent?: string;
  createdAt: string;
  closedAt?: string;
  conversionTime?: number; // days
}

interface Sale {
  id: string;
  propertyId: string;
  leadId: string;
  agentId: string;
  salePrice: number;
  commission: number;
  dealDate: string;
  propertyType: string;
  location: string;
}

interface Showing {
  id: string;
  propertyId: string;
  leadId: string;
  date: string;
  outcome: 'converted' | 'not_interested' | 'follow_up' | 'pending';
}

// Sample data
const properties: Map<string, Property> = new Map();
const leads: Map<string, Lead> = new Map();
const sales: Map<string, Sale> = new Map();
const showings: Map<string, Showing> = new Map();

// Seed sample data
function seedData() {
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune'];
  const localities = ['Downtown', 'Suburbs', 'Metro Area', 'Township', 'CBD'];
  const types = ['apartment', 'villa', 'plot', 'commercial'];

  // Sample properties
  for (let i = 0; i < 50; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const price = Math.floor(Math.random() * 50000000) + 1000000;
    const status = Math.random() > 0.3 ? 'available' : 'sold';

    const prop: Property = {
      id: uuidv4(),
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} in ${city}`,
      type,
      status,
      price,
      location: { city, locality: localities[Math.floor(Math.random() * localities.length)] },
      area: { value: Math.floor(Math.random() * 3000) + 500, unit: 'sqft' },
      listedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      soldAt: status === 'sold' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      soldPrice: status === 'sold' ? price * (0.95 + Math.random() * 0.1) : undefined,
    };

    if (prop.soldAt && prop.listedAt) {
      prop.daysOnMarket = Math.floor((new Date(prop.soldAt).getTime() - new Date(prop.listedAt).getTime()) / (1000 * 60 * 60 * 24));
    }

    properties.set(prop.id, prop);
  }

  // Sample leads
  const sources = ['website', 'whatsapp', 'phone', 'referral', 'agent', 'social'];
  const statuses = ['new', 'contacted', 'qualified', 'visiting', 'negotiating', 'closed_won', 'closed_lost'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  for (let i = 0; i < 100; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString();
    const closed = status === 'closed_won' || status === 'closed_lost';

    const lead: Lead = {
      id: uuidv4(),
      name: `Customer ${i + 1}`,
      source: sources[Math.floor(Math.random() * sources.length)],
      status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      budget: {
        min: Math.floor(Math.random() * 10000000),
        max: Math.floor(Math.random() * 20000000) + 10000000,
      },
      assignedAgent: Math.random() > 0.2 ? uuidv4() : undefined,
      createdAt,
      closedAt: closed ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    };

    if (lead.closedAt) {
      lead.conversionTime = Math.floor((new Date(lead.closedAt).getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    }

    leads.set(lead.id, lead);
  }

  // Sample sales
  const wonLeads = Array.from(leads.values()).filter(l => l.status === 'closed_won');
  for (const lead of wonLeads) {
    const propList = Array.from(properties.values());
    const prop = propList[Math.floor(Math.random() * propList.length)];

    const sale: Sale = {
      id: uuidv4(),
      propertyId: prop.id,
      leadId: lead.id,
      agentId: lead.assignedAgent || uuidv4(),
      salePrice: prop.soldPrice || prop.price,
      commission: (prop.soldPrice || prop.price) * 0.02,
      dealDate: lead.closedAt || new Date().toISOString(),
      propertyType: prop.type,
      location: prop.location.city,
    };

    sales.set(sale.id, sale);
  }

  // Sample showings
  for (let i = 0; i < 75; i++) {
    const propList = Array.from(properties.values());
    const leadList = Array.from(leads.values());
    const outcomes: Showing['outcome'][] = ['converted', 'not_interested', 'follow_up', 'pending'];

    const showing: Showing = {
      id: uuidv4(),
      propertyId: propList[Math.floor(Math.random() * propList.length)].id,
      leadId: leadList[Math.floor(Math.random() * leadList.length)].id,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
    };

    showings.set(showing.id, showing);
  }
}

seedData();

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'report-service', port: PORT });
});

// ============= PROPERTY REPORTS =============

// Property performance overview
app.get('/reports/properties', (req: Request, res: Response) => {
  try {
    const propArray = Array.from(properties.values());
    const { city, type, startDate, endDate } = req.query;

    let filtered = propArray;
    if (city) filtered = filtered.filter(p => p.location.city === city);
    if (type) filtered = filtered.filter(p => p.type === type);
    if (startDate) filtered = filtered.filter(p => p.listedAt >= startDate);
    if (endDate) filtered = filtered.filter(p => p.listedAt <= endDate);

    const available = filtered.filter(p => p.status === 'available');
    const sold = filtered.filter(p => p.status === 'sold');

    const avgDaysOnMarket = sold.filter(p => p.daysOnMarket).reduce((sum, p) => sum + (p.daysOnMarket || 0), 0) / (sold.length || 1);

    const totalValue = filtered.reduce((sum, p) => sum + p.price, 0);
    const soldValue = sold.reduce((sum, p) => sum + (p.soldPrice || p.price), 0);

    res.json({
      summary: {
        total: filtered.length,
        available: available.length,
        sold: sold.length,
        soldPercentage: filtered.length > 0 ? Math.round(sold.length / filtered.length * 100) : 0,
        averageDaysOnMarket: Math.round(avgDaysOnMarket),
        totalInventoryValue: totalValue,
        totalSoldValue: soldValue,
      },
      byType: groupBy(filtered, 'type'),
      byCity: groupBy(filtered, 'location.city'),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate property report' });
  }
});

// Property valuation report
app.get('/reports/properties/valuations', (req: Request, res: Response) => {
  try {
    const propArray = Array.from(properties.values());
    const { city } = req.query;

    let filtered = propArray;
    if (city) filtered = filtered.filter(p => p.location.city === city);

    const valuations = filtered.map(p => {
      const pricePerSqft = p.price / p.area.value;
      const avgPricePerSqft = filtered
        .filter(other => other.location.city === p.location.city && other.type === p.type)
        .reduce((sum, other) => sum + other.price / other.area.value, 0) / filtered.length;

      return {
        id: p.id,
        title: p.title,
        currentPrice: p.price,
        pricePerSqft,
        avgPricePerSqft: avgPricePerSqft || pricePerSqft,
        variance: avgPricePerSqft ? Math.round((pricePerSqft / avgPricePerSqft - 1) * 100) : 0,
        marketPosition: pricePerSqft < avgPricePerSqft ? 'below_market' : 'above_market',
        daysOnMarket: p.daysOnMarket,
      };
    });

    res.json({ valuations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate valuation report' });
  }
});

// ============= LEAD REPORTS =============

// Lead pipeline report
app.get('/reports/leads', (req: Request, res: Response) => {
  try {
    const leadArray = Array.from(leads.values());
    const { startDate, endDate, agentId } = req.query;

    let filtered = leadArray;
    if (startDate) filtered = filtered.filter(l => l.createdAt >= startDate);
    if (endDate) filtered = filtered.filter(l => l.createdAt <= endDate);
    if (agentId) filtered = filtered.filter(l => l.assignedAgent === agentId);

    const byStatus = groupBy(filtered, 'status');
    const bySource = groupBy(filtered, 'source');
    const byPriority = groupBy(filtered, 'priority');

    const conversionRate = filtered.length > 0
      ? Math.round(filtered.filter(l => l.status === 'closed_won').length / filtered.length * 100)
      : 0;

    const avgConversionTime = filtered
      .filter(l => l.conversionTime)
      .reduce((sum, l) => sum + (l.conversionTime || 0), 0) / filtered.filter(l => l.conversionTime).length;

    res.json({
      summary: {
        total: filtered.length,
        new: byStatus['new']?.length || 0,
        active: filtered.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length,
        converted: byStatus['closed_won']?.length || 0,
        lost: byStatus['closed_lost']?.length || 0,
        conversionRate,
        averageConversionDays: Math.round(avgConversionTime || 0),
      },
      byStatus,
      bySource,
      byPriority,
      budgetDistribution: getBudgetDistribution(filtered),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate lead report' });
  }
});

// Lead source effectiveness
app.get('/reports/leads/sources', (req: Request, res: Response) => {
  try {
    const leadArray = Array.from(leads.values());

    const sources = ['website', 'whatsapp', 'phone', 'referral', 'agent', 'social'];
    const effectiveness = sources.map(source => {
      const sourceLeads = leadArray.filter(l => l.source === source);
      const converted = sourceLeads.filter(l => l.status === 'closed_won').length;
      const conversionRate = sourceLeads.length > 0 ? Math.round(converted / sourceLeads.length * 100) : 0;
      const avgBudget = sourceLeads.reduce((sum, l) => sum + l.budget.max, 0) / (sourceLeads.length || 1);

      return {
        source,
        totalLeads: sourceLeads.length,
        converted,
        conversionRate,
        averageBudget: Math.round(avgBudget),
        quality: conversionRate >= 30 ? 'high' : conversionRate >= 15 ? 'medium' : 'low',
      };
    });

    effectiveness.sort((a, b) => b.conversionRate - a.conversionRate);

    res.json({ sources: effectiveness });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate source report' });
  }
});

// ============= SALES REPORTS =============

// Sales performance report
app.get('/reports/sales', (req: Request, res: Response) => {
  try {
    const saleArray = Array.from(sales.values());
    const { startDate, endDate, agentId, city } = req.query;

    let filtered = saleArray;
    if (startDate) filtered = filtered.filter(s => s.dealDate >= startDate);
    if (endDate) filtered = filtered.filter(s => s.dealDate <= endDate);
    if (agentId) filtered = filtered.filter(s => s.agentId === agentId);
    if (city) filtered = filtered.filter(s => s.location === city);

    const totalRevenue = filtered.reduce((sum, s) => sum + s.salePrice, 0);
    const totalCommission = filtered.reduce((sum, s) => sum + s.commission, 0);
    const avgDealSize = filtered.length > 0 ? totalRevenue / filtered.length : 0;

    const byType = groupBy(filtered, 'propertyType');
    const byCity = groupBy(filtered, 'location');

    res.json({
      summary: {
        totalDeals: filtered.length,
        totalRevenue: Math.round(totalRevenue),
        totalCommission: Math.round(totalCommission),
        averageDealSize: Math.round(avgDealSize),
        commissionRate: totalRevenue > 0 ? Math.round(totalCommission / totalRevenue * 100) : 0,
      },
      byPropertyType: byType,
      byCity,
      recentDeals: filtered.sort((a, b) => new Date(b.dealDate).getTime() - new Date(a.dealDate).getTime()).slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
});

// Agent performance report
app.get('/reports/agents', (req: Request, res: Response) => {
  try {
    const saleArray = Array.from(sales.values());
    const leadArray = Array.from(leads.values());

    const agentIds = new Set([...saleArray.map(s => s.agentId), ...leadArray.map(l => l.assignedAgent).filter(Boolean)]);
    const agentStats = Array.from(agentIds).map(agentId => {
      const agentSales = saleArray.filter(s => s.agentId === agentId);
      const agentLeads = leadArray.filter(l => l.assignedAgent === agentId);
      const convertedLeads = agentLeads.filter(l => l.status === 'closed_won').length;

      return {
        agentId,
        totalDeals: agentSales.length,
        totalRevenue: agentSales.reduce((sum, s) => sum + s.salePrice, 0),
        totalCommission: agentSales.reduce((sum, s) => sum + s.commission, 0),
        conversionRate: agentLeads.length > 0 ? Math.round(convertedLeads / agentLeads.length * 100) : 0,
        averageDealSize: agentSales.length > 0
          ? agentSales.reduce((sum, s) => sum + s.salePrice, 0) / agentSales.length
          : 0,
        activeLeads: agentLeads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length,
      };
    });

    agentStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      agents: agentStats,
      topPerformer: agentStats[0],
      averageCommission: agentStats.reduce((sum, a) => sum + a.totalCommission, 0) / (agentStats.length || 1),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate agent report' });
  }
});

// ============= SHOWING REPORTS =============

// Showing effectiveness
app.get('/reports/showings', (req: Request, res: Response) => {
  try {
    const showingArray = Array.from(showings.values());
    const { propertyId, startDate, endDate } = req.query;

    let filtered = showingArray;
    if (propertyId) filtered = filtered.filter(s => s.propertyId === propertyId);
    if (startDate) filtered = filtered.filter(s => s.date >= startDate);
    if (endDate) filtered = filtered.filter(s => s.date <= endDate);

    const converted = filtered.filter(s => s.outcome === 'converted').length;
    const notInterested = filtered.filter(s => s.outcome === 'not_interested').length;
    const followUp = filtered.filter(s => s.outcome === 'follow_up').length;

    res.json({
      summary: {
        total: filtered.length,
        converted,
        notInterested,
        followUp,
        pending: filtered.filter(s => s.outcome === 'pending').length,
        conversionRate: filtered.length > 0 ? Math.round(converted / filtered.length * 100) : 0,
      },
      byOutcome: groupBy(filtered, 'outcome'),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate showing report' });
  }
});

// ============= DASHBOARD =============

// Executive dashboard
app.get('/dashboard', (_req: Request, res: Response) => {
  try {
    const propArray = Array.from(properties.values());
    const leadArray = Array.from(leads.values());
    const saleArray = Array.from(sales.values());

    const totalRevenue = saleArray.reduce((sum, s) => sum + s.salePrice, 0);
    const totalCommission = saleArray.reduce((sum, s) => sum + s.commission, 0);
    const conversionRate = leadArray.length > 0
      ? Math.round(leadArray.filter(l => l.status === 'closed_won').length / leadArray.length * 100)
      : 0;

    res.json({
      overview: {
        properties: { total: propArray.length, available: propArray.filter(p => p.status === 'available').length },
        leads: { total: leadArray.length, active: leadArray.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length },
        sales: { totalDeals: saleArray.length, totalRevenue, conversionRate },
        revenue: { total: totalRevenue, commission: totalCommission },
      },
      trends: {
        monthlyDeals: getMonthlyTrend(saleArray),
        monthlyLeads: getMonthlyTrend(leadArray, 'createdAt'),
        monthlyRevenue: getMonthlyRevenueTrend(saleArray),
      },
      recentActivity: {
        latestSales: saleArray.sort((a, b) => new Date(b.dealDate).getTime() - new Date(a.dealDate).getTime()).slice(0, 5),
        hotLeads: leadArray.filter(l => l.priority === 'urgent' || l.priority === 'high').slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate dashboard' });
  }
});

// ============= EXPORT =============

// Export report as CSV
app.get('/export/:type', (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (type === 'sales') {
      const saleArray = Array.from(sales.values());
      const csv = 'id,propertyId,agentId,salePrice,commission,dealDate,propertyType,location\n' +
        saleArray.map(s => `${s.id},${s.propertyId},${s.agentId},${s.salePrice},${s.commission},${s.dealDate},${s.propertyType},${s.location}`).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
      res.send(csv);
    } else if (type === 'leads') {
      const leadArray = Array.from(leads.values());
      const csv = 'id,name,source,status,priority,budget_min,budget_max,createdAt\n' +
        leadArray.map(l => `${l.id},${l.name},${l.source},${l.status},${l.priority},${l.budget.min},${l.budget.max},${l.createdAt}`).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads-report.csv');
      res.send(csv);
    } else {
      res.status(400).json({ error: 'Invalid export type' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// Helper functions
function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const value = String(item[key]);
    if (!groups[value]) groups[value] = [];
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

function getBudgetDistribution(leadArray: Lead[]) {
  const buckets = [
    { label: 'Under 50L', min: 0, max: 5000000, count: 0 },
    { label: '50L - 1Cr', min: 5000000, max: 10000000, count: 0 },
    { label: '1Cr - 2Cr', min: 10000000, max: 20000000, count: 0 },
    { label: '2Cr - 5Cr', min: 20000000, max: 50000000, count: 0 },
    { label: 'Above 5Cr', min: 50000000, max: Infinity, count: 0 },
  ];

  leadArray.forEach(lead => {
    const bucket = buckets.find(b => lead.budget.max >= b.min && lead.budget.max < b.max);
    if (bucket) bucket.count++;
  });

  return buckets;
}

function getMonthlyTrend(data: Array<{ dealDate?: string; createdAt?: string }>, dateField: 'dealDate' | 'createdAt' = 'dealDate') {
  const months: Record<string, number> = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months[key] = 0;
  }

  data.forEach(item => {
    const date = item[dateField];
    if (date) {
      const d = new Date(date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key] !== undefined) months[key]++;
    }
  });

  return Object.entries(months).map(([month, count]) => ({ month, count }));
}

function getMonthlyRevenueTrend(sales: Sale[]) {
  const months: Record<string, number> = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months[key] = 0;
  }

  sales.forEach(sale => {
    const d = new Date(sale.dealDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (months[key] !== undefined) months[key] += sale.salePrice;
  });

  return Object.entries(months).map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));
}

// Start server
app.listen(PORT, () => {
  console.log(`📊 Report Service running on port ${PORT}`);
  console.log(`   - Property reports & valuations`);
  console.log(`   - Lead pipeline analytics`);
  console.log(`   - Sales performance reports`);
  console.log(`   - Agent metrics`);
  console.log(`   - Executive dashboard`);
  console.log(`   - CSV export`);
});

export { app, properties, leads, sales, showings };