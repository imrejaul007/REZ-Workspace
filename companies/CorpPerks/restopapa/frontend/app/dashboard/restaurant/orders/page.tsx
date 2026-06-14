'use client';

import { useState } from 'react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  orderTime: string;
  estimatedDeliveryTime?: string;
  tableNumber?: number;
  deliveryPartner?: string;
  notes?: string;
}

export default function OrdersManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const orders: Order[] = [
    {
      id: 'order_001',
      orderNumber: 'ORD-2025-0001',
      customerName: 'Rajesh Kumar',
      customerPhone: '+91-9876543210',
      customerAddress: '123 MG Road, Mumbai - 400001',
      items: [
        { id: 'item_1', name: 'Butter Chicken', quantity: 2, price: 350 },
        { id: 'item_2', name: 'Garlic Naan', quantity: 4, price: 80 },
        { id: 'item_3', name: 'Basmati Rice', quantity: 2, price: 120 },
        { id: 'item_4', name: 'Lassi', quantity: 2, price: 60, specialInstructions: 'Less sugar' }
      ],
      totalAmount: 1370,
      status: 'preparing',
      orderType: 'delivery',
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      orderTime: '2025-01-15 19:30:00',
      estimatedDeliveryTime: '2025-01-15 20:45:00',
      deliveryPartner: 'Swiggy',
      notes: 'Customer prefers less spicy food'
    },
    {
      id: 'order_002',
      orderNumber: 'ORD-2025-0002',
      customerName: 'Priya Sharma',
      customerPhone: '+91-8765432109',
      items: [
        { id: 'item_5', name: 'Paneer Tikka', quantity: 1, price: 280 },
        { id: 'item_6', name: 'Roti', quantity: 3, price: 40 },
        { id: 'item_7', name: 'Dal Tadka', quantity: 1, price: 180 }
      ],
      totalAmount: 620,
      status: 'ready',
      orderType: 'takeaway',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      orderTime: '2025-01-15 19:45:00',
      estimatedDeliveryTime: '2025-01-15 20:15:00'
    },
    {
      id: 'order_003',
      orderNumber: 'ORD-2025-0003',
      customerName: 'Amit Singh',
      customerPhone: '+91-7654321098',
      items: [
        { id: 'item_8', name: 'Chicken Biryani', quantity: 3, price: 450 },
        { id: 'item_9', name: 'Raita', quantity: 3, price: 60 },
        { id: 'item_10', name: 'Gulab Jamun', quantity: 4, price: 80 }
      ],
      totalAmount: 1670,
      status: 'confirmed',
      orderType: 'dine_in',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      orderTime: '2025-01-15 20:00:00',
      tableNumber: 12
    },
    {
      id: 'order_004',
      orderNumber: 'ORD-2025-0004',
      customerName: 'Neha Patel',
      customerPhone: '+91-6543210987',
      customerAddress: '456 Brigade Road, Bangalore - 560001',
      items: [
        { id: 'item_11', name: 'Masala Dosa', quantity: 2, price: 150 },
        { id: 'item_12', name: 'Filter Coffee', quantity: 2, price: 40 }
      ],
      totalAmount: 380,
      status: 'delivered',
      orderType: 'delivery',
      paymentStatus: 'paid',
      paymentMethod: 'wallet',
      orderTime: '2025-01-15 18:30:00',
      estimatedDeliveryTime: '2025-01-15 19:30:00',
      deliveryPartner: 'Zomato'
    },
    {
      id: 'order_005',
      orderNumber: 'ORD-2025-0005',
      customerName: 'Vikash Agarwal',
      customerPhone: '+91-5432109876',
      items: [
        { id: 'item_13', name: 'Veg Thali', quantity: 1, price: 220 }
      ],
      totalAmount: 220,
      status: 'cancelled',
      orderType: 'dine_in',
      paymentStatus: 'refunded',
      paymentMethod: 'upi',
      orderTime: '2025-01-15 19:00:00',
      tableNumber: 8,
      notes: 'Customer cancelled due to wait time'
    },
    {
      id: 'order_006',
      orderNumber: 'ORD-2025-0006',
      customerName: 'Sunita Verma',
      customerPhone: '+91-4321098765',
      customerAddress: '789 Park Street, Kolkata - 700001',
      items: [
        { id: 'item_14', name: 'Fish Curry', quantity: 1, price: 320 },
        { id: 'item_15', name: 'Steamed Rice', quantity: 1, price: 100 },
        { id: 'item_16', name: 'Mishti Doi', quantity: 2, price: 80 }
      ],
      totalAmount: 580,
      status: 'out_for_delivery',
      orderType: 'delivery',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      orderTime: '2025-01-15 20:15:00',
      estimatedDeliveryTime: '2025-01-15 21:00:00',
      deliveryPartner: 'Uber Eats'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in': return '🪑';
      case 'takeaway': return '🥡';
      case 'delivery': return '🚗';
      default: return '📋';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesType = selectedType === 'all' || order.orderType === selectedType;
    const matchesSearch = searchTerm === '' ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    // This would typically update the backend
    logger.info(`Updating order ${orderId} to status: ${newStatus}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return [
          { label: 'Confirm', status: 'confirmed' as const, color: 'bg-blue-600 hover:bg-blue-700' },
          { label: 'Cancel', status: 'cancelled' as const, color: 'bg-red-600 hover:bg-red-700' }
        ];
      case 'confirmed':
        return [
          { label: 'Start Preparing', status: 'preparing' as const, color: 'bg-orange-600 hover:bg-orange-700' }
        ];
      case 'preparing':
        return [
          { label: 'Mark Ready', status: 'ready' as const, color: 'bg-green-600 hover:bg-green-700' }
        ];
      case 'ready':
        if (order.orderType === 'delivery') {
          return [
            { label: 'Out for Delivery', status: 'out_for_delivery' as const, color: 'bg-purple-600 hover:bg-purple-700' }
          ];
        } else {
          return [
            { label: 'Mark Delivered', status: 'delivered' as const, color: 'bg-gray-600 hover:bg-gray-700' }
          ];
        }
      case 'out_for_delivery':
        return [
          { label: 'Mark Delivered', status: 'delivered' as const, color: 'bg-gray-600 hover:bg-gray-700' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="mt-2 text-gray-600">Track and manage all incoming orders</p>
        </div>

        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="dine_in">Dine In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-lg font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-orange-600 text-xl">👨‍🍳</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Preparing</p>
                <p className="text-lg font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'preparing').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Ready</p>
                <p className="text-lg font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'ready').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">💰</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Orders</h3>
            <p className="text-sm text-gray-500">Showing {filteredOrders.length} of {orders.length} orders</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getOrderTypeIcon(order.orderType)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.orderTime).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          {order.tableNumber && (
                            <div className="text-xs text-gray-500">Table {order.tableNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">
                        {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{order.paymentMethod}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-1">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900 text-left"
                        >
                          View Details
                        </button>
                        {getStatusActions(order).map(action => (
                          <button
                            key={action.status}
                            onClick={() => updateOrderStatus(order.id, action.status)}
                            className={`text-white px-2 py-1 rounded text-xs ${action.color}`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing 1-{filteredOrders.length} of {orders.length} orders
              </div>
              <div className="flex space-x-1">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white">Previous</button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white">Next</button>
              </div>
            </div>
          </div>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Order Details - {selectedOrder.orderNumber}</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Type</label>
                    <p className="text-sm text-gray-900 flex items-center">
                      <span className="mr-2">{getOrderTypeIcon(selectedOrder.orderType)}</span>
                      {selectedOrder.orderType.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Time</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedOrder.orderTime).toLocaleString('en-IN')}
                    </p>
                  </div>
                  {selectedOrder.estimatedDeliveryTime && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estimated Delivery</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedOrder.estimatedDeliveryTime).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>

                {selectedOrder.customerAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Delivery Address</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customerAddress}</p>
                  </div>
                )}

                {selectedOrder.tableNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Table Number</label>
                    <p className="text-sm text-gray-900">Table {selectedOrder.tableNumber}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Order Items</label>
                  <div className="space-y-2">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          {item.specialInstructions && (
                            <div className="text-sm text-orange-600 italic">Note: {item.specialInstructions}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                          <div className="font-medium">{formatCurrency(item.price * item.quantity)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      Status: {selectedOrder.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                      Payment: {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                <div className="flex space-x-2">
                  {getStatusActions(selectedOrder).map(action => (
                    <button
                      key={action.status}
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, action.status);
                        setSelectedOrder(null);
                      }}
                      className={`px-4 py-2 text-white rounded-lg ${action.color}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}