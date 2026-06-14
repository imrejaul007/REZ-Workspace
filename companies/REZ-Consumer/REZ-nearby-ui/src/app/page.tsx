'use client';

/**
 * REZ Nearby UI - Location-based discovery
 */

import { useState } from 'react';

const categories = [
  { id: 'restaurant', name: 'Restaurants', icon: '🍽️' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'health', name: 'Health', icon: '🏥' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'services', name: 'Services', icon: '🔧' },
];

const mockPlaces = [
  { id: '1', name: 'Pizza Palace', category: 'restaurant', distance: '0.5 km', rating: 4.5 },
  { id: '2', name: 'Coffee Shop', category: 'restaurant', distance: '0.8 km', rating: 4.2 },
  { id: '3', name: 'Shopping Mall', category: 'shopping', distance: '1.2 km', rating: 4.0 },
];

export default function NearbyPage() {
  const [selectedCategory, setSelectedCategory] = useState('restaurant');

  const filteredPlaces = mockPlaces.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">REZ Nearby</h1>
        <p className="text-sm text-gray-500">Discover places around you</p>
      </header>

      {/* Categories */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Places */}
      <div className="px-4 space-y-3">
        {filteredPlaces.map(place => (
          <div key={place.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{place.name}</p>
                <p className="text-sm text-gray-500">{place.distance}</p>
              </div>
              <div className="text-right">
                <span className="text-yellow-500">★</span>
                <span className="font-medium">{place.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
