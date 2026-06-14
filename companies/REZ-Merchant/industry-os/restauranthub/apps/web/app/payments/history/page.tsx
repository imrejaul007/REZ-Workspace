'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Receipt,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function PaymentHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  
  const [payments, setPayments] = useState([
    {
      id: 'PAY-2024-001',
      orderId: 'ORD-2024-001',
      amount: 67.47,
      status: 'completed',
      method: 'Credit Card',
      methodDetails: '**** 4242',
      date: '2024-02-15T14:30:00',
      restaurant: 'Bella Vista Italian',
      transactionId: 'txn_1ABC123DEF456',
      fee: 2.02
    },
    {
      id: 'PAY-2024-002',
      orderId: 'ORD-2024-002',
      amount: 45.80,
      status: 'completed',
      method: 'UPI',
      methodDetails: 'john@paytm',
      date: '2024-02-14T19:45:00',
      restaurant: 'Tokyo Sushi Bar',
      transactionId: 'upi_2XYZ789GHI012',
      fee: 0.00
    },
    {
      id: 'PAY-2024-003',
      orderId: 'ORD-2024-003',
      amount: 23.99,
      status: 'pending',
      method: 'Cash on Delivery',
      methodDetails: 'COD',
      date: '2024-02-14T16:20:00',
      restaurant: 'Green Garden Cafe',
      transactionId: null,
      fee: 0.00
    },
    {
      id: 'PAY-2024-004',
      orderId: 'ORD-2024-004',
      amount: 89.25,
      status: 'failed',
      method: 'Digital Wallet',
      methodDetails: 'PayTM Wallet',
      date: '2024-02-13T12:15:00',
      restaurant: 'Spice Route',
      transactionId: 'wallet_3DEF456JKL789',
      fee: 2.68
    },
    {
      id: 'PAY-2024-005',
      orderId: 'ORD-2024-005',
      amount: 34.50,
      status: 'refunded',
      method: 'Credit Card',
      methodDetails: '**** 8888',
      date: '2024-02-13T10:30:00',
      restaurant: 'Pizza Palace',
      transactionId: 'txn_4GHI789MNO012',
      fee: 1.04
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'refunded': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'refunded': return <RefreshCw className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.restaurant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesMethod = filterMethod === 'all' || payment.method === filterMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const stats = {
    totalAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    totalTransactions: payments.length,
    successfulPayments: payments.filter(p => p.status === 'completed').length,
    pendingPayments: payments.filter(p => p.status === 'pending').length
  };

  const paymentMethods = [...new Set(payments.map(payment => payment.method))];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment History</h1>
            <p className="text-muted-foreground">Track all your payment transactions</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <h3 className="text-2xl font-bold mt-2 text-green-600">${stats.totalAmount.toFixed(2)}</h3>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <h3 className="text-2xl font-bold mt-2">{stats.totalTransactions}</h3>
                  </div>
                  <Receipt className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Successful</p>
                    <h3 className="text-2xl font-bold mt-2 text-green-600">{stats.successfulPayments}</h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <h3 className="text-2xl font-bold mt-2 text-yellow-600">{stats.pendingPayments}</h3>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by payment ID, order ID, or restaurant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Payment History ({filteredPayments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Payment ID</th>
                      <th className="text-left p-3">Order</th>
                      <th className="text-left p-3">Restaurant</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Method</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment, index) => (
                      <motion.tr 
                        key={payment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <span className="font-mono text-sm font-medium">{payment.id}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm">{payment.orderId}</span>
                        </td>
                        <td className="p-3 text-sm">{payment.restaurant}</td>
                        <td className="p-3">
                          <div>
                            <span className="font-medium">${payment.amount.toFixed(2)}</span>
                            {payment.fee > 0 && (
                              <p className="text-xs text-gray-500">Fee: ${payment.fee.toFixed(2)}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <span className="text-sm font-medium">{payment.method}</span>
                            <p className="text-xs text-gray-500">{payment.methodDetails}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(payment.status)}>
                            {getStatusIcon(payment.status)}
                            <span className="ml-1 capitalize">{payment.status}</span>
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(payment.date).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">$186.02</div>
                  <p className="text-sm text-gray-600">This Month</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">$142.30</div>
                  <p className="text-sm text-gray-600">Last Month</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">+30.7%</div>
                  <p className="text-sm text-gray-600">Growth</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}