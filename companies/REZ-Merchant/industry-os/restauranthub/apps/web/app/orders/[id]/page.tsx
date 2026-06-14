'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  ArrowLeft,
  Receipt,
  Star,
  Download
} from 'lucide-react';
import { ordersApi, Order } from '@/lib/api/orders';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface OrderDetailsPageProps {
  params: { id: string };
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isSuccess = searchParams.get('success') === 'true';
  const orderId = params.id;

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (isSuccess) {
      toast.success('🎉 Order placed successfully!');
    }
  }, [isSuccess]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const orderData = await ordersApi.getOrder(orderId);
      setOrder(orderData);
    } catch (err: unknown) {
      console.error('Failed to fetch order:', err instanceof Error ? err.message : String(err));
      setError('Failed to load order details');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PREPARING': return 'bg-orange-100 text-orange-800';
      case 'READY': return 'bg-purple-100 text-purple-800';
      case 'DISPATCHED': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The order you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
              <p className="text-muted-foreground">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
            <Badge className={getPaymentStatusColor(order.paymentStatus)}>
              {order.paymentStatus}
            </Badge>
          </div>
        </div>

        {/* Success Message */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Order Confirmed!</h3>
                <p className="text-green-700">
                  Your order has been placed successfully. You'll receive updates via email and SMS.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <img 
                        src={item.product?.images[0] || '/api/placeholder/64/64'} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ${item.unitPrice}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Address
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      <p>{order.deliveryAddress?.fullName}</p>
                      <p>{order.deliveryAddress?.addressLine1}</p>
                      <p>
                        {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Estimated Delivery
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {order.estimatedTime}
                    </p>
                    {order.expectedDelivery && (
                      <p className="text-sm text-muted-foreground">
                        Expected: {new Date(order.expectedDelivery).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {order.customerNotes && (
                  <div>
                    <h4 className="font-semibold mb-2">Special Instructions</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {order.customerNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Actions */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${order.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${order.deliveryFee.toFixed(2)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${order.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Info */}
            {order.vendor && (
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold">{order.vendor.businessName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {order.vendor.businessAddress}, {order.vendor.city}, {order.vendor.state}
                    </p>
                  </div>
                  {order.vendor.averageRating && (
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{order.vendor.averageRating}</span>
                      <span className="text-sm text-muted-foreground">rating</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
                {order.status === 'CONFIRMED' && (
                  <Button className="w-full" variant="outline">
                    Cancel Order
                  </Button>
                )}
                <Button className="w-full" onClick={() => router.push('/orders')}>
                  View All Orders
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}