'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  ChefHat,
  Timer,
  CheckCircle,
  AlertTriangle,
  Flame,
  Users,
  UtensilsCrossed,
  Play,
  Pause,
  RotateCcw,
  Bell,
  Settings,
  Maximize2,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  status: 'new' | 'preparing' | 'ready' | 'served' | 'delayed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: OrderItem[];
  totalItems: number;
  estimatedTime: number;
  elapsedTime: number;
  orderTime: string;
  specialInstructions?: string;
  allergens?: string[];
  station: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  modifications?: string[];
  cookingTime: number;
  station: string;
  status: 'pending' | 'preparing' | 'ready';
  allergens?: string[];
}

// Mock orders removed - using real-time data from useKitchenOrders hook

const kitchenStations = [
  { id: 'all', name: 'All Stations', icon: UtensilsCrossed, color: 'blue' },
  { id: 'grill', name: 'Grill', icon: Flame, color: 'red' },
  { id: 'saute', name: 'Sauté', icon: ChefHat, color: 'orange' },
  { id: 'fryer', name: 'Fryer', icon: Timer, color: 'yellow' },
  { id: 'salad', name: 'Cold Prep', icon: Users, color: 'green' },
  { id: 'oven', name: 'Oven', icon: Timer, color: 'purple' }
];

export default function KitchenDisplaySystem() {
  const router = useRouter();
  const [selectedStation, setSelectedStation] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get merchant and store IDs (from auth context or URL params)
  const [merchantId, setMerchantId] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');

  // Load from localStorage or context
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? {
      merchantId: localStorage.getItem('merchant_id') || '',
      storeId: localStorage.getItem('store_id') || '',
    } : { merchantId: '', storeId: '' };

    if (!stored.merchantId || !stored.storeId) {
      // In production, redirect to login/store selection if not available
      console.warn('Missing merchant_id or store_id');
    }

    setMerchantId(stored.merchantId);
    setStoreId(stored.storeId);
  }, []);

  // Use the kitchen orders hook
  const {
    orders,
    updateItemStatus,
    updateOrderStatus,
    isLoading,
    error,
    isConnected,
  } = useKitchenOrders(merchantId, storeId);

  // Update elapsed time for orders in preparing status
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setCurrentTime(new Date());
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const filteredOrders = selectedStation === 'all'
    ? orders
    : orders.filter(order => order.station === selectedStation || order.items.some(item => item.station === selectedStation));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'served': return 'bg-gray-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'normal': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const formatTime = (minutes: number) => {
    return `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin">
              <ChefHat className="h-12 w-12 text-primary mx-auto mb-4" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Loading Kitchen Display</h2>
            <p className="text-muted-foreground">Connecting to order system...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Kitchen Display System</h1>
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                isConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              )}>
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Connecting...
                  </>
                )}
              </div>
            </div>
            <p className="text-muted-foreground mt-1">
              Real-time order management for kitchen operations - {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button variant="outline" >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" >
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </Button>
            <Button 
              variant="outline" 
              
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
            <Button variant="outline" >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Kitchen Stations Filter */}
        <div className="flex flex-wrap gap-2">
          {kitchenStations.map((station) => {
            const Icon = station.icon;
            const isSelected = selectedStation === station.id;
            
            return (
              <Button
                key={station.id}
                variant={isSelected ? "default" : "outline"}
                
                onClick={() => setSelectedStation(station.id)}
                className={cn(
                  "flex items-center space-x-2",
                  isSelected && `bg-${station.color}-600 hover:bg-${station.color}-700`
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{station.name}</span>
                <Badge variant="secondary" className="ml-1">
                  {station.id === 'all' 
                    ? orders.length 
                    : orders.filter(order => 
                        order.station === station.id || 
                        order.items.some(item => item.station === station.id)
                      ).length
                  }
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Orders</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'new').length}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Preparing</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'preparing').length}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ChefHat className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ready</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'ready').length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Delayed</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'delayed').length}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  "relative overflow-hidden",
                  getPriorityColor(order.priority),
                  order.status === 'delayed' && "animate-pulse"
                )}>
                  {/* Priority Indicator */}
                  {order.priority === 'urgent' && (
                    <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-500" />
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          {order.tableNumber && (
                            <span>Table {order.tableNumber}</span>
                          )}
                          {order.customerName && (
                            <span>{order.customerName}</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={cn("text-white text-xs", getStatusColor(order.status))}
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.orderTime}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Order Type & Time */}
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">
                        {order.orderType}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4" />
                        <span className={cn(
                          order.elapsedTime > order.estimatedTime ? "text-red-600 font-semibold" : "text-muted-foreground"
                        )}>
                          {formatTime(order.elapsedTime)} / {formatTime(order.estimatedTime)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-background rounded border">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{item.quantity}x</span>
                              <span className="text-sm">{item.name}</span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  item.status === 'ready' && "bg-green-100 text-green-800",
                                  item.status === 'preparing' && "bg-orange-100 text-orange-800",
                                  item.status === 'pending' && "bg-gray-100 text-gray-800"
                                )}
                              >
                                {item.status}
                              </Badge>
                            </div>
                            {item.modifications && item.modifications.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                • {item.modifications.join(', ')}
                              </p>
                            )}
                            {item.allergens && item.allergens.length > 0 && (
                              <p className="text-xs text-red-600 mt-1">
                                ⚠️ {item.allergens.join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            {item.status === 'pending' && (
                              <Button
                                
                                variant="outline"
                                onClick={() => updateItemStatus(order.id, item.id, 'preparing')}
                                className="h-8 w-8 p-0"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            {item.status === 'preparing' && (
                              <Button
                                
                                variant="outline"
                                onClick={() => updateItemStatus(order.id, item.id, 'ready')}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs font-medium text-yellow-800">Special Instructions:</p>
                        <p className="text-xs text-yellow-700">{order.specialInstructions}</p>
                      </div>
                    )}

                    {/* Allergens */}
                    {order.allergens && order.allergens.length > 0 && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-medium text-red-800">Allergen Alert:</p>
                        <p className="text-xs text-red-700">{order.allergens.join(', ')}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {order.status === 'new' && (
                        <Button
                          
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          
                          onClick={() => updateOrderStatus(order.id, 'served')}
                          className="flex-1"
                        >
                          <UtensilsCrossed className="h-4 w-4 mr-1" />
                          Served
                        </Button>
                      )}
                      {(order.status === 'preparing' || order.status === 'delayed') && (
                        <Button
                          
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'new')}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Orders</h3>
              <p className="text-muted-foreground">
                {selectedStation === 'all' 
                  ? 'No orders in the kitchen right now'
                  : `No orders for ${kitchenStations.find(s => s.id === selectedStation)?.name} station`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}