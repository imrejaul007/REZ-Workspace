'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ShoppingCart,
  Eye,
  Trash2,
  Share2,
  Download,
  Upload,
  Star,
  MapPin,
  Package,
  Store,
  Building2,
  Calendar,
  TrendingUp,
  Clock,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useWishlist, WishlistItem, convertToWishlistItem } from '@/lib/wishlist';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, toggleWishlist, isInWishlist, getStats, searchItems, getSortedItems, clearAll } = useWishlist();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | WishlistItem['type']>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const stats = getStats();
  
  // Filter items based on search and type
  const filteredItems = React.useMemo(() => {
    let items = searchQuery ? searchItems(searchQuery) : wishlist.items;
    if (selectedType !== 'all') {
      items = items.filter(item => item.type === selectedType);
    }
    return getSortedItems(sortBy, sortOrder).filter(item => 
      selectedType === 'all' ? true : item.type === selectedType
    ).filter(item => 
      searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );
  }, [wishlist.items, searchQuery, selectedType, sortBy, sortOrder]);

  const handleRemoveItem = (item: WishlistItem) => {
    removeFromWishlist(item.id, item.type);
    toast({
      title: "Removed from Wishlist",
      description: `${item.name} has been removed from your wishlist.`,
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      clearAll();
      toast({
        title: "Wishlist Cleared",
        description: "All items have been removed from your wishlist.",
      });
    }
  };

  const getTypeIcon = (type: WishlistItem['type']) => {
    switch (type) {
      case 'product': return Package;
      case 'vendor': return Store;
      case 'property': return Building2;
      default: return Heart;
    }
  };

  const getTypeColor = (type: WishlistItem['type']) => {
    switch (type) {
      case 'product': return 'text-blue-600 bg-blue-50';
      case 'vendor': return 'text-green-600 bg-green-50';
      case 'property': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Heart className="h-8 w-8 text-red-500 mr-3 fill-red-500" />
              My Wishlist
            </h1>
            <p className="mt-2 text-gray-600">
              Keep track of your favorite products, vendors, and properties
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline"  size="default">
              <Share2 className="h-4 w-4 mr-2" />
              Share Wishlist
            </Button>
            <Button variant="outline"  size="default">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {stats.totalItems > 0 && (
              <Button 
                variant="outline" 
                 
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
               size="default">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Products</CardTitle>
              <div className="text-2xl font-bold text-blue-600">{stats.productCount}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vendors</CardTitle>
              <div className="text-2xl font-bold text-green-600">{stats.vendorCount}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Properties</CardTitle>
              <div className="text-2xl font-bold text-purple-600">{stats.propertyCount}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalValue > 0 ? formatCurrency(stats.totalValue) : '—'}
              </div>
            </CardHeader>
          </Card>
        </div>

        {stats.totalItems === 0 ? (
          // Empty State
          <Card className="py-12">
            <CardContent className="text-center">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start exploring our marketplace and save your favorite products, vendors, and properties for later.
              </p>
              <div className="flex justify-center space-x-3">
                <Button onClick={() => window.location.href = '/marketplace'} size="default" variant="default">
                  <Package className="h-4 w-4 mr-2" />
                  Browse Products
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/marketplace?tab=vendors'} size="default">
                  <Store className="h-4 w-4 mr-2" />
                  Find Vendors
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search your wishlist..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* Type Filter */}
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as 'all' | WishlistItem['type'])}
                    >
                      <option value="all">All Items</option>
                      <option value="product">Products</option>
                      <option value="vendor">Vendors</option>
                      <option value="property">Properties</option>
                    </select>
                    
                    {/* Sort Options */}
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'price' | 'rating')}
                    >
                      <option value="date">Sort by Date</option>
                      <option value="name">Sort by Name</option>
                      <option value="price">Sort by Price</option>
                      <option value="rating">Sort by Rating</option>
                    </select>
                    
                    <Button
                      variant="outline"
                      
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      size="default"
                    >
                      {sortOrder === 'asc' ? (
                        <SortAsc className="h-4 w-4" />
                      ) : (
                        <SortDesc className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Wishlist Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredItems.map((item) => {
                  const TypeIcon = getTypeIcon(item.type);

                  return (
                    <motion.div
                      key={`${item.id}-${item.type}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow group">
                        <div className="relative">
                          {/* Item Image */}
                          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-t-lg">
                            <TypeIcon className="h-12 w-12 text-gray-400" />
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item)}
                            className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>

                          {/* Type Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className={cn('text-xs', getTypeColor(item.type))}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {item.type}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Item Name */}
                            <div>
                              <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                                {item.name}
                              </h3>
                              {item.vendor && (
                                <p className="text-sm text-muted-foreground">
                                  by {item.vendor.name}
                                </p>
                              )}
                            </div>

                            {/* Price */}
                            {item.price && (
                              <div className="text-lg font-bold text-foreground">
                                {formatCurrency(item.price)}
                                {item.metadata?.unit && (
                                  <span className="text-sm text-muted-foreground ml-1">
                                    per {item.metadata.unit}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center justify-between text-sm">
                              {item.metadata?.rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{item.metadata.rating}</span>
                                </div>
                              )}
                              
                              {item.metadata?.inStock === false && (
                                <Badge variant="outline" className="text-red-600 border-red-200">
                                  Out of Stock
                                </Badge>
                              )}
                              
                              {item.metadata?.discount && item.metadata.discount > 0 && (
                                <Badge className="bg-red-500 text-white">
                                  {item.metadata.discount}% OFF
                                </Badge>
                              )}
                            </div>

                            {/* Added Date */}
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2 pt-2">
                              <Button className="flex-1" size="default" variant="default">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {item.type === 'product' && (
                                <Button variant="outline" size="default">
                                  <ShoppingCart className="h-4 w-4 mr-1" />
                                  Add to Cart
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* No Results */}
            {filteredItems.length === 0 && (searchQuery || selectedType !== 'all') && (
              <Card className="py-12">
                <CardContent className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search or filter criteria.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('all');
                    }}
                    size="default"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}