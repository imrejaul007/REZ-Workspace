'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts([
      { id: '1', name: 'Organic Milk', sku: 'MILK001', category: 'Dairy', quantity: 50, price: 60 },
      { id: '2', name: 'Whole Wheat Bread', sku: 'BREAD001', category: 'Bakery', quantity: 30, price: 45 },
      { id: '3', name: 'Fresh Eggs (30)', sku: 'EGG001', category: 'Dairy', quantity: 20, price: 250 },
      { id: '4', name: 'Basmati Rice 5kg', sku: 'RICE001', category: 'Grains', quantity: 40, price: 450 }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Add Product</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{p.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={p.quantity < 25 ? 'text-red-600 font-medium' : ''}>{p.quantity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
