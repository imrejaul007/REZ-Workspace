'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  WalletIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import PaymentForm from './PaymentForm';

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  referenceNumber: string;
  createdAt: string;
}

interface WalletManagerProps {
  className?: string;
}

export const WalletManager: React.FC<WalletManagerProps> = ({ className }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWalletData();
  }, [page]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetch('/api/payments/wallet/balance', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
          },
        }),
        fetch(`/api/payments/wallet/transactions?page=${page}&limit=10`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
          },
        }),
      ]);

      const balanceData = await balanceResponse.json();
      const transactionsData = await transactionsResponse.json();

      if (balanceData.success) {
        setBalance(balanceData.data.balance);
      }

      if (transactionsData.success) {
        setTransactions(transactionsData.data.transactions);
        setTotalPages(transactionsData.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      toast.error('Failed to load wallet information');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < 10) {
      toast.error('Minimum amount is ₹10');
      return;
    }

    if (amount > 50000) {
      toast.error('Maximum amount is ₹50,000');
      return;
    }

    setShowAddMoney(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    toast.success('Money added to wallet successfully!');
    setShowAddMoney(false);
    setAddAmount('');
    fetchWalletData(); // Refresh wallet data
  };

  const handlePaymentError = (error) => {
    toast.error('Failed to add money to wallet');
    setShowAddMoney(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'credit':
        return <ArrowUpIcon className="w-5 h-5 text-green-500" />;
      case 'debit':
        return <ArrowDownIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'credit':
        return 'text-green-600';
      case 'debit':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (showAddMoney) {
    return (
      <div className={className}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add Money to Wallet</h3>
            <Button
              variant="outline"
              onClick={() => setShowAddMoney(false)}
            >
              Cancel
            </Button>
          </div>

          <PaymentForm
            amount={parseFloat(addAmount)}
            orderId={`WALLET_TOPUP_${Date.now()}`}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <WalletIcon className="w-6 h-6" />
            My Wallet
          </h3>
        </div>

        {/* Wallet Balance */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Available Balance</p>
              <p className="text-3xl font-bold">₹{balance.toFixed(2)}</p>
            </div>
            <WalletIcon className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        {/* Add Money Section */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-3">Add Money to Wallet</h4>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter amount"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              min="10"
              max="50000"
              className="flex-1"
            />
            <Button 
              onClick={handleAddMoney}
              disabled={!addAmount || parseFloat(addAmount) <= 0}
              className="flex items-center gap-1"
            >
              <PlusIcon className="w-4 h-4" />
              Add Money
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Minimum: ₹10 | Maximum: ₹50,000 per transaction
          </p>
        </div>

        {/* Quick Add Amounts */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Quick Add:</p>
          <div className="flex gap-2 flex-wrap">
            {[100, 500, 1000, 2000, 5000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                
                onClick={() => setAddAmount(amount.toString())}
                className="text-xs"
              >
                ₹{amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h4 className="font-medium mb-4">Recent Transactions</h4>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                      <p className="text-xs text-gray-400">
                        Ref: {transaction.referenceNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: ₹{transaction.balance.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WalletManager;