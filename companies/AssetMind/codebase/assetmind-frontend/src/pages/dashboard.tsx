/**
 * AssetMind Frontend - Core Pages
 *
 * Next.js 14 with App Router
 *
 * Version: 1.0
 * Date: June 5, 2026
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

interface AssetTwin {
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  opportunity_score: number;
  risk_score: number;
  sentiment: number;
  prediction: {
    bullish_probability: number;
    neutral_probability: number;
    bearish_probability: number;
    confidence: number;
  };
}

interface MarketBriefing {
  timestamp: string;
  market_sentiment: string;
  top_opportunities: AssetTwin[];
  top_risks: AssetTwin[];
  watchlist_changes: string[];
  economic_events: { event: string; impact: string; time: string }[];
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_MARKET_DATA = {
  nvda: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    current_price: 878.35,
    price_change_24h: 2.45,
    opportunity_score: 85,
    risk_score: 35,
    sentiment: 78,
    prediction: { bullish: 62, neutral: 24, bearish: 14 }
  },
  aapl: {
    symbol: 'AAPL',
    name: 'Apple Inc',
    current_price: 189.25,
    price_change_24h: -0.85,
    opportunity_score: 72,
    risk_score: 28,
    sentiment: 65,
    prediction: { bullish: 55, neutral: 30, bearish: 15 }
  }
};

const CHART_COLORS = {
  primary: '#6366F1',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6'
};

// ============================================================================
// Components
// ============================================================================

const ScoreCard = ({
  label,
  value,
  max = 100,
  color = CHART_COLORS.primary,
  trend = 'STABLE'
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className={`text-xs px-2 py-1 rounded-full ${
        trend === 'UP' ? 'bg-green-100 text-green-700' :
        trend === 'DOWN' ? 'bg-red-100 text-red-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : '→'} {trend}
      </span>
    </div>
    <div className="text-3xl font-bold" style={{ color }}>
      {value}
      <span className="text-sm text-gray-400 ml-1">/{max}</span>
    </div>
    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  </motion.div>
);

const PredictionGauge = ({ prediction }: { prediction: { bullish: number; neutral: number; bearish: number } }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <h3 className="text-sm font-medium text-gray-500 mb-4">Probability Prediction</h3>
    <div className="flex justify-between items-end h-32">
      <div className="flex-1 text-center">
        <div className="text-2xl font-bold text-green-500">{prediction.bullish}%</div>
        <div className="text-xs text-gray-500 mt-1">Bullish</div>
        <div
          className="mx-auto mt-2 w-16 rounded-t-lg"
          style={{
            height: `${prediction.bullish * 0.5}px`,
            backgroundColor: CHART_COLORS.success
          }}
        />
      </div>
      <div className="flex-1 text-center">
        <div className="text-2xl font-bold text-gray-500">{prediction.neutral}%</div>
        <div className="text-xs text-gray-500 mt-1">Neutral</div>
        <div
          className="mx-auto mt-2 w-16 rounded-t-lg"
          style={{
            height: `${prediction.neutral * 0.5}px`,
            backgroundColor: CHART_COLORS.warning
          }}
        />
      </div>
      <div className="flex-1 text-center">
        <div className="text-2xl font-bold text-red-500">{prediction.bearish}%</div>
        <div className="text-xs text-gray-500 mt-1">Bearish</div>
        <div
          className="mx-auto mt-2 w-16 rounded-t-lg"
          style={{
            height: `${prediction.bearish * 0.5}px`,
            backgroundColor: CHART_COLORS.danger
          }}
        />
      </div>
    </div>
  </div>
);

const PriceChart = ({ data }: { data: { time: string; price: number }[] }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <h3 className="text-sm font-medium text-gray-500 mb-4">Price History</h3>
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: 'none',
            borderRadius: '8px',
            color: 'white'
          }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={CHART_COLORS.primary}
          fill="url(#priceGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const BriefingCard = ({ briefing }: { briefing: MarketBriefing }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white"
  >
    <div className="flex justify-between items-start mb-6">
      <div>
        <h2 className="text-lg font-semibold">Morning Briefing</h2>
        <p className="text-sm text-indigo-200">{new Date(briefing.timestamp).toLocaleString()}</p>
      </div>
      <div className="text-right">
        <div className="text-sm text-indigo-200">Market Sentiment</div>
        <div className="text-xl font-bold">{briefing.market_sentiment}</div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-medium text-indigo-200 mb-2">Top Opportunities</h3>
        {briefing.top_opportunities.slice(0, 3).map((asset) => (
          <div key={asset.symbol} className="flex justify-between text-sm mb-1">
            <span>{asset.symbol}</span>
            <span className="text-green-300">{asset.opportunity_score}</span>
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-sm font-medium text-indigo-200 mb-2">Key Risks</h3>
        {briefing.top_risks.slice(0, 3).map((asset) => (
          <div key={asset.symbol} className="flex justify-between text-sm mb-1">
            <span>{asset.symbol}</span>
            <span className="text-red-300">{asset.risk_score}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-indigo-500">
      <h3 className="text-sm font-medium text-indigo-200 mb-2">Economic Events Today</h3>
      {briefing.economic_events.map((event, i) => (
        <div key={i} className="flex justify-between text-sm mb-1">
          <span>{event.event}</span>
          <span className={event.impact === 'HIGH' ? 'text-red-300' : 'text-yellow-300'}>
            {event.impact}
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

const AssetSearch = ({ onSelect }: { onSelect: (symbol: string) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([]);

  // Mock search - in production, call API
  useEffect(() => {
    if (query.length > 0) {
      const mockResults = [
        { symbol: 'NVDA', name: 'NVIDIA Corporation' },
        { symbol: 'AAPL', name: 'Apple Inc' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'GOOGL', name: 'Alphabet Inc' },
        { symbol: 'TSLA', name: 'Tesla Inc' },
      ].filter(r =>
        r.symbol.toLowerCase().includes(query.toLowerCase()) ||
        r.name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(mockResults);
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search assets (NVDA, Apple, Bitcoin...)"
        className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
          {results.map((result) => (
            <button
              key={result.symbol}
              onClick={() => {
                onSelect(result.symbol);
                setQuery('');
                setResults([]);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center"
            >
              <span className="font-medium">{result.symbol}</span>
              <span className="text-gray-500 text-sm">{result.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Dashboard Page
// ============================================================================

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState<string>('NVDA');
  const [assetData, setAssetData] = useState(MOCK_MARKET_DATA.nvda);

  const mockBriefing: MarketBriefing = {
    timestamp: new Date().toISOString(),
    market_sentiment: 'Moderately Bullish',
    top_opportunities: [
      { ...MOCK_MARKET_DATA.nvda, opportunity_score: 85 },
      { ...MOCK_MARKET_DATA.aapl, opportunity_score: 72 },
    ],
    top_risks: [
      { ...MOCK_MARKET_DATA.nvda, risk_score: 35 },
      { ...MOCK_MARKET_DATA.aapl, risk_score: 28 },
    ],
    watchlist_changes: ['Added BTC', 'Removed SPY'],
    economic_events: [
      { event: 'US CPI', impact: 'HIGH', time: '8:30 AM' },
      { event: 'Fed Meeting', impact: 'HIGH', time: '2:00 PM' },
    ]
  };

  const priceHistory = [
    { time: '9:00', price: 850 },
    { time: '10:00', price: 855 },
    { time: '11:00', price: 860 },
    { time: '12:00', price: 858 },
    { time: '13:00', price: 865 },
    { time: '14:00', price: 870 },
    { time: '15:00', price: 875 },
    { time: '16:00', price: 878 },
  ];

  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
    // In production, fetch actual data
    if (symbol === 'NVDA') setAssetData(MOCK_MARKET_DATA.nvda);
    else setAssetData(MOCK_MARKET_DATA.aapl);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AssetMind</h1>
                <p className="text-xs text-gray-500">Financial Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <AssetSearch onSelect={handleAssetSelect} />
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Morning Briefing */}
        <div className="mb-8">
          <BriefingCard briefing={mockBriefing} />
        </div>

        {/* Asset Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {assetData.name}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold">${assetData.current_price}</span>
            <span className={`text-lg font-medium ${assetData.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {assetData.price_change_24h >= 0 ? '+' : ''}{assetData.price_change_24h.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-500">24h</span>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <ScoreCard
            label="Opportunity Score"
            value={assetData.opportunity_score}
            color={CHART_COLORS.success}
            trend="UP"
          />
          <ScoreCard
            label="Risk Score"
            value={assetData.risk_score}
            color={CHART_COLORS.danger}
            trend="STABLE"
          />
          <ScoreCard
            label="Sentiment"
            value={assetData.sentiment}
            color={CHART_COLORS.info}
            trend="UP"
          />
          <ScoreCard
            label="Confidence"
            value={assetData.prediction.confidence || 78}
            color={CHART_COLORS.primary}
            trend="STABLE"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <PriceChart data={priceHistory} />
          </div>
          <PredictionGauge prediction={assetData.prediction} />
        </div>

        {/* What Should I Do? */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI Recommendation
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <div>
                <div className="font-medium text-green-600">Bullish on {selectedAsset}</div>
                <div className="text-sm text-gray-500">
                  Strong AI infrastructure demand continues. 62% probability of upside over 30 days.
                </div>
              </div>
            </div>
            <div className="pl-9 space-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Supporting factors:</span>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• Strong data center revenue growth</li>
                  <li>• Institutional accumulation increasing</li>
                  <li>• AI chip demand remains robust</li>
                </ul>
              </div>
            </div>
            <div className="pl-9 space-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Risk factors:</span>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• Valuation at 45x forward PE is elevated</li>
                  <li>• China export restrictions remain</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              View Full Research Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
