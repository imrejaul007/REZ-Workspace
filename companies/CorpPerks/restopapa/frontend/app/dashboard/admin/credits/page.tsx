'use client';

import React, { useState } from 'react';
import { 
  CreditCardIcon,
  BanknotesIcon,
  UserIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface CreditAccount {
  id: string;
  userId: string;
  userName: string;
  userType: 'restaurant' | 'vendor';
  businessName: string;
  email: string;
  phone: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  status: 'active' | 'suspended' | 'closed' | 'pending';
  creditScore: number;
  paymentTerms: string;
  interestRate: number;
  lastPayment: {
    amount: number;
    date: string;
  } | null;
  nextDueDate: string;
  overdueAmount: number;
  createdDate: string;
  lastActivity: string;
}

interface CreditTransaction {
  id: string;
  accountId: string;
  type: 'debit' | 'credit' | 'interest' | 'fee';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  balance: number;
}

interface CreditRequest {
  id: string;
  userId: string;
  userName: string;
  businessName: string;
  requestedAmount: number;
  currentLimit: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  reviewedDate?: string;
  reviewedBy?: string;
  documents: {
    bankStatements: boolean;
    gstReturns: boolean;
    businessProof: boolean;
  };
  creditAssessment: {
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: string;
  };
}

const CreditsPage = () => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'requests' | 'transactions' | 'analytics'>('accounts');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUserType, setFilterUserType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);

  const [accounts] = useState<CreditAccount[]>([
    {
      id: '1',
      userId: 'rest_001',
      userName: 'Rajesh Kumar',
      userType: 'restaurant',
      businessName: 'Spice Garden Restaurant',
      email: 'rajesh@spicegarden.com',
      phone: '+91-9876543210',
      creditLimit: 500000,
      currentBalance: 125000,
      availableCredit: 375000,
      status: 'active',
      creditScore: 750,
      paymentTerms: 'Net 30',
      interestRate: 18.0,
      lastPayment: { amount: 50000, date: '2024-03-01' },
      nextDueDate: '2024-03-15',
      overdueAmount: 0,
      createdDate: '2024-01-15',
      lastActivity: '2 hours ago'
    },
    {
      id: '2',
      userId: 'vend_001',
      userName: 'Sunita Kumar',
      userType: 'vendor',
      businessName: 'Fresh Farm Supplies',
      email: 'sunita@freshfarm.com',
      phone: '+91-9876543211',
      creditLimit: 300000,
      currentBalance: 180000,
      availableCredit: 120000,
      status: 'active',
      creditScore: 680,
      paymentTerms: 'Net 15',
      interestRate: 20.0,
      lastPayment: { amount: 75000, date: '2024-02-28' },
      nextDueDate: '2024-03-10',
      overdueAmount: 25000,
      createdDate: '2024-02-01',
      lastActivity: '1 day ago'
    },
    {
      id: '3',
      userId: 'rest_002',
      userName: 'Marco Rossi',
      userType: 'restaurant',
      businessName: 'Pizza Corner',
      email: 'marco@pizzacorner.com',
      phone: '+91-9876543212',
      creditLimit: 200000,
      currentBalance: 200000,
      availableCredit: 0,
      status: 'suspended',
      creditScore: 580,
      paymentTerms: 'Net 30',
      interestRate: 24.0,
      lastPayment: null,
      nextDueDate: '2024-02-15',
      overdueAmount: 85000,
      createdDate: '2023-12-01',
      lastActivity: '1 week ago'
    },
    {
      id: '4',
      userId: 'rest_003',
      userName: 'Priya Sharma',
      userType: 'restaurant',
      businessName: 'Green Leaf Cafe',
      email: 'priya@greenleaf.com',
      phone: '+91-9876543213',
      creditLimit: 100000,
      currentBalance: 0,
      availableCredit: 100000,
      status: 'active',
      creditScore: 720,
      paymentTerms: 'Net 15',
      interestRate: 16.0,
      lastPayment: { amount: 45000, date: '2024-03-05' },
      nextDueDate: '2024-03-20',
      overdueAmount: 0,
      createdDate: '2024-03-01',
      lastActivity: '3 hours ago'
    }
  ]);

  const [requests] = useState<CreditRequest[]>([
    {
      id: '1',
      userId: 'rest_004',
      userName: 'Ahmed Ali',
      businessName: 'Biryani Palace',
      requestedAmount: 750000,
      currentLimit: 300000,
      reason: 'Expanding to new location and need working capital for inventory',
      status: 'pending',
      requestDate: '2024-03-10',
      documents: { bankStatements: true, gstReturns: true, businessProof: true },
      creditAssessment: { score: 690, riskLevel: 'medium', recommendation: 'Approve with conditions' }
    },
    {
      id: '2',
      userId: 'vend_002',
      userName: 'Lakshmi Iyer',
      businessName: 'Spice Masters Trading',
      requestedAmount: 400000,
      currentLimit: 150000,
      reason: 'Seasonal demand increase and bulk procurement needs',
      status: 'approved',
      requestDate: '2024-03-05',
      reviewedDate: '2024-03-08',
      reviewedBy: 'Credit Manager',
      documents: { bankStatements: true, gstReturns: false, businessProof: true },
      creditAssessment: { score: 720, riskLevel: 'low', recommendation: 'Approve full amount' }
    },
    {
      id: '3',
      userId: 'rest_005',
      userName: 'David Wilson',
      businessName: 'Continental Bistro',
      requestedAmount: 200000,
      currentLimit: 0,
      reason: 'New restaurant setup and initial working capital requirement',
      status: 'rejected',
      requestDate: '2024-02-28',
      reviewedDate: '2024-03-02',
      reviewedBy: 'Credit Manager',
      documents: { bankStatements: false, gstReturns: false, businessProof: true },
      creditAssessment: { score: 520, riskLevel: 'high', recommendation: 'Reject - insufficient documentation' }
    }
  ]);

  const [transactions] = useState<CreditTransaction[]>([
    {
      id: '1',
      accountId: '1',
      type: 'debit',
      amount: 75000,
      description: 'Inventory purchase from Fresh Farm Supplies',
      date: '2024-03-12',
      status: 'completed',
      reference: 'TXN001',
      balance: 125000
    },
    {
      id: '2',
      accountId: '1',
      type: 'credit',
      amount: 50000,
      description: 'Payment received',
      date: '2024-03-01',
      status: 'completed',
      reference: 'PAY001',
      balance: 50000
    },
    {
      id: '3',
      accountId: '2',
      type: 'interest',
      amount: 3000,
      description: 'Monthly interest charge',
      date: '2024-03-01',
      status: 'completed',
      reference: 'INT001',
      balance: 183000
    }
  ]);

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getRiskBadge = (risk: string) => {
    const badges = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return badges[risk as keyof typeof badges] || badges.medium;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'debit': return <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />;
      case 'credit': return <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />;
      case 'interest': return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'fee': return <DocumentTextIcon className="w-5 h-5 text-purple-500" />;
      default: return <CreditCardIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleViewAccount = (account: CreditAccount) => {
    setSelectedAccount(account);
  };

  const handleApproveRequest = (id: string) => {
    logger.info('Approving credit request:', id);
  };

  const handleRejectRequest = (id: string) => {
    logger.info('Rejecting credit request:', id);
  };

  const handleSuspendAccount = (id: string) => {
    logger.info('Suspending credit account:', id);
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || account.status === filterStatus;
    const matchesUserType = filterUserType === 'all' || account.userType === filterUserType;
    
    return matchesSearch && matchesStatus && matchesUserType;
  });

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (selectedAccount) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSelectedAccount(null)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedAccount.businessName}</h1>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedAccount.status)}`}>
            {selectedAccount.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Owner:</span>
                <span className="text-sm text-gray-900 ml-2">{selectedAccount.userName}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm text-gray-900 ml-2 capitalize">{selectedAccount.userType}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm text-gray-900 ml-2">{selectedAccount.email}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="text-sm text-gray-900 ml-2">{selectedAccount.phone}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <span className="text-sm text-gray-900 ml-2">{new Date(selectedAccount.createdDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Last Active:</span>
                <span className="text-sm text-gray-900 ml-2">{selectedAccount.lastActivity}</span>
              </div>
            </div>
          </div>

          {/* Credit Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Credit Information</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Credit Limit</div>
                <div className="text-2xl font-bold text-gray-900">₹{selectedAccount.creditLimit.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Current Balance</div>
                <div className="text-xl font-semibold text-red-600">₹{selectedAccount.currentBalance.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Available Credit</div>
                <div className="text-xl font-semibold text-green-600">₹{selectedAccount.availableCredit.toLocaleString()}</div>
              </div>
              <div className="pt-2">
                <div className="text-sm text-gray-600 mb-1">Credit Utilization</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(selectedAccount.currentBalance / selectedAccount.creditLimit) * 100}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-900 mt-1">
                  {Math.round((selectedAccount.currentBalance / selectedAccount.creditLimit) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Credit Score</div>
                <div className="text-2xl font-bold text-purple-600">{selectedAccount.creditScore}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Interest Rate</div>
                <div className="text-lg font-semibold text-gray-900">{selectedAccount.interestRate}% p.a.</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payment Terms</div>
                <div className="text-sm text-gray-900">{selectedAccount.paymentTerms}</div>
              </div>
              {selectedAccount.lastPayment && (
                <div>
                  <div className="text-sm text-gray-600">Last Payment</div>
                  <div className="text-sm text-gray-900">₹{selectedAccount.lastPayment.amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{new Date(selectedAccount.lastPayment.date).toLocaleDateString()}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600">Next Due Date</div>
                <div className="text-sm text-gray-900">{new Date(selectedAccount.nextDueDate).toLocaleDateString()}</div>
              </div>
              {selectedAccount.overdueAmount > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-sm text-red-600">Overdue Amount</div>
                  <div className="text-lg font-bold text-red-700">₹{selectedAccount.overdueAmount.toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.filter(t => t.accountId === selectedAccount.id).slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                    <div className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    transaction.type === 'debit' || transaction.type === 'interest' || transaction.type === 'fee' 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {transaction.type === 'debit' || transaction.type === 'interest' || transaction.type === 'fee' ? '-' : '+'}
                    ₹{transaction.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Ref: {transaction.reference}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Modify Credit Limit
          </button>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg">
            Send Payment Reminder
          </button>
          {selectedAccount.status === 'active' ? (
            <button 
              onClick={() => handleSuspendAccount(selectedAccount.id)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
            >
              Suspend Account
            </button>
          ) : (
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
              Activate Account
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage credit accounts, requests, and payment tracking
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <CreditCardIcon className="w-4 h-4" />
            <span>New Credit Account</span>
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <ChartBarIcon className="w-4 h-4" />
            <span>Credit Analytics</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCardIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Credit Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BanknotesIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Credit Extended</p>
              <p className="text-2xl font-bold text-gray-900">₹{accounts.reduce((sum, acc) => sum + acc.creditLimit, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{accounts.reduce((sum, acc) => sum + acc.currentBalance, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900">{requests.filter(r => r.status === 'pending').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'accounts', label: 'Credit Accounts', count: accounts.length },
            { key: 'requests', label: 'Credit Requests', count: requests.filter(r => r.status === 'pending').length },
            { key: 'transactions', label: 'Transactions', count: transactions.length },
            { key: 'analytics', label: 'Analytics', count: 0 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts or requests..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {activeTab === 'accounts' && (
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterUserType}
            onChange={(e) => setFilterUserType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="restaurant">Restaurants</option>
            <option value="vendor">Vendors</option>
          </select>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{account.businessName}</div>
                        <div className="text-sm text-gray-500 capitalize">{account.userType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{account.userName}</div>
                        <div className="text-sm text-gray-500">{account.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{account.creditLimit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{account.currentBalance.toLocaleString()}</div>
                      {account.overdueAmount > 0 && (
                        <div className="text-sm text-red-600">Overdue: ₹{account.overdueAmount.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(account.status)}`}>
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.creditScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleViewAccount(account)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{request.businessName}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Owner</p>
                      <p className="text-sm font-medium text-gray-900">{request.userName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Limit</p>
                      <p className="text-sm font-medium text-gray-900">₹{request.currentLimit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Requested Amount</p>
                      <p className="text-sm font-medium text-blue-600">₹{request.requestedAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Reason</p>
                    <p className="text-sm text-gray-900">{request.reason}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Documents</p>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {request.documents.bankStatements ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <XMarkIcon className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-700">Bank Statements</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {request.documents.gstReturns ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <XMarkIcon className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-700">GST Returns</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {request.documents.businessProof ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <XMarkIcon className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-700">Business Proof</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Credit Assessment</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Score</span>
                          <span className="text-sm font-medium text-gray-900">{request.creditAssessment.score}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Risk Level</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskBadge(request.creditAssessment.riskLevel)}`}>
                            {request.creditAssessment.riskLevel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{request.creditAssessment.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {request.status === 'pending' && (
                  <div className="flex flex-col space-y-2 ml-6">
                    <button 
                      onClick={() => handleApproveRequest(request.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(request.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Reject
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">
                      Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="text-sm text-gray-900 capitalize">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        transaction.type === 'debit' || transaction.type === 'interest' || transaction.type === 'fee' 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {transaction.type === 'debit' || transaction.type === 'interest' || transaction.type === 'fee' ? '-' : '+'}
                        ₹{transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Credit Portfolio</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Credit Score</span>
                <span className="text-lg font-semibold text-gray-900">
                  {Math.round(accounts.reduce((sum, acc) => sum + acc.creditScore, 0) / accounts.length)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Collection Rate</span>
                <span className="text-lg font-semibold text-green-600">92.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Default Rate</span>
                <span className="text-lg font-semibold text-red-600">2.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. Interest Rate</span>
                <span className="text-lg font-semibold text-purple-600">
                  {(accounts.reduce((sum, acc) => sum + acc.interestRate, 0) / accounts.length).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Low Risk</span>
                <span className="text-lg font-semibold text-green-600">
                  {accounts.filter(acc => acc.creditScore >= 700).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Medium Risk</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {accounts.filter(acc => acc.creditScore >= 600 && acc.creditScore < 700).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">High Risk</span>
                <span className="text-lg font-semibold text-red-600">
                  {accounts.filter(acc => acc.creditScore < 600).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Credit Extended</span>
                <span className="text-lg font-semibold text-gray-900">₹12.5L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payments Received</span>
                <span className="text-lg font-semibold text-green-600">₹8.9L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Interest Earned</span>
                <span className="text-lg font-semibold text-purple-600">₹1.2L</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsPage;