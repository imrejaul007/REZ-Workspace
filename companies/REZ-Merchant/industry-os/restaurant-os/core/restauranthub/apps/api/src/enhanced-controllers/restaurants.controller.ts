import { Controller, Get, Query, Param, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import crypto from 'crypto';
import { mockData } from '../mock-data/simple-mock-data';

@Controller('api/restaurants')
export class EnhancedRestaurantsController {
  private restaurants = mockData.restaurants;
  private users = mockData.users;

  @Get()
  async getRestaurants(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('cuisine') cuisine?: string,
    @Query('priceRange') priceRange?: string,
    @Query('rating') rating?: string,
    @Query('location') location?: string,
    @Query('search') search?: string,
    @Query('verified') verified?: string,
    @Query('sortBy', new DefaultValuePipe('rating')) sortBy?: 'rating' | 'reviews' | 'name' | 'joined'
  ) {
    let filteredRestaurants = [...this.restaurants];

    // Apply filters
    if (cuisine) {
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.cuisineType.some(c => c.toLowerCase().includes(cuisine.toLowerCase()))
      );
    }

    if (priceRange) {
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.priceRange === priceRange
      );
    }

    if (rating) {
      const minRating = parseFloat(rating);
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.rating >= minRating
      );
    }

    if (location) {
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.address.city.toLowerCase().includes(location.toLowerCase()) ||
        restaurant.address.state.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchLower) ||
        restaurant.description.toLowerCase().includes(searchLower) ||
        restaurant.cuisineType.some(c => c.toLowerCase().includes(searchLower))
      );
    }

    if (verified === 'true') {
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.verificationStatus === 'VERIFIED'
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'reviews':
        filteredRestaurants.sort((a, b) => b.totalReviews - a.totalReviews);
        break;
      case 'name':
        filteredRestaurants.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'joined':
        filteredRestaurants.sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());
        break;
      default: // rating
        filteredRestaurants.sort((a, b) => b.rating - a.rating);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRestaurants = filteredRestaurants.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedRestaurants.map(restaurant => ({
        ...restaurant,
        memberSince: this.getTimeAgo(restaurant.joinedDate),
        isTopRated: restaurant.rating >= 4.5 && restaurant.totalReviews >= 50,
        popularityScore: this.calculatePopularityScore(restaurant)
      })),
      meta: {
        total: filteredRestaurants.length,
        page,
        limit,
        totalPages: Math.ceil(filteredRestaurants.length / limit),
        hasNextPage: endIndex < filteredRestaurants.length,
        hasPrevPage: page > 1
      },
      filters: {
        availableCuisines: this.getAvailableCuisines(),
        priceRanges: ['$', '$$', '$$$', '$$$$'],
        locations: this.getAvailableLocations(),
        sortOptions: [
          { value: 'rating', label: 'Highest Rated' },
          { value: 'reviews', label: 'Most Reviews' },
          { value: 'name', label: 'Name A-Z' },
          { value: 'joined', label: 'Recently Joined' }
        ]
      }
    };
  }

  @Get('featured')
  async getFeaturedRestaurants() {
    const featuredRestaurants = this.restaurants
      .filter(restaurant =>
        restaurant.rating >= 4.5 &&
        restaurant.totalReviews >= 30 &&
        restaurant.verificationStatus === 'VERIFIED'
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);

    return {
      success: true,
      data: featuredRestaurants.map(restaurant => ({
        ...restaurant,
        memberSince: this.getTimeAgo(restaurant.joinedDate),
        popularityScore: this.calculatePopularityScore(restaurant)
      }))
    };
  }

  @Get('top-rated')
  async getTopRatedRestaurants() {
    const topRated = this.restaurants
      .filter(restaurant => restaurant.totalReviews >= 20)
      .sort((a, b) => {
        // Sort by rating first, then by number of reviews
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.totalReviews - a.totalReviews;
      })
      .slice(0, 12);

    return {
      success: true,
      data: topRated.map(restaurant => ({
        ...restaurant,
        memberSince: this.getTimeAgo(restaurant.joinedDate),
        badge: restaurant.rating >= 4.8 ? 'EXCELLENT' : restaurant.rating >= 4.5 ? 'GREAT' : 'GOOD'
      }))
    };
  }

  @Get('stats')
  async getRestaurantStats() {
    const stats = {
      totalRestaurants: this.restaurants.length,
      verifiedRestaurants: this.restaurants.filter(r => r.verificationStatus === 'VERIFIED').length,
      averageRating: parseFloat((this.restaurants.reduce((sum, r) => sum + r.rating, 0) / this.restaurants.length).toFixed(1)),
      totalReviews: this.restaurants.reduce((sum, r) => sum + r.totalReviews, 0),
      totalOrders: this.restaurants.reduce((sum, r) => sum + r.stats.totalOrders, 0),
      totalRevenue: this.restaurants.reduce((sum, r) => sum + r.stats.monthlyRevenue, 0),
      averageOrderValue: parseFloat((this.restaurants.reduce((sum, r) => sum + r.stats.averageOrderValue, 0) / this.restaurants.length).toFixed(2)),
      cuisineDistribution: this.getCuisineDistribution(),
      priceRangeDistribution: this.getPriceRangeDistribution(),
      ratingDistribution: this.getRatingDistribution(),
      topPerformers: this.getTopPerformers(),
      recentActivity: {
        newRestaurantsThisMonth: this.restaurants.filter(restaurant => {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return new Date(restaurant.joinedDate) > monthAgo;
        }).length,
        totalOrdersThisMonth: crypto.randomInt(2000, 6999) // Simulated
      },
      geographicDistribution: this.getGeographicDistribution()
    };

    return {
      success: true,
      data: stats
    };
  }

  @Get(':id')
  async getRestaurantById(@Param('id') id: string) {
    const restaurant = this.restaurants.find(r => r.id === id);

    if (!restaurant) {
      return {
        success: false,
        message: 'Restaurant not found',
        data: null
      };
    }

    // Generate mock menu items
    const menuItems = this.generateMenuItems(restaurant.cuisineType[0]);
    const recentReviews = this.generateRecentReviews(restaurant.totalReviews);

    // Find similar restaurants
    const similarRestaurants = this.restaurants
      .filter(r => r.id !== id && (
        r.cuisineType.some(cuisine => restaurant.cuisineType.includes(cuisine)) ||
        r.address.city === restaurant.address.city ||
        Math.abs(r.rating - restaurant.rating) <= 0.5
      ))
      .slice(0, 4);

    return {
      success: true,
      data: {
        ...restaurant,
        memberSince: this.getTimeAgo(restaurant.joinedDate),
        popularityScore: this.calculatePopularityScore(restaurant),
        menuItems,
        recentReviews,
        similarRestaurants: similarRestaurants.map(r => ({
          ...r,
          memberSince: this.getTimeAgo(r.joinedDate)
        })),
        operatingHours: this.generateOperatingHours(),
        socialMedia: {
          facebook: `https://facebook.com/${restaurant.name.replace(/\s+/g, '').toLowerCase()}`,
          instagram: `https://instagram.com/${restaurant.name.replace(/\s+/g, '').toLowerCase()}`,
          twitter: `https://twitter.com/${restaurant.name.replace(/\s+/g, '').toLowerCase()}`
        },
        analytics: {
          monthlyViews: crypto.randomInt(200, 1199),
          profileCompleteness: crypto.randomInt(80, 99),
          responseRate: crypto.randomInt(70, 99)
        }
      }
    };
  }

  @Get(':id/menu')
  async getRestaurantMenu(@Param('id') id: string) {
    const restaurant = this.restaurants.find(r => r.id === id);

    if (!restaurant) {
      return {
        success: false,
        message: 'Restaurant not found',
        data: null
      };
    }

    const menuCategories = [
      {
        name: 'Appetizers',
        items: this.generateMenuItems('appetizers', 6)
      },
      {
        name: 'Main Courses',
        items: this.generateMenuItems(restaurant.cuisineType[0], 10)
      },
      {
        name: 'Desserts',
        items: this.generateMenuItems('desserts', 4)
      },
      {
        name: 'Beverages',
        items: this.generateMenuItems('beverages', 8)
      }
    ];

    return {
      success: true,
      data: {
        restaurantName: restaurant.name,
        categories: menuCategories,
        lastUpdated: new Date(),
        currency: 'USD'
      }
    };
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  }

  private calculatePopularityScore(restaurant): number {
    const ratingWeight = 0.4;
    const reviewsWeight = 0.3;
    const ordersWeight = 0.3;

    const normalizedRating = restaurant.rating / 5;
    const normalizedReviews = Math.min(restaurant.totalReviews / 100, 1);
    const normalizedOrders = Math.min(restaurant.stats.totalOrders / 1000, 1);

    return Math.round(
      (normalizedRating * ratingWeight +
       normalizedReviews * reviewsWeight +
       normalizedOrders * ordersWeight) * 100
    );
  }

  private getAvailableCuisines() {
    const cuisines = new Set<string>();
    this.restaurants.forEach(restaurant => {
      restaurant.cuisineType.forEach(cuisine => cuisines.add(cuisine));
    });
    return Array.from(cuisines).sort();
  }

  private getAvailableLocations() {
    const locations = new Set<string>();
    this.restaurants.forEach(restaurant => {
      locations.add(`${restaurant.address.city}, ${restaurant.address.state}`);
    });
    return Array.from(locations).sort();
  }

  private getCuisineDistribution() {
    const cuisineCounts = new Map();
    this.restaurants.forEach(restaurant => {
      restaurant.cuisineType.forEach(cuisine => {
        cuisineCounts.set(cuisine, (cuisineCounts.get(cuisine) || 0) + 1);
      });
    });

    return Array.from(cuisineCounts.entries())
      .map(([cuisine, count]) => ({ cuisine, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getPriceRangeDistribution() {
    const priceCounts = new Map();
    this.restaurants.forEach(restaurant => {
      priceCounts.set(restaurant.priceRange, (priceCounts.get(restaurant.priceRange) || 0) + 1);
    });

    return Array.from(priceCounts.entries())
      .map(([range, count]) => ({ range, count }));
  }

  private getRatingDistribution() {
    const ratingRanges = [
      { range: '4.5-5.0', min: 4.5, max: 5.0 },
      { range: '4.0-4.4', min: 4.0, max: 4.4 },
      { range: '3.5-3.9', min: 3.5, max: 3.9 },
      { range: '3.0-3.4', min: 3.0, max: 3.4 },
      { range: 'Below 3.0', min: 0, max: 2.9 }
    ];

    return ratingRanges.map(({ range, min, max }) => ({
      range,
      count: this.restaurants.filter(r => r.rating >= min && r.rating <= max).length
    }));
  }

  private getTopPerformers() {
    return this.restaurants
      .sort((a, b) => this.calculatePopularityScore(b) - this.calculatePopularityScore(a))
      .slice(0, 5)
      .map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        rating: restaurant.rating,
        totalReviews: restaurant.totalReviews,
        monthlyRevenue: restaurant.stats.monthlyRevenue,
        popularityScore: this.calculatePopularityScore(restaurant)
      }));
  }

  private getGeographicDistribution() {
    const cityCounts = new Map();
    this.restaurants.forEach(restaurant => {
      cityCounts.set(restaurant.address.city, (cityCounts.get(restaurant.address.city) || 0) + 1);
    });

    return Array.from(cityCounts.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  }

  private generateMenuItems(cuisineOrCategory: string, count: number = 8) {
    const menuItems = {
      Italian: ['Margherita Pizza', 'Spaghetti Carbonara', 'Chicken Parmigiana', 'Fettuccine Alfredo'],
      Chinese: ['Sweet and Sour Pork', 'Kung Pao Chicken', 'Beef Lo Mein', 'Fried Rice'],
      Mexican: ['Tacos al Pastor', 'Chicken Enchiladas', 'Beef Burrito', 'Guacamole'],
      appetizers: ['Caesar Salad', 'Mozzarella Sticks', 'Buffalo Wings', 'Onion Rings'],
      desserts: ['Chocolate Cake', 'Tiramisu', 'Ice Cream', 'Apple Pie'],
      beverages: ['Coca Cola', 'Fresh Orange Juice', 'Coffee', 'Iced Tea']
    };

    const items = menuItems[cuisineOrCategory as keyof typeof menuItems] || menuItems.Italian;

    return Array.from({ length: count }, (_, i) => ({
      id: `item-${i + 1}`,
      name: items[i % items.length] || `Delicious ${cuisineOrCategory} Dish ${i + 1}`,
      description: 'A wonderful dish prepared with fresh ingredients and traditional techniques.',
      price: (crypto.randomInt(800, 2799) / 100).toFixed(2),
      category: cuisineOrCategory,
      isPopular: crypto.randomInt(0, 9) > 6,
      image: `https://picsum.photos/300/200?random=${i + 100}`
    }));
  }

  private generateRecentReviews(totalReviews: number) {
    const reviewCount = Math.min(totalReviews, 5);
    return Array.from({ length: reviewCount }, (_, i) => ({
      id: `review-${i + 1}`,
      customerName: `${this.users[i % this.users.length].firstName} ${this.users[i % this.users.length].lastName}`,
      rating: crypto.randomInt(4, 5), // 4 or 5 stars for recent reviews
      comment: 'Great food and excellent service! Highly recommend this place to anyone looking for quality dining.',
      date: new Date(Date.now() - crypto.randomInt(0, 29) * 24 * 60 * 60 * 1000),
      verified: crypto.randomInt(0, 9) > 2
    }));
  }

  private generateOperatingHours() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map(day => ({
      day,
      open: '11:00 AM',
      close: day === 'Friday' || day === 'Saturday' ? '11:00 PM' : '10:00 PM',
      isOpen: true
    }));
  }
}
