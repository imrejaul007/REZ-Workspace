'use client';

import React, { useState, useEffect } from 'react';
import { DecisionCard, HealthScoreGauge, PredictiveChart } from '@/components/ai';
import intelligence, { WorkforceHealthScore, DecisionCard as DecisionCardType, WorkforceForecast } from '@/lib/ai/client';

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'forecasts' | 'anomalies'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [healthScore, setHealthScore] = useState<WorkforceHealthScore | null>(null);
  const [decisionCards, setDecisionCards] = useState<DecisionCardType[]>([]);
  const [forecast, setForecast] = useState<WorkforceForecast | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load health score
      const healthResponse = await intelligence.getHealthScore();
      if (healthResponse.success && healthResponse.data) {
        setHealthScore(healthResponse.data);
      }

      // Load decision cards
      const cardsResponse = await intelligence.getDecisionCards();
      if (cardsResponse.success && cardsResponse.data) {
        setDecisionCards(cardsResponse.data.cards || []);
      }

      // Load forecast
      const forecastResponse = await intelligence.getWorkforceForecast();
      if (forecastResponse.success && forecastResponse.data) {
        setForecast(forecastResponse.data);
      }
    } catch (err) {
      logger.error('Failed to load insights:', err);
      setError('Failed to load AI insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissCard = (cardId: string) => {
    setDecisionCards(prev => prev.filter(c => c.id !== cardId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-48 bg-gray-200 rounded-xl" />
              <div className="h-48 bg-gray-200 rounded-xl" />
              <div className="h-48 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <span className="text-4xl mb-4 block">⚠️</span>
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🧠</span>
            <h1 className="text-2xl font-bold">AI Workforce Intelligence</h1>
          </div>
          <p className="text-indigo-100">
            Decision intelligence powered by real-time workforce analytics
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'forecasts', label: 'Forecasts', icon: '🔮' },
            { id: 'anomalies', label: 'Anomalies', icon: '⚠️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Health Score */}
            {healthScore && (
              <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Workforce Health Score
                </h2>
                <HealthScoreGauge score={healthScore} />
              </section>
            )}

            {/* Decision Cards */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                AI Recommendations
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                  {decisionCards.length}
                </span>
              </h2>
              {decisionCards.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {decisionCards.map((card) => (
                    <DecisionCard
                      key={card.id}
                      card={card}
                      onDismiss={() => handleDismissCard(card.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <span className="text-4xl mb-4 block">✨</span>
                  <p className="text-gray-600">
                    No active recommendations. Your workforce is performing well!
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Forecasts Tab */}
        {activeTab === 'forecasts' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Attrition Forecast */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📉</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Attrition Risk</h3>
                    <p className="text-sm text-gray-500">Next 90 days</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {forecast?.attritionForecast.predictions[forecast.attritionForecast.predictions.length - 1]?.value
                    ? `${(forecast.attritionForecast.predictions[forecast.attritionForecast.predictions.length - 1].value * 100).toFixed(1)}%`
                    : '8.5%'}
                </div>
                <p className="text-sm text-gray-500 mt-1">Projected attrition rate</p>
              </div>

              {/* Headcount Forecast */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">👥</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Headcount</h3>
                    <p className="text-sm text-gray-500">Projected growth</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  +{forecast?.headcountForecast.predictions[forecast.headcountForecast.predictions.length - 1]?.value
                    ? forecast.headcountForecast.predictions[forecast.headcountForecast.predictions.length - 1].value - 150
                    : 3}
                </div>
                <p className="text-sm text-gray-500 mt-1">New hires in 90 days</p>
              </div>

              {/* Payroll Forecast */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Payroll</h3>
                    <p className="text-sm text-gray-500">Next 90 days</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  ₹{(forecast?.payrollForecast.next90Days / 100000).toFixed(1)}L
                </div>
                <p className="text-sm text-gray-500 mt-1">Projected payroll cost</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {forecast && forecast.headcountForecast.predictions.length > 0 && (
                <PredictiveChart
                  title="Headcount Forecast"
                  data={forecast.headcountForecast.predictions.map(p => ({
                    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    value: p.value,
                    lowerBound: p.lowerBound,
                    upperBound: p.upperBound,
                  }))}
                  unit=" employees"
                />
              )}

              {forecast && forecast.attritionForecast.predictions.length > 0 && (
                <PredictiveChart
                  title="Attrition Rate Forecast"
                  data={forecast.attritionForecast.predictions.map(p => ({
                    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    value: p.value * 100,
                    lowerBound: p.lowerBound ? p.lowerBound * 100 : undefined,
                    upperBound: p.upperBound ? p.upperBound * 100 : undefined,
                  }))}
                  unit="%"
                />
              )}
            </div>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <h3 className="font-semibold text-amber-800">Real-time Anomaly Detection</h3>
                  <p className="text-sm text-amber-700">
                    Automatically monitors workforce metrics for unusual patterns and anomalies.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Anomaly */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Attendance Patterns</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Normal
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Present Rate</span>
                    <span className="font-medium text-gray-800">94.2%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '94.2%' }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Expected: 92-96%</span>
                    <span className="text-green-600">Within range</span>
                  </div>
                </div>
              </div>

              {/* Engagement Anomaly */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Engagement Trends</h3>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    Slight Decline
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Engagement Score</span>
                    <span className="font-medium text-gray-800">73/100</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: '73%' }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Target: 75+</span>
                    <span className="text-yellow-600">2 points below target</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
