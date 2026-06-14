'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gift,
  Package,
  Tag,
  Star,
  ChevronRight,
  Truck,
  Award,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GiftCategory {
  id: string;
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  color: string;
  items: number;
}

interface FeaturedGift {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
}

const CATEGORIES: GiftCategory[] = [
  { id: '1', name: 'Festival Gifts', description: 'Diwali, Holi, Eid & more', icon: Gift, color: '#EC4899', items: 45 },
  { id: '2', name: 'Food & Snacks', description: 'Chocolates, cookies & more', icon: Package, color: '#F59E0B', items: 32 },
  { id: '3', name: 'Electronics', description: 'Gadgets & accessories', icon: Tag, color: '#3B82F6', items: 18 },
  { id: '4', name: 'Vouchers', description: 'Gift cards & vouchers', icon: Star, color: '#8B5CF6', items: 25 },
];

const FEATURED_GIFTS: FeaturedGift[] = [
  { id: '1', name: 'Premium Gift Box', description: 'Assorted chocolates & cookies', price: 1200, originalPrice: 1500, image: '', rating: 4.5, reviews: 234, category: 'Festival' },
  { id: '2', name: 'Bluetooth Speaker', description: 'Portable wireless speaker', price: 1799, originalPrice: 2500, image: '', rating: 4.3, reviews: 156, category: 'Electronics' },
  { id: '3', name: 'Food Court Voucher', description: '₹500 value voucher', price: 475, originalPrice: 500, image: '', rating: 4.8, reviews: 892, category: 'Vouchers' },
  { id: '4', name: 'Branded T-Shirt', description: 'Custom company logo', price: 800, originalPrice: 1200, image: '', rating: 4.2, reviews: 89, category: 'Merchandise' },
];

export default function CorpGiftsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Gift Store</h1>
          <p className="text-sm text-muted-foreground">Redeem your gift budget</p>
        </div>
      </div>

      {/* Gift Budget Banner */}
      <Card className="p-4 bg-gradient-to-r from-[#EC4899] to-[#F472B6]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white/80 text-sm">Your Gift Budget</div>
            <div className="text-white text-2xl font-bold">₹2,000</div>
          </div>
          <Button className="bg-white text-[#EC4899] hover:bg-white/90">
            Browse Gifts
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <Users className="w-5 h-5 text-[#8B5CF6] mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">5</div>
          <div className="text-xs text-gray-500">Received</div>
        </Card>
        <Card className="p-3 text-center">
          <Truck className="w-5 h-5 text-[#3B82F6] mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">3</div>
          <div className="text-xs text-gray-500">In Transit</div>
        </Card>
        <Card className="p-3 text-center">
          <Award className="w-5 h-5 text-[#F59E0B] mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">2</div>
          <div className="text-xs text-gray-500">Redeemed</div>
        </Card>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.id} className="p-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  <Icon className="w-5 h-5" style={{ color: category.color }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{category.description}</p>
                <div className="text-xs font-medium" style={{ color: category.color }}>
                  {category.items} items
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Featured Gifts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Featured Gifts</h2>
          <Button variant="ghost" size="sm" className="text-[#8B5CF6]">
            View All
          </Button>
        </div>

        <div className="space-y-4">
          {FEATURED_GIFTS.map((gift) => (
            <Card key={gift.id} className="p-4">
              <div className="flex gap-4">
                {/* Image Placeholder */}
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-8 h-8 text-gray-400" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6]">
                        {gift.category}
                      </span>
                      <h3 className="font-semibold text-gray-900 mt-1">{gift.name}</h3>
                      <p className="text-sm text-gray-500">{gift.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="text-sm font-medium text-gray-900">{gift.rating}</span>
                      <span className="text-sm text-gray-500">({gift.reviews})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(gift.originalPrice)}
                      </span>
                      <div className="text-lg font-bold text-[#EC4899]">
                        {formatCurrency(gift.price)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Gifts */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Recently Received</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Diwali Gift Box</div>
              <div className="text-sm text-gray-500">From: Your Company</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">Delivered</div>
              <div className="text-xs text-gray-500">Oct 20, 2024</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Food Court Voucher</div>
              <div className="text-sm text-gray-500">From: HR Team</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-[#3B82F6]">In Transit</div>
              <div className="text-xs text-gray-500">Arriving Tomorrow</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
