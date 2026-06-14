'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit,
  Shield,
  Check,
  Star,
  MoreVertical,
  Smartphone,
  Wallet,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function PaymentMethods() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [paymentType, setPaymentType] = useState('card');
  
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'card',
      name: 'Visa ending in 4242',
      details: '**** **** **** 4242',
      expiry: '12/26',
      isDefault: true,
      brand: 'visa',
      nickname: 'Personal Card'
    },
    {
      id: 2,
      type: 'card',
      name: 'Mastercard ending in 8888',
      details: '**** **** **** 8888',
      expiry: '08/25',
      isDefault: false,
      brand: 'mastercard',
      nickname: 'Business Card'
    },
    {
      id: 3,
      type: 'upi',
      name: 'UPI - john@paytm',
      details: 'john@paytm',
      expiry: null,
      isDefault: false,
      brand: 'upi',
      nickname: 'Primary UPI'
    },
    {
      id: 4,
      type: 'wallet',
      name: 'PayTM Wallet',
      details: 'Balance: $45.20',
      expiry: null,
      isDefault: false,
      brand: 'paytm',
      nickname: 'Digital Wallet'
    }
  ]);

  const getMethodIcon = (type: string, brand: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-6 w-6" />;
      case 'upi':
        return <Smartphone className="h-6 w-6" />;
      case 'wallet':
        return <Wallet className="h-6 w-6" />;
      case 'bank':
        return <Building className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const getBrandColor = (brand: string) => {
    switch (brand) {
      case 'visa': return 'from-blue-600 to-blue-800';
      case 'mastercard': return 'from-red-500 to-orange-600';
      case 'upi': return 'from-green-500 to-teal-600';
      case 'paytm': return 'from-blue-400 to-blue-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const setDefaultMethod = (id: number) => {
    setPaymentMethods(prev => prev.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
  };

  const deleteMethod = (id: number) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Methods</h1>
            <p className="text-muted-foreground">Manage your payment methods and billing information</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Payment Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="paymentType">Payment Type</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="wallet">Digital Wallet</SelectItem>
                      <SelectItem value="bank">Bank Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentType === 'card' && (
                  <>
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input id="cardName" placeholder="John Doe" />
                    </div>
                  </>
                )}

                {paymentType === 'upi' && (
                  <div>
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input id="upiId" placeholder="yourname@upi" />
                  </div>
                )}

                {paymentType === 'wallet' && (
                  <div>
                    <Label htmlFor="walletType">Wallet Provider</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select wallet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paytm">PayTM</SelectItem>
                        <SelectItem value="phonepe">PhonePe</SelectItem>
                        <SelectItem value="gpay">Google Pay</SelectItem>
                        <SelectItem value="freecharge">FreeCharge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="nickname">Nickname (Optional)</Label>
                  <Input id="nickname" placeholder="Personal Card" />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowAddDialog(false)}>
                    Add Method
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Security Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900">Your payments are secure</h3>
                <p className="text-sm text-blue-800 mt-1">
                  All payment information is encrypted and stored securely. We never store your full card details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative ${method.isDefault ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                <CardContent className="p-6">
                  {/* Card Design */}
                  <div className={`h-48 rounded-lg bg-gradient-to-br ${getBrandColor(method.brand)} text-white p-4 mb-4 relative overflow-hidden`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-white"></div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="text-white">
                          {getMethodIcon(method.type, method.brand)}
                        </div>
                        {method.isDefault && (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xl font-mono tracking-wider">
                          {method.details}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs opacity-80">NICKNAME</p>
                            <p className="font-medium">{method.nickname}</p>
                          </div>
                          {method.expiry && (
                            <div className="text-right">
                              <p className="text-xs opacity-80">EXPIRES</p>
                              <p className="font-medium">{method.expiry}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{method.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {method.type} {method.type === 'card' ? `• ${method.brand}` : ''}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!method.isDefault && (
                        <Button 
                          variant="outline" 
                          
                          onClick={() => setDefaultMethod(method.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Set Default
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!method.isDefault && (
                            <DropdownMenuItem onClick={() => setDefaultMethod(method.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteMethod(method.id)}
                            className="text-red-600"
                            disabled={method.isDefault}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Payment Security Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Payment Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">SSL Encryption</h3>
                  <p className="text-sm text-muted-foreground">
                    All transactions are protected with 256-bit SSL encryption
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">PCI Compliant</h3>
                  <p className="text-sm text-muted-foreground">
                    Our payment processing meets all PCI DSS requirements
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Fraud Protection</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced fraud detection monitors all transactions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}