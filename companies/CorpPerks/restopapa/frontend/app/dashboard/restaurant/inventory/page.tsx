'use client';

import { useState } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  category: 'vegetables' | 'meat' | 'dairy' | 'grains' | 'spices' | 'beverages' | 'others';
  currentStock: number;
  unit: 'kg' | 'liters' | 'pieces' | 'packets' | 'bottles';
  minThreshold: number;
  maxCapacity: number;
  costPerUnit: number;
  supplier: string;
  lastRestocked: string;
  expiryDate?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  location: string;
}

interface PurchaseOrder {
  id: string;
  supplierName: string;
  items: {
    itemName: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    total: number;
  }[];
  totalAmount: number;
  orderDate: string;
  expectedDelivery: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
}

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'suppliers'>('inventory');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);

  const inventoryItems: InventoryItem[] = [
    {
      id: 'item_001',
      name: 'Basmati Rice',
      category: 'grains',
      currentStock: 25,
      unit: 'kg',
      minThreshold: 10,
      maxCapacity: 100,
      costPerUnit: 120,
      supplier: 'Fresh Farm Supplies',
      lastRestocked: '2025-01-10',
      status: 'in_stock',
      location: 'Storage Room A'
    },
    {
      id: 'item_002',
      name: 'Chicken Breast',
      category: 'meat',
      currentStock: 5,
      unit: 'kg',
      minThreshold: 8,
      maxCapacity: 50,
      costPerUnit: 280,
      supplier: 'Premium Meat Co.',
      lastRestocked: '2025-01-12',
      expiryDate: '2025-01-18',
      status: 'low_stock',
      location: 'Freezer Section'
    },
    {
      id: 'item_003',
      name: 'Paneer',
      category: 'dairy',
      currentStock: 0,
      unit: 'kg',
      minThreshold: 5,
      maxCapacity: 20,
      costPerUnit: 350,
      supplier: 'Dairy Fresh Ltd.',
      lastRestocked: '2025-01-08',
      expiryDate: '2025-01-16',
      status: 'out_of_stock',
      location: 'Refrigerator'
    },
    {
      id: 'item_004',
      name: 'Tomatoes',
      category: 'vegetables',
      currentStock: 15,
      unit: 'kg',
      minThreshold: 10,
      maxCapacity: 50,
      costPerUnit: 40,
      supplier: 'Local Vegetable Market',
      lastRestocked: '2025-01-14',
      expiryDate: '2025-01-17',
      status: 'in_stock',
      location: 'Vegetable Storage'
    },
    {
      id: 'item_005',
      name: 'Garam Masala',
      category: 'spices',
      currentStock: 2,
      unit: 'packets',
      minThreshold: 3,
      maxCapacity: 20,
      costPerUnit: 150,
      supplier: 'Spice World',
      lastRestocked: '2025-01-05',
      status: 'low_stock',
      location: 'Spice Rack'
    },
    {
      id: 'item_006',
      name: 'Cooking Oil',
      category: 'others',
      currentStock: 8,
      unit: 'liters',
      minThreshold: 5,
      maxCapacity: 30,
      costPerUnit: 180,
      supplier: 'Oil Mills Co.',
      lastRestocked: '2025-01-11',
      status: 'in_stock',
      location: 'Storage Room B'
    },
    {
      id: 'item_007',
      name: 'Fresh Milk',
      category: 'dairy',
      currentStock: 3,
      unit: 'liters',
      minThreshold: 10,
      maxCapacity: 40,
      costPerUnit: 55,
      supplier: 'Dairy Fresh Ltd.',
      lastRestocked: '2025-01-13',
      expiryDate: '2025-01-15',
      status: 'expired',
      location: 'Refrigerator'
    },
    {
      id: 'item_008',
      name: 'Coca Cola',
      category: 'beverages',
      currentStock: 24,
      unit: 'bottles',
      minThreshold: 20,
      maxCapacity: 100,
      costPerUnit: 25,
      supplier: 'Beverage Distributors',
      lastRestocked: '2025-01-12',
      status: 'in_stock',
      location: 'Beverage Cooler'
    }
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po_001',
      supplierName: 'Fresh Farm Supplies',
      items: [
        { itemName: 'Basmati Rice', quantity: 50, unit: 'kg', costPerUnit: 120, total: 6000 },
        { itemName: 'Lentils', quantity: 20, unit: 'kg', costPerUnit: 80, total: 1600 }
      ],
      totalAmount: 7600,
      orderDate: '2025-01-15',
      expectedDelivery: '2025-01-17',
      status: 'confirmed'
    },
    {
      id: 'po_002',
      supplierName: 'Premium Meat Co.',
      items: [
        { itemName: 'Chicken Breast', quantity: 25, unit: 'kg', costPerUnit: 280, total: 7000 },
        { itemName: 'Mutton', quantity: 15, unit: 'kg', costPerUnit: 450, total: 6750 }
      ],
      totalAmount: 13750,
      orderDate: '2025-01-14',
      expectedDelivery: '2025-01-16',
      status: 'pending'
    },
    {
      id: 'po_003',
      supplierName: 'Dairy Fresh Ltd.',
      items: [
        { itemName: 'Paneer', quantity: 10, unit: 'kg', costPerUnit: 350, total: 3500 },
        { itemName: 'Fresh Milk', quantity: 30, unit: 'liters', costPerUnit: 55, total: 1650 }
      ],
      totalAmount: 5150,
      orderDate: '2025-01-13',
      expectedDelivery: '2025-01-15',
      status: 'delivered'
    }
  ];

  const suppliers = [
    {
      id: 'sup_001',
      name: 'Fresh Farm Supplies',
      contact: '+91-9876543210',
      email: 'orders@freshfarm.com',
      category: 'Vegetables & Grains',
      rating: 4.8,
      lastOrder: '2025-01-15',
      totalOrders: 45
    },
    {
      id: 'sup_002',
      name: 'Premium Meat Co.',
      contact: '+91-8765432109',
      email: 'sales@premiummeat.com',
      category: 'Meat & Seafood',
      rating: 4.6,
      lastOrder: '2025-01-14',
      totalOrders: 28
    },
    {
      id: 'sup_003',
      name: 'Dairy Fresh Ltd.',
      contact: '+91-7654321098',
      email: 'supply@dairyfresh.com',
      category: 'Dairy Products',
      rating: 4.5,
      lastOrder: '2025-01-13',
      totalOrders: 32
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vegetables': return '🥕';
      case 'meat': return '🥩';
      case 'dairy': return '🥛';
      case 'grains': return '🌾';
      case 'spices': return '🌶️';
      case 'beverages': return '🥤';
      case 'others': return '📦';
      default: return '📦';
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesSearch = searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStockPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const handleRestock = async () => {
    if (!selectedItem || restockQuantity <= 0) return;
    
    setIsAddingStock(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info(`Restocking ${selectedItem.name} with ${restockQuantity} ${selectedItem.unit}`);
    setRestockQuantity(0);
    setIsAddingStock(false);
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-gray-600">Track stock levels, manage suppliers, and handle purchase orders</p>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inventory ({inventoryItems.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'suppliers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Suppliers ({suppliers.length})
            </button>
          </nav>
        </div>

        {activeTab === 'inventory' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-green-600 text-xl">📦</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="text-lg font-semibold text-gray-900">{inventoryItems.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-yellow-600 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Low Stock</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {inventoryItems.filter(item => item.status === 'low_stock').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-red-600 text-xl">🚫</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {inventoryItems.filter(item => item.status === 'out_of_stock').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <span className="text-gray-600 text-xl">⏰</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {inventoryItems.filter(item => isExpiringsSoon(item.expiryDate)).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-col lg:flex-row gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="meat">Meat</option>
                  <option value="dairy">Dairy</option>
                  <option value="grains">Grains</option>
                  <option value="spices">Spices</option>
                  <option value="beverages">Beverages</option>
                  <option value="others">Others</option>
                </select>
                
                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Inventory Items</h3>
                <p className="text-sm text-gray-500">Showing {filteredItems.length} of {inventoryItems.length} items</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost/Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getCategoryIcon(item.category)}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500 capitalize">{item.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {item.currentStock} {item.unit}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  item.currentStock <= item.minThreshold ? 'bg-red-500' : 
                                  item.currentStock < item.minThreshold * 1.5 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${getStockPercentage(item.currentStock, item.maxCapacity)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {item.minThreshold} | Max: {item.maxCapacity}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.costPerUnit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.supplier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.expiryDate ? (
                            <div className={isExpiringsSoon(item.expiryDate) ? 'text-red-600 font-medium' : ''}>
                              {new Date(item.expiryDate).toLocaleDateString('en-IN')}
                              {isExpiringsSoon(item.expiryDate) && <div className="text-xs">Expiring Soon!</div>}
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Restock
                          </button>
                          <button className="text-indigo-600 hover:text-indigo-900">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Purchase Orders</h3>
                <p className="text-sm text-gray-500">Manage your purchase orders and deliveries</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create New Order
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.supplierName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {order.items.map(item => `${item.quantity} ${item.unit} ${item.itemName}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.expectedDelivery).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">View</button>
                        {order.status === 'pending' && (
                          <button className="text-red-600 hover:text-red-900">Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-500">{supplier.category}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-sm text-gray-600 ml-1">{supplier.rating}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Contact:</span>
                    <span className="text-gray-900">{supplier.contact}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-900">{supplier.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Orders:</span>
                    <span className="text-gray-900">{supplier.totalOrders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Order:</span>
                    <span className="text-gray-900">
                      {new Date(supplier.lastOrder).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                    Create Order
                  </button>
                  <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Restock Item</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedItem.name}</h4>
                  <p className="text-sm text-gray-500">Current Stock: {selectedItem.currentStock} {selectedItem.unit}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity to Add ({selectedItem.unit})
                  </label>
                  <input
                    type="number"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(Number(e.target.value))}
                    min="0"
                    max={selectedItem.maxCapacity - selectedItem.currentStock}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max capacity: {selectedItem.maxCapacity} {selectedItem.unit}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-700">
                    New stock level: {selectedItem.currentStock + restockQuantity} {selectedItem.unit}
                  </p>
                  <p className="text-sm text-gray-700">
                    Estimated cost: {formatCurrency(restockQuantity * selectedItem.costPerUnit)}
                  </p>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestock}
                  disabled={restockQuantity <= 0 || isAddingStock}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isAddingStock ? 'Adding Stock...' : 'Add Stock'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function isExpiringsSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3 && diffDays > 0;
}