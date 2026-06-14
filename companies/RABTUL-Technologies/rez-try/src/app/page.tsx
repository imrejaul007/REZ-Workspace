'use client';

import { useState, useEffect } from 'react';

interface Trial {
  id: string;
  name: string;
  description: string;
  images: string[];
  coinPrice: number;
  commitmentFee: number;
  originalPrice: number;
  reviewCount: number;
  merchant: {
    name: string;
    address: string;
    rating: number;
  };
}

export default function DiscoveryPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetch(`/api/trials?lat=12.97&lng=77.59&category=${category === 'all' ? '' : category}`)
      .then(r => r.json())
      .then(d => setTrials(d.trials || []))
      .finally(() => setLoading(false));
  }, [category]);

  const categories = ['all', 'beauty', 'food', 'fitness', 'wellness', 'home', 'products'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">ReZ Try</h1>
          <p className="text-gray-600">Discover and try new experiences</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                category === cat ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Trial grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trials.map(trial => (
              <div key={trial.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="h-48 bg-gray-200">
                  {trial.images[0] ? (
                    <img src={trial.images[0]} alt={trial.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{trial.name}</h3>
                  <p className="text-gray-600 text-sm">{trial.merchant.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-yellow-500">⭐ {trial.merchant.rating}</span>
                    <span className="text-gray-400 text-sm">({trial.reviewCount} reviews)</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-indigo-600">{trial.coinPrice}</span>
                      <span className="text-gray-500"> coins</span>
                    </div>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
                      Book Trial
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
