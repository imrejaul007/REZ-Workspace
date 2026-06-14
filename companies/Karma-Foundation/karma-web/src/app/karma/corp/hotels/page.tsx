'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Star,
  ChevronRight,
  Calendar,
  Users,
  Building2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  discount: number;
  amenities: string[];
  image: string;
}

const MOCK_HOTELS: Hotel[] = [
  {
    id: '1',
    name: 'The Grand Mumbai',
    location: 'MG Road, Mumbai',
    rating: 4.5,
    reviews: 2341,
    price: 4500,
    originalPrice: 5500,
    discount: 18,
    amenities: ['Free WiFi', 'Pool', 'Spa', 'Gym'],
    image: '',
  },
  {
    id: '2',
    name: 'ITC Gardenia Bangalore',
    location: 'MG Road, Bangalore',
    rating: 4.6,
    reviews: 1892,
    price: 6500,
    originalPrice: 7500,
    discount: 13,
    amenities: ['Free WiFi', 'Business Center', 'Restaurant'],
    image: '',
  },
  {
    id: '3',
    name: 'Hyatt Regency Delhi',
    location: 'Bhikaiji Cama Place, Delhi',
    rating: 4.4,
    reviews: 3124,
    price: 8000,
    originalPrice: 9500,
    discount: 16,
    amenities: ['Free WiFi', 'Pool', 'Spa', 'Concierge'],
    image: '',
  },
];

export default function CorpHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setHotels(MOCK_HOTELS);
      setLoading(false);
    }, 500);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/karma/corp" className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <ChevronRight className="w-5 h-5 rotate-180 transform text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Hotel</h1>
          <p className="text-sm text-muted-foreground">Corporate hotel bookings</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search hotels or cities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
        />
      </div>

      {/* Travel Benefits Banner */}
      <Card className="p-4 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white">Corporate Travel Benefits</div>
            <div className="text-sm text-white/80">
              Special rates with up to 20% discount
            </div>
          </div>
          <div className="text-white font-bold text-lg">₹10K</div>
        </div>
      </Card>

      {/* Hotels List */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          {filteredHotels.length} Properties Found
        </h2>

        <div className="space-y-4">
          {filteredHotels.map((hotel) => (
            <Card key={hotel.id} className="overflow-hidden">
              {/* Hotel Image Placeholder */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-gray-400" />
              </div>

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-500">{hotel.location}</span>
                    </div>
                  </div>
                  {hotel.discount > 0 && (
                    <div className="px-2 py-1 bg-[#22C55E20] rounded text-xs font-semibold text-[#22C55E]">
                      {hotel.discount}% OFF
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="text-sm font-semibold text-gray-900">{hotel.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">({hotel.reviews} reviews)</span>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>

                {/* Pricing & CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(hotel.originalPrice)}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[#3B82F6]">
                        {formatCurrency(hotel.price)}
                      </span>
                      <span className="text-sm text-gray-500">/night</span>
                    </div>
                  </div>
                  <Button className="bg-[#3B82F6] hover:bg-[#2563EB]">
                    Book Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {filteredHotels.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hotels found</h3>
          <p className="text-sm text-gray-500">
            Try searching for a different city or hotel
          </p>
        </div>
      )}

      {/* Help */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#8B5CF6]" />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Need help with booking?</div>
            <div className="text-sm text-gray-500">Contact your HR or use the travel desk</div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </Card>
    </div>
  );
}
