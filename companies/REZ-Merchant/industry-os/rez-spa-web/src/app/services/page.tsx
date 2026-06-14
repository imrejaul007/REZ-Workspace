'use client';

import { useState, useEffect } from 'react';

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  status: string;
  isPopular: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServices([
          { id: '1', name: 'Deep Tissue Massage', category: 'massage', duration: 60, price: 2500, status: 'active', isPopular: true },
          { id: '2', name: 'Aromatherapy Massage', category: 'massage', duration: 90, price: 3500, status: 'active', isPopular: true },
          { id: '3', name: 'Signature Facial', category: 'facial', duration: 60, price: 2000, status: 'active', isPopular: false },
          { id: '4', name: 'Gold Facial', category: 'facial', duration: 90, price: 4500, status: 'active', isPopular: true },
          { id: '5', name: 'Body Scrub Treatment', category: 'body', duration: 45, price: 1800, status: 'active', isPopular: false },
          { id: '6', name: 'Hot Stone Massage', category: 'massage', duration: 75, price: 3200, status: 'active', isPopular: true }
        ]);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const categories = [
    { value: 'all', label: 'All Services' },
    { value: 'massage', label: 'Massage' },
    { value: 'facial', label: 'Facial' },
    { value: 'body', label: 'Body Treatments' },
    { value: 'nail', label: 'Nail' },
    { value: 'wellness', label: 'Wellness' }
  ];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(s => s.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            + Add Service
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === cat.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </main>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{service.category}</p>
          </div>
          {service.isPopular && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              Popular
            </span>
          )}
        </div>

        <div className="flex items-center text-gray-600 mb-4">
          <span className="mr-4">⏱ {service.duration} min</span>
          <span className="font-semibold text-purple-600">₹{service.price.toLocaleString()}</span>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Edit
          </button>
          <button className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            View
          </button>
        </div>
      </div>
    </div>
  );
}
