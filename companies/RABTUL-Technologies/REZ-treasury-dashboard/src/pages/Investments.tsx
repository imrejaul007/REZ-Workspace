/**
 * TreasuryOS Dashboard - Investments Page
 */

import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const InvestmentsPage: React.FC = () => {
  const [investments] = useState([
    { id: 'inv_1', name: 'HDFC FD Q2', type: 'fixed_deposit', principal: 100000, current: 107500, rate: 7.5, maturity: '2025-03-15', status: 'active' },
    { id: 'inv_2', name: 'SBI Mutual Fund', type: 'mutual_fund', principal: 50000, current: 54500, rate: 9.0, maturity: '2024-12-31', status: 'active' },
    { id: 'inv_3', name: 'Govt Bond 2024', type: 'government_bond', principal: 75000, current: 78000, rate: 7.2, maturity: '2024-08-20', status: 'active' },
  ]);

  const performanceData = [
    { month: 'Jan', value: 100000 },
    { month: 'Feb', value: 102500 },
    { month: 'Mar', value: 105000 },
    { month: 'Apr', value: 103000 },
    { month: 'May', value: 108000 },
    { month: 'Jun', value: 112000 },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  const getDaysUntil = (date: string) => {
    const maturity = new Date(date);
    const now = new Date();
    return Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.principal, 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + inv.current, 0);
  const totalReturns = totalCurrent - totalInvested;
  const returnPercent = ((totalReturns / totalInvested) * 100).toFixed(2);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Investment Portfolio</h1>
          <p className="text-gray-500">Track your investments and returns</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Investment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Total Invested</p>
          <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Current Value</p>
          <p className="text-2xl font-bold">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Total Returns</p>
          <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {formatCurrency(totalReturns)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Return %</p>
          <p className="text-2xl font-bold text-green-600">{returnPercent}%</p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Portfolio Performance</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `₹${v / 1000}K`} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investments Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Active Investments</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-3">Name</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Principal</th>
              <th className="pb-3">Current</th>
              <th className="pb-3">Return</th>
              <th className="pb-3">Maturity</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {investments.map((inv) => {
              const daysLeft = getDaysUntil(inv.maturity);
              const returns = inv.current - inv.principal;
              const returnPct = ((returns / inv.principal) * 100).toFixed(1);
              const isMaturingSoon = daysLeft <= 30 && daysLeft > 0;
              const isMatured = daysLeft <= 0;

              return (
                <tr key={inv.id} className="border-b">
                  <td className="py-3 font-medium">{inv.name}</td>
                  <td className="py-3 capitalize">{inv.type.replace('_', ' ')}</td>
                  <td className="py-3">{formatCurrency(inv.principal)}</td>
                  <td className="py-3">{formatCurrency(inv.current)}</td>
                  <td className="py-3">
                    <span className={returns >= 0 ? 'text-green-600' : 'text-red-600'}>
                      +{formatCurrency(returns)} ({returnPct}%)
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {inv.maturity}
                      {isMaturingSoon && (
                        <span className="flex items-center gap-1 text-orange-600 text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          {daysLeft} days
                        </span>
                      )}
                      {isMatured && (
                        <span className="text-green-600 text-xs">Matured</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      inv.status === 'active' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {inv.status}
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

export default InvestmentsPage;