'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Phone,
  Clock,
  Package,
  Truck,
  ChefHat,
  CheckCircle,
  CheckCircle2,
  XCircle,
  User,
  Star,
  Navigation,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  Share2,
  Download,
  Bike,
  Car,
  Info,
  Bell,
  ChevronRight,
  ArrowLeft,
  Loader2,
  MapPinned,
  Timer,
  Route,
  ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { 
  useOrderTracking,
  OrderTimeline,
  DeliveryStatus,
  getStatusColor,
  getStatusBadgeColor,
  formatTimeAgo,
  formatETA
} from '@/lib/order-tracking';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TimelineItemProps {
  item: OrderTimeline;
  isLast?: boolean;
}

function TimelineItem({ item, isLast }: TimelineItemProps) {
  const getIcon = () => {
    switch (item.icon) {
      case 'ShoppingCart': return ShoppingCart;
      case 'CheckCircle': return CheckCircle;
      case 'ChefHat': return ChefHat;
      case 'Package': return Package;
      case 'User': return User;
      case 'Bike': return Bike;
      case 'Truck': return Truck;
      case 'Clock': return Clock;
      case 'CheckCircle2': return CheckCircle2;
      case 'XCircle': return XCircle;
      default: return CheckCircle;
    }
  };

  const Icon = getIcon();

  return (
    <div className={cn("flex", isLast ? "" : "pb-8")}>
      <div className="flex flex-col items-center mr-4">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border-2",
          item.current 
            ? "border-primary bg-primary text-primary-foreground animate-pulse" 
            : item.completed 
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 bg-background text-muted-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        {!isLast && (
          <div className={cn(
            "h-full w-0.5 mt-2",
            item.completed ? "bg-primary" : "bg-muted-foreground/30"
          )} />
        )}
      </div>
      
      <div className="flex-1 pt-1">
        <div className="flex items-center justify-between">
          <h3 className={cn(
            "font-semibold",
            item.current ? "text-primary" : item.completed ? "text-foreground" : "text-muted-foreground"
          )}>
            {item.message}
          </h3>
          <span className="text-sm text-muted-foreground">
            {formatTimeAgo(item.timestamp)}
          </span>
        </div>
        <p className={cn(
          "text-sm mt-1",
          item.completed ? "text-muted-foreground" : "text-muted-foreground/60"
        )}>
          {item.description}
        </p>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.orderId as string;
  
  const {
    tracking,
    stats,
    loading,
    updateStatus,
    rateOrder,
    cancelOrder,
    markNotificationRead
  } = useOrderTracking(orderId);

  const [showRating, setShowRating] = useState(false);
  const [ratings, setRatings] = useState({
    food: 0,
    delivery: 0,
    packaging: 0,
    overall: 0,
    comment: ''
  });

  const [activeTab, setActiveTab] = useState('tracking');
  const [showNotifications, setShowNotifications] = useState(false);

  // Mark notifications as read when viewed
  useEffect(() => {
    if (showNotifications && tracking?.notifications) {
      tracking.notifications
        .filter(n => !n.read)
        .forEach(n => markNotificationRead(n.id));
    }
  }, [showNotifications, tracking, markNotificationRead]);

  const handleCancelOrder = () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      cancelOrder('Customer requested cancellation');
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
      });
    }
  };

  const handleRateOrder = () => {
    if (rateOrder(ratings)) {
      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted.",
      });
      setShowRating(false);
    }
  };

  const handleContactRider = () => {
    if (tracking?.rider) {
      window.location.href = `tel:${tracking.rider.phone}`;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Order ${tracking?.orderNumber}`,
        text: `Track my order from ${tracking?.restaurant.name}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Tracking link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tracking) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find the order you're looking for.
          </p>
          <Button onClick={() => router.push('/orders')}>
            View All Orders
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const canCancelOrder = ['pending', 'confirmed', 'preparing'].includes(tracking.status);
  const isDelivered = tracking.deliveryStatus === 'delivered';
  const isCancelled = tracking.deliveryStatus === 'cancelled';

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
              <h1 className="text-3xl font-bold text-foreground">Track Order</h1>
              <p className="text-muted-foreground">
                Order #{tracking.orderNumber}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()}>
              <Download className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-4 w-4" />
                {stats && stats.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.unreadNotifications}
                  </span>
                )}
              </Button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50"
                  >
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {tracking.notifications.map(notif => (
                        <div key={notif.id} className={cn(
                          "p-4 border-b border-border last:border-0",
                          !notif.read && "bg-primary/5"
                        )}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{notif.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notif.message}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notif.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge className={cn("mb-2", getStatusBadgeColor(tracking.status))}>
                  {tracking.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <h2 className="text-2xl font-bold text-foreground">
                  {tracking.deliveryStatus === 'delivered' 
                    ? 'Your order has been delivered!' 
                    : tracking.deliveryStatus === 'cancelled'
                      ? 'Your order was cancelled'
                      : `Your order is ${tracking.deliveryStatus.replace(/_/g, ' ')}`}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {!isCancelled && (
                    <>
                      Estimated delivery: <span className="font-medium">{formatETA(tracking.estimatedDelivery)}</span>
                    </>
                  )}
                </p>
              </div>
              
              {tracking.rider && !isCancelled && !isDelivered && (
                <Button onClick={handleContactRider}>
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Rider
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            {!isCancelled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Progress</span>
                  <span className="font-medium">{tracking.tracking.progress?.toFixed(0)}%</span>
                </div>
                <Progress value={tracking.tracking.progress || 0} className="h-3" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="rider">Rider</TabsTrigger>
          </TabsList>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            {/* Map View (Placeholder) */}
            <Card>
              <CardContent className="p-0">
                <div className="h-96 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center relative">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Live Tracking</h3>
                    <p className="text-muted-foreground">
                      Real-time map tracking coming soon
                    </p>
                  </div>
                  
                  {/* Route Info Overlay */}
                  {tracking.tracking.distance && (
                    <div className="absolute bottom-4 left-4 bg-white/90 p-4 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Distance</p>
                          <p className="font-semibold">{tracking.tracking.distance} km</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ETA</p>
                          <p className="font-semibold">{tracking.tracking.duration} min</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Timer className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time Elapsed</p>
                        <p className="text-lg font-semibold">{stats.elapsedTime} min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Route className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Distance</p>
                        <p className="text-lg font-semibold">{stats.distance} km</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time Remaining</p>
                        <p className="text-lg font-semibold">{stats.remainingTime} min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
                <CardDescription>
                  Track your order's journey from placement to delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tracking.timeline.map((item, index) => (
                    <TimelineItem
                      key={item.status}
                      item={item}
                      isLast={index === tracking.timeline.length - 1}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tracking.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Amount</span>
                    <span className="text-lg font-bold">₹{tracking.payment.amount}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Payment Method</span>
                    <span className="text-sm">{tracking.payment.method}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground">Payment Status</span>
                    <Badge variant={tracking.payment.status === 'paid' ? 'default' : 'secondary'}>
                      {tracking.payment.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Restaurant & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Restaurant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{tracking.restaurant.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tracking.restaurant.address}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{tracking.restaurant.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{tracking.customer.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tracking.customer.address}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{tracking.customer.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rider Tab */}
          <TabsContent value="rider">
            {tracking.rider ? (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Partner</CardTitle>
                  <CardDescription>
                    Your order is being delivered by our trusted partner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{tracking.rider.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{tracking.rider.rating}</span>
                          <span className="text-sm text-muted-foreground">rating</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Vehicle</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {tracking.rider.vehicleType === 'bike' ? (
                              <Bike className="h-4 w-4" />
                            ) : (
                              <Car className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium capitalize">
                              {tracking.rider.vehicleType}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Vehicle Number</p>
                          <p className="text-sm font-medium mt-1">{tracking.rider.vehicleNumber}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button onClick={handleContactRider} className="flex-1">
                          <Phone className="h-4 w-4 mr-2" />
                          Call Rider
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Rider Assigned Yet</h3>
                  <p className="text-muted-foreground">
                    A delivery partner will be assigned soon
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {canCancelOrder && (
              <Button variant="destructive" onClick={handleCancelOrder}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </Button>
            )}
            
            {isDelivered && !tracking.ratings && (
              <Button onClick={() => setShowRating(true)}>
                <Star className="h-4 w-4 mr-2" />
                Rate Order
              </Button>
            )}
          </div>
          
          <Button variant="outline" onClick={() => router.push('/orders')}>
            View All Orders
          </Button>
        </div>

        {/* Rating Modal */}
        <AnimatePresence>
          {showRating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowRating(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-background border border-border rounded-lg p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">Rate Your Experience</h3>
                
                <div className="space-y-4">
                  {['food', 'delivery', 'packaging', 'overall'].map(aspect => (
                    <div key={aspect}>
                      <label className="text-sm font-medium capitalize">{aspect}</label>
                      <div className="flex space-x-1 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatings(prev => ({ ...prev, [aspect]: star }))}
                            className="p-1"
                          >
                            <Star className={cn(
                              "h-6 w-6 transition-colors",
                              Number(ratings[aspect as keyof typeof ratings]) >= star
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            )} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div>
                    <label className="text-sm font-medium">Comments (Optional)</label>
                    <textarea
                      value={ratings.comment}
                      onChange={(e) => setRatings(prev => ({ ...prev, comment: e.target.value }))}
                      rows={3}
                      className="w-full mt-1 p-2 border border-border rounded-md"
                      placeholder="Share your experience..."
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setShowRating(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleRateOrder} className="flex-1">
                    Submit Rating
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}