'use client';

import { useState, useEffect } from 'react';

export default function OEMDashboard() {
  const [brandId, setBrandId] = useState('demo_brand');
  const [period, setPeriod] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');

  const [metrics, setMetrics] = useState({
    total_serials: 125000,
    active_products: 98000,
    activation_rate: 70,
    pending_claims: 342,
    fraud_attempts: 127,
  });

  const getMockData = (tab: string) => {
    switch (tab) {
      case 'counterfeit':
        return {
          total_reports: 342,
          risk_score: 45,
          by_type: [
            { type: 'fake_serial', count: 180, confidence: 78 },
            { type: 'replica', count: 95, confidence: 65 },
            { type: 'cloned', count: 45, confidence: 82 },
          ],
        };
      case 'regional':
        return {
          regions: [
            { city: 'Mumbai', verifications: 45000, rate: 72 },
            { city: 'Delhi', verifications: 38000, rate: 68 },
            { city: 'Bangalore', verifications: 28000, rate: 75 },
          ],
        };
      case 'fraud':
        return {
          patterns: [
            { type: 'serial_hijacking', severity: 'critical', count: 45 },
            { type: 'fake_activation', severity: 'high', count: 62 },
          ],
        };
      case 'predictions':
        return {
          forecasts: [
            { label: 'Projected Verifications', value: 45000, color: 'emerald' },
            { label: 'Projected Claims', value: 1350, color: 'blue' },
            { label: 'Expiring Warranties', value: 500, color: 'amber' },
          ],
        };
      default:
        return {};
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'counterfeit', label: 'Counterfeit', icon: '🔍' },
    { id: 'regional', label: 'Regional', icon: '🌍' },
    { id: 'fraud', label: 'Fraud', icon: '⚠️' },
    { id: 'predictions', label: 'Predictions', icon: '🔮' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 -mx-4 md:-mx-8 px-4 md:px-8 py-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">OEM Dashboard</h1>
            <p className="text-slate-400 mt-1">Brand Analytics & Insights</p>
          </div>
          <div className="flex gap-3">
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg backdrop-blur-sm"
            >
              <option value="demo_brand">Samsung</option>
              <option value="apple">Apple</option>
              <option value="google">Google</option>
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg backdrop-blur-sm"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Serials', value: metrics.total_serials.toLocaleString(), color: 'blue' },
              { label: 'Active Products', value: metrics.active_products.toLocaleString(), color: 'emerald' },
              { label: 'Activation Rate', value: `${metrics.activation_rate}%`, color: 'violet' },
              { label: 'Fraud Blocked', value: metrics.fraud_attempts, color: 'red' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Activation Funnel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Activation Funnel</h3>
            <div className="space-y-4">
              {[
                { label: 'Serials Generated', value: 125000, color: 'bg-blue-500', width: 100 },
                { label: 'Verified', value: 105000, color: 'bg-blue-400', width: 84 },
                { label: 'Activated', value: 87500, color: 'bg-emerald-500', width: 70 },
              ].map((step, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{step.label}</span>
                    <span className="font-semibold text-gray-900">{step.value.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${step.color} rounded-full transition-all duration-500`}
                      style={{ width: `${step.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-amber-800 mb-4">⚠️ Active Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-gray-700">Fraud rate exceeds threshold (3.2%)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-gray-700">Activation rate below target (70%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Counterfeit Tab */}
      {activeTab === 'counterfeit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white">
              <p className="text-white/80 text-sm mb-1">Total Reports</p>
              <p className="text-3xl font-bold">342</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-gray-500 text-sm mb-1">Risk Score</p>
              <p className="text-3xl font-bold text-amber-600">45</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-gray-500 text-sm mb-1">Risk Level</p>
              <p className="text-3xl font-bold text-orange-600 capitalize">medium</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">By Type</h3>
            <div className="space-y-4">
              {getMockData('counterfeit').by_type.map((item, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium capitalize">{item.type.replace('_', ' ')}</span>
                      <span className="text-gray-500">{item.count} reports</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(item.count / 342) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">{item.confidence}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Regional Tab */}
      {activeTab === 'regional' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Regional Distribution</h3>
          <div className="space-y-4">
            {getMockData('regional').regions.map((region, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900">{region.city}</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{region.verifications.toLocaleString()}</span>
                    <span className="text-gray-400 ml-2">({region.rate}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                    style={{ width: `${region.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fraud Tab */}
      {activeTab === 'fraud' && (
        <div className="space-y-4">
          {getMockData('fraud').patterns.map((pattern, i: number) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    pattern.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {pattern.severity}
                  </span>
                  <span className="font-semibold text-gray-900 capitalize">{pattern.type.replace('_', ' ')}</span>
                </div>
                <span className="text-2xl font-bold text-gray-400">{pattern.count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {getMockData('predictions').forecasts.map((item, i: number) => (
              <div key={i} className={`bg-gradient-to-br ${
                item.color === 'emerald' ? 'from-emerald-500 to-teal-600' :
                item.color === 'blue' ? 'from-blue-500 to-indigo-600' :
                'from-amber-500 to-orange-600'
              } rounded-2xl p-6 text-white`}>
                <p className="text-white/80 text-sm mb-1">{item.label}</p>
                <p className="text-3xl font-bold">{item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-3">
              {[
                'Contact 500 customers with expiring warranties for renewal',
                'High claim rate in Mumbai - consider quality review',
                '350 upsell opportunities for extended warranty',
              ].map((rec, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
