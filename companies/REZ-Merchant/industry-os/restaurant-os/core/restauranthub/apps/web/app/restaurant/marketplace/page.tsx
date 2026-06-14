'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Filter,
  ShoppingCart,
  Heart,
  Eye,
  Star,
  MapPin,
  Truck,
  Package,
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  Minus,
  ShoppingBag,
  Store,
  Building2,
  Calendar,
  ShoppingBasket
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency, cn } from '@/lib/utils';
import { VendorCard } from '@/components/marketplace/vendor-card';
import { RestaurantListingCard } from '@/components/marketplace/restaurant-listing-card';
import { MarketplaceFilters } from '@/components/marketplace/marketplace-filters';
import { SubscriptionCard } from '@/components/marketplace/subscription-card';
import { Vendor, Product, RestaurantListing, MarketplaceFilter } from '@/types/marketplace';
import ProductCard from '@/components/marketplace/product-card';

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

export default function RestaurantMarketplace() {
  const [activeTab, setActiveTab] = useState<'vendors' | 'products' | 'restaurants'>('vendors');
  const [filters, setFilters] = useState<MarketplaceFilter>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showFilters, setShowFilters] = useState(true);

  // Real data state — typed as any[] since API shape may differ from local Vendor interface
  const [apiVendors, setApiVendors] = useState<unknown[]>([]);
  const [apiCategories, setApiCategories] = useState<unknown[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<unknown>('/marketplace/suppliers'),
      apiFetch<unknown>('/marketplace/categories'),
    ])
      .then(([suppliersRes, categoriesRes]) => {
        const rawSuppliers: unknown[] = Array.isArray(suppliersRes)
          ? suppliersRes
          : suppliersRes?.data ?? suppliersRes?.suppliers ?? [];
        const rawCategories: unknown[] = Array.isArray(categoriesRes)
          ? categoriesRes
          : categoriesRes?.data ?? categoriesRes?.categories ?? [];

        // Normalize suppliers into the shape expected by VendorCard
        const normalized: unknown[] = rawSuppliers.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? '',
          category: Array.isArray(s.category) ? s.category[0] : (s.category ?? 'general'),
          location: s.city ?? s.location?.city ?? '',
          rating: typeof s.rating === 'object' ? (s.rating?.overall ?? 0) : (s.rating ?? 0),
          reviewCount: s.reviewCount ?? s.rating?.reviewCount ?? 0,
          services: s.services ?? s.tags ?? [],
          deliveryTime: s.stats?.responseTime ?? s.deliveryTime ?? '2-5 business days',
          isVerified: s.isVerified ?? false,
          subscriptionPlans: s.subscriptionPlans ?? [],
        }));

        setApiVendors(normalized);
        setApiCategories(rawCategories);
      })
      .catch((err) => {
        console.error('Failed to load marketplace data:', err);
      })
      .finally(() => setDataLoading(false));
  }, []);

  // Derive transformed products from fetched vendor data (no products endpoint yet)
  const transformedProducts: unknown[] = [];

  const handleFilterChange = (newFilters: MarketplaceFilter) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleVendorDetails = (vendor: Vendor) => {
    // Enhanced vendor details with deal closure path
    const details = `🏪 VENDOR PROFILE: ${vendor.name}\n\n` +
      `⭐ Rating: ${vendor.rating}/5 (${vendor.reviewCount || 150}+ reviews)\n` +
      `📍 Location: ${vendor.location}\n` +
      `🛍️ Services: ${vendor.services.join(', ')}\n` +
      `💰 Starting from: $50/order\n` +
      `🚚 Delivery: ${vendor.deliveryTime || '2-5 business days'}\n\n` +
      `📞 Ready to connect?\n` +
      `✅ Get Instant Quote\n` +
      `✅ Schedule Consultation\n` +
      `✅ View Portfolio & References\n\n` +
      `Click 'Contact Vendor' to start your partnership!`;
    
    if (confirm(details + '\n\nWould you like to contact this vendor now?')) {
      handleVendorContact(vendor);
    }
  };

  const handleVendorContact = (vendor: Vendor) => {
    // Enhanced contact flow for deal closure
    const contactFlow = `🤝 CONNECT WITH ${vendor.name.toUpperCase()}\n\n` +
      `Choose your preferred contact method:\n\n` +
      `📧 Email: contact@${vendor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com\n` +
      `📱 WhatsApp: +1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}\n` +
      `📞 Direct Line: Available 9AM-6PM EST\n` +
      `💬 Live Chat: Instant response\n\n` +
      `🎯 NEXT STEPS:\n` +
      `1. Share your requirements\n` +
      `2. Get personalized quote (within 2 hours)\n` +
      `3. Schedule demo/consultation\n` +
      `4. Negotiate terms & pricing\n` +
      `5. Finalize partnership agreement\n\n` +
      `💡 TIP: Mention 'RestoPapa' for 10% first-order discount!`;
    
    alert(contactFlow);
  };

  const handleProductDetails = (product) => {
    // Enhanced product details with purchase path
    const details = `🛍️ PRODUCT DETAILS: ${product.name}\n\n` +
      `💰 Price: $${product.price} per ${product.unit}\n` +
      `${product.originalPrice ? `🏷️ Original: $${product.originalPrice} (You save $${(product.originalPrice - product.price).toFixed(2)})\n` : ''}` +
      `📦 Min Order: ${product.minOrderQuantity} ${product.unit}\n` +
      `📊 In Stock: ${product.inStock ? '✅ Available' : '❌ Out of Stock'}\n` +
      `⭐ Rating: ${product.ratings.average}/5 (${product.ratings.count} reviews)\n` +
      `🏪 Vendor: ${product.vendor.name} ${product.vendor.verified ? '✅ Verified' : ''}\n` +
      `🚚 Delivery: ${product.delivery.estimatedDays}${product.delivery.freeShipping ? ' (FREE SHIPPING!)' : ''}\n` +
      `${product.discount ? `🎉 LIMITED TIME: ${product.discount.percentage}% OFF!\n` : ''}\n` +
      `📝 Description: ${product.description}\n\n` +
      `🛒 PURCHASE OPTIONS:\n` +
      `• Add to Cart (Instant)\n` +
      `• Buy Now (Express Checkout)\n` +
      `• Request Bulk Quote\n` +
      `• Subscribe & Save 15%`;
    
    if (confirm(details + '\n\nReady to purchase? Click OK to add to cart!')) {
      handleAddToCart(product, product.minOrderQuantity);
    }
  };

  const handleAddToCart = (product, quantity: number) => {
    setCart(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + quantity
    }));
    
    const newTotal = (cart[product.id] || 0) + quantity;
    const itemTotal = (product.price * quantity).toFixed(2);
    const cartValue = Object.entries({...cart, [product.id]: newTotal})
      .reduce((sum, [id, qty]) => {
        const prod = transformedProducts.find(p => p.id === id);
        return sum + (prod ? Number(prod.price) * Number(qty) : 0);
      }, 0).toFixed(2);
    
    // Enhanced cart confirmation with next steps
    const success = `🛒 ADDED TO CART!\n\n` +
      `✅ ${product.name}\n` +
      `📦 Quantity: ${quantity} ${product.unit}\n` +
      `💰 Item Total: $${itemTotal}\n` +
      `📊 Cart Total: $${cartValue}\n` +
      `🚚 Est. Delivery: ${product.delivery.estimatedDays}\n\n` +
      `🎯 NEXT STEPS:\n` +
      `• Continue Shopping\n` +
      `• View Cart & Checkout\n` +
      `• Apply Coupon Code\n` +
      `• Setup Recurring Order\n\n` +
      `💡 Free shipping on orders over $200!`;
    
    if (confirm(success + '\n\nView cart now?')) {
      // Trigger cart view
      const cartEvent = new CustomEvent('viewCart');
      window.dispatchEvent(cartEvent);
    }
  };

  const handleRestaurantDetails = (listing: RestaurantListing) => {
    // Enhanced property details with leasing path
    const details = `🏢 PROPERTY DETAILS: ${listing.title}\n\n` +
      `📍 Prime Location: ${listing.location}\n` +
      `📏 Size: 2500 sq ft\n` +
      `💰 ${listing.type === 'lease' ? 'Monthly Rent' : 'Sale Price'}: $${listing.price.toLocaleString()}\n` +
      `🏠 Property Type: ${listing.type}\n` +
      `🅿️ Parking: Available\n` +
      `🍽️ Kitchen: Fully Equipped\n` +
      `📅 Available: ${listing.availability || 'Immediate'}\n\n` +
      `✨ HIGHLIGHTS:\n` +
      `• High foot traffic area\n` +
      `• Restaurant-ready infrastructure\n` +
      `• Flexible lease terms\n` +
      `• Competitive market rates\n\n` +
      `🎯 NEXT STEPS:\n` +
      `1. Schedule property tour\n` +
      `2. Review lease agreement\n` +
      `3. Submit application\n` +
      `4. Get pre-approved\n` +
      `5. Secure your location!`;
    
    if (confirm(details + '\n\nSchedule a tour today?')) {
      handleRestaurantContact(listing);
    }
  };

  const handleRestaurantContact = (listing: RestaurantListing) => {
    // Enhanced property contact flow
    const contactInfo = `🏢 SCHEDULE PROPERTY TOUR\n\n` +
      `Property: ${listing.title}\n` +
      `Location: ${listing.location}\n\n` +
      `📅 AVAILABLE TOUR TIMES:\n` +
      `• Today 2:00 PM - 4:00 PM\n` +
      `• Tomorrow 10:00 AM - 12:00 PM\n` +
      `• Weekend 9:00 AM - 5:00 PM\n\n` +
      `📞 Property Agent: Sarah Johnson\n` +
      `📱 Direct: (555) 123-4567\n` +
      `📧 Email: sarah@restaurantproperties.com\n\n` +
      `🚀 FAST-TRACK PROCESS:\n` +
      `1. Instant tour booking\n` +
      `2. Pre-qualification (5 mins)\n` +
      `3. Same-day application\n` +
      `4. 48-hour approval\n\n` +
      `💡 Tip: Bring business plan for faster approval!`;
    
    alert(contactInfo + '\n\n📞 Calling now to schedule your tour...');
  };

  const handleSubscribe = (planId: string) => {
    const plan = allSubscriptionPlans.find(p => p.id === planId);
    if (!plan) return;
    
    // Enhanced subscription flow
    const subscriptionFlow = `🎯 SUBSCRIPTION SIGNUP: ${plan.name}\n\n` +
      `💰 Monthly Cost: $${plan.price}\n` +
      `⏱️ Billing Cycle: ${plan.billingCycle}\n` +
      `📦 What's Included: ${plan.features.slice(0, 3).join(', ')}\n` +
      `${plan.features.length > 3 ? `+ ${plan.features.length - 3} more features` : ''}\n\n` +
      `🎁 SPECIAL OFFER:\n` +
      `• 14-day FREE trial\n` +
      `• First month 50% off\n` +
      `• No setup fees\n` +
      `• Cancel anytime\n\n` +
      `📊 SETUP PROCESS:\n` +
      `1. Start free trial (no card required)\n` +
      `2. Configure your preferences\n` +
      `3. First delivery scheduled\n` +
      `4. Enjoy automated supplies!\n\n` +
      `💡 Join 500+ restaurants saving 20% monthly!`;
    
    if (confirm(subscriptionFlow + '\n\nStart your FREE trial now?')) {
      alert(`🎉 Welcome to ${plan.name}!\n\nYour 14-day free trial is starting...\n\n📧 Check your email for setup instructions\n🚚 First delivery will be scheduled within 24 hours\n💬 Our team will contact you for onboarding\n\nThank you for choosing RestoPapa!`);
    }
  };

  const cartItemsCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  const applyFilters = (items: unknown[], type: 'vendors' | 'products' | 'restaurants') => {
    return items.filter(item => {
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(searchLower);
        const matchesDescription = item.description?.toLowerCase().includes(searchLower);
        const matchesTitle = item.title?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription && !matchesTitle) return false;
      }

      if (filters.category && type !== 'restaurants') {
        if (item.category !== filters.category) return false;
      }

      if (filters.serviceType && type === 'vendors') {
        if (!item.services?.includes(filters.serviceType)) return false;
      }

      if (filters.rating && type !== 'restaurants') {
        if (item.rating < filters.rating) return false;
      }

      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        const itemLocation = item.location?.toLowerCase() || '';
        if (!itemLocation.includes(locationLower)) return false;
      }

      if (filters.priceRange && type === 'products') {
        if (item.price < filters.priceRange.min || item.price > filters.priceRange.max) return false;
      }

      return true;
    });
  };

  const filteredVendors: unknown[] = applyFilters(apiVendors, 'vendors');
  const filteredProducts: unknown[] = applyFilters(transformedProducts, 'products');
  const filteredRestaurants: unknown[] = [];

  const allSubscriptionPlans = apiVendors.flatMap((vendor) =>
    vendor.subscriptionPlans?.map((plan) => ({ ...plan, vendorName: vendor.name })) || []
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-primary/10 via-blue-50 to-purple-50 border border-border rounded-2xl p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-3">
                RestoPapa Marketplace
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Your one-stop destination for restaurant supplies, equipment, real estate, and business services. 
                Connect with trusted vendors and grow your restaurant business.
              </p>
              <div className="flex items-center justify-center sm:justify-start space-x-6 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>1000+ Verified Vendors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>50,000+ Products</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-6 sm:mt-0">
              <Button 
                size="lg" 
                className="relative bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg" 
                onClick={() => {
                  if (cartItemsCount > 0) {
                    const cartItems = Object.entries(cart)
                      .map(([id, qty]) => {
                        const product = transformedProducts.find(p => p.id === id);
                        return product ? `${product.name}: ${qty}` : `${id}: ${qty}`;
                      })
                      .join('\n');
                    alert(`Shopping Cart (${cartItemsCount} items):\n\n${cartItems}\n\nProceed to checkout?`);
                  } else {
                    alert('Your cart is empty!\n\nBrowse our products to add items to your cart.');
                  }
                }}
              >
                <ShoppingBasket className="h-5 w-5 mr-3" />
                Cart ({cartItemsCount})
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </Button>
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white">
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <MarketplaceFilters
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                  onClearFilters={clearFilters}
                  activeTab={activeTab}
                />
              </div>
            </div>
          )}

          {/* Enhanced Main Content Area */}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as unknown)} className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 p-6 bg-white rounded-xl border border-border shadow-sm">
                <TabsList className="grid w-full max-w-2xl grid-cols-2 sm:grid-cols-4 h-14 p-1 bg-muted/50">
                  <TabsTrigger value="vendors" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <Store className="h-4 w-4" />
                    <span className="hidden sm:inline">Vendors</span>
                  </TabsTrigger>
                  <TabsTrigger value="products" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Products</span>
                  </TabsTrigger>
                  <TabsTrigger value="restaurants" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Real Estate</span>
                  </TabsTrigger>
                  <TabsTrigger value="subscriptions" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Subscriptions</span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  <Button
                    variant="outline"
                    
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                  <Button variant="ghost"  className="text-muted-foreground hover:text-foreground">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </div>
              </div>

              <TabsContent value="vendors" className="mt-6">
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Trusted Vendors & Services</h2>
                        <p className="text-muted-foreground">Connect with verified suppliers and service providers</p>
                      </div>
                      <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {dataLoading ? 'Loading...' : `${filteredVendors.length} vendors found`}
                        </span>
                        <Button variant="outline"  className="text-primary border-primary hover:bg-primary hover:text-white">
                          View All Vendors
                        </Button>
                        <Button variant="outline" >
                          Compare Selected
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredVendors.map((vendor) => (
                      <VendorCard
                        key={vendor.id}
                        vendor={vendor}
                        onViewDetails={handleVendorDetails}
                        onContact={handleVendorContact}
                      />
                    ))}
                  </div>
                  {filteredVendors.length === 0 && (
                    <div className="text-center py-12">
                      <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No vendors found</h3>
                      <p className="text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="products" className="mt-6">
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Premium Restaurant Products</h2>
                        <p className="text-muted-foreground">Quality ingredients, equipment, and supplies for your restaurant</p>
                      </div>
                      <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {filteredProducts.length} products available
                        </span>
                        <Button variant="outline"  className="text-primary border-primary hover:bg-primary hover:text-white">
                          Bulk Order
                        </Button>
                        <Button variant="outline" >
                          Price Compare
                        </Button>
                        <Button  className="bg-green-600 hover:bg-green-700 text-white">
                          Request Quote
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onViewDetails={handleProductDetails}
                        variant="default"
                      />
                    ))}
                  </div>
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No products found</h3>
                      <p className="text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="restaurants" className="mt-6">
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Prime Restaurant Real Estate</h2>
                        <p className="text-muted-foreground">Find the perfect location for your restaurant business</p>
                      </div>
                      <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          {filteredRestaurants.length} properties available
                        </span>
                        <Button variant="outline"  className="text-primary border-primary hover:bg-primary hover:text-white">
                          Schedule Tour
                        </Button>
                        <Button variant="outline" >
                          Save Search
                        </Button>
                        <Button  className="bg-orange-600 hover:bg-orange-700 text-white">
                          Get Pre-Approved
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredRestaurants.map((listing) => (
                      <RestaurantListingCard
                        key={listing.id}
                        listing={listing}
                        onViewDetails={handleRestaurantDetails}
                        onContact={handleRestaurantContact}
                      />
                    ))}
                  </div>
                  {filteredRestaurants.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No restaurant listings found</h3>
                      <p className="text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="subscriptions" className="mt-6">
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Business Subscription Plans</h2>
                        <p className="text-muted-foreground">Recurring supply plans and services to streamline your operations</p>
                      </div>
                      <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                          {allSubscriptionPlans.length} plans available
                        </span>
                        <Button variant="outline"  className="text-primary border-primary hover:bg-primary hover:text-white">
                          Compare Plans
                        </Button>
                        <Button variant="outline" >
                          Custom Plan
                        </Button>
                        <Button  className="bg-indigo-600 hover:bg-indigo-700 text-white">
                          Start Free Trial
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {allSubscriptionPlans.map((plan, index) => (
                      <SubscriptionCard
                        key={plan.id}
                        plan={plan}
                        vendorName={plan.vendorName}
                        onSubscribe={handleSubscribe}
                        isPopular={index === 0}
                      />
                    ))}
                  </div>
                  {allSubscriptionPlans.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No subscription plans available</h3>
                      <p className="text-muted-foreground">Check back later for new plans</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}