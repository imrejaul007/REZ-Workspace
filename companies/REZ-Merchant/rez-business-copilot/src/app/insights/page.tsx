'use client';

import React, { useState } from 'react';
import { InsightCard, InsightList, InsightSummary } from '@/components/Insights/InsightCard';
import { MetricCard } from '@/components/Response/MetricCard';
import type { Insight, Metric } from '@/types/copilot';
import {
  Search,
  Filter,
  Bookmark,
  Trash2,
  Share2,
  ChevronLeft,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

// Mock saved insights data
const mockInsights: Insight[] = [
  {
    id: 'saved-1',
    title: 'Weekend Sales Dip',
    description: 'Sales typically drop 15% on Sundays. Consider running a Sunday special promotion.',
    type: 'warning',
    impact: 'medium',
    category: 'sales',
  },
  {
    id: 'saved-2',
    title: 'Loyal Customer Opportunity',
    description: 'Your top 20% of customers generate 60% of revenue. A loyalty program could increase retention.',
    type: 'opportunity',
    impact: 'high',
    category: 'retention',
  },
  {
    id: 'saved-3',
    title: 'Peak Hours Optimization',
    description: '30% of revenue comes from 11 AM - 1 PM. Consider adding staff during this window.',
    type: 'info',
    impact: 'medium',
    category: 'operations',
  },
  {
    id: 'saved-4',
    title: 'Recommended Summer Offer',
    description: 'Based on your sales patterns, launching a summer offer could boost revenue by 12-18%.',
    type: 'opportunity',
    impact: 'high',
    category: 'promotion',
  },
];

const mockMetrics: Metric[] = [
  {
    id: 'm1',
    name: 'Total Insights',
    value: 24,
    trend: 'up',
    changePercentage: 12,
    format: 'number',
  },
  {
    id: 'm2',
    name: 'High Priority',
    value: 5,
    trend: 'down',
    changePercentage: -20,
    format: 'number',
  },
  {
    id: 'm3',
    name: 'Action Items',
    value: 12,
    trend: 'up',
    changePercentage: 50,
    format: 'number',
  },
];

type ViewMode = 'all' | 'opportunities' | 'warnings' | 'info';

export default function InsightsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'impact' | 'category'>('recent');

  // Filter insights based on search and view mode
  const filteredInsights = mockInsights.filter((insight) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        insight.title.toLowerCase().includes(query) ||
        insight.description.toLowerCase().includes(query) ||
        insight.category.toLowerCase().includes(query)
      );
    }

    // View mode filter
    if (viewMode !== 'all') {
      return insight.type === viewMode;
    }

    return true;
  });

  // Sort insights
  const sortedInsights = [...filteredInsights].sort((a, b) => {
    switch (sortBy) {
      case 'impact':
        const impactOrder = { high: 0, medium: 1, low: 2 };
        return impactOrder[a.impact] - impactOrder[b.impact];
      case 'category':
        return a.category.localeCompare(b.category);
      case 'recent':
      default:
        return 0; // Would sort by saved date in real app
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Copilot</span>
              </a>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Saved Insights</h1>
                <p className="text-sm text-gray-500">Your saved business insights and recommendations</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Bookmark className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {mockMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} showTrend />
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'all' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode('opportunities')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'opportunities' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-green-600" />
                Opportunities
              </button>
              <button
                onClick={() => setViewMode('warnings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'warnings' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Warnings
              </button>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="recent">Most Recent</option>
              <option value="impact">Impact Level</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {/* Insights List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2">
            <InsightList insights={sortedInsights} groupByCategory={false} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Lightbulb className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Opportunities</span>
                  </div>
                  <span className="text-sm font-semibold">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm">Warnings</span>
                  </div>
                  <span className="text-sm font-semibold">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">High Impact</span>
                  </div>
                  <span className="text-sm font-semibold">2</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-3">
                {['sales', 'retention', 'operations', 'promotion'].map((category) => {
                  const count = mockInsights.filter((i) => i.category === category).length;
                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="text-sm text-gray-700 capitalize">{category}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Schedule Report
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <TrendingUp className="w-4 h-4" />
                  View Analytics
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Bookmark className="w-4 h-4" />
                  Save Current View
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}