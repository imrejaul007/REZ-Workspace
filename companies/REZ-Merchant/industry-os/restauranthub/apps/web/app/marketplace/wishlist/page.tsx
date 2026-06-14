'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, ShoppingCart, Star, Trash2, Share2, Filter, Grid, List, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface WishlistItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  vendor: {
    id: string;
    name: string;
    location: string;
  };
  category: string;
  isAvailable: boolean;
  addedDate: string;
  priceHistory: {
    date: string;
    price: number;
  }[];
  isPriceDropped: boolean;
  priceDropPercentage?: number;
}

const mockWishlistItems: WishlistItem[] = [
  {
    id: '1',
    name: 'Artisan Margherita Pizza',
    description: 'Wood-fired pizza with San Marzano tomatoes and fresh mozzarella',
    price: 16.99,
    originalPrice: 18.99,
    rating: 4.8,
    reviewCount: 342,
    image: '🍕',
    vendor: { id: 'bella-vista', name: 'Bella Vista Italian', location: 'Downtown' },
    category: 'Pizza',
    isAvailable: true,
    addedDate: '2024-01-10',
    priceHistory: [
      { date: '2024-01-10', price: 18.99 },
      { date: '2024-01-15', price: 16.99 }
    ],
    isPriceDropped: true,
    priceDropPercentage: 11
  },
  {
    id: '2',
    name: 'Premium Sushi Roll Set',
    description: 'Fresh sashimi-grade salmon and tuna sushi rolls',
    price: 28.50,
    originalPrice: 32.00,
    rating: 4.9,
    reviewCount: 189,
    image: '🍣',
    vendor: { id: 'tokyo-sushi', name: 'Tokyo Sushi Bar', location: 'Midtown' },
    category: 'Japanese',
    isAvailable: true,
    addedDate: '2024-01-08',
    priceHistory: [
      { date: '2024-01-08', price: 32.00 },
      { date: '2024-01-12', price: 28.50 }
    ],
    isPriceDropped: true,
    priceDropPercentage: 11
  },
  {
    id: '3',
    name: 'Truffle Mushroom Burger',
    description: 'Gourmet burger with truffle aioli and wild mushrooms',
    price: 24.99,
    rating: 4.7,
    reviewCount: 156,
    image: '🍔',
    vendor: { id: 'gourmet-burgers', name: 'Gourmet Burger Co.', location: 'Uptown' },
    category: 'Burgers',
    isAvailable: true,
    addedDate: '2024-01-05',
    priceHistory: [
      { date: '2024-01-05', price: 24.99 }
    ],
    isPriceDropped: false
  },
  {
    id: '4',
    name: 'Spicy Thai Curry',
    description: 'Authentic red curry with coconut milk and fresh herbs',
    price: 19.99,
    rating: 4.6,
    reviewCount: 234,
    image: '🍛',
    vendor: { id: 'thai-garden', name: 'Thai Garden', location: 'Chinatown' },
    category: 'Thai',
    isAvailable: false,
    addedDate: '2024-01-03',
    priceHistory: [
      { date: '2024-01-03', price: 19.99 }
    ],
    isPriceDropped: false
  },
  {
    id: '5',
    name: 'Chocolate Lava Cake',
    description: 'Decadent chocolate cake with molten center and vanilla ice cream',
    price: 12.99,
    originalPrice: 15.99,
    rating: 4.8,
    reviewCount: 98,
    image: '🍰',
    vendor: { id: 'sweet-treats', name: 'Sweet Treats Bakery', location: 'Mall District' },
    category: 'Desserts',
    isAvailable: true,
    addedDate: '2024-01-01',
    priceHistory: [
      { date: '2024-01-01', price: 15.99 },
      { date: '2024-01-14', price: 12.99 }
    ],
    isPriceDropped: true,
    priceDropPercentage: 19
  },
  {
    id: '6',
    name: 'Mediterranean Salad Bowl',
    description: 'Fresh mixed greens with feta, olives, and Mediterranean dressing',
    price: 14.99,
    rating: 4.4,
    reviewCount: 167,
    image: '🥗',
    vendor: { id: 'fresh-bowl', name: 'Fresh Bowl Co.', location: 'Health District' },
    category: 'Salads',
    isAvailable: true,
    addedDate: '2023-12-28',
    priceHistory: [
      { date: '2023-12-28', price: 14.99 }
    ],
    isPriceDropped: false
  }
];

export default function WishlistPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(mockWishlistItems);
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>(mockWishlistItems);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyPriceDrops, setShowOnlyPriceDrops] = useState(false);

  const categories = ['all', ...Array.from(new Set(wishlistItems.map(item => item.category)))];

  useEffect(() => {
    let filtered = [...wishlistItems];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Availability filter
    if (showOnlyAvailable) {
      filtered = filtered.filter(item => item.isAvailable);
    }

    // Price drop filter
    if (showOnlyPriceDrops) {
      filtered = filtered.filter(item => item.isPriceDropped);
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
        break;
    }

    setFilteredItems(filtered);
  }, [wishlistItems, searchQuery, filterCategory, showOnlyAvailable, showOnlyPriceDrops, sortBy]);

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleRemoveSelected = () => {
    setWishlistItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
    toast({
      title: "Items removed",
      description: `${selectedItems.length} items removed from your wishlist.`
    });
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.isAvailable) {
      toast({
        title: "Item unavailable",
        description: "This item is currently not available.",
        variant: "error"
      });
      return;
    }

    toast({
      title: "Added to cart!",
      description: `${item.name} has been added to your cart.`
    });
  };

  const handleRemoveItem = (itemId: string) => {
    const item = wishlistItems.find(i => i.id === itemId);
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Removed from wishlist",
      description: `${item?.name} has been removed from your wishlist.`
    });
  };

  const handleItemClick = (itemId: string) => {
    router.push(`/marketplace/product/${itemId}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Wishlist',
        text: 'Check out my food wishlist!',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Wishlist link has been copied to clipboard."
      });
    }
  };

  const priceDropItems = wishlistItems.filter(item => item.isPriceDropped);

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
            <span>My Wishlist</span>
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Wishlist</h1>
              <p className="text-muted-foreground">
                {filteredItems.length} of {wishlistItems.length} items
                {priceDropItems.length > 0 && (
                  <span className="ml-2">
                    • <span className="text-green-600 font-semibold">{priceDropItems.length} price drops!</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {selectedItems.length > 0 && (
              <Button variant="destructive" onClick={handleRemoveSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Selected ({selectedItems.length})
              </Button>
            )}
          </div>
        </motion.div>

        {/* Price Drop Alert */}
        {priceDropItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Great News! Prices Dropped!</h3>
                <p className="text-green-700">
                  {priceDropItems.length} item{priceDropItems.length > 1 ? 's' : ''} in your wishlist {priceDropItems.length > 1 ? 'have' : 'has'} lower prices now.
                </p>
              </div>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowOnlyPriceDrops(!showOnlyPriceDrops)}
              >
                {showOnlyPriceDrops ? 'Show All' : 'View Price Drops'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search wishlist items..."
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

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category} className="capitalize">
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
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

        {/* Quick Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="available"
              checked={showOnlyAvailable}
              onChange={(e) => setShowOnlyAvailable((e.target as HTMLInputElement).checked)}
            />
            <label htmlFor="available" className="text-sm">Available items only</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="price-drops"
              checked={showOnlyPriceDrops}
              onChange={(e) => setShowOnlyPriceDrops((e.target as HTMLInputElement).checked)}
            />
            <label htmlFor="price-drops" className="text-sm">Price drops only</label>
          </div>
        </div>

        {/* Select All */}
        {filteredItems.length > 0 && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select all ({filteredItems.length} items)
            </label>
          </div>
        )}

        {/* Wishlist Items */}
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {wishlistItems.length === 0 ? 'Your wishlist is empty' : 'No items match your filters'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {wishlistItems.length === 0
                ? 'Start adding your favorite items to your wishlist!'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            <Button onClick={() => {
              if (wishlistItems.length === 0) {
                router.push('/marketplace');
              } else {
                setSearchQuery('');
                setFilterCategory('all');
                setShowOnlyAvailable(false);
                setShowOnlyPriceDrops(false);
              }
            }}>
              {wishlistItems.length === 0 ? 'Browse Marketplace' : 'Clear Filters'}
            </Button>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {viewMode === 'grid' ? (
                  <Card className={`group hover:shadow-lg transition-all duration-200 ${
                    !item.isAvailable ? 'opacity-60' : ''
                  }`}>
                    <CardContent className="p-0">
                      <div className="relative">
                        {/* Checkbox */}
                        <div className="absolute top-3 left-3 z-10">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => handleItemSelect(item.id)}
                            className="bg-white border-2"
                          />
                        </div>

                        {/* Product Image */}
                        <div 
                          className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center text-6xl cursor-pointer relative"
                          onClick={() => handleItemClick(item.id)}
                        >
                          {item.image}

                          {/* Price Drop Badge */}
                          {item.isPriceDropped && (
                            <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              -{item.priceDropPercentage}% OFF
                            </div>
                          )}

                          {/* Unavailable Overlay */}
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-lg flex items-center justify-center">
                              <Badge variant="destructive">Unavailable</Badge>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4 space-y-3">
                          <div onClick={() => handleItemClick(item.id)} className="cursor-pointer">
                            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {item.description}
                            </p>

                            <div className="flex items-center space-x-2 mb-2">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{item.rating}</span>
                                <span className="text-sm text-muted-foreground">({item.reviewCount})</span>
                              </div>
                              <Badge variant="outline" className="text-xs">{item.category}</Badge>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-xl font-bold">
                                  ${item.price}
                                </span>
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    ${item.originalPrice}
                                  </span>
                                )}
                              </div>
                              {item.isPriceDropped && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Price Drop!
                                </Badge>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground mb-3">
                              Added {new Date(item.addedDate).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <Button
                              className="flex-1"
                              onClick={() => handleAddToCart(item)}
                              disabled={!item.isAvailable}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                            </Button>
                            <Button
                              variant="outline"
                              
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className={`group hover:shadow-lg transition-all duration-200 ${
                    !item.isAvailable ? 'opacity-60' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex space-x-6">
                        <div className="flex items-center space-x-4">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => handleItemSelect(item.id)}
                          />
                          <div 
                            className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-4xl cursor-pointer relative"
                            onClick={() => handleItemClick(item.id)}
                          >
                            {item.image}
                            {!item.isAvailable && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div onClick={() => handleItemClick(item.id)} className="cursor-pointer flex-1">
                              <h3 className="font-semibold text-xl group-hover:text-primary transition-colors">
                                {item.name}
                              </h3>
                              <p className="text-muted-foreground mt-1">{item.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {item.isPriceDropped && (
                                <Badge className="bg-green-500">-{item.priceDropPercentage}% OFF</Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{item.rating}</span>
                              <span className="text-muted-foreground">({item.reviewCount} reviews)</span>
                            </div>
                            <Badge variant="outline">{item.category}</Badge>
                            <span className="text-sm text-muted-foreground">{item.vendor.name}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl font-bold">${item.price}</span>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-lg text-muted-foreground line-through">
                                  ${item.originalPrice}
                                </span>
                              )}
                              {item.isPriceDropped && (
                                <Badge className="bg-green-100 text-green-800">Price Drop!</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handleAddToCart(item)}
                                disabled={!item.isAvailable}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            Added on {new Date(item.addedDate).toLocaleDateString()}
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
    </DashboardLayout>
  );
}