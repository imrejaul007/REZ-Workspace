import React, { useState } from 'react';
import { usePerformance, useLeaderboard, useStaff } from '../hooks/useStaff';
import { PerformanceChart } from '../components/PerformanceChart';
import { Performance } from '../types';
import { format } from 'date-fns';
import {
  Trophy,
  TrendingUp,
  DollarSign,
  Star,
  Users,
  Calendar,
  Search,
} from 'lucide-react';

export function PerformancePage() {
  const [view, setView] = useState<'leaderboard' | 'tips' | 'individual'>('leaderboard');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: performance, loading: perfLoading, error: perfError } = usePerformance();
  const { data: leaderboard, loading: leaderboardLoading } = useLeaderboard(10);
  const { data: staff } = useStaff();

  const filteredPerformance = performance?.filter(p =>
    p.staffName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const overallStats = performance ? {
    avgRating: (performance.reduce((sum, p) => sum + p.rating, 0) / performance.length).toFixed(1),
    totalTips: performance.reduce((sum, p) => sum + p.tipsCollected, 0),
    totalBonuses: performance.reduce((sum, p) => sum + p.bonusesEarned, 0),
    avgAttendance: (performance.reduce((sum, p) => sum + p.attendanceRate, 0) / performance.length).toFixed(0),
  } : null;

  if (perfLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (perfError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load performance data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Metrics</h1>
          <p className="text-gray-500">May 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('leaderboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'leaderboard'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setView('tips')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'tips'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tips
          </button>
          <button
            onClick={() => setView('individual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'individual'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Individual
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-full">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.avgRating}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-full">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tips</p>
                <p className="text-2xl font-bold text-gray-900">${overallStats.totalTips.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Bonuses</p>
                <p className="text-2xl font-bold text-gray-900">${overallStats.totalBonuses.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-full">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.avgAttendance}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'individual' && !selectedStaffId && (
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPerformance.map((perf) => (
              <div
                key={perf.staffId}
                className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedStaffId(perf.staffId)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    perf.rank === 1 ? 'bg-yellow-400 text-white' :
                    perf.rank === 2 ? 'bg-gray-400 text-white' :
                    perf.rank === 3 ? 'bg-orange-400 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {perf.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{perf.staffName}</p>
                    <p className="text-sm text-gray-500">{perf.completedShifts} shifts completed</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className={`w-4 h-4 ${perf.rating >= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                    <span className="font-medium">{perf.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-green-600 font-semibold">${perf.tipsCollected}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'individual' && selectedStaffId && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedStaffId(null)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to all staff
          </button>
          <div className="card">
            <PerformanceChart data={performance || []} view="individual" staffId={selectedStaffId} />
          </div>
        </div>
      )}

      {(view === 'leaderboard' || view === 'tips') && (
        <div className="card">
          <PerformanceChart data={performance || []} view={view} />
        </div>
      )}

      {/* Top Performers Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaderboard?.slice(0, 3).map((perf, index) => (
          <div
            key={perf.staffId}
            className={`card text-center ${
              index === 0 ? 'bg-gradient-to-b from-yellow-50 to-white border-2 border-yellow-300' :
              index === 1 ? 'bg-gradient-to-b from-gray-50 to-white border-2 border-gray-300' :
              'bg-gradient-to-b from-orange-50 to-white border-2 border-orange-300'
            }`}
          >
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              index === 0 ? 'bg-yellow-400' :
              index === 1 ? 'bg-gray-400' :
              'bg-orange-400'
            }`}>
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <p className="text-4xl font-bold mb-2">#{index + 1}</p>
            <p className="font-semibold text-lg text-gray-900">{perf.staffName}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{perf.rating.toFixed(1)}</span>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-2xl font-bold text-green-600">${perf.tipsCollected}</p>
              <p className="text-sm text-gray-500">Total Tips</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">{perf.completedShifts} shifts completed</p>
              <p className="text-sm text-gray-600">{perf.attendanceRate.toFixed(0)}% attendance rate</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
