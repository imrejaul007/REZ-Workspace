import React from 'react';
import { Performance } from '../types';
import { Star, TrendingUp, Award, DollarSign } from 'lucide-react';

interface PerformanceChartProps {
  data: Performance[];
  view?: 'leaderboard' | 'individual' | 'tips';
  staffId?: string;
}

export function PerformanceChart({ data, view = 'leaderboard', staffId }: PerformanceChartProps) {
  if (view === 'individual' && staffId) {
    const staff = data.find(p => p.staffId === staffId);
    if (!staff) return <div className="text-gray-500">No performance data available</div>;
    return <IndividualPerformance data={staff} />;
  }

  if (view === 'tips') {
    return <TipsChart data={data} />;
  }

  return <LeaderboardChart data={data} />;
}

function LeaderboardChart({ data }: { data: Performance[] }) {
  const maxTips = Math.max(...data.map(d => d.tipsCollected));

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Award className="w-5 h-5 text-yellow-500" />
        Top Performers
      </h3>

      <div className="space-y-2">
        {data.slice(0, 10).map((perf, index) => (
          <div
            key={perf.staffId}
            className={`
              flex items-center gap-4 p-3 rounded-lg transition-all
              ${index === 0 ? 'bg-yellow-50 border-2 border-yellow-300' :
                index === 1 ? 'bg-gray-50 border-2 border-gray-300' :
                index === 2 ? 'bg-orange-50 border-2 border-orange-300' :
                'bg-white border border-gray-200 hover:shadow-sm'}
            `}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center font-bold
              ${index === 0 ? 'bg-yellow-400 text-white' :
                index === 1 ? 'bg-gray-400 text-white' :
                index === 2 ? 'bg-orange-400 text-white' :
                'bg-gray-200 text-gray-600'}
            `}>
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{perf.staffName}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{perf.completedShifts}/{perf.totalShifts} shifts</span>
                <span>{perf.attendanceRate.toFixed(0)}% attendance</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Tips</p>
                <p className="font-semibold text-green-600">${perf.tipsCollected}</p>
              </div>

              <div className="flex items-center gap-1">
                <Star className={`w-4 h-4 ${perf.rating >= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                <span className="font-medium">{perf.rating.toFixed(1)}</span>
              </div>

              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                  style={{ width: `${(perf.tipsCollected / maxTips) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndividualPerformance({ data }: { data: Performance }) {
  const attendancePercentage = Math.round(data.attendanceRate);
  const shiftCompletion = Math.round((data.completedShifts / data.totalShifts) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {data.staffName.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-xl text-gray-900">{data.staffName}</h3>
          <p className="text-gray-500">{data.period}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900">{data.rating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-gray-500">Rating</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">${data.tipsCollected}</span>
          </div>
          <p className="text-sm text-gray-500">Tips Collected</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">${data.bonusesEarned}</span>
          </div>
          <p className="text-sm text-gray-500">Bonuses</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">#{data.rank}</span>
          </div>
          <p className="text-sm text-gray-500">Rank</p>
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold text-gray-900 mb-4">Attendance Rate</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  attendancePercentage >= 90 ? 'bg-green-500' :
                  attendancePercentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
          </div>
          <span className="font-semibold text-gray-900">{attendancePercentage}%</span>
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold text-gray-900 mb-4">Shift Completion</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${shiftCompletion}%` }}
              />
            </div>
          </div>
          <span className="font-semibold text-gray-900">
            {data.completedShifts}/{data.totalShifts} ({shiftCompletion}%)
          </span>
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold text-gray-900 mb-4">Earnings Breakdown</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Base Tips</span>
            <span className="font-medium">${data.tipsCollected}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Bonuses</span>
            <span className="font-medium text-green-600">+${data.bonusesEarned}</span>
          </div>
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-xl text-gray-900">
              ${data.tipsCollected + data.bonusesEarned}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TipsChart({ data }: { data: Performance[] }) {
  const sortedByTips = [...data].sort((a, b) => b.tipsCollected - a.tipsCollected);
  const maxTips = sortedByTips[0]?.tipsCollected || 1;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-500" />
        Tips Leaderboard
      </h3>

      <div className="space-y-3">
        {sortedByTips.map((perf, index) => (
          <div key={perf.staffId} className="flex items-center gap-4">
            <div className="w-6 text-center font-medium text-gray-500">{index + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 truncate">{perf.staffName}</span>
                <span className="font-semibold text-green-600">${perf.tipsCollected}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${(perf.tipsCollected / maxTips) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
