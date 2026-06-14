'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, Grid, List, Star, Heart, ShoppingCart, Clock, MapPin, X, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
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
    deliveryTime: string;
  };
  category: string;
  tags: string[];
  isPopular: boolean;
  inStock: boolean;
  matchScore: number;
  matchReason: string[];
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    name: 'Artisan Margherita Pizza',
    description: 'Wood-fired pizza with San Marzano tomatoes and fresh mozzarella',
    price: 18.99,
    originalPrice: 22.99,
    rating: 4.8,
    reviewCount: 342,
    image: '🍕',
    vendor: { id: 'bella-vista', name: 'Bella Vista Italian', location: 'Downtown', deliveryTime: '25-35 min' },
    category: 'Pizza',
    tags: ['pizza', 'italian', 'margherita', 'wood-fired', 'vegetarian'],
    isPopular: true,
    inStock: true,
    matchScore: 95,
    matchReason: ['Name match: "Margherita Pizza"', 'Category: Pizza', 'Tags: pizza, italian']
  },
  {
    id: '2',
    name: 'Pepperoni Supreme Pizza',
    description: 'Classic pepperoni pizza with extra cheese and Italian herbs',
    price: 21.99,
    rating: 4.6,
    reviewCount: 289,
    image: '🍕',
    vendor: { id: 'pizza-palace', name: 'Pizza Palace', location: 'Midtown', deliveryTime: '20-30 min' },
    category: 'Pizza',
    tags: ['pizza', 'pepperoni', 'classic', 'cheese'],
    isPopular: true,
    inStock: true,
    matchScore: 90,
    matchReason: ['Category: Pizza', 'Tags: pizza', 'Popular item']
  },
  {
    id: '3',
    name: 'Chicken Tikka Pizza',
    description: 'Fusion pizza with spiced chicken tikka and mint chutney',
    price: 24.99,
    rating: 4.7,
    reviewCount: 156,
    image: '🍕',
    vendor: { id: 'spice-fusion', name: 'Spice Fusion', location: 'Eastside', deliveryTime: '30-40 min' },
    category: 'Pizza',
    tags: ['pizza', 'chicken', 'indian', 'fusion', 'spicy'],
    isPopular: false,
    inStock: true,
    matchScore: 85,
    matchReason: ['Category: Pizza', 'Tags: pizza', 'Fusion cuisine']
  },
  {
    id: '4',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with parmesan and Caesar dressing',
    price: 12.99,
    rating: 4.4,
    reviewCount: 98,
    image: '🥗',
    vendor: { id: 'fresh-greens', name: 'Fresh Greens', location: 'Uptown', deliveryTime: '15-25 min' },
    category: 'Salads',
    tags: ['salad', 'caesar', 'healthy', 'vegetarian', 'fresh'],
    isPopular: false,
    inStock: true,
    matchScore: 70,
    matchReason: ['Similar cuisine style', 'Popular with pizza orders']
  },
  {
    id: '5',
    name: 'Meat Lovers Pizza',
    description: 'Loaded with pepperoni, sausage, bacon, and ham',
    price: 26.99,
    rating: 4.8,
    reviewCount: 234,
    image: '🍕',
    vendor: { id: 'meat-masters', name: 'Meat Masters', location: 'Westside', deliveryTime: '25-35 min' },
    category: 'Pizza',
    tags: ['pizza', 'meat', 'pepperoni', 'sausage', 'bacon'],
    isPopular: true,
    inStock: false,
    matchScore: 88,
    matchReason: ['Category: Pizza', 'Tags: pizza', 'High rating']
  }
];

const trendingSearches = [
  'pizza', 'sushi', 'burger', 'pasta', 'tacos', 'ramen', 'salad', 'chicken'
];

const popularFilters = [
  'Under $20', 'Fast Delivery', 'Top Rated', 'Vegetarian', 'Gluten Free'
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const categories = ['Pizza', 'Sushi', 'Burgers', 'Salads', 'Chinese', 'Indian', 'Italian', 'Mexican'];

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  useEffect(() => {
    let filtered = [...searchResults];

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(result =>
        selectedCategories.includes(result.category)
      );
    }

    // Filter by price range
    filtered = filtered.filter(result => 
      result.price >= priceRange[0] && result.price <= priceRange[1]
    );

    // Filter by stock status
    if (showOnlyInStock) {
      filtered = filtered.filter(result => result.inStock);
    }

    // Filter by popularity
    if (showOnlyPopular) {
      filtered = filtered.filter(result => result.isPopular);
    }

    // Sort results
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
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'relevance':
      default:
        filtered.sort((a, b) => b.matchScore - a.matchScore);
        break;
    }

    setFilteredResults(filtered);
  }, [searchResults, selectedCategories, priceRange, showOnlyInStock, showOnlyPopular, sortBy]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    // Simulate API search delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Filter mock results based on search query
    const results = mockSearchResults.filter(item => {
      const searchTerm = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        item.vendor.name.toLowerCase().includes(searchTerm)
      );
    });
    
    // Update match scores based on relevance
    results.forEach(result => {
      const searchTerm = query.toLowerCase();
      let score = 0;
      
      if (result.name.toLowerCase().includes(searchTerm)) score += 50;
      if (result.category.toLowerCase().includes(searchTerm)) score += 30;
      if (result.tags.some(tag => tag.toLowerCase().includes(searchTerm))) score += 20;
      if (result.description.toLowerCase().includes(searchTerm)) score += 10;
      
      result.matchScore = Math.min(100, score + (result.isPopular ? 10 : 0));
    });
    
    setSearchResults(results);
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  const handleTrendingSearch = (term: string) => {
    setSearchQuery(term);
    router.push(`/marketplace/search?q=${encodeURIComponent(term)}`);
    performSearch(term);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleProductClick = (productId: string) => {
    router.push(`/marketplace/product/${productId}`);
  };

  const handleAddToCart = (productId: string, productName: string) => {
    toast({
      title: "Added to cart!",
      description: `${productName} has been added to your cart.`
    });
  };

  const handleWishlist = (productId: string, productName: string) => {
    toast({
      title: "Added to wishlist!",
      description: `${productName} has been added to your wishlist.`
    });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 50]);
    setShowOnlyInStock(false);
    setShowOnlyPopular(false);
  };

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
            <span>Search Results</span>
          </div>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for food, restaurants, cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-lg h-12"
              />
            </div>
            <Button type="submit" size="lg" disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          {/* Trending & Suggestions */}
          {!hasSearched && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((term) => (
                    <Button
                      key={term}
                      variant="outline"
                      
                      onClick={() => handleTrendingSearch(term)}
                      className="text-xs"
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Filters
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularFilters.map((filter) => (
                    <Button
                      key={filter}
                      variant="outline"
                      
                      className="text-xs"
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-lg font-semibold mb-2">Searching...</div>
            <p className="text-muted-foreground">Finding the best matches for "{searchQuery}"</p>
          </motion.div>
        )}

        {/* Search Results */}
        {hasSearched && !isLoading && (
          <>
            {/* Results Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h2 className="text-2xl font-bold">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-muted-foreground">
                  {filteredResults.length} of {searchResults.length} results
                  {selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 50 || showOnlyInStock || showOnlyPopular 
                    ? ' (filtered)' : ''}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(selectedCategories.length > 0 || showOnlyInStock || showOnlyPopular) && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                      {selectedCategories.length + (showOnlyInStock ? 1 : 0) + (showOnlyPopular ? 1 : 0)}
                    </Badge>
                  )}
                </Button>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
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
            </motion.div>

            <div className="flex gap-6">
              {/* Filters Sidebar */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ 
                  opacity: showFilters ? 1 : 0,
                  x: showFilters ? 0 : -20,
                  width: showFilters ? '300px' : '0px'
                }}
                className={`${showFilters ? 'block' : 'hidden lg:block'} space-y-6 overflow-hidden`}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Filters</h3>
                    <Button variant="ghost"  onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>
                  
                  {/* Quick Filters */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="in-stock" 
                        checked={showOnlyInStock}
                        onChange={(e) => setShowOnlyInStock((e.target as HTMLInputElement).checked)}
                      />
                      <label htmlFor="in-stock" className="text-sm">In Stock Only</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="popular" 
                        checked={showOnlyPopular}
                        onChange={(e) => setShowOnlyPopular((e.target as HTMLInputElement).checked)}
                      />
                      <label htmlFor="popular" className="text-sm">Popular Items Only</label>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-medium">Price Range</h4>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={50}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Categories</h4>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => handleCategoryToggle(category)}
                          />
                          <label htmlFor={category} className="text-sm">{category}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Results */}
              <div className="flex-1">
                {filteredResults.length === 0 ? (
                  <Card className="p-12 text-center">
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search terms or filters
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                      <Button variant="outline" onClick={() => setSearchQuery('')}>
                        Clear Search
                      </Button>
                      <Button onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className={
                      viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                    }
                  >
                    {filteredResults.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {viewMode === 'grid' ? (
                          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200">
                            <CardContent className="p-0">
                              <div onClick={() => handleProductClick(result.id)}>
                                {/* Product Image */}
                                <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center text-6xl relative">
                                  {result.image}
                                  {!result.inStock && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-lg flex items-center justify-center">
                                      <Badge variant="destructive">Out of Stock</Badge>
                                    </div>
                                  )}
                                  <div className="absolute top-2 left-2 flex flex-col space-y-1">
                                    <Badge className="bg-green-600 text-xs">
                                      {result.matchScore}% match
                                    </Badge>
                                    {result.isPopular && (
                                      <Badge className="bg-red-500 text-xs">Popular</Badge>
                                    )}
                                  </div>
                                  {result.originalPrice && (
                                    <Badge className="absolute top-2 right-2 bg-orange-500">
                                      {Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100)}% OFF
                                    </Badge>
                                  )}
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                                    {result.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {result.description}
                                  </p>
                                  
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm font-medium">{result.rating}</span>
                                      <span className="text-sm text-muted-foreground">
                                        ({result.reviewCount})
                                      </span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {result.category}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center space-x-2 mb-3 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{result.vendor.location}</span>
                                    <Clock className="h-4 w-4" />
                                    <span>{result.vendor.deliveryTime}</span>
                                  </div>

                                  <div className="mb-2">
                                    <div className="text-xs text-muted-foreground">Match reasons:</div>
                                    <div className="text-xs text-green-600">
                                      {result.matchReason.slice(0, 2).join(', ')}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xl font-bold">${result.price}</span>
                                      {result.originalPrice && (
                                        <span className="text-sm text-muted-foreground line-through">
                                          ${result.originalPrice}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="p-4 pt-0 flex items-center space-x-2">
                                <Button
                                  className="flex-1"
                                  onClick={() => handleAddToCart(result.id, result.name)}
                                  disabled={!result.inStock}
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Add to Cart
                                </Button>
                                <Button
                                  variant="outline"
                                  
                                  onClick={() => handleWishlist(result.id, result.name)}
                                >
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200">
                            <CardContent className="p-6">
                              <div className="flex space-x-6" onClick={() => handleProductClick(result.id)}>
                                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-4xl flex-shrink-0 relative">
                                  {result.image}
                                  {!result.inStock && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                      <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-start justify-between">
                                    <h3 className="font-semibold text-xl group-hover:text-primary transition-colors">
                                      {result.name}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                      <Badge className="bg-green-600 text-xs">
                                        {result.matchScore}% match
                                      </Badge>
                                      {result.isPopular && (
                                        <Badge className="bg-red-500 text-xs">Popular</Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <p className="text-muted-foreground">
                                    {result.description}
                                  </p>
                                  
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      <span className="font-medium">{result.rating}</span>
                                      <span className="text-muted-foreground">
                                        ({result.reviewCount} reviews)
                                      </span>
                                    </div>
                                    <Badge variant="outline">{result.category}</Badge>
                                  </div>

                                  <div className="text-sm text-green-600">
                                    {result.matchReason.join(' • ')}
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-2xl font-bold">${result.price}</span>
                                      {result.originalPrice && (
                                        <span className="text-lg text-muted-foreground line-through">
                                          ${result.originalPrice}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        onClick={() => handleAddToCart(result.id, result.name)}
                                        disabled={!result.inStock}
                                      >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Add to Cart
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleWishlist(result.id, result.name)}
                                      >
                                        <Heart className="h-4 w-4" />
                                      </Button>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}