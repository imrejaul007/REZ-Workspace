'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Download, Calendar, TrendingUp, Clock, FileText, Eye, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function Payroll() {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedPayStub, setSelectedPayStub] = useState(null);
  
  const payStubs = [
    {
      id: 1,
      payPeriod: 'January 1-15, 2024',
      payDate: '2024-01-18',
      grossPay: 1240.00,
      netPay: 967.20,
      regularHours: 80,
      overtimeHours: 5,
      regularRate: 15.00,
      overtimeRate: 22.50,
      deductions: {
        federal: 186.00,
        state: 37.20,
        social: 76.88,
        medicare: 17.98,
        insurance: 45.00
      },
      status: 'paid'
    },
    {
      id: 2,
      payPeriod: 'December 16-31, 2023',
      payDate: '2024-01-03',
      grossPay: 1200.00,
      netPay: 936.00,
      regularHours: 80,
      overtimeHours: 0,
      regularRate: 15.00,
      overtimeRate: 22.50,
      deductions: {
        federal: 180.00,
        state: 36.00,
        social: 74.40,
        medicare: 17.40,
        insurance: 45.00
      },
      status: 'paid'
    },
    {
      id: 3,
      payPeriod: 'December 1-15, 2023',
      payDate: '2023-12-18',
      grossPay: 1320.00,
      netPay: 1027.60,
      regularHours: 80,
      overtimeHours: 8,
      regularRate: 15.00,
      overtimeRate: 22.50,
      deductions: {
        federal: 198.00,
        state: 39.60,
        social: 81.84,
        medicare: 19.14,
        insurance: 45.00
      },
      status: 'paid'
    }
  ];

  const currentPayStub = payStubs[0];
  const ytdData = {
    grossPay: payStubs.reduce((sum, stub) => sum + stub.grossPay, 0),
    netPay: payStubs.reduce((sum, stub) => sum + stub.netPay, 0),
    regularHours: payStubs.reduce((sum, stub) => sum + stub.regularHours, 0),
    overtimeHours: payStubs.reduce((sum, stub) => sum + stub.overtimeHours, 0),
    totalDeductions: payStubs.reduce((sum, stub) => 
      sum + Object.values(stub.deductions).reduce((deductionSum, deduction) => deductionSum + deduction, 0), 0
    )
  };

  const directDeposit = {
    bankName: 'Chase Bank',
    accountType: 'Checking',
    accountNumber: '****1234',
    routingNumber: '021000021',
    status: 'active'
  };

  const taxDocuments = [
    { name: 'W-2 Form 2023', date: '2024-01-31', status: 'available', type: 'w2' },
    { name: 'Pay Summary 2023', date: '2024-01-31', status: 'available', type: 'summary' },
    { name: 'W-4 Form', date: '2023-06-15', status: 'on_file', type: 'w4' }
  ];

  const PayStubModal = ({ payStub }) => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Pay Stub Details</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Pay Period</h4>
            <p>{payStub.payPeriod}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Pay Date</h4>
            <p>{new Date(payStub.payDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Earnings</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Regular ({payStub.regularHours}h @ ${payStub.regularRate})</span>
                <span>${(payStub.regularHours * payStub.regularRate).toFixed(2)}</span>
              </div>
              {payStub.overtimeHours > 0 && (
                <div className="flex justify-between">
                  <span>Overtime ({payStub.overtimeHours}h @ ${payStub.overtimeRate})</span>
                  <span>${(payStub.overtimeHours * payStub.overtimeRate).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Gross Pay</span>
                <span>${payStub.grossPay.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Deductions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Federal Tax</span>
                <span>${payStub.deductions.federal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>State Tax</span>
                <span>${payStub.deductions.state.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Social Security</span>
                <span>${payStub.deductions.social.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Medicare</span>
                <span>${payStub.deductions.medicare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Health Insurance</span>
                <span>${payStub.deductions.insurance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Deductions</span>
                <span>${(Object.values(payStub.deductions).reduce((sum: number, val: unknown) => sum + (typeof val === 'number' ? val : 0), 0) as number).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-green-800">Net Pay</span>
            <span className="text-2xl font-bold text-green-600">${payStub.netPay.toFixed(2)}</span>
          </div>
        </div>

        <Button className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download Pay Stub
        </Button>
      </div>
    </DialogContent>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payroll & Benefits</h1>
            <p className="text-muted-foreground">View pay stubs, earnings, and tax documents</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Year</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="previous">Previous Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Tax Documents
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Current Pay Period */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Latest Pay Stub
                    </div>
                    <Badge className="bg-green-500">Paid</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">${currentPayStub.netPay.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Net Pay</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">${currentPayStub.grossPay.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Gross Pay</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{currentPayStub.regularHours + currentPayStub.overtimeHours}h</div>
                      <div className="text-sm text-gray-600">Total Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{currentPayStub.overtimeHours}h</div>
                      <div className="text-sm text-gray-600">Overtime</div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Pay Period</span>
                      <span className="font-medium">{currentPayStub.payPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pay Date</span>
                      <span className="font-medium">{new Date(currentPayStub.payDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Regular Rate</span>
                      <span className="font-medium">${currentPayStub.regularRate}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Rate</span>
                      <span className="font-medium">${currentPayStub.overtimeRate}/hr</span>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full mt-4">
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Pay Stub
                      </Button>
                    </DialogTrigger>
                    <PayStubModal payStub={currentPayStub} />
                  </Dialog>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pay History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Pay History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payStubs.map((payStub, index) => (
                      <motion.div
                        key={payStub.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{payStub.payPeriod}</div>
                          <div className="text-sm text-gray-600">
                            Paid on {new Date(payStub.payDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right mr-4">
                          <div className="font-semibold">${payStub.netPay.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{payStub.regularHours + payStub.overtimeHours}h worked</div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button  variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <PayStubModal payStub={payStub} />
                        </Dialog>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* YTD Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Year to Date
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${ytdData.netPay.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Net Pay</div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Gross Pay</span>
                      <span className="font-medium">${ytdData.grossPay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Regular Hours</span>
                      <span className="font-medium">{ytdData.regularHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Hours</span>
                      <span className="font-medium">{ytdData.overtimeHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Deductions</span>
                      <span className="font-medium">${ytdData.totalDeductions.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Direct Deposit */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Direct Deposit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bank</span>
                    <span className="font-medium">{directDeposit.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Account Type</span>
                    <span className="font-medium">{directDeposit.accountType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Account</span>
                    <span className="font-medium">{directDeposit.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <Button variant="outline" className="w-full mt-3">
                    Update Bank Info
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tax Documents */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Tax Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {taxDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-gray-600">{new Date(doc.date).toLocaleDateString()}</div>
                        </div>
                        <Button  variant="outline" disabled={doc.status === 'on_file'}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Avg Weekly Hours</span>
                    <span className="font-medium">42.5h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Hourly Rate</span>
                    <span className="font-medium">$15.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Raise</span>
                    <span className="font-medium">6 months ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance Bonus</span>
                    <span className="font-medium text-green-600">Eligible</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}