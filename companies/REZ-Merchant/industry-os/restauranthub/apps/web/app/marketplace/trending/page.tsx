'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Star, Heart, ShoppingCart, Clock, MapPin, Flame, Zap, Users, Eye, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface TrendingItem {
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
  trendingStats: {
    rank: number;
    previousRank: number;
    orderCount24h: number;
    orderCountWeek: number;
    viewCount24h: number;
    trendDirection: 'up' | 'down' | 'stable';
    trendPercentage: number;
    isNewEntry: boolean;
    daysSinceLaunch: number;
  };
  tags: string[];
  isPopular: boolean;
  inStock: boolean;
}

const mockTrendingItems: TrendingItem[] = [
  {
    id: '1',
    name: 'Viral TikTok Burger Stack',
    description: 'The internet sensation! Triple-stacked beef patties with viral sauce that everyone\'s talking about',
    price: 22.99,
    originalPrice: 26.99,
    rating: 4.9,
    reviewCount: 1247,
    image: '🍔',
    vendor: { id: 'viral-eats', name: 'Viral Eats', location: 'Social District', deliveryTime: '20-30 min' },
    category: 'Burgers',
    trendingStats: {
      rank: 1,
      previousRank: 3,
      orderCount24h: 342,
      orderCountWeek: 1856,
      viewCount24h: 2841,
      trendDirection: 'up',
      trendPercentage: 67,
      isNewEntry: false,
      daysSinceLaunch: 14
    },
    tags: ['viral', 'social-media', 'trending', 'must-try'],
    isPopular: true,
    inStock: true
  },
  {
    id: '2',
    name: 'Instagrammable Rainbow Sushi',
    description: 'Colorful sushi rolls that are taking Instagram by storm! Fresh fish with natural coloring',
    price: 34.99,
    rating: 4.8,
    reviewCount: 892,
    image: '🍣',
    vendor: { id: 'rainbow-sushi', name: 'Rainbow Sushi Co.', location: 'Arts Quarter', deliveryTime: '25-35 min' },
    category: 'Japanese',
    trendingStats: {
      rank: 2,
      previousRank: 1,
      orderCount24h: 298,
      orderCountWeek: 1523,
      viewCount24h: 3247,
      trendDirection: 'down',
      trendPercentage: -12,
      isNewEntry: false,
      daysSinceLaunch: 21
    },
    tags: ['instagram', 'colorful', 'photogenic', 'artistic'],
    isPopular: true,
    inStock: true
  },
  {
    id: '3',
    name: 'Korean Corn Dogs (4-Pack)',
    description: 'Crispy, cheesy Korean-style corn dogs with potato coating. The latest Korean street food craze!',
    price: 18.99,
    originalPrice: 22.99,
    rating: 4.7,
    reviewCount: 645,
    image: '🌭',
    vendor: { id: 'k-street', name: 'K-Street Food', location: 'Korea Town', deliveryTime: '15-25 min' },
    category: 'Korean',
    trendingStats: {
      rank: 3,
      previousRank: 7,
      orderCount24h: 267,
      orderCountWeek: 1287,
      viewCount24h: 1934,
      trendDirection: 'up',
      trendPercentage: 43,
      isNewEntry: false,
      daysSinceLaunch: 8
    },
    tags: ['korean', 'street-food', 'crispy', 'cheese'],
    isPopular: true,
    inStock: true
  },
  {
    id: '4',
    name: 'Cloud Eggs Benedict',
    description: 'Fluffy cloud-like eggs benedict that\'s breaking the internet! Light as air, taste like heaven',
    price: 16.99,
    rating: 4.6,
    reviewCount: 423,
    image: '🍳',
    vendor: { id: 'cloud-nine', name: 'Cloud Nine Brunch', location: 'Hipster Heights', deliveryTime: '30-40 min' },
    category: 'Brunch',
    trendingStats: {
      rank: 4,
      previousRank: 12,
      orderCount24h: 198,
      orderCountWeek: 934,
      viewCount24h: 1567,
      trendDirection: 'up',
      trendPercentage: 89,
      isNewEntry: true,
      daysSinceLaunch: 3
    },
    tags: ['fluffy', 'brunch', 'unique', 'photogenic'],
    isPopular: false,
    inStock: true
  },
  {
    id: '5',
    name: 'Boba Pizza Fusion',
    description: 'The wild fusion everyone\'s curious about - pizza with boba pearls and sweet toppings!',
    price: 25.99,
    rating: 4.2,
    reviewCount: 312,
    image: '🍕',
    vendor: { id: 'fusion-fever', name: 'Fusion Fever', location: 'Experimental Eats', deliveryTime: '35-45 min' },
    category: 'Fusion',
    trendingStats: {
      rank: 5,
      previousRank: 4,
      orderCount24h: 156,
      orderCountWeek: 743,
      viewCount24h: 2156,
      trendDirection: 'down',
      trendPercentage: -8,
      isNewEntry: false,
      daysSinceLaunch: 12
    },
    tags: ['fusion', 'experimental', 'boba', 'sweet'],
    isPopular: false,
    inStock: true
  },
  {
    id: '6',
    name: 'Charcoal Ice Cream Bowl',
    description: 'Dramatic black ice cream that\'s as delicious as it is striking. Perfect for dark aesthetic posts',
    price: 12.99,
    rating: 4.5,
    reviewCount: 289,
    image: '🍨',
    vendor: { id: 'dark-treats', name: 'Dark Treats', location: 'Gothic Gardens', deliveryTime: '20-30 min' },
    category: 'Desserts',
    trendingStats: {
      rank: 6,
      previousRank: 5,
      orderCount24h: 134,
      orderCountWeek: 612,
      viewCount24h: 1423,
      trendDirection: 'down',
      trendPercentage: -5,
      isNewEntry: false,
      daysSinceLaunch: 28
    },
    tags: ['charcoal', 'black', 'aesthetic', 'unique'],
    isPopular: false,
    inStock: true
  },
  {
    id: '7',
    name: 'Flaming Hot Cheetos Ramen',
    description: 'Spicy ramen with Flaming Hot Cheetos topping. The ultimate comfort food mashup!',
    price: 14.99,
    rating: 4.4,
    reviewCount: 567,
    image: '🍜',
    vendor: { id: 'heat-wave', name: 'Heat Wave Noodles', location: 'Spice Street', deliveryTime: '25-35 min' },
    category: 'Ramen',
    trendingStats: {
      rank: 7,
      previousRank: 2,
      orderCount24h: 123,
      orderCountWeek: 589,
      viewCount24h: 987,
      trendDirection: 'down',
      trendPercentage: -23,
      isNewEntry: false,
      daysSinceLaunch: 35
    },
    tags: ['spicy', 'cheetos', 'ramen', 'comfort'],
    isPopular: false,
    inStock: true
  }
];

const trendingCategories = [
  { id: 'viral', name: 'Viral Foods', icon: '🔥', count: 12 },
  { id: 'new', name: 'New Drops', icon: '✨', count: 8 },
  { id: 'rising', name: 'Rising Fast', icon: '📈', count: 15 },
  { id: 'social', name: 'Social Media Hits', icon: '📱', count: 20 }
];

export default function TrendingPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>(mockTrendingItems);
  const [filteredItems, setFilteredItems] = useState<TrendingItem[]>(mockTrendingItems);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rank');
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    let filtered = [...trendingItems];

    // Category filter
    switch (selectedCategory) {
      case 'viral':
        filtered = filtered.filter(item => item.trendingStats.orderCount24h > 200);
        break;
      case 'new':
        filtered = filtered.filter(item => item.trendingStats.isNewEntry || item.trendingStats.daysSinceLaunch <= 7);
        break;
      case 'rising':
        filtered = filtered.filter(item => item.trendingStats.trendDirection === 'up');
        break;
      case 'social':
        filtered = filtered.filter(item => item.tags.some(tag => ['viral', 'instagram', 'tiktok', 'social-media', 'photogenic'].includes(tag)));
        break;
      default:
        // Show all
        break;
    }

    // Sorting
    switch (sortBy) {
      case 'orders':
        filtered.sort((a, b) => {
          const orderCountA = timeRange === '24h' ? a.trendingStats.orderCount24h : a.trendingStats.orderCountWeek;
          const orderCountB = timeRange === '24h' ? b.trendingStats.orderCount24h : b.trendingStats.orderCountWeek;
          return orderCountB - orderCountA;
        });
        break;
      case 'views':
        filtered.sort((a, b) => b.trendingStats.viewCount24h - a.trendingStats.viewCount24h);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'trend':
        filtered.sort((a, b) => Math.abs(b.trendingStats.trendPercentage) - Math.abs(a.trendingStats.trendPercentage));
        break;
      case 'rank':
      default:
        filtered.sort((a, b) => a.trendingStats.rank - b.trendingStats.rank);
        break;
    }

    setFilteredItems(filtered);
  }, [trendingItems, selectedCategory, sortBy, timeRange]);

  const handleItemClick = (itemId: string) => {
    router.push(`/marketplace/product/${itemId}`);
  };

  const handleAddToCart = (item: TrendingItem) => {
    toast({
      title: "Added to cart!",
      description: `${item.name} has been added to your cart.`
    });
  };

  const handleWishlist = (item: TrendingItem) => {
    toast({
      title: "Added to wishlist!",
      description: `${item.name} has been added to your wishlist.`
    });
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      default:
        return <div className="h-4 w-4 border border-gray-400 rounded-full" />;
    }
  };

  const getRankChangeIndicator = (current: number, previous: number) => {
    if (current < previous) {
      return (
        <div className="flex items-center space-x-1 text-green-600 text-sm">
          <TrendingUp className="h-3 w-3" />
          <span>+{previous - current}</span>
        </div>
      );
    } else if (current > previous) {
      return (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <TrendingUp className="h-3 w-3 transform rotate-180" />
          <span>-{current - previous}</span>
        </div>
      );
    }
    return <div className="text-gray-500 text-sm">-</div>;
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
            <span>Trending Now</span>
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <Flame className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Trending Now 🔥
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Discover what's hot right now! The most viral, talked-about, and trending foods
            </p>
          </div>
        </motion.div>

        {/* Trending Categories */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {trendingCategories.map((category) => (
            <Card key={category.id} className={`cursor-pointer hover:shadow-md transition-all ${
              selectedCategory === category.id ? 'ring-2 ring-primary' : ''
            }`} onClick={() => setSelectedCategory(category.id)}>
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-semibold text-sm">{category.name}</h3>
                <Badge variant="secondary" className="mt-1">{category.count} items</Badge>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
          >
            All Trending
          </Button>

          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Trending Rank</SelectItem>
                <SelectItem value="orders">Most Orders</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="trend">Biggest Trend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trending Items */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex space-x-6">
                    {/* Rank */}
                    <div className="flex flex-col items-center space-y-2 w-16">
                      <div className={`text-3xl font-bold ${
                        item.trendingStats.rank <= 3 ? 'text-yellow-500' : 'text-muted-foreground'
                      }`}>
                        #{item.trendingStats.rank}
                      </div>
                      {getRankChangeIndicator(item.trendingStats.rank, item.trendingStats.previousRank)}
                      {item.trendingStats.isNewEntry && (
                        <Badge className="bg-green-500 text-xs px-1 py-0">NEW</Badge>
                      )}
                    </div>

                    {/* Product Image */}
                    <div 
                      className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-5xl cursor-pointer relative"
                      onClick={() => handleItemClick(item.id)}
                    >
                      {item.image}
                      {item.originalPrice && (
                        <Badge className="absolute top-2 right-2 bg-red-500 text-xs">
                          SALE
                        </Badge>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 space-y-3">
                      <div onClick={() => handleItemClick(item.id)} className="cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(item.trendingStats.trendDirection)}
                            <span className={`font-semibold ${
                              item.trendingStats.trendDirection === 'up' ? 'text-green-600' : 
                              item.trendingStats.trendDirection === 'down' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {item.trendingStats.trendPercentage > 0 ? '+' : ''}{item.trendingStats.trendPercentage}%
                            </span>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-3">{item.description}</p>

                        <div className="flex items-center space-x-6 mb-3">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{item.rating}</span>
                            <span className="text-muted-foreground">({item.reviewCount})</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{item.vendor.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{item.vendor.deliveryTime}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs capitalize">
                              {tag.replace('-', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Trending Stats */}
                      <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <ShoppingCart className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold text-blue-600">
                              {timeRange === '24h' ? item.trendingStats.orderCount24h : item.trendingStats.orderCountWeek}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Eye className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-semibold text-green-600">
                              {item.trendingStats.viewCount24h}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Zap className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-semibold text-orange-600">
                              {item.trendingStats.daysSinceLaunch}d
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">Since Launch</div>
                        </div>
                      </div>

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold">${item.price}</span>
                          {item.originalPrice && (
                            <span className="text-lg text-muted-foreground line-through">
                              ${item.originalPrice}
                            </span>
                          )}
                          {item.originalPrice && (
                            <Badge className="bg-green-100 text-green-800">
                              Save ${(item.originalPrice - item.price).toFixed(2)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleAddToCart(item)}
                            disabled={!item.inStock}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleWishlist(item)}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredItems.length === 0 && (
          <Card className="p-12 text-center">
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trending items found</h3>
            <p className="text-muted-foreground mb-4">
              Try selecting a different category or time range.
            </p>
            <Button onClick={() => setSelectedCategory('all')}>
              View All Trending
            </Button>
          </Card>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-2">Want to be featured in trending?</h2>
          <p className="mb-6">Join thousands of food creators making waves in the culinary world!</p>
          <Button variant="secondary" onClick={() => router.push('/vendor/signup')}>
            Become a Vendor
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}