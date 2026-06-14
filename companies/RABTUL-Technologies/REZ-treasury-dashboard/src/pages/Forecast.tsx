/**
 * TreasuryOS Dashboard - Forecast Page
 */

import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const ForecastPage: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const forecastData = [
    { week: 'W1', inflow: 450000, outflow: 320000, balance: 2580000 },
    { week: 'W2', inflow: 520000, outflow: 380000, balance: 2720000 },
    { week: 'W3', inflow: 480000, outflow: 350000, balance: 2850000 },
    { week: 'W4', inflow: 550000, outflow: 420000, balance: 2980000 },
    { week: 'W5', inflow: 500000, outflow: 380000, balance: 3100000 },
    { week: 'W6', inflow: 580000, outflow: 400000, balance: 3280000 },
    { week: 'W7', inflow: 520000, outflow: 360000, balance: 3440000 },
    { week: 'W8', inflow: 600000, outflow: 420000, balance: 3620000 },
    { week: 'W9', inflow: 550000, outflow: 390000, balance: 3780000 },
    { week: 'W10', inflow: 580000, outflow: 400000, balance: 3960000 },
    { week: 'W11', inflow: 620000, outflow: 430000, balance: 4150000 },
    { week: 'W12', inflow: 590000, outflow: 410000, balance: 4330000 },
    { week: 'W13', inflow: 650000, outflow: 450000, balance: 4530000 },
  ];

  const shortfallPrediction = {
    willShortfall: false,
    projectedShortfall: 0,
    projectedBalance: 4530000,
    requiredBalance: 10000,
    confidence: 85,
    riskLevel: 'low' as const,
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">13-Week Cash Flow Forecast</h1>
          <p className="text-gray-500">AI-powered cash flow predictions</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Regenerate Forecast'}
        </button>
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Week 13 Balance</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(4530000)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Net Cash Flow</p>
          <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            +{formatCurrency(2080000)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Confidence</p>
          <p className="text-2xl font-bold">{shortfallPrediction.confidence}%</p>
        </div>
        <div className={`rounded-xl shadow-sm p-6 ${
          shortfallPrediction.riskLevel === 'low' ? 'bg-green-50' :
          shortfallPrediction.riskLevel === 'medium' ? 'bg-yellow-50' :
          'bg-red-50'
        }`}>
          <p className="text-sm text-gray-500">Shortfall Risk</p>
          <p className={`text-2xl font-bold flex items-center gap-2 ${
            shortfallPrediction.riskLevel === 'low' ? 'text-green-600' :
            shortfallPrediction.riskLevel === 'medium' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {shortfallPrediction.riskLevel === 'low' && <AlertTriangle className="w-5 h-5" />}
            {shortfallPrediction.riskLevel.charAt(0).toUpperCase() + shortfallPrediction.riskLevel.slice(1)}
          </p>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Cash Flow by Week</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis tickFormatter={(v) => `₹${v / 100000}L`} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Legend />
              <Bar dataKey="inflow" fill="#10B981" name="Inflow" />
              <Bar dataKey="outflow" fill="#EF4444" name="Outflow" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Balance Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Projected Balance Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis tickFormatter={(v) => `₹${v / 100000}L`} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={3} name="Balance" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Weekly Breakdown</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-3">Week</th>
              <th className="pb-3">Inflow</th>
              <th className="pb-3">Outflow</th>
              <th className="pb-3">Net</th>
              <th className="pb-3">Closing Balance</th>
              <th className="pb-3">Risk</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {forecastData.map((week) => {
              const net = week.inflow - week.outflow;
              const riskLevel = week.balance < 100000 ? 'critical' : week.balance < week.outflow * 2 ? 'high' : 'low';
              return (
                <tr key={week.week} className="border-b">
                  <td className="py-3 font-medium">{week.week}</td>
                  <td className="py-3 text-green-600">{formatCurrency(week.inflow)}</td>
                  <td className="py-3 text-red-600">{formatCurrency(week.outflow)}</td>
                  <td className={`py-3 font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {net >= 0 ? '+' : ''}{formatCurrency(net)}
                  </td>
                  <td className="py-3 font-medium">{formatCurrency(week.balance)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                      riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {riskLevel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastPage;