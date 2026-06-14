'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, Phone, Mail, ArrowLeft, Download, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function OrderConfirmation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState({
    id: '#ORD-2024-001',
    status: 'confirmed',
    estimatedDelivery: '25-30 minutes',
    total: 67.47,
    items: [
      { id: 1, name: 'Margherita Pizza', quantity: 2, price: 18.99 },
      { id: 2, name: 'Caesar Salad', quantity: 1, price: 12.99 },
      { id: 3, name: 'Salmon Sushi Roll', quantity: 3, price: 15.50 }
    ],
    restaurant: {
      name: 'Bella Vista Italian',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, Downtown'
    },
    delivery: {
      address: '456 Oak Avenue, Apt 2B, New York, NY 10001',
      instructions: 'Ring doorbell, leave at door'
    }
  });

  useEffect(() => {
    // Show success animation
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Confirmed!</h1>
            <p className="text-gray-600 mt-2">
              Thank you for your order. We'll send you updates on your delivery.
            </p>
          </div>
        </motion.div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Order Summary
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Order ID:</span>
                  <span className="font-mono text-sm font-medium">{orderData.id}</span>
                  <Badge variant="secondary">{orderData.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderData.items.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span>${orderData.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Delivery Information */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-green-600">Estimated Delivery</h4>
                  <p className="text-2xl font-bold">{orderData.estimatedDelivery}</p>
                  <p className="text-sm text-gray-600">We'll notify you when your order is on the way</p>
                </div>
                <div>
                  <h4 className="font-medium">Delivery Address</h4>
                  <p className="text-gray-700">{orderData.delivery.address}</p>
                  {orderData.delivery.instructions && (
                    <p className="text-sm text-gray-600 mt-1">
                      Special Instructions: {orderData.delivery.instructions}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Restaurant Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{orderData.restaurant.name}</h3>
                  <p className="text-gray-600">{orderData.restaurant.address}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Restaurant
                  </Button>
                  <Button variant="outline" >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Tracking */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {[
                  { step: 'Order Placed', completed: true, time: 'Just now' },
                  { step: 'Preparing', completed: false, time: '5 min' },
                  { step: 'Out for Delivery', completed: false, time: '20 min' },
                  { step: 'Delivered', completed: false, time: '30 min' }
                ].map((status, index) => (
                  <div key={index} className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      status.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <h4 className="font-medium text-sm">{status.step}</h4>
                    <p className="text-xs text-gray-600">{status.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6 }}
          className="flex items-center justify-between"
        >
          <Button variant="ghost" onClick={() => router.push('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button onClick={() => router.push(`/orders/${orderData.id.replace('#', '')}`)}>
              Track Order
            </Button>
          </div>
        </motion.div>

        {/* Rating Prompt */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Enjoyed your meal?</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Rate your experience and help others discover great food!
                  </p>
                </div>
                <Button className="bg-yellow-500 hover:bg-yellow-600">
                  <Star className="h-4 w-4 mr-2" />
                  Rate & Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}