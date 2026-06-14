'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Search, 
  Filter, 
  Eye,
  MoreVertical, 
  CheckCircle, 
  Clock, 
  Truck,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';

export default function AdminOrders() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRestaurant, setFilterRestaurant] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const [orders, setOrders] = useState([
    {
      id: 'ORD-2024-001',
      customer: 'John Doe',
      restaurant: 'Bella Vista Italian',
      items: 3,
      total: 67.47,
      status: 'delivered',
      orderTime: '2024-02-15T14:30:00',
      deliveryTime: '2024-02-15T15:15:00',
      paymentMethod: 'Credit Card',
      deliveryFee: 3.99
    },
    {
      id: 'ORD-2024-002',
      customer: 'Sarah Wilson',
      restaurant: 'Tokyo Sushi Bar',
      items: 2,
      total: 45.80,
      status: 'preparing',
      orderTime: '2024-02-15T15:45:00',
      deliveryTime: null,
      paymentMethod: 'UPI',
      deliveryFee: 2.50
    },
    {
      id: 'ORD-2024-003',
      customer: 'Mike Johnson',
      restaurant: 'Green Garden Cafe',
      items: 1,
      total: 23.99,
      status: 'out_for_delivery',
      orderTime: '2024-02-15T16:20:00',
      deliveryTime: null,
      paymentMethod: 'Cash on Delivery',
      deliveryFee: 0
    },
    {
      id: 'ORD-2024-004',
      customer: 'Emily Chen',
      restaurant: 'Spice Route',
      items: 4,
      total: 89.25,
      status: 'cancelled',
      orderTime: '2024-02-15T12:15:00',
      deliveryTime: null,
      paymentMethod: 'Digital Wallet',
      deliveryFee: 5.00
    },
    {
      id: 'ORD-2024-005',
      customer: 'David Brown',
      restaurant: 'Pizza Palace',
      items: 2,
      total: 34.50,
      status: 'confirmed',
      orderTime: '2024-02-15T17:10:00',
      deliveryTime: null,
      paymentMethod: 'Credit Card',
      deliveryFee: 3.00
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'out_for_delivery': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'confirmed': return <Clock className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.restaurant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesRestaurant = filterRestaurant === 'all' || order.restaurant === filterRestaurant;
    return matchesSearch && matchesStatus && matchesRestaurant;
  });

  const stats = {
    total: orders.length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
    delivered: orders.filter(o => o.status === 'delivered').length,
    active: orders.filter(o => ['confirmed', 'preparing', 'out_for_delivery'].includes(o.status)).length
  };

  const restaurants = [...new Set(orders.map(order => order.restaurant))];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order Management</h1>
            <p className="text-muted-foreground">Monitor and manage all platform orders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <h3 className="text-2xl font-bold mt-2">{stats.total}</h3>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <h3 className="text-2xl font-bold mt-2 text-green-600">${stats.revenue.toFixed(2)}</h3>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <h3 className="text-2xl font-bold mt-2 text-green-600">{stats.delivered}</h3>
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
                    <p className="text-sm font-medium text-gray-600">Active Orders</p>
                    <h3 className="text-2xl font-bold mt-2 text-blue-600">{stats.active}</h3>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
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
                    placeholder="Search orders by ID, customer, or restaurant..."
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
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRestaurant} onValueChange={setFilterRestaurant}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by restaurant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Restaurants</SelectItem>
                  {restaurants.map(restaurant => (
                    <SelectItem key={restaurant} value={restaurant}>{restaurant}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Orders ({filteredOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Order ID</th>
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Restaurant</th>
                      <th className="text-left p-3">Items</th>
                      <th className="text-left p-3">Total</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Order Time</th>
                      <th className="text-left p-3">Payment</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <motion.tr 
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <span className="font-mono text-sm font-medium">{order.id}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="font-medium">{order.customer}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{order.restaurant}</td>
                        <td className="p-3 text-sm">{order.items} items</td>
                        <td className="p-3 font-medium">${order.total.toFixed(2)}</td>
                        <td className="p-3">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(order.orderTime).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm">{order.paymentMethod}</td>
                        <td className="p-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Package className="h-4 w-4 mr-2" />
                                Track Order
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="h-4 w-4 mr-2" />
                                Contact Customer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}