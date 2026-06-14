'use client';

import { Header } from '@/components/Header';
import { StatsCard } from '@/components/StatsCard';
import { Timeline } from '@/components/Timeline';
import { StageChip } from '@/components/StageChip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DealStage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Mock data for demonstration
const mockStats = {
  totalDeals: 156,
  totalValue: 456000000,
  conversionRate: 32.5,
  dealsByStage: {
    inquiry: 24,
    site_visit: 18,
    offer: 12,
    negotiation: 15,
    agreement: 8,
    registry: 5,
    closed: 74,
  } as Record<DealStage, number>,
  monthlyStats: {
    dealsClosed: 12,
    valueClosed: 38000000,
    newDeals: 18,
  },
  recentActivity: [
    {
      id: '1',
      type: 'stage_change' as const,
      description: 'Deal #RE-2024-156 moved to Registry',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      createdBy: 'Rahul Kumar',
    },
    {
      id: '2',
      type: 'offer' as const,
      description: 'New offer of Rs. 2.5 Cr received for Villa Roseland',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      createdBy: 'System',
    },
    {
      id: '3',
      type: 'meeting' as const,
      description: 'Site visit completed for Sunrise Apartments',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      createdBy: 'Priya Sharma',
    },
    {
      id: '4',
      type: 'payment' as const,
      description: 'Payment milestone reached - Registry',
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      createdBy: 'System',
    },
    {
      id: '5',
      type: 'note' as const,
      description: 'Customer requested additional documents',
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      createdBy: 'Amit Singh',
    },
  ],
};

const pipelinePreview = [
  { stage: 'inquiry' as DealStage, count: 24, value: 72000000 },
  { stage: 'site_visit' as DealStage, count: 18, value: 54000000 },
  { stage: 'offer' as DealStage, count: 12, value: 36000000 },
  { stage: 'negotiation' as DealStage, count: 15, value: 45000000 },
  { stage: 'agreement' as DealStage, count: 8, value: 24000000 },
  { stage: 'registry' as DealStage, count: 5, value: 15000000 },
  { stage: 'closed' as DealStage, count: 74, value: 222000000 },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Dashboard"
        subtitle="Overview of your deal pipeline"
      />

      <main className="pl-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Deals"
              value={mockStats.totalDeals}
              subtitle="Active pipeline"
              icon={Building2}
              trend={{ value: 12, label: 'vs last month' }}
            />
            <StatsCard
              title="Total Value"
              value={formatCurrency(mockStats.totalValue)}
              subtitle="Pipeline value"
              icon={DollarSign}
              trend={{ value: 8, label: 'vs last month' }}
            />
            <StatsCard
              title="Conversion Rate"
              value={`${mockStats.conversionRate}%`}
              subtitle="Inquiry to close"
              icon={TrendingUp}
              trend={{ value: 3, label: 'vs last month' }}
            />
            <StatsCard
              title="Deals Closed"
              value={mockStats.monthlyStats.dealsClosed}
              subtitle={`${formatCurrency(mockStats.monthlyStats.valueClosed)} this month`}
              icon={Users}
              trend={{ value: 15, label: 'vs last month' }}
            />
          </div>

          {/* Pipeline Preview & Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Pipeline Preview */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pipeline Overview</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/pipeline">
                    View Full Pipeline
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {pipelinePreview.map((stage) => (
                    <div
                      key={stage.stage}
                      className="flex flex-col items-center p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-2xl font-bold">{stage.count}</span>
                      <StageChip stage={stage.stage} size="sm" />
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(stage.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline activities={mockStats.recentActivity} maxItems={5} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <Link href="/deals" className="block p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Add New Deal</h3>
                      <p className="text-sm text-muted-foreground">
                        Create a new deal in the pipeline
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <Link href="/pipeline" className="block p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">View Pipeline</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage deals by stage
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <Link href="/agreements" className="block p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Agreements</h3>
                      <p className="text-sm text-muted-foreground">
                        Track pending agreements
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
