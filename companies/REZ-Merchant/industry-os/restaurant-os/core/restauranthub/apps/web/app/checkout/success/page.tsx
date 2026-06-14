'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Package, 
  Clock, 
  MapPin, 
  Receipt, 
  Truck,
  Star,
  Share2,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OrderSummary {
  orderId: string;
  total: number;
  estimatedDelivery: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  restaurant: {
    name: string;
    address: string;
    phone: string;
  };
}

export default function CheckoutSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'RH' + Date.now();
  
  const [orderData] = useState<OrderSummary>({
    orderId,
    total: 44.96,
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    deliveryAddress: '123 Main Street, New York, NY 10001',
    items: [
      { name: 'Margherita Pizza', quantity: 2, price: 24.98 },
      { name: 'Caesar Salad', quantity: 1, price: 12.99 },
      { name: 'Garlic Bread', quantity: 1, price: 6.99 }
    ],
    restaurant: {
      name: 'Bella Vista Italian',
      address: '456 Restaurant Ave, New York, NY',
      phone: '+1 (555) 123-4567'
    }
  });

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTrackOrder = () => {
    router.push(`/orders/track?id=${orderData.orderId}`);
  };

  const handleViewOrders = () => {
    router.push('/orders');
  };

  const handleContinueShopping = () => {
    router.push('/marketplace');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your order. We're preparing it now!
          </p>
          <Badge variant="secondary" className="mt-2">
            Order #{orderData.orderId}
          </Badge>
        </motion.div>

        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Restaurant Info */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                  BV
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{orderData.restaurant.name}</h3>
                  <p className="text-sm text-gray-600">{orderData.restaurant.address}</p>
                  <p className="text-sm text-gray-600">{orderData.restaurant.phone}</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-semibold">Items Ordered</h4>
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                    <span className="font-semibold">${item.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 font-semibold text-lg border-t border-gray-200">
                  <span>Total</span>
                  <span>${orderData.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Estimated Delivery</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(orderData.estimatedDelivery).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Delivery Address</h4>
                    <p className="text-sm text-gray-600">{orderData.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Button onClick={handleTrackOrder} size="lg" className="w-full">
            <Truck className="h-4 w-4 mr-2" />
            Track Your Order
          </Button>
          <Button onClick={handleViewOrders} variant="outline" size="lg" className="w-full">
            <Receipt className="h-4 w-4 mr-2" />
            View All Orders
          </Button>
        </motion.div>

        {/* Additional Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button variant="ghost" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button variant="ghost" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Order
                </Button>
                <Button variant="ghost" className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  Rate Restaurant
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Continue Shopping */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-gray-600 mb-4">
            Want to order something else?
          </p>
          <Button onClick={handleContinueShopping} variant="outline">
            Continue Shopping
          </Button>
        </motion.div>

        {/* Auto redirect notice */}
        {countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-sm text-gray-500"
          >
            Redirecting to order tracking in {countdown} seconds...
          </motion.div>
        )}
      </div>
    </div>
  );
}