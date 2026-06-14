'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Clock, Shield, Filter, Grid, List, Search, X, Users, Award, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Vendor {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  rating: number;
  reviewCount: number;
  location: {
    address: string;
    city: string;
    distance: number;
  };
  deliveryInfo: {
    fee: number;
    minOrder: number;
    estimatedTime: string;
  };
  images: {
    logo: string;
    cover: string;
  };
  isVerified: boolean;
  isOpen: boolean;
  stats: {
    totalOrders: number;
    responseTime: string;
    acceptanceRate: number;
    joinedDate: string;
  };
  features: string[];
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  popularDishes: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function apiFetch<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const cuisineTypes = ['All', 'Italian', 'Japanese', 'Indian', 'American', 'Chinese', 'Healthy', 'Mexican', 'Thai'];
const priceRanges = ['All', '$', '$$', '$$$', '$$$$'];

interface ApiSupplier {
  id: string;
  name: string;
  description?: string;
  category?: string | string[];
  city?: string;
  isVerified?: boolean;
  rating?: number | { overall?: number };
  reviewCount?: number;
  [key: string];
}

function normalizeVendor(s: ApiSupplier): Vendor {
  const ratingObj = typeof s.rating === 'object' ? (s.rating as { overall?: number; reviewCount?: number }) : null;
  const rating = ratingObj ? (ratingObj.overall ?? 0) : ((s.rating as number) ?? 0);
  const reviewCount = ratingObj ? (ratingObj.reviewCount ?? 0) : (s.reviewCount ?? 0);
  const cuisine = Array.isArray(s.category) ? s.category : s.category ? [s.category] : [];
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? '',
    cuisine,
    rating,
    reviewCount,
    location: {
      address: s.address ?? '',
      city: s.city ?? s.location?.city ?? '',
      distance: s.distance ?? 0,
    },
    deliveryInfo: {
      fee: s.deliveryFee ?? 0,
      minOrder: s.minOrder ?? 0,
      estimatedTime: s.estimatedTime ?? 'N/A',
    },
    images: {
      logo: s.logo ?? s.images?.logo ?? '🏪',
      cover: s.cover ?? s.images?.cover ?? '🏬',
    },
    isVerified: s.isVerified ?? false,
    isOpen: s.isOpen ?? true,
    stats: {
      totalOrders: s.stats?.totalOrders ?? s.totalOrders ?? 0,
      responseTime: s.stats?.responseTime ?? 'N/A',
      acceptanceRate: s.stats?.acceptanceRate ?? 0,
      joinedDate: s.stats?.joinedDate ?? s.createdAt ?? '',
    },
    features: s.features ?? s.tags ?? [],
    priceRange: (s.priceRange ?? '$$') as Vendor['priceRange'],
    popularDishes: s.popularDishes ?? [],
  };
}

export default function VendorsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState([10]);
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    apiFetch<{ data?: ApiSupplier[]; suppliers?: ApiSupplier[] } | ApiSupplier[]>('/marketplace/suppliers')
      .then((res) => {
        const raw: ApiSupplier[] = Array.isArray(res)
          ? res
          : (res as unknown).data ?? (res as unknown).suppliers ?? [];
        const normalized = raw.map(normalizeVendor);
        setVendors(normalized);
        setFilteredVendors(normalized);
      })
      .catch((err) => {
        console.error('Failed to load vendors:', err);
        toast({ title: 'Error', description: 'Failed to load vendors', variant: 'error' });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = [...vendors];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.location.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Cuisine filter
    if (selectedCuisines.length > 0 && !selectedCuisines.includes('All')) {
      filtered = filtered.filter(vendor =>
        vendor.cuisine.some(cuisine => selectedCuisines.includes(cuisine))
      );
    }

    // Price range filter
    if (selectedPriceRanges.length > 0 && !selectedPriceRanges.includes('All')) {
      filtered = filtered.filter(vendor =>
        selectedPriceRanges.includes(vendor.priceRange)
      );
    }

    // Distance filter
    const maxDist = maxDistance[0] ?? 10;
    filtered = filtered.filter(vendor => vendor.location.distance <= maxDist);

    // Open only filter
    if (showOnlyOpen) {
      filtered = filtered.filter(vendor => vendor.isOpen);
    }

    // Verified only filter
    if (showOnlyVerified) {
      filtered = filtered.filter(vendor => vendor.isVerified);
    }

    // Sorting
    switch (sortBy) {
      case 'distance':
        filtered.sort((a, b) => a.location.distance - b.location.distance);
        break;
      case 'delivery-fee':
        filtered.sort((a, b) => a.deliveryInfo.fee - b.deliveryInfo.fee);
        break;
      case 'min-order':
        filtered.sort((a, b) => a.deliveryInfo.minOrder - b.deliveryInfo.minOrder);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'orders':
        filtered.sort((a, b) => b.stats.totalOrders - a.stats.totalOrders);
        break;
      case 'rating':
      default:
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    setFilteredVendors(filtered);
  }, [vendors, searchQuery, selectedCuisines, selectedPriceRanges, maxDistance, showOnlyOpen, showOnlyVerified, sortBy]);

  const handleCuisineToggle = (cuisine: string) => {
    if (cuisine === 'All') {
      setSelectedCuisines(['All']);
    } else {
      setSelectedCuisines(prev => {
        const filtered = prev.filter(c => c !== 'All');
        return prev.includes(cuisine)
          ? filtered.filter(c => c !== cuisine)
          : [...filtered, cuisine];
      });
    }
  };

  const handlePriceRangeToggle = (priceRange: string) => {
    if (priceRange === 'All') {
      setSelectedPriceRanges(['All']);
    } else {
      setSelectedPriceRanges(prev => {
        const filtered = prev.filter(p => p !== 'All');
        return prev.includes(priceRange)
          ? filtered.filter(p => p !== priceRange)
          : [...filtered, priceRange];
      });
    }
  };

  const handleVendorClick = (vendorId: string) => {
    router.push(`/marketplace/vendor/${vendorId}`);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCuisines([]);
    setSelectedPriceRanges([]);
    setMaxDistance([10]);
    setShowOnlyOpen(false);
    setShowOnlyVerified(false);
  };

  const activeFiltersCount = selectedCuisines.filter(c => c !== 'All').length + 
                           selectedPriceRanges.filter(p => p !== 'All').length +
                           (showOnlyOpen ? 1 : 0) + (showOnlyVerified ? 1 : 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
          <div className="text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground" onClick={() => router.push('/marketplace')}>
              Marketplace
            </span>
            <span className="mx-2">›</span>
            <span>All Vendors</span>
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
            <Users className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">All Vendors</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Discover amazing restaurants and food vendors in your area
            </p>
            <div className="flex items-center justify-center space-x-4 mt-4">
              <Badge variant="secondary">
                {loading ? 'Loading...' : `${filteredVendors.length} vendors found`}
              </Badge>
              <Badge variant="outline">
                {loading ? '...' : `${vendors.filter(v => v.isOpen).length} currently open`}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search vendors, cuisine, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="distance">Nearest First</SelectItem>
                <SelectItem value="delivery-fee">Lowest Delivery Fee</SelectItem>
                <SelectItem value="min-order">Lowest Min Order</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="orders">Most Orders</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ 
              opacity: showFilters ? 1 : 0,
              x: showFilters ? 0 : -20,
              width: showFilters ? '320px' : '0px'
            }}
            className={`${showFilters ? 'block' : 'hidden lg:block'} space-y-6 overflow-hidden`}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <Button variant="ghost"  onClick={clearAllFilters}>
                  Clear All
                </Button>
              </div>
              
              {/* Quick Filters */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="open-now" 
                    checked={showOnlyOpen}
                    onChange={(e) => setShowOnlyOpen((e.target as HTMLInputElement).checked)}
                  />
                  <label htmlFor="open-now" className="text-sm">Open now</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="verified" 
                    checked={showOnlyVerified}
                    onChange={(e) => setShowOnlyVerified((e.target as HTMLInputElement).checked)}
                  />
                  <label htmlFor="verified" className="text-sm">Verified vendors only</label>
                </div>
              </div>

              {/* Distance */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium">Maximum Distance</h4>
                <div className="px-2">
                  <Slider
                    value={maxDistance}
                    onValueChange={setMaxDistance}
                    max={20}
                    min={1}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>1 km</span>
                    <span>{maxDistance[0]} km</span>
                  </div>
                </div>
              </div>

              {/* Cuisine Types */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium">Cuisine Types</h4>
                <div className="space-y-2">
                  {cuisineTypes.map((cuisine) => (
                    <div key={cuisine} className="flex items-center space-x-2">
                      <Checkbox
                        id={cuisine}
                        checked={selectedCuisines.includes(cuisine)}
                        onCheckedChange={() => handleCuisineToggle(cuisine)}
                      />
                      <label htmlFor={cuisine} className="text-sm">{cuisine}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <h4 className="font-medium">Price Range</h4>
                <div className="space-y-2">
                  {priceRanges.map((priceRange) => (
                    <div key={priceRange} className="flex items-center space-x-2">
                      <Checkbox
                        id={priceRange}
                        checked={selectedPriceRanges.includes(priceRange)}
                        onCheckedChange={() => handlePriceRangeToggle(priceRange)}
                      />
                      <label htmlFor={priceRange} className="text-sm">
                        {priceRange === 'All' ? 'All Prices' : priceRange}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Vendors List */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg border bg-muted h-64" />
                ))}
              </div>
            ) : filteredVendors.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredVendors.map((vendor, index) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="cursor-pointer"
                    onClick={() => handleVendorClick(vendor.id)}
                  >
                    {viewMode === 'grid' ? (
                      <Card className={`group hover:shadow-lg transition-all duration-200 ${
                        !vendor.isOpen ? 'opacity-60' : ''
                      }`}>
                        <CardContent className="p-0">
                          {/* Cover Image */}
                          <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500 rounded-t-lg flex items-center justify-center text-4xl text-white relative">
                            {vendor.images.cover}
                            {!vendor.isOpen && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-lg flex items-center justify-center">
                                <Badge variant="destructive">Closed</Badge>
                              </div>
                            )}
                            {vendor.isVerified && (
                              <div className="absolute top-2 right-2">
                                <Shield className="h-5 w-5 text-blue-400" />
                              </div>
                            )}
                          </div>

                          <div className="p-4 space-y-3">
                            {/* Vendor Logo & Basic Info */}
                            <div className="flex items-start space-x-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={`/vendor-${vendor.id}.jpg`} />
                                <AvatarFallback className="text-2xl">{vendor.images.logo}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                                  {vendor.name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {vendor.description}
                                </p>
                              </div>
                            </div>

                            {/* Rating & Reviews */}
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{vendor.rating}</span>
                                <span className="text-sm text-muted-foreground">({vendor.reviewCount})</span>
                              </div>
                              <span className="text-sm font-medium">{vendor.priceRange}</span>
                            </div>

                            {/* Cuisine Tags */}
                            <div className="flex flex-wrap gap-1">
                              {vendor.cuisine.slice(0, 3).map(cuisine => (
                                <Badge key={cuisine} variant="outline" className="text-xs">
                                  {cuisine}
                                </Badge>
                              ))}
                            </div>

                            {/* Location & Delivery */}
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{vendor.location.distance} km away</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{vendor.deliveryInfo.estimatedTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">${vendor.deliveryInfo.fee} delivery fee</span>
                              </div>
                            </div>

                            {/* Popular Dishes */}
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Popular:</p>
                              <p className="text-sm">{vendor.popularDishes.slice(0, 2).join(', ')}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className={`group hover:shadow-lg transition-all duration-200 ${
                        !vendor.isOpen ? 'opacity-60' : ''
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex space-x-6">
                            <div className="flex items-center space-x-4">
                              <Avatar className="w-20 h-20">
                                <AvatarImage src={`/vendor-${vendor.id}.jpg`} />
                                <AvatarFallback className="text-3xl">{vendor.images.logo}</AvatarFallback>
                              </Avatar>
                            </div>

                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                                      {vendor.name}
                                    </h3>
                                    {vendor.isVerified && (
                                      <Shield className="h-5 w-5 text-blue-500" />
                                    )}
                                    <Badge variant={vendor.isOpen ? "default" : "destructive"}>
                                      {vendor.isOpen ? 'Open' : 'Closed'}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground">{vendor.description}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Award className="h-4 w-4 text-yellow-500" />
                                  <span className="font-semibold">{vendor.priceRange}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-semibold">{vendor.rating}</span>
                                  <span className="text-muted-foreground">({vendor.reviewCount} reviews)</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">{vendor.location.distance} km</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">{vendor.deliveryInfo.estimatedTime}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {vendor.cuisine.map(cuisine => (
                                  <Badge key={cuisine} variant="outline">{cuisine}</Badge>
                                ))}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    <span className="font-medium">Delivery:</span> ${vendor.deliveryInfo.fee} • Min order ${vendor.deliveryInfo.minOrder}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Popular: {vendor.popularDishes.slice(0, 3).join(', ')}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">{vendor.stats.totalOrders.toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">orders</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}