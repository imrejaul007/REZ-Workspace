/**
 * AssetMind Dashboard
 * Full dashboard with Asset Twin view
 */

'use client';

import React, { useState } from 'react';

// Types
interface AssetTwin {
  symbol: string;
  name: string;
  price: number;
  change: number;
  opportunityScore: number;
  riskScore: number;
  sentiment: number;
  prediction: {
    bullish: number;
    neutral: number;
    bearish: number;
  };
}

interface Briefing {
  marketSentiment: string;
  opportunities: { symbol: string; score: number }[];
  events: { event: string; impact: string; time: string }[];
}

// Mock Data
const MOCK_TWIN: AssetTwin = {
  symbol: 'NVDA',
  name: 'NVIDIA Corporation',
  price: 878.35,
  change: 2.51,
  opportunityScore: 85,
  riskScore: 35,
  sentiment: 78,
  prediction: { bullish: 62, neutral: 24, bearish: 14 }
};

const MOCK_BRIEFING: Briefing = {
  marketSentiment: 'Moderately Bullish',
  opportunities: [
    { symbol: 'SMCI', score: 88 },
    { symbol: 'VRT', score: 85 },
    { symbol: 'NVDA', score: 82 }
  ],
  events: [
    { event: 'US CPI', impact: 'HIGH', time: '8:30 AM' },
    { event: 'Fed Meeting', impact: 'HIGH', time: '2:00 PM' }
  ]
};

// Score Card Component
function ScoreCard({ label, value, color, trend }: { label: string; value: number; color: string; trend: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          trend === 'UP' ? 'bg-green-900 text-green-400' :
          trend === 'DOWN' ? 'bg-red-900 text-red-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          {trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : '→'} {trend}
        </span>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
        <span className="text-sm text-gray-500 ml-1">/100</span>
      </div>
    </div>
  );
}

// Prediction Bar
function PredictionBar({ bullish, neutral, bearish }: { bullish: number; neutral: number; bearish: number }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Probability Prediction</h3>
      <div className="flex h-24">
        <div className="flex-1 bg-green-600/20 rounded-l-lg flex flex-col items-center justify-end p-2">
          <div className="text-2xl font-bold text-green-500">{bullish}%</div>
          <div className="text-xs text-green-400">Bullish</div>
        </div>
        <div className="flex-1 bg-gray-600/20 flex flex-col items-center justify-end p-2">
          <div className="text-2xl font-bold text-gray-400">{neutral}%</div>
          <div className="text-xs text-gray-500">Neutral</div>
        </div>
        <div className="flex-1 bg-red-600/20 rounded-r-lg flex flex-col items-center justify-end p-2">
          <div className="text-2xl font-bold text-red-500">{bearish}%</div>
          <div className="text-xs text-red-400">Bearish</div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard
export default function Dashboard() {
  const [twin] = useState<AssetTwin>(MOCK_TWIN);
  const [briefing] = useState<Briefing>(MOCK_BRIEFING);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-xl font-bold text-white">AssetMind</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Today: June 5, 2026</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Morning Briefing */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Morning Briefing</h2>
              <p className="text-indigo-200 text-sm">AI-powered daily intelligence</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-indigo-200">Market Sentiment</div>
              <div className="text-xl font-bold text-white">{briefing.marketSentiment}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-indigo-200 mb-2">Top Opportunities</h3>
              {briefing.opportunities.map((opp, i) => (
                <div key={i} className="flex justify-between text-sm text-white mb-1">
                  <span>{opp.symbol}</span>
                  <span className="text-green-300">{opp.score}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-medium text-indigo-200 mb-2">Economic Events</h3>
              {briefing.events.map((evt, i) => (
                <div key={i} className="flex justify-between text-sm text-white mb-1">
                  <span>{evt.event}</span>
                  <span className={evt.impact === 'HIGH' ? 'text-red-300' : 'text-yellow-300'}>{evt.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Asset Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">{twin.name}</h2>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-white">${twin.price.toLocaleString()}</span>
            <span className={`text-lg font-medium ${twin.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {twin.change >= 0 ? '+' : ''}{twin.change}%
            </span>
            <span className="text-sm text-gray-500">24h</span>
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <ScoreCard label="Opportunity" value={twin.opportunityScore} color="#10B981" trend="UP" />
          <ScoreCard label="Risk" value={twin.riskScore} color="#EF4444" trend="STABLE" />
          <ScoreCard label="Sentiment" value={twin.sentiment} color="#3B82F6" trend="UP" />
          <ScoreCard label="Confidence" value={78} color="#8B5CF6" trend="STABLE" />
        </div>

        {/* Prediction */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <PredictionBar {...twin.prediction} />
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-4">AI Recommendation</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">📊</span>
              <div>
                <div className="font-medium text-green-400">Bullish on {twin.symbol}</div>
                <div className="text-sm text-gray-400">62% probability of upside</div>
              </div>
            </div>
            <div className="text-sm text-gray-300">
              Strong AI infrastructure demand continues. Data center revenue growing 400% YoY.
            </div>
          </div>
        </div>

        {/* Research Report Preview */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-1">Supporting Factors</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Strong data center revenue growth</li>
                <li>• Institutional accumulation increasing</li>
                <li>• AI chip demand remains robust</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-1">Risk Factors</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Valuation at 45x forward PE elevated</li>
                <li>• China export restrictions remain</li>
              </ul>
            </div>
          </div>
          <button className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            View Full Research Report
          </button>
        </div>
      </main>
    </div>
  );
}
