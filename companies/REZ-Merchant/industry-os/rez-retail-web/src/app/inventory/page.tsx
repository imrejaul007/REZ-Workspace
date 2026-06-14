'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, AlertTriangle, ArrowUpDown, TrendingUp, Search } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    setTimeout(() => {
      setInventory([
        { id: '1', sku: 'ELEC-001', name: 'Wireless Earbuds Pro', category: 'Electronics', currentStock: 150, reorderPoint: 20, reorderQuantity: 100, status: 'in_stock' },
        { id: '2', sku: 'ELEC-002', name: 'Smart Watch Series 5', category: 'Electronics', currentStock: 8, reorderPoint: 15, reorderQuantity: 50, status: 'low_stock' },
        { id: '3', sku: 'CLTH-001', name: 'Premium Cotton T-Shirt', category: 'Clothing', currentStock: 320, reorderPoint: 50, reorderQuantity: 200, status: 'in_stock' },
        { id: '4', sku: 'HOME-001', name: 'LED Desk Lamp', category: 'Home', currentStock: 5, reorderPoint: 10, reorderQuantity: 30, status: 'low_stock' },
        { id: '5', sku: 'ELEC-003', name: 'Portable Bluetooth Speaker', category: 'Electronics', currentStock: 0, reorderPoint: 15, reorderQuantity: 50, status: 'out_of_stock' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalProducts: inventory.length,
    inStock: inventory.filter(i => i.status === 'in_stock').length,
    lowStock: inventory.filter(i => i.status === 'low_stock').length,
    outOfStock: inventory.filter(i => i.status === 'out_of_stock').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-gray-600">
                <Package className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
            </div>
            <Link
              href="/inventory/reorder"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <TrendingUp className="w-4 h-4" />
              Create Purchase Order
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-4">
            <p className="text-sm text-green-600">In Stock</p>
            <p className="text-2xl font-bold text-green-700">{stats.inStock}</p>
          </div>
          <div className="bg-amber-50 rounded-xl shadow-sm p-4">
            <p className="text-sm text-amber-600">Low Stock</p>
            <p className="text-2xl font-bold text-amber-700">{stats.lowStock}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-4">
            <p className="text-sm text-red-600">Out of Stock</p>
            <p className="text-2xl font-bold text-red-700">{stats.outOfStock}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'in_stock', 'low_stock', 'out_of_stock'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' :
                   status === 'in_stock' ? 'In Stock' :
                   status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="block text-sm text-gray-500">{item.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.sku}</td>
                  <td className="px-6 py-4">
                    <span className={`text-lg font-bold ${
                      item.status === 'out_of_stock' ? 'text-red-600' :
                      item.status === 'low_stock' ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.reorderPoint}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.reorderQuantity}</td>
                  <td className="px-6 py-4">
                    {item.status === 'low_stock' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </span>
                    )}
                    {item.status === 'out_of_stock' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3" />
                        Out of Stock
                      </span>
                    )}
                    {item.status === 'in_stock' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
