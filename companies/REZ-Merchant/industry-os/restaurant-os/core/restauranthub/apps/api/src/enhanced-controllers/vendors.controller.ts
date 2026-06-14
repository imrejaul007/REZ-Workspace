import { Controller, Get, Query, Param, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import crypto from 'crypto';
import { mockData } from '../mock-data/simple-mock-data';

@Controller('api/vendors')
export class EnhancedVendorsController {
  private vendors = mockData.vendors;
  private products = this.generateProductCatalog();

  @Get()
  async getVendors(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('businessType') businessType?: string,
    @Query('location') location?: string,
    @Query('rating') rating?: string,
    @Query('search') search?: string,
    @Query('verified') verified?: string,
    @Query('serviceArea') serviceArea?: string,
    @Query('sortBy', new DefaultValuePipe('rating')) sortBy?: 'rating' | 'reviews' | 'name' | 'experience'
  ) {
    let filteredVendors = [...this.vendors];

    // Apply filters
    if (businessType) {
      filteredVendors = filteredVendors.filter(vendor =>
        vendor.businessType.toLowerCase().includes(businessType.toLowerCase())
      );
    }

    if (location) {
      filteredVendors = filteredVendors.filter(vendor =>
        vendor.address.city.toLowerCase().includes(location.toLowerCase()) ||
        vendor.address.state.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (rating) {
      const minRating = parseFloat(rating);
      filteredVendors = filteredVendors.filter(vendor => vendor.rating >= minRating);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredVendors = filteredVendors.filter(vendor =>
        vendor.companyName.toLowerCase().includes(searchLower) ||
        vendor.businessType.toLowerCase().includes(searchLower) ||
        vendor.description.toLowerCase().includes(searchLower)
      );
    }

    if (verified === 'true') {
      filteredVendors = filteredVendors.filter(vendor =>
        vendor.verificationStatus === 'VERIFIED'
      );
    }

    if (serviceArea) {
      filteredVendors = filteredVendors.filter(vendor =>
        vendor.serviceAreas.some(area =>
          area.toLowerCase().includes(serviceArea.toLowerCase())
        )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'reviews':
        filteredVendors.sort((a, b) => b.totalReviews - a.totalReviews);
        break;
      case 'name':
        filteredVendors.sort((a, b) => a.companyName.localeCompare(b.companyName));
        break;
      case 'experience':
        filteredVendors.sort((a, b) => b.yearsInBusiness - a.yearsInBusiness);
        break;
      default: // rating
        filteredVendors.sort((a, b) => b.rating - a.rating);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVendors = filteredVendors.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedVendors.map(vendor => ({
        ...vendor,
        memberSince: this.getTimeAgo(new Date(Date.now() - vendor.yearsInBusiness * 365 * 24 * 60 * 60 * 1000)),
        reliabilityScore: this.calculateReliabilityScore(vendor),
        isTopRated: vendor.rating >= 4.5 && vendor.totalReviews >= 20,
        responseTime: this.generateResponseTime()
      })),
      meta: {
        total: filteredVendors.length,
        page,
        limit,
        totalPages: Math.ceil(filteredVendors.length / limit),
        hasNextPage: endIndex < filteredVendors.length,
        hasPrevPage: page > 1
      },
      filters: {
        availableBusinessTypes: this.getAvailableBusinessTypes(),
        serviceAreas: this.getAvailableServiceAreas(),
        locations: this.getAvailableLocations(),
        sortOptions: [
          { value: 'rating', label: 'Highest Rated' },
          { value: 'reviews', label: 'Most Reviews' },
          { value: 'experience', label: 'Most Experience' },
          { value: 'name', label: 'Name A-Z' }
        ]
      }
    };
  }

  @Get('featured')
  async getFeaturedVendors() {
    const featuredVendors = this.vendors
      .filter(vendor =>
        vendor.rating >= 4.5 &&
        vendor.totalReviews >= 15 &&
        vendor.verificationStatus === 'VERIFIED'
      )
      .sort((a, b) => this.calculateReliabilityScore(b) - this.calculateReliabilityScore(a))
      .slice(0, 8);

    return {
      success: true,
      data: featuredVendors.map(vendor => ({
        ...vendor,
        reliabilityScore: this.calculateReliabilityScore(vendor),
        responseTime: this.generateResponseTime()
      }))
    };
  }

  @Get('categories')
  async getVendorCategories() {
    const categories = this.getBusinessTypeDistribution();

    return {
      success: true,
      data: categories.map(category => ({
        ...category,
        topVendors: this.vendors
          .filter(vendor => vendor.businessType === category.type)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3)
          .map(vendor => ({
            id: vendor.id,
            name: vendor.companyName,
            rating: vendor.rating,
            totalReviews: vendor.totalReviews
          })),
        averageRating: parseFloat(
          (this.vendors
            .filter(vendor => vendor.businessType === category.type)
            .reduce((sum, vendor) => sum + vendor.rating, 0) / category.count
          ).toFixed(1)
        )
      }))
    };
  }

  @Get('stats')
  async getVendorStats() {
    const stats = {
      totalVendors: this.vendors.length,
      verifiedVendors: this.vendors.filter(v => v.verificationStatus === 'VERIFIED').length,
      averageRating: parseFloat((this.vendors.reduce((sum, v) => sum + v.rating, 0) / this.vendors.length).toFixed(1)),
      totalReviews: this.vendors.reduce((sum, v) => sum + v.totalReviews, 0),
      totalOrders: this.vendors.reduce((sum, v) => sum + v.stats.totalOrders, 0),
      averageExperience: Math.round(this.vendors.reduce((sum, v) => sum + v.yearsInBusiness, 0) / this.vendors.length),
      businessTypeDistribution: this.getBusinessTypeDistribution(),
      serviceAreaCoverage: this.getServiceAreaCoverage(),
      performanceMetrics: this.getPerformanceMetrics(),
      topPerformers: this.getTopPerformers(),
      recentActivity: {
        newVendorsThisMonth: this.vendors.filter(vendor => crypto.randomInt(0, 9) > 7).length, // Simulated
        totalOrdersThisMonth: crypto.randomInt(500, 2499) // Simulated
      },
      marketInsights: this.getMarketInsights()
    };

    return {
      success: true,
      data: stats
    };
  }

  @Get(':id')
  async getVendorById(@Param('id') id: string) {
    const vendor = this.vendors.find(v => v.id === id);

    if (!vendor) {
      return {
        success: false,
        message: 'Vendor not found',
        data: null
      };
    }

    const vendorProducts = this.products.filter(p => p.vendorId === id);
    const recentReviews = this.generateRecentReviews(vendor);
    const similarVendors = this.getSimilarVendors(vendor);

    return {
      success: true,
      data: {
        ...vendor,
        reliabilityScore: this.calculateReliabilityScore(vendor),
        responseTime: this.generateResponseTime(),
        memberSince: this.getTimeAgo(new Date(Date.now() - vendor.yearsInBusiness * 365 * 24 * 60 * 60 * 1000)),
        products: vendorProducts.slice(0, 20), // Show first 20 products
        productCategories: this.getProductCategories(vendorProducts),
        recentReviews,
        similarVendors,
        certifications: this.generateCertifications(vendor),
        paymentTerms: {
          terms: 'Net 30',
          acceptedMethods: ['Credit Card', 'Bank Transfer', 'Check'],
          creditLimit: crypto.randomInt(10000, 59999)
        },
        shippingInfo: {
          freeShippingMinimum: vendor.minimumOrder,
          averageDeliveryTime: crypto.randomInt(2, 7).toString() + ' days',
          shippingMethods: ['Standard', 'Express', 'Overnight']
        },
        analytics: {
          monthlyOrders: crypto.randomInt(20, 119),
          repeatCustomerRate: crypto.randomInt(60, 89),
          profileViews: crypto.randomInt(50, 249)
        }
      }
    };
  }

  @Get(':id/products')
  async getVendorProducts(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit: number,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sortBy', new DefaultValuePipe('name')) sortBy?: 'name' | 'price' | 'popularity'
  ) {
    const vendor = this.vendors.find(v => v.id === id);

    if (!vendor) {
      return {
        success: false,
        message: 'Vendor not found',
        data: null
      };
    }

    let vendorProducts = this.products.filter(p => p.vendorId === id);

    // Apply filters
    if (category) {
      vendorProducts = vendorProducts.filter(product =>
        product.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      vendorProducts = vendorProducts.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price':
        vendorProducts.sort((a, b) => a.price - b.price);
        break;
      case 'popularity':
        vendorProducts.sort((a, b) => b.orderCount - a.orderCount);
        break;
      default: // name
        vendorProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = vendorProducts.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        vendorName: vendor.companyName,
        products: paginatedProducts,
        categories: this.getProductCategories(vendorProducts),
        meta: {
          total: vendorProducts.length,
          page,
          limit,
          totalPages: Math.ceil(vendorProducts.length / limit)
        }
      }
    };
  }

  @Get(':id/reviews')
  async getVendorReviews(@Param('id') id: string) {
    const vendor = this.vendors.find(v => v.id === id);

    if (!vendor) {
      return {
        success: false,
        message: 'Vendor not found',
        data: null
      };
    }

    const reviews = this.generateDetailedReviews(vendor);
    const reviewStats = this.calculateReviewStats(reviews);

    return {
      success: true,
      data: {
        vendorName: vendor.companyName,
        overallRating: vendor.rating,
        totalReviews: vendor.totalReviews,
        reviewStats,
        reviews
      }
    };
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  }

  private calculateReliabilityScore(vendor): number {
    const ratingWeight = 0.3;
    const experienceWeight = 0.3;
    const deliveryWeight = 0.2;
    const reviewsWeight = 0.2;

    const normalizedRating = vendor.rating / 5;
    const normalizedExperience = Math.min(vendor.yearsInBusiness / 10, 1);
    const normalizedDelivery = vendor.stats.onTimeDelivery / 100;
    const normalizedReviews = Math.min(vendor.totalReviews / 50, 1);

    return Math.round(
      (normalizedRating * ratingWeight +
       normalizedExperience * experienceWeight +
       normalizedDelivery * deliveryWeight +
       normalizedReviews * reviewsWeight) * 100
    );
  }

  private generateResponseTime(): string {
    const hours = crypto.randomInt(1, 12);
    return hours <= 4 ? `${hours} hours` : hours <= 8 ? 'Same day' : '1-2 days';
  }

  private getAvailableBusinessTypes(): string[] {
    return [...new Set(this.vendors.map(v => v.businessType))].sort();
  }

  private getAvailableServiceAreas(): string[] {
    const areas = new Set<string>();
    this.vendors.forEach(vendor => {
      vendor.serviceAreas.forEach(area => areas.add(area));
    });
    return Array.from(areas).sort();
  }

  private getAvailableLocations(): string[] {
    return [...new Set(this.vendors.map(v => `${v.address.city}, ${v.address.state}`))].sort();
  }

  private getBusinessTypeDistribution() {
    const typeCounts = new Map();
    this.vendors.forEach(vendor => {
      typeCounts.set(vendor.businessType, (typeCounts.get(vendor.businessType) || 0) + 1);
    });

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getServiceAreaCoverage() {
    const areaCounts = new Map();
    this.vendors.forEach(vendor => {
      vendor.serviceAreas.forEach(area => {
        areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
      });
    });

    return Array.from(areaCounts.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getPerformanceMetrics() {
    return {
      averageOnTimeDelivery: parseFloat((this.vendors.reduce((sum, v) => sum + v.stats.onTimeDelivery, 0) / this.vendors.length).toFixed(1)),
      averageCustomerSatisfaction: parseFloat((this.vendors.reduce((sum, v) => sum + v.stats.customerSatisfaction, 0) / this.vendors.length).toFixed(1)),
      topRatedVendors: this.vendors.filter(v => v.rating >= 4.5).length,
      experiencedVendors: this.vendors.filter(v => v.yearsInBusiness >= 10).length
    };
  }

  private getTopPerformers() {
    return this.vendors
      .sort((a, b) => this.calculateReliabilityScore(b) - this.calculateReliabilityScore(a))
      .slice(0, 5)
      .map(vendor => ({
        id: vendor.id,
        name: vendor.companyName,
        businessType: vendor.businessType,
        rating: vendor.rating,
        reliabilityScore: this.calculateReliabilityScore(vendor),
        yearsInBusiness: vendor.yearsInBusiness
      }));
  }

  private getMarketInsights() {
    return {
      fastestGrowingCategory: 'Food Ingredients',
      mostDemandedServices: ['Same Day Delivery', 'Bulk Orders', 'Custom Packaging'],
      averageOrderValue: Math.round(this.vendors.reduce((sum, v) => sum + v.minimumOrder, 0) / this.vendors.length),
      satisfactionTrend: '+5.2%'
    };
  }

  private generateProductCatalog() {
    type VendorProduct = {
      id: string;
      vendorId: string;
      name: string;
      description: string;
      price: number;
      unit: string;
      category: string;
      inStock: boolean;
      minimumOrder: number;
      orderCount: number;
      image: string;
    };

    const products: VendorProduct[] = [];
    const productNames = [
      'Premium Olive Oil', 'Organic Flour', 'Fresh Basil', 'Tomato Sauce', 'Mozzarella Cheese',
      'Stainless Steel Pan', 'Commercial Oven', 'Food Processor', 'Mixing Bowls',
      'Disposable Plates', 'Paper Cups', 'Takeout Containers', 'Food Wrap',
      'Sanitizer', 'Dish Soap', 'Paper Towels', 'Cleaning Cloths'
    ];

    this.vendors.forEach(vendor => {
      const productCount = crypto.randomInt(10, 39);
      for (let i = 0; i < productCount; i++) {
        products.push({
          id: `${vendor.id}-product-${i + 1}`,
          vendorId: vendor.id,
          name: productNames[crypto.randomInt(0, productNames.length - 1)] + ` ${i + 1}`,
          description: 'High-quality product perfect for restaurant operations.',
          price: parseFloat((crypto.randomInt(500, 10499) / 100).toFixed(2)),
          unit: crypto.randomInt(0, 1) === 0 ? 'case' : 'lb',
          category: vendor.businessType,
          inStock: crypto.randomInt(0, 9) === 0,
          minimumOrder: crypto.randomInt(1, 10),
          orderCount: crypto.randomInt(0, 99),
          image: `https://picsum.photos/250/200?random=${crypto.randomInt(0, 999)}`
        });
      }
    });

    return products;
  }

  private getProductCategories(products: unknown[]) {
    const categories = new Map();
    products.forEach(product => {
      categories.set(product.category, (categories.get(product.category) || 0) + 1);
    });

    return Array.from(categories.entries())
      .map(([category, count]) => ({ category, count }));
  }

  private generateRecentReviews(vendor) {
    const reviewCount = Math.min(vendor.totalReviews, 5);
    return Array.from({ length: reviewCount }, (_, i) => ({
      id: `review-${vendor.id}-${i + 1}`,
      customerName: `Restaurant ${i + 1}`,
      rating: crypto.randomInt(4, 5), // 4 or 5 stars
      comment: 'Excellent service and quality products. Reliable delivery and competitive pricing.',
      date: new Date(Date.now() - crypto.randomInt(0, 89) * 24 * 60 * 60 * 1000),
      verified: crypto.randomInt(0, 9) > 1,
      helpful: crypto.randomInt(0, 9)
    }));
  }

  private getSimilarVendors(vendor) {
    return this.vendors
      .filter(v => v.id !== vendor.id && (
        v.businessType === vendor.businessType ||
        v.serviceAreas.some(area => vendor.serviceAreas.includes(area))
      ))
      .slice(0, 4)
      .map(v => ({
        id: v.id,
        name: v.companyName,
        businessType: v.businessType,
        rating: v.rating,
        totalReviews: v.totalReviews,
        reliabilityScore: this.calculateReliabilityScore(v)
      }));
  }

  private generateCertifications(vendor) {
    const allCertifications = [
      'ISO 9001:2015', 'HACCP Certified', 'FDA Registered', 'USDA Approved',
      'Organic Certified', 'Fair Trade', 'SQF Level 2', 'BRC Certified'
    ];

    return allCertifications
      .filter(() => crypto.randomInt(0, 9) > 5)
      .map(cert => ({
        name: cert,
        issueDate: new Date(Date.now() - crypto.randomInt(0, 1094) * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + crypto.randomInt(0, 729) * 24 * 60 * 60 * 1000),
        isActive: true
      }));
  }

  private generateDetailedReviews(vendor) {
    const reviewCount = Math.min(vendor.totalReviews, 10);
    const reviewTexts = [
      'Outstanding service and product quality. They always deliver on time and their customer service is excellent.',
      'Great supplier with competitive prices. Products are always fresh and well-packaged.',
      'Reliable partner for our restaurant. They understand our needs and provide consistent quality.',
      'Good communication and fast response times. Highly recommend for restaurant supplies.',
      'Quality products and professional service. They have been our go-to supplier for years.'
    ];

    return Array.from({ length: reviewCount }, (_, i) => ({
      id: `detailed-review-${vendor.id}-${i + 1}`,
      customerName: `${crypto.randomInt(0, 1) === 0 ? 'Restaurant' : 'Cafe'} ${String.fromCharCode(65 + i)}`,
      rating: crypto.randomInt(4, 5),
      title: 'Great experience with this vendor',
      comment: reviewTexts[crypto.randomInt(0, reviewTexts.length - 1)],
      date: new Date(Date.now() - crypto.randomInt(0, 364) * 24 * 60 * 60 * 1000),
      verified: crypto.randomInt(0, 9) > 2,
      helpful: crypto.randomInt(0, 14),
      orderValue: crypto.randomInt(500, 5499),
      productsSatisfaction: crypto.randomInt(4, 5),
      deliverySatisfaction: crypto.randomInt(4, 5),
      serviceSatisfaction: crypto.randomInt(4, 5)
    }));
  }

  private calculateReviewStats(reviews: unknown[]) {
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    return {
      ratingDistribution,
      averageProductsSatisfaction: parseFloat((reviews.reduce((sum, r) => sum + (r.productsSatisfaction || 4), 0) / reviews.length).toFixed(1)),
      averageDeliverySatisfaction: parseFloat((reviews.reduce((sum, r) => sum + (r.deliverySatisfaction || 4), 0) / reviews.length).toFixed(1)),
      averageServiceSatisfaction: parseFloat((reviews.reduce((sum, r) => sum + (r.serviceSatisfaction || 4), 0) / reviews.length).toFixed(1)),
      verifiedReviews: reviews.filter(r => r.verified).length,
      totalHelpfulVotes: reviews.reduce((sum, r) => sum + (r.helpful || 0), 0)
    };
  }
}
