'use client';

import React, { useState, useEffect } from 'react';
import { WorkforceHealthScore } from '@/lib/ai/client';

interface HealthScoreGaugeProps {
  score: WorkforceHealthScore;
  showDetails?: boolean;
  compact?: boolean;
  animated?: boolean;
}

export default function HealthScoreGauge({
  score,
  showDetails = true,
  compact = false,
  animated = true
}: HealthScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score.overall);
  const [animatedComponents, setAnimatedComponents] = useState({
    engagement: 0,
    attendance: 0,
    productivity: 0,
    sentiment: 0,
  });

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score.overall);
      setAnimatedComponents(score.components);
      return;
    }

    // Animate main score
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;
    let step = 0;

    const scoreInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score.overall * easeOut));

      if (step >= steps) {
        clearInterval(scoreInterval);
      }
    }, stepDuration);

    // Animate components
    const componentDuration = 1000;
    const componentSteps = 60;
    const componentStepDuration = componentDuration / componentSteps;
    let componentStep = 0;

    const componentInterval = setInterval(() => {
      componentStep++;
      const progress = componentStep / componentSteps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedComponents({
        engagement: Math.round(score.components.engagement * easeOut),
        attendance: Math.round(score.components.attendance * easeOut),
        productivity: Math.round(score.components.productivity * easeOut),
        sentiment: Math.round(score.components.sentiment * easeOut),
      });

      if (componentStep >= componentSteps) {
        clearInterval(componentInterval);
      }
    }, componentStepDuration);

    return () => {
      clearInterval(scoreInterval);
      clearInterval(componentInterval);
    };
  }, [score, animated]);

  const getScoreConfig = (value: number) => {
    if (value >= 80) return { color: '#10b981', label: 'Excellent', bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'from-emerald-400 to-emerald-600' };
    if (value >= 70) return { color: '#22c55e', label: 'Good', bg: 'bg-green-100', text: 'text-green-700', ring: 'from-green-400 to-green-600' };
    if (value >= 60) return { color: '#eab308', label: 'Fair', bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'from-yellow-400 to-yellow-600' };
    if (value >= 50) return { color: '#f97316', label: 'Warning', bg: 'bg-orange-100', text: 'text-orange-700', ring: 'from-orange-400 to-orange-600' };
    return { color: '#ef4444', label: 'Critical', bg: 'bg-red-100', text: 'text-red-700', ring: 'from-red-400 to-red-600' };
  };

  const overall = getScoreConfig(displayScore);
  const engagement = getScoreConfig(animatedComponents.engagement);
  const attendance = getScoreConfig(animatedComponents.attendance);
  const productivity = getScoreConfig(animatedComponents.productivity);
  const sentiment = getScoreConfig(animatedComponents.sentiment);

  // SVG gauge calculation
  const radius = compact ? 45 : 70;
  const strokeWidth = compact ? 8 : 12;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  if (compact) {
    return (
      <div className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors">
        <div className="relative">
          <svg width={radius * 2 + 24} height={radius * 2 + 24} className="-rotate-90">
            {/* Background circle with gradient */}
            <defs>
              <linearGradient id={`gauge-gradient-${score.overall}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e5e7eb" />
                <stop offset="100%" stopColor="#f3f4f6" />
              </linearGradient>
            </defs>
            <circle
              cx={radius + 12}
              cy={radius + 12}
              r={radius}
              fill="none"
              stroke={`url(#gauge-gradient-${score.overall})`}
              strokeWidth={strokeWidth}
            />
            {/* Progress circle with gradient */}
            <circle
              cx={radius + 12}
              cy={radius + 12}
              r={radius}
              fill="none"
              stroke={overall.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 6px ${overall.color}40)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold transition-colors duration-500" style={{ color: overall.color }}>
              {displayScore}
            </span>
          </div>
        </div>
        <div>
          <div className={`text-sm font-semibold ${overall.text} transition-colors duration-500`}>
            {overall.label}
          </div>
          <div className="text-xs text-gray-500">Health Score</div>
        </div>
      </div>
    );
  }

  const componentItems = [
    { key: 'engagement', label: 'Engagement', icon: '💬', value: animatedComponents.engagement, config: engagement },
    { key: 'attendance', label: 'Attendance', icon: '📅', value: animatedComponents.attendance, config: attendance },
    { key: 'productivity', label: 'Productivity', icon: '⚡', value: animatedComponents.productivity, config: productivity },
    { key: 'sentiment', label: 'Sentiment', icon: '😊', value: animatedComponents.sentiment, config: sentiment },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <h2 className="text-white font-semibold">Workforce Health</h2>
        <p className="text-indigo-200 text-sm">Real-time composite score</p>
      </div>

      <div className="p-6">
        <div className="flex items-start gap-8">
          {/* Main Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg width={radius * 2 + 32} height={radius * 2 + 32} className="-rotate-90">
                {/* Background circle */}
                <circle
                  cx={radius + 16}
                  cy={radius + 16}
                  r={radius}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth={strokeWidth}
                />
                {/* Animated progress */}
                <circle
                  cx={radius + 16}
                  cy={radius + 16}
                  r={radius}
                  fill="none"
                  stroke={overall.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 10px ${overall.color}60)`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black transition-colors duration-500" style={{ color: overall.color }}>
                  {displayScore}
                </span>
                <span className="text-sm text-gray-500">/ 100</span>
              </div>
            </div>
            <div className={`mt-3 px-4 py-1.5 rounded-full text-sm font-bold ${overall.bg} ${overall.text} ring-2 ring-offset-2`}
                 style={{ outlineColor: overall.color + '30' }}>
              {overall.label}
            </div>
          </div>

          {/* Components Grid */}
          {showDetails && (
            <div className="flex-1 grid grid-cols-2 gap-3">
              {componentItems.map(({ key, label, icon, value, config }) => (
                <div
                  key={key}
                  className={`p-4 rounded-xl ${config.bg} transition-all duration-500 hover:scale-105`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                    <span className={`font-bold text-lg ${config.text}`}>{value}</span>
                  </div>
                  <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${value}%`,
                        backgroundColor: config.color,
                        boxShadow: `0 0 8px ${config.color}60`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trends & Risk Section */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            {/* Trend Indicators */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  score.trends.weekly >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className={`text-lg ${score.trends.weekly >= 0 ? '↗' : '↘'}`} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Weekly Trend</div>
                  <div className={`text-lg font-bold ${score.trends.weekly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {score.trends.weekly >= 0 ? '+' : ''}{score.trends.weekly}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  score.trends.monthly >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className={`text-lg ${score.trends.monthly >= 0 ? '↗' : '↘'}`} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Monthly Trend</div>
                  <div className={`text-lg font-bold ${score.trends.monthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {score.trends.monthly >= 0 ? '+' : ''}{score.trends.monthly}%
                  </div>
                </div>
              </div>
            </div>

            {/* Department Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="text-xs text-green-600 font-medium">🏆 Healthiest Dept</div>
                <div className="text-base font-bold text-green-700">{score.healthiestDept}</div>
              </div>
              <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                <div className="text-xs text-orange-600 font-medium">⚠️ At Risk Dept</div>
                <div className="text-base font-bold text-orange-700">{score.atRiskDept}</div>
              </div>
            </div>

            {/* Risk Indicators */}
            {score.riskIndicators.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 font-medium mb-2">Active Risk Indicators</div>
                <div className="flex flex-wrap gap-2">
                  {score.riskIndicators.slice(0, 4).map((risk, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        risk.severity === 'high'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : risk.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}
                    >
                      {risk.indicator}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Last updated: {new Date(score.generatedAt).toLocaleString()}</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}
