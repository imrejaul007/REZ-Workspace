'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ResalePage() {
  const [serial, setSerial] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const checkResale = async () => {
    if (!serial) return;
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setResult({
        risk_assessment: {
          score: 85,
          level: 'low',
          can_proceed: true,
          factors: [
            { factor: 'ownership_verified', score: 95, description: 'Ownership chain is verified' },
            { factor: 'warranty_valid', score: 90, description: 'Warranty is still active' },
            { factor: 'no_fraud_history', score: 80, description: 'No fraud reports found' },
          ],
        },
        warranty: {
          status: 'active',
          remaining_days: 268,
          transferable: true,
        },
        service_history: {
          total_services: 0,
          recent_services: 0,
        },
        recommendation: 'This product is safe to purchase. Ownership is verified and warranty is transferable.',
      });
      setLoading(false);
    }, 1500);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'from-emerald-400 to-emerald-600';
      case 'medium': return 'from-amber-400 to-orange-500';
      case 'high': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 p-8 mb-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Resale Verification
          </h1>
          <p className="text-blue-100 text-lg">
            Verify product authenticity before buying or selling
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              placeholder="Enter serial number"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            onClick={checkResale}
            disabled={!serial || loading}
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Verify'
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Risk Score */}
          <div className={`rounded-2xl bg-gradient-to-r ${getRiskColor(result.risk_assessment.level)} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Risk Assessment Score</p>
                <p className="text-5xl font-bold">{result.risk_assessment.score}/100</p>
              </div>
              <div className={`px-4 py-2 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm`}>
                <span className="text-2xl font-bold capitalize">{result.risk_assessment.level} RISK</span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="mt-6 h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${result.risk_assessment.score}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/60">
              <span>High Risk</span>
              <span>Low Risk</span>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Factors</h3>
            <div className="space-y-3">
              {result.risk_assessment.factors.map((factor, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    factor.score > 70 ? 'bg-emerald-100' : factor.score > 40 ? 'bg-amber-100' : 'bg-red-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      factor.score > 70 ? 'text-emerald-600' : factor.score > 40 ? 'text-amber-600' : 'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 capitalize">{factor.factor.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-500">{factor.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      factor.score > 70 ? 'text-emerald-600' : factor.score > 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {factor.score}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warranty & Service */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Warranty Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-emerald-600 capitalize">{result.warranty.status}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Days Remaining</span>
                  <span className="font-medium text-gray-900">{result.warranty.remaining_days}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-500">Transferable</span>
                  <span className={`font-medium ${result.warranty.transferable ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.warranty.transferable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Service History</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Total Services</span>
                  <span className="font-medium text-gray-900">{result.service_history.total_services}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-500">Recent (30 days)</span>
                  <span className="font-medium text-gray-900">{result.service_history.recent_services}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className={`rounded-2xl p-6 ${
            result.risk_assessment.can_proceed
              ? 'bg-emerald-50 border-2 border-emerald-200'
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                result.risk_assessment.can_proceed ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                {result.risk_assessment.can_proceed ? (
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-1 ${result.risk_assessment.can_proceed ? 'text-emerald-800' : 'text-red-800'}`}>
                  {result.risk_assessment.can_proceed ? 'Safe to Proceed' : 'Not Recommended'}
                </h3>
                <p className={result.risk_assessment.can_proceed ? 'text-emerald-700' : 'text-red-700'}>
                  {result.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {result.risk_assessment.can_proceed && (
            <div className="flex gap-4">
              <button className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all">
                Proceed with Purchase
              </button>
              <button className="px-6 py-4 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all">
                Contact Seller
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 7c0 3.308 2.692 6 6 6s6-2.692 6-6c0-1.05-.18-2.05-.5-2.98z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Before You Buy</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter a serial number to check product authenticity, ownership verification, and warranty status before making a purchase.
          </p>
        </div>
      )}
    </div>
  );
}
