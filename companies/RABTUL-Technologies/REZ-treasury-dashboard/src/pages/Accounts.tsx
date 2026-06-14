/**
 * TreasuryOS Dashboard - Accounts Page
 */

import React, { useState } from 'react';
import { Plus, Wallet, Building2, Shield, CreditCard } from 'lucide-react';

const accountTypeIcons: Record<string, React.ReactNode> = {
  master: <Building2 className="w-5 h-5" />,
  operating: <Wallet className="w-5 h-5" />,
  reserve: <Shield className="w-5 h-5" />,
  escrow: <CreditCard className="w-5 h-5" />,
};

export const AccountsPage: React.FC = () => {
  const [accounts] = useState([
    { id: 'acc_1', type: 'master', name: 'Main Treasury', balance: 1500000, currency: 'INR' },
    { id: 'acc_2', type: 'operating', name: 'Operations', balance: 450000, currency: 'INR' },
    { id: 'acc_3', type: 'reserve', name: 'Emergency Reserve', balance: 500000, currency: 'INR' },
  ]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Treasury Accounts</h1>
          <p className="text-gray-500">Manage your treasury accounts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Create Account
        </button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                account.type === 'master' ? 'bg-blue-100 text-blue-600' :
                account.type === 'operating' ? 'bg-green-100 text-green-600' :
                account.type === 'reserve' ? 'bg-purple-100 text-purple-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                {accountTypeIcons[account.type]}
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded capitalize">
                {account.type}
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-1">{account.name}</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(account.balance)}
            </p>
            <p className="text-sm text-gray-500">{account.currency}</p>
            <div className="mt-4 pt-4 border-t flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">
                Deposit
              </button>
              <button className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">
                Withdraw
              </button>
              <button className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">
                Transfer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cash Position Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Cash Position Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Total Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(2450000)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Reserved</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(350000)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(2100000)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-2xl font-bold text-blue-600">+12.5%</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-3">Date</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Description</th>
              <th className="pb-3">Amount</th>
              <th className="pb-3">Balance</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b">
              <td className="py-3">Jun 13, 2024</td>
              <td><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Deposit</span></td>
              <td>Investment redemption</td>
              <td className="text-green-600 font-medium">+₹1,07,500</td>
              <td>₹15,07,500</td>
            </tr>
            <tr className="border-b">
              <td className="py-3">Jun 12, 2024</td>
              <td><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Withdrawal</span></td>
              <td>FD purchase</td>
              <td className="text-red-600 font-medium">-₹1,00,000</td>
              <td>₹14,00,000</td>
            </tr>
            <tr>
              <td className="py-3">Jun 11, 2024</td>
              <td><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Transfer</span></td>
              <td>To Operations</td>
              <td className="text-red-600 font-medium">-₹50,000</td>
              <td>₹15,00,000</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountsPage;