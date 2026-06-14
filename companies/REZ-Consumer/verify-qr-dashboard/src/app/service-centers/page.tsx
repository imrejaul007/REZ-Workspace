'use client';

import { useState, useEffect } from 'react';

// Types
interface ServiceCenter {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  services: string[];
  workingHours: string;
  rating: number;
  verified: boolean;
}

export default function ServiceCentersPage() {
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<ServiceCenter | null>(null);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const response = await fetch('http://localhost:4003/api/service-centers');
      const data = await response.json();
      if (data.success) {
        setCenters(data.data || mockCenters);
      } else {
        setCenters(mockCenters);
      }
    } catch {
      setCenters(mockCenters);
    }
    setLoading(false);
  };

  const mockCenters: ServiceCenter[] = [
    {
      _id: '1',
      name: 'TechCare Solutions',
      address: '123 MG Road, Sector 14',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      phone: '+91 98765 43210',
      email: 'bangalore@techcare.com',
      services: ['Screen Repair', 'Battery Replacement', 'Software Issues', 'Water Damage'],
      workingHours: '9 AM - 8 PM',
      rating: 4.5,
      verified: true
    },
    {
      _id: '2',
      name: 'QuickFix Electronics',
      address: '456 Brigade Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560025',
      phone: '+91 98765 43211',
      email: 'support@quickfix.com',
      services: ['All Repairs', 'Warranty Claims', 'Parts Replacement'],
      workingHours: '10 AM - 7 PM',
      rating: 4.2,
      verified: true
    },
    {
      _id: '3',
      name: 'Gadget Hospital',
      address: '789 Commercial Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91 98765 43212',
      email: 'mumbai@gadgethospital.com',
      services: ['Screen Repair', 'Data Recovery', 'Battery Replacement'],
      workingHours: '9 AM - 9 PM',
      rating: 4.8,
      verified: true
    },
    {
      _id: '4',
      name: 'Mobile Masters',
      address: '321 Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700016',
      phone: '+91 98765 43213',
      email: 'info@mobilemasters.in',
      services: ['Screen Replacement', 'Speaker Repair', 'Charging Issues'],
      workingHours: '10 AM - 6 PM',
      rating: 4.0,
      verified: false
    }
  ];

  const filteredCenters = centers.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(search.toLowerCase()) ||
      center.address.toLowerCase().includes(search.toLowerCase());
    const matchesCity = !cityFilter || center.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const cities = [...new Set(centers.map(c => c.city))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service centers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Service Centers</h1>
          <p className="text-gray-600 mt-1">Find authorized service centers near you</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Found {filteredCenters.length} service center{filteredCenters.length !== 1 ? 's' : ''}
        </div>

        {/* Centers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCenters.map(center => (
            <div
              key={center._id}
              className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCenter(center)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{center.name}</h3>
                  {center.verified && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <span className="text-sm font-medium">{center.rating}</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-3">{center.address}</p>
              <p className="text-gray-500 text-xs mb-3">{center.city}, {center.state} - {center.pincode}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {center.services.slice(0, 3).map((service, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {service}
                  </span>
                ))}
                {center.services.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{center.services.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">🕐 {center.workingHours}</span>
                <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Book Slot →
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCenters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No service centers found matching your criteria.</p>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedCenter.name}</h2>
              <button
                onClick={() => setSelectedCenter(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-600">{selectedCenter.address}</p>
              <p className="text-gray-500 text-sm">{selectedCenter.city}, {selectedCenter.state} - {selectedCenter.pincode}</p>
              <p className="text-gray-600">📞 {selectedCenter.phone}</p>
              <p className="text-gray-600">📧 {selectedCenter.email}</p>
              <p className="text-gray-600">🕐 {selectedCenter.workingHours}</p>
            </div>

            <h3 className="font-semibold mb-2">Services Offered</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCenter.services.map((service, i) => (
                <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full">
                  {service}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCenter(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Booking feature - connects to verify-qr-service /api/book-service');
                  setSelectedCenter(null);
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
