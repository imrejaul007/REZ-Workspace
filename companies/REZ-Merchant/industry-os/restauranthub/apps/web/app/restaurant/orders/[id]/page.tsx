'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, Phone, User, CheckCircle, AlertCircle, Package, Truck, MessageCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function OrderDetails() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState({
    id: orderId,
    customer: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      address: '456 Oak Street, New York, NY 10001'
    },
    items: [
      { name: 'Margherita Pizza', quantity: 2, price: 18.99, notes: 'Extra cheese, no basil' },
      { name: 'Caesar Salad', quantity: 1, price: 12.99, notes: '' },
      { name: 'Garlic Bread', quantity: 1, price: 6.99, notes: 'Well done' }
    ],
    status: 'preparing',
    paymentStatus: 'paid',
    type: 'delivery',
    orderTime: '2025-01-10T18:30:00Z',
    estimatedTime: 45,
    actualTime: null,
    subtotal: 51.97,
    tax: 4.16,
    deliveryFee: 3.99,
    tip: 8.00,
    total: 68.12,
    driver: {
      name: 'Mike Rodriguez',
      phone: '+1 (555) 987-6543',
      rating: 4.8,
      estimatedArrival: '19:15'
    },
    timeline: [
      { status: 'placed', time: '18:30', completed: true, message: 'Order received' },
      { status: 'confirmed', time: '18:32', completed: true, message: 'Order confirmed by restaurant' },
      { status: 'preparing', time: '18:35', completed: true, message: 'Kitchen started preparation' },
      { status: 'ready', time: '19:10', completed: false, message: 'Ready for pickup/delivery' },
      { status: 'out_for_delivery', time: '19:15', completed: false, message: 'Driver assigned' },
      { status: 'delivered', time: '19:30', completed: false, message: 'Order delivered' }
    ],
    notes: '',
    rating: null
  });

  const [newNote, setNewNote] = useState('');

  const statusColors = {
    placed: 'bg-blue-500',
    confirmed: 'bg-yellow-500',
    preparing: 'bg-orange-500',
    ready: 'bg-purple-500',
    out_for_delivery: 'bg-indigo-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
  };

  const getStatusProgress = (status: string) => {
    const statuses = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    const currentIndex = statuses.indexOf(status);
    return ((currentIndex + 1) / statuses.length) * 100;
  };

  const handleStatusUpdate = (newStatus: string) => {
    setOrder(prev => ({
      ...prev,
      status: newStatus,
      timeline: prev.timeline.map(item => ({
        ...item,
        completed: prev.timeline.indexOf(item) <= prev.timeline.findIndex(t => t.status === newStatus)
      }))
    }));
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setOrder(prev => ({ ...prev, notes: prev.notes + (prev.notes ? '\n' : '') + newNote.trim() }));
      setNewNote('');
    }
  };

  const getEstimatedTime = () => {
    const orderTime = new Date(order.orderTime);
    const estimated = new Date(orderTime.getTime() + order.estimatedTime * 60000);
    return estimated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getElapsedTime = () => {
    const orderTime = new Date(order.orderTime);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - orderTime.getTime()) / 60000);
    return elapsed;
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost"  onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Order #{orderId}</h1>
              <p className="text-muted-foreground">
                {order.type === 'delivery' ? 'Delivery' : 'Pickup'} • Placed {getElapsedTime()} minutes ago
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={statusColors[order.status as keyof typeof statusColors]}>
              {order.status.replace('_', ' ')}
            </Badge>
            <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'}>
              {order.paymentStatus}
            </Badge>
          </div>
        </div>

        {order.status === 'preparing' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              This order is currently being prepared. Estimated completion time: {getEstimatedTime()}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Order Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{Math.round(getStatusProgress(order.status))}% Complete</span>
                      </div>
                      <Progress value={getStatusProgress(order.status)} />
                    </div>
                    
                    <div className="space-y-3">
                      {order.timeline.map((step, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          {step.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-500'}`}>
                                {step.message}
                              </span>
                              <span className="text-sm text-gray-500">{step.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              {item.notes && (
                                <p className="text-sm text-gray-600 mt-1">Note: {item.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                              <div className="text-sm text-gray-500">{item.quantity} × ${item.price}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${order.tax.toFixed(2)}</span>
                    </div>
                    {order.type === 'delivery' && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>${order.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tip</span>
                      <span>${order.tip.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Customer Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium">{order.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email</span>
                      <span className="font-medium">{order.customer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-medium">{order.customer.phone}</span>
                    </div>
                    {order.type === 'delivery' && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600">Address</span>
                        <span className="font-medium text-right max-w-xs">{order.customer.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.status === 'preparing' && (
                    <Button 
                      className="w-full"
                      onClick={() => handleStatusUpdate('ready')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Ready
                    </Button>
                  )}
                  {order.status === 'ready' && order.type === 'delivery' && (
                    <Button 
                      className="w-full"
                      onClick={() => handleStatusUpdate('out_for_delivery')}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Assign Driver
                    </Button>
                  )}
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Customer
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Delivery Information */}
            {order.type === 'delivery' && order.driver && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="h-5 w-5 mr-2" />
                      Delivery Driver
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="w-10 h-10 bg-blue-500 flex items-center justify-center text-white">
                        {order.driver.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <div>
                        <div className="font-medium">{order.driver.name}</div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="h-3 w-3 mr-1 text-yellow-400" />
                          {order.driver.rating}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Phone</span>
                        <span>{order.driver.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ETA</span>
                        <span>{order.driver.estimatedArrival}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Order Notes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.notes && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm whitespace-pre-wrap">{order.notes}</div>
                      </div>
                    )}
                    <Textarea
                      placeholder="Add a note about this order..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      
                      className="w-full"
                    >
                      Add Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Placed</span>
                      <span>{new Date(order.orderTime).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated</span>
                      <span>{getEstimatedTime()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Elapsed</span>
                      <span>{getElapsedTime()} minutes</span>
                    </div>
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