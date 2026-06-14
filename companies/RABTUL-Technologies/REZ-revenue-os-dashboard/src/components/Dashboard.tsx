'use client';

import { TrendingUp, TrendingDown, Target, DollarSign, Users, Activity, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import PipelineKanban from './PipelineKanban';
import DealList from './DealList';
import SignalsFeed from './SignalsFeed';
import ForecastChart from './ForecastChart';
import ActivityFeed from './ActivityFeed';
import clsx from 'clsx';

interface DashboardProps {
  activeView: string;
  pipelineData: any;
  dealActivities: any;
  signals: any;
  forecast: any;
}

export default function Dashboard({ activeView, pipelineData, dealActivities, signals, forecast }: DashboardProps) {
  if (activeView === 'pipeline') {
    return <PipelineKanban stages={pipelineData.stages} />;
  }

  if (activeView === 'deals') {
    return <DealList deals={dealActivities.deals} />;
  }

  if (activeView === 'signals') {
    return <SignalsFeed signals={signals} />;
  }

  if (activeView === 'accounts') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Top Accounts</h2>
          <div className="space-y-4">
            {dealActivities.deals.slice(0, 5).map((deal: any) => (
              <div key={deal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{deal.company}</p>
                  <p className="text-sm text-gray-500">{deal.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${deal.value.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{deal.stage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Account Insights</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">High Intent</p>
              <p className="text-2xl font-bold text-green-800">12</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-700">Needs Attention</p>
              <p className="text-2xl font-bold text-amber-800">8</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">New This Week</p>
              <p className="text-2xl font-bold text-blue-800">5</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Overview
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Pipeline"
          value={`$${(pipelineData.totalValue / 1000).toFixed(0)}K`}
          change="+12%"
          positive
          icon={DollarSign}
        />
        <KPICard
          title="Weighted Pipeline"
          value={`$${(pipelineData.weightedValue / 1000).toFixed(0)}K`}
          change="+8%"
          positive
          icon={Target}
        />
        <KPICard
          title="Active Deals"
          value={pipelineData.totalDeals.toString()}
          change="-2"
          positive={false}
          icon={TrendingUp}
        />
        <KPICard
          title="Win Rate"
          value={`${pipelineData.winRate}%`}
          change="+3%"
          positive
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Revenue Forecast</h2>
          <ForecastChart data={forecast} />
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Pipeline by Stage</h2>
          <div className="space-y-3">
            {pipelineData.stages.map((stage: any) => (
              <div key={stage.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{stage.name}</span>
                  <span className="text-gray-500">{stage.deals} deals</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${stage.percentage}%`, backgroundColor: stage.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <ActivityFeed activities={dealActivities.activities} />
        </div>

        {/* Top Signals */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Live Signals
          </h2>
          <div className="space-y-3">
            {signals.slice(0, 5).map((signal: any) => (
              <div key={signal.id} className="flex items-start gap-3">
                <div className={clsx(
                  'w-2 h-2 rounded-full mt-2',
                  signal.type === 'funding' ? 'bg-green-500' :
                  signal.type === 'expansion' ? 'bg-blue-500' :
                  signal.type === 'news' ? 'bg-purple-500' : 'bg-gray-400'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{signal.title}</p>
                  <p className="text-xs text-gray-500">{signal.company} • {format(new Date(signal.date), 'MMM d')}</p>
                </div>
                <span className={clsx(
                  'px-2 py-0.5 text-xs rounded-full',
                  signal.intent === 'high' ? 'bg-green-100 text-green-700' :
                  signal.intent === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                )}>
                  {signal.intent}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Action Items
          </h2>
          <div className="space-y-3">
            {dealActivities.deals.filter((d: any) => d.priority === 'high').slice(0, 4).map((deal: any) => (
              <div key={deal.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-amber-900">{deal.name}</p>
                <p className="text-xs text-amber-700 mt-1">{deal.company} • {deal.nextAction}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
}

function KPICard({ title, value, change, positive, icon: Icon }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{title}</span>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold">{value}</p>
        <div className={clsx(
          'flex items-center gap-1 text-sm',
          positive ? 'text-green-600' : 'text-red-600'
        )}>
          {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{change}</span>
        </div>
      </div>
    </div>
  );
}
