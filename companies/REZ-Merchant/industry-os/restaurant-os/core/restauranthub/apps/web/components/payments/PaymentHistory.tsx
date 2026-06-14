'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  paymentGateway: string;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
  };
}

interface PaymentHistoryProps {
  userId?: string;
  showAllTransactions?: boolean; // For admin view
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  userId,
  showAllTransactions = false,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, gatewayFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter }),
        ...(gatewayFilter && { gateway: gatewayFilter }),
      });

      const endpoint = showAllTransactions 
        ? `/api/payments/admin/transactions?${params}`
        : `/api/payments/history?${params}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPayments(data.data.payments);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      case 'refunded':
        return 'blue';
      case 'partially_refunded':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
        return <CreditCardIcon className="w-5 h-5" />;
      case 'upi':
        return <DevicePhoneMobileIcon className="w-5 h-5" />;
      case 'wallet':
      case 'cash':
      case 'netbanking':
      default:
        return <BanknotesIcon className="w-5 h-5" />;
    }
  };

  const handleRefund = async (paymentId: string, amount?: number) => {
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('restauranthub_token')}`,
        },
        body: JSON.stringify({
          paymentId,
          ...(amount && { amount }),
          reason: 'Customer requested refund',
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchPayments(); // Refresh the list
        alert('Refund processed successfully');
      } else {
        alert(data.message || 'Refund failed');
      }
    } catch (error) {
      console.error('Refund failed:', error);
      alert('Failed to process refund');
    }
  };

  const filteredPayments = payments.filter(payment =>
    searchTerm === '' ||
    payment.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <h3 className="text-lg font-semibold">
            {showAllTransactions ? 'All Transactions' : 'Payment History'}
          </h3>
          
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by order number or payment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="min-w-[120px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={gatewayFilter}
              onValueChange={(value) => setGatewayFilter(value)}
            >
              <SelectTrigger className="min-w-[120px]">
                <SelectValue placeholder="All Gateways" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Gateways</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No payments found matching your criteria.
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getPaymentMethodIcon(payment.method)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {payment.order?.orderNumber || payment.orderId}
                        </span>
                        <Badge color={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Payment ID: {payment.id}</p>
                        <p>Method: {payment.method?.toUpperCase()} via {payment.paymentGateway}</p>
                        <p>Date: {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      ₹{payment.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.currency}
                    </div>
                    
                    {showAllTransactions && payment.status === 'PAID' && (
                      <Button
                        
                        variant="outline"
                        onClick={() => handleRefund(payment.id)}
                        className="mt-2 text-xs"
                      >
                        Refund
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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
      </Card>
    </div>
  );
};

export default PaymentHistory;