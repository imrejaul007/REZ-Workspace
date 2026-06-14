'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  TrendingUp,
  Clock,
  Receipt,
  Gift,
  Award,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  category: 'payment' | 'refund' | 'bonus' | 'cashback' | 'reward' | 'transfer' | 'fee';
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  orderId?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

interface WalletBalance {
  available: number;
  pending: number;
  reserved: number;
  currency: string;
  lastUpdated: string;
}

interface CreditLine {
  limit: number;
  used: number;
  available: number;
  interestRate: number;
  dueDate?: string;
  minimumPayment?: number;
}

interface WalletSystemProps {
  balance: WalletBalance;
  creditLine?: CreditLine;
  transactions: WalletTransaction[];
  onAddMoney: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onPayment: (amount: number, orderId: string) => void;
  userRole: 'restaurant' | 'vendor' | 'employee' | 'admin';
}

export default function WalletSystem({
  balance,
  creditLine,
  transactions,
  onAddMoney,
  onWithdraw,
  onPayment,
  userRole
}: WalletSystemProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'credit'>('overview');
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = transactionFilter === 'all' || transaction.category === transactionFilter;
    const matchesSearch = !searchTerm || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.referenceId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTransactionIcon = (transaction: WalletTransaction) => {
    switch (transaction.category) {
      case 'payment': return transaction.type === 'credit' ? ArrowDownLeft : ArrowUpRight;
      case 'refund': return ArrowDownLeft;
      case 'bonus': case 'reward': case 'cashback': return Gift;
      case 'transfer': return transaction.type === 'credit' ? ArrowDownLeft : ArrowUpRight;
      case 'fee': return ArrowUpRight;
      default: return Wallet;
    }
  };

  const getTransactionColor = (transaction: WalletTransaction) => {
    if (transaction.status === 'failed') return 'text-red-600';
    if (transaction.status === 'pending') return 'text-yellow-600';
    
    switch (transaction.type) {
      case 'credit': return 'text-green-600';
      case 'debit': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getCategoryColor = (category: WalletTransaction['category']) => {
    switch (category) {
      case 'payment': return 'bg-blue-100 text-blue-800';
      case 'refund': return 'bg-green-100 text-green-800';
      case 'bonus': case 'reward': return 'bg-purple-100 text-purple-800';
      case 'cashback': return 'bg-orange-100 text-orange-800';
      case 'transfer': return 'bg-cyan-100 text-cyan-800';
      case 'fee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionStats = () => {
    const thisMonth = transactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    });

    const totalCredits = thisMonth.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = thisMonth.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

    return {
      totalCredits,
      totalDebits,
      netChange: totalCredits - totalDebits,
      transactionCount: thisMonth.length
    };
  };

  const stats = getTransactionStats();

  const handleAddMoney = () => {
    const amount = parseFloat(addAmount);
    if (amount > 0) {
      onAddMoney(amount);
      setAddAmount('');
      setShowAddMoneyModal(false);
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= balance.available) {
      onWithdraw(amount);
      setWithdrawAmount('');
      setShowWithdrawModal(false);
    }
  };

  const quickAddAmounts = [500, 1000, 2000, 5000, 10000];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Wallet & Credits</h2>
          <p className="text-muted-foreground mt-1">
            Manage your RestoPapa wallet and credit line
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" >
            <Download className="h-4 w-4 mr-2" />
            Statement
          </Button>
          <Button onClick={() => setShowAddMoneyModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Money
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(balance.available)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {formatDate(balance.lastUpdated, { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(balance.pending)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Being processed
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(Math.abs(stats.netChange))}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {stats.netChange >= 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">Net Inflow</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-red-600" />
                      <span className="text-xs text-red-600">Net Outflow</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {creditLine && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Credit Available</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(creditLine.available)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {formatCurrency(creditLine.limit)} limit
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-border">
        {['overview', 'transactions', creditLine && 'credit'].filter(Boolean).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as unknown)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'transactions' && 'Transactions'}
            {tab === 'credit' && 'Credit Line'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setShowAddMoneyModal(true)}
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-sm">Add Money</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={balance.available <= 0}
                >
                  <Minus className="h-6 w-6" />
                  <span className="text-sm">Withdraw</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                >
                  <Receipt className="h-4 w-4 mr-3" />
                  Download Statement
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-3" />
                  Auto-reload Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => {
                  const Icon = getTransactionIcon(transaction);
                  return (
                    <div key={transaction.id} className="flex items-center space-x-3">
                      <div className={cn('p-2 rounded-full bg-muted', getTransactionColor(transaction))}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {transaction.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge className={cn('text-xs', getCategoryColor(transaction.category))}>
                            {transaction.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(transaction.timestamp, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn('font-medium', getTransactionColor(transaction))}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        {transaction.status === 'pending' && (
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Categories</option>
                  <option value="payment">Payments</option>
                  <option value="refund">Refunds</option>
                  <option value="bonus">Bonuses</option>
                  <option value="cashback">Cashback</option>
                  <option value="reward">Rewards</option>
                  <option value="transfer">Transfers</option>
                  <option value="fee">Fees</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Transaction List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Transactions</CardTitle>
                <Badge variant="outline">
                  {filteredTransactions.length} transactions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
                  const Icon = getTransactionIcon(transaction);
                  return (
                    <div key={transaction.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-accent transition-colors">
                      <div className={cn('p-3 rounded-full bg-muted', getTransactionColor(transaction))}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <Badge className={cn('text-xs', getCategoryColor(transaction.category))}>
                            {transaction.category}
                          </Badge>
                          {transaction.status !== 'completed' && (
                            <Badge variant={transaction.status === 'pending' ? 'outline' : 'destructive'} className="text-xs">
                              {transaction.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{formatDate(transaction.timestamp)}</span>
                          {transaction.referenceId && (
                            <span className="font-mono">ID: {transaction.referenceId}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={cn('text-lg font-semibold', getTransactionColor(transaction))}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      
                      <Button variant="ghost" >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'credit' && creditLine && (
        <div className="space-y-6">
          {/* Credit Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Credit Line Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span>{formatCurrency(creditLine.used)} of {formatCurrency(creditLine.limit)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(creditLine.used / creditLine.limit) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(creditLine.available)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="text-lg font-semibold text-foreground">
                      {creditLine.interestRate}% p.a.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {creditLine.dueDate && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Due</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-accent rounded-lg">
                    <DollarSign className="h-12 w-12 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(creditLine.minimumPayment || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Minimum Payment Due</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-medium">{formatDate(creditLine.dueDate)}</span>
                  </div>
                  
                  <Button className="w-full">
                    Make Payment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      <AnimatePresence>
        {showAddMoneyModal && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowAddMoneyModal(false)}
            />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Add Money to Wallet</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount</label>
                    <input
                      type="number"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                    />
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Quick amounts</p>
                    <div className="grid grid-cols-3 gap-2">
                      {quickAddAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setAddAmount(amount.toString())}
                          className="px-3 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                        >
                          {formatCurrency(amount)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddMoneyModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddMoney}
                      disabled={!addAmount || parseFloat(addAmount) <= 0}
                      className="flex-1"
                    >
                      Add {addAmount && formatCurrency(parseFloat(addAmount))}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowWithdrawModal(false)}
            />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Withdraw Money</h3>
                
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-lg font-semibold">{formatCurrency(balance.available)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount to Withdraw</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      max={balance.available}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                    />
                    {parseFloat(withdrawAmount) > balance.available && (
                      <p className="text-red-600 text-sm mt-1">Insufficient balance</p>
                    )}
                  </div>
                  
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Withdrawals typically take 1-3 business days to process.
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowWithdrawModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleWithdraw}
                      disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > balance.available}
                      className="flex-1"
                    >
                      Withdraw {withdrawAmount && formatCurrency(parseFloat(withdrawAmount))}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}