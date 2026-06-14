'use client';

import { useState, useEffect } from 'react';

interface Collection {
  id: string;
  name: string;
  season: string;
  year: number;
  products: number;
  status: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    setCollections([
      { id: '1', name: 'Summer 2024', season: 'Summer', year: 2024, products: 45, status: 'active' },
      { id: '2', name: 'Winter 2024', season: 'Winter', year: 2024, products: 38, status: 'draft' },
      { id: '3', name: 'Spring 2024', season: 'Spring', year: 2024, products: 52, status: 'active' }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">+ New Collection</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map(c => (
            <div key={c.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <h3 className="text-lg font-semibold">{c.name}</h3>
              <p className="text-sm text-gray-500">{c.season} {c.year}</p>
              <p className="text-sm mt-2">{c.products} products</p>
              <span className={`inline-block px-2 py-1 text-xs rounded-full mt-3 ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
