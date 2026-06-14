'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending';
  icon;
}

interface OrderTracking {
  orderId: string;
  status: string;
  estimatedDelivery: string;
  currentLocation: string;
  driver?: {
    name: string;
    phone: string;
    rating: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  steps: TrackingStep[];
}

export default function OrderTracking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || '12345';
  
  const [trackingData, setTrackingData] = useState<OrderTracking>({
    orderId: orderId,
    status: 'out_for_delivery',
    estimatedDelivery: '2024-01-20 14:30',
    currentLocation: '0.5 miles away',
    driver: {
      name: 'Mike Johnson',
      phone: '+1 (555) 987-6543',
      rating: 4.8
    },
    items: [
      { name: 'Margherita Pizza', quantity: 2, price: 24.98 },
      { name: 'Caesar Salad', quantity: 1, price: 12.99 },
      { name: 'Garlic Bread', quantity: 1, price: 6.99 }
    ],
    steps: [
      {
        id: '1',
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and is being prepared',
        timestamp: '2024-01-20 12:00',
        status: 'completed',
        icon: CheckCircle
      },
      {
        id: '2',
        title: 'Preparing',
        description: 'Restaurant is preparing your order',
        timestamp: '2024-01-20 12:15',
        status: 'completed',
        icon: Package
      },
      {
        id: '3',
        title: 'Out for Delivery',
        description: 'Your order is on the way',
        timestamp: '2024-01-20 13:30',
        status: 'current',
        icon: Truck
      },
      {
        id: '4',
        title: 'Delivered',
        description: 'Order delivered to your location',
        timestamp: '',
        status: 'pending',
        icon: MapPin
      }
    ]
  });

  const getProgressValue = () => {
    const completedSteps = trackingData.steps.filter(step => step.status === 'completed').length;
    const currentStepIndex = trackingData.steps.findIndex(step => step.status === 'current');
    const totalSteps = trackingData.steps.length;
    
    if (currentStepIndex !== -1) {
      return ((completedSteps + 0.5) / totalSteps) * 100;
    }
    return (completedSteps / totalSteps) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500';
      case 'preparing':
        return 'bg-yellow-500';
      case 'out_for_delivery':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Track Order</h1>
            <p className="text-muted-foreground">Order #{trackingData.orderId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Tracking */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Truck className="h-5 w-5 mr-2" />
                      Order Status
                    </CardTitle>
                    <Badge className={getStatusColor(trackingData.status)}>
                      {trackingData.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Estimated Delivery</span>
                    <span className="font-semibold">
                      {new Date(trackingData.estimatedDelivery).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Current Location</span>
                    <span className="font-semibold text-green-600">
                      {trackingData.currentLocation}
                    </span>
                  </div>
                  <Progress value={getProgressValue()} className="h-2" />
                </CardContent>
              </Card>
            </motion.div>

            {/* Tracking Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Tracking Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingData.steps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.id} className="flex items-start space-x-4">
                          <div className={`
                            flex items-center justify-center w-10 h-10 rounded-full
                            ${step.status === 'completed' ? 'bg-green-500 text-white' : 
                              step.status === 'current' ? 'bg-blue-500 text-white' : 
                              'bg-gray-200 text-gray-500'}
                          `}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-semibold ${
                                step.status === 'current' ? 'text-blue-600' : ''
                              }`}>
                                {step.title}
                              </h4>
                              {step.timestamp && (
                                <span className="text-sm text-muted-foreground">
                                  {new Date(step.timestamp).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                            {step.status === 'current' && (
                              <div className="flex items-center mt-2 text-sm text-blue-600">
                                <Clock className="h-4 w-4 mr-1" />
                                In Progress
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver Info */}
            {trackingData.driver && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Your Driver</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {trackingData.driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold">{trackingData.driver.name}</h4>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm">{trackingData.driver.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button  className="flex-1">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button  variant="outline" className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trackingData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div>
                        <span>{item.quantity}x </span>
                        <span>{item.name}</span>
                      </div>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span>
                        ${trackingData.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Button variant="outline" className="w-full">
                    View Order Details
                  </Button>
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Cancel Order
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}