// Analytics and Reporting Dummy Data
// Comprehensive analytics data for RestaurantHub platform dashboard

// Platform-wide Analytics
const platformAnalytics = {
  overview: {
    totalUsers: 12847,
    totalRestaurants: 1247,
    totalEmployees: 8932,
    totalVendors: 1845,
    totalOrders: 45678,
    totalRevenue: 2847392.50,
    monthlyGrowthRate: 15.7,
    userRetentionRate: 73.4,
    averageOrderValue: 312.45,
    platformCommission: 284739.25, // 10% of revenue
    lastUpdated: "2025-01-15T23:59:59Z"
  },
  
  userGrowth: {
    monthly: [
      { month: "2024-07", users: 5234, restaurants: 567, employees: 3421, vendors: 890 },
      { month: "2024-08", users: 6127, restaurants: 678, employees: 4102, vendors: 1034 },
      { month: "2024-09", users: 7298, restaurants: 789, employees: 4823, vendors: 1187 },
      { month: "2024-10", users: 8542, restaurants: 901, employees: 5634, vendors: 1345 },
      { month: "2024-11", users: 9867, restaurants: 1023, employees: 6578, vendors: 1498 },
      { month: "2024-12", users: 11234, restaurants: 1156, employees: 7654, vendors: 1672 },
      { month: "2025-01", users: 12847, restaurants: 1247, employees: 8932, vendors: 1845 }
    ],
    weekly: [
      { week: "2025-W01", newUsers: 234, newRestaurants: 12, newEmployees: 156, newVendors: 23 },
      { week: "2025-W02", newUsers: 267, newRestaurants: 15, newEmployees: 178, newVendors: 28 },
      { week: "2025-W03", newUsers: 298, newRestaurants: 18, newEmployees: 201, newVendors: 31 }
    ]
  },

  revenueAnalytics: {
    monthly: [
      { month: "2024-07", revenue: 1234567.80, orders: 23456, avgOrderValue: 287.45 },
      { month: "2024-08", revenue: 1456789.90, orders: 27834, avgOrderValue: 295.67 },
      { month: "2024-09", revenue: 1678934.50, orders: 31245, avgOrderValue: 302.34 },
      { month: "2024-10", revenue: 1934567.20, orders: 35678, avgOrderValue: 298.76 },
      { month: "2024-11", revenue: 2198765.40, orders: 39876, avgOrderValue: 305.89 },
      { month: "2024-12", revenue: 2456782.90, orders: 42134, avgOrderValue: 309.12 },
      { month: "2025-01", revenue: 2847392.50, orders: 45678, avgOrderValue: 312.45 }
    ],
    byCategory: {
      foodOrders: { revenue: 2278714.00, percentage: 80.0 },
      marketplaceProducts: { revenue: 427115.25, percentage: 15.0 },
      services: { revenue: 113847.63, percentage: 4.0 },
      jobPostings: { revenue: 27715.62, percentage: 1.0 }
    },
    commissionEarnings: {
      restaurants: 227871.40, // 10% of food orders
      marketplace: 64067.29,  // 15% of marketplace
      services: 17077.14,     // 15% of services
      jobs: 5543.12          // 20% of job postings
    }
  },

  geographyAnalytics: {
    topCities: [
      { city: "Bangalore", users: 3847, restaurants: 378, orders: 12456, revenue: 856789.50 },
      { city: "Mumbai", users: 2934, restaurants: 298, orders: 9832, revenue: 678932.40 },
      { city: "Delhi", users: 2567, restaurants: 245, orders: 8765, revenue: 589734.20 },
      { city: "Chennai", users: 1876, restaurants: 178, orders: 6543, revenue: 445632.80 },
      { city: "Hyderabad", users: 1623, restaurants: 148, orders: 5432, revenue: 376245.60 }
    ],
    stateDistribution: [
      { state: "Karnataka", percentage: 30.2, users: 3889 },
      { state: "Maharashtra", percentage: 23.8, users: 3065 },
      { state: "Delhi", percentage: 18.6, users: 2391 },
      { state: "Tamil Nadu", percentage: 15.4, users: 1978 },
      { state: "Telangana", percentage: 12.0, users: 1542 }
    ]
  }
};

// Restaurant Analytics
const restaurantAnalytics = {
  "rest-001": {
    restaurantId: "rest-001",
    restaurantName: "The Golden Spoon",
    overview: {
      totalOrders: 1247,
      totalRevenue: 389456.70,
      avgOrderValue: 312.45,
      customerRating: 4.6,
      deliveryRating: 4.4,
      repeatCustomerRate: 68.5,
      monthlyGrowth: 18.7,
      activeMenuItems: 45,
      popularityRank: 3
    },
    
    salesTrends: {
      daily: [
        { date: "2025-01-09", orders: 23, revenue: 7234.50 },
        { date: "2025-01-10", orders: 19, revenue: 5976.30 },
        { date: "2025-01-11", orders: 27, revenue: 8456.70 },
        { date: "2025-01-12", orders: 31, revenue: 9687.90 },
        { date: "2025-01-13", orders: 25, revenue: 7821.40 },
        { date: "2025-01-14", orders: 29, revenue: 9045.60 },
        { date: "2025-01-15", orders: 33, revenue: 10312.80 }
      ],
      hourlyDistribution: [
        { hour: "08:00", orders: 2, avgWaitTime: 15 },
        { hour: "09:00", orders: 3, avgWaitTime: 12 },
        { hour: "10:00", orders: 4, avgWaitTime: 14 },
        { hour: "11:00", orders: 6, avgWaitTime: 16 },
        { hour: "12:00", orders: 18, avgWaitTime: 22 },
        { hour: "13:00", orders: 15, avgWaitTime: 19 },
        { hour: "14:00", orders: 8, avgWaitTime: 14 },
        { hour: "15:00", orders: 4, avgWaitTime: 11 },
        { hour: "16:00", orders: 3, avgWaitTime: 10 },
        { hour: "17:00", orders: 5, avgWaitTime: 13 },
        { hour: "18:00", orders: 8, avgWaitTime: 16 },
        { hour: "19:00", orders: 21, avgWaitTime: 25 },
        { hour: "20:00", orders: 19, avgWaitTime: 23 },
        { hour: "21:00", orders: 12, avgWaitTime: 18 },
        { hour: "22:00", orders: 6, avgWaitTime: 14 }
      ]
    },

    menuAnalytics: {
      topSellingItems: [
        { 
          itemId: "item-001", 
          name: "Butter Chicken", 
          orders: 187, 
          revenue: 84150.00, 
          profitMargin: 65.2,
          avgRating: 4.8,
          customerFeedback: "Most loved dish"
        },
        { 
          itemId: "item-002", 
          name: "Chicken Biryani", 
          orders: 156, 
          revenue: 62400.00, 
          profitMargin: 58.7,
          avgRating: 4.7,
          customerFeedback: "Authentic flavors"
        },
        { 
          itemId: "item-003", 
          name: "Garlic Naan", 
          orders: 234, 
          revenue: 19890.00, 
          profitMargin: 72.3,
          avgRating: 4.6,
          customerFeedback: "Perfect with curry"
        }
      ],
      categoryPerformance: [
        { category: "Main Course", orders: 567, revenue: 246780.00, avgRating: 4.6 },
        { category: "Bread", orders: 432, revenue: 36720.00, avgRating: 4.5 },
        { category: "Rice", orders: 298, revenue: 44700.00, avgRating: 4.4 },
        { category: "Appetizers", orders: 234, revenue: 35100.00, avgRating: 4.3 },
        { category: "Desserts", orders: 178, revenue: 17800.00, avgRating: 4.7 }
      ],
      itemPerformance: {
        lowPerforming: [
          { name: "Fish Tikka", orders: 12, revenue: 2400.00, rating: 3.8 },
          { name: "Mutton Curry", orders: 18, revenue: 7200.00, rating: 3.9 }
        ],
        trending: [
          { name: "Paneer Tikka", orders: 67, growth: "+45%", rating: 4.5 },
          { name: "Dal Makhani", orders: 89, growth: "+32%", rating: 4.4 }
        ]
      }
    },

    customerAnalytics: {
      demographics: {
        ageGroups: [
          { range: "18-25", percentage: 28.4, orders: 354 },
          { range: "26-35", percentage: 42.7, orders: 532 },
          { range: "36-45", percentage: 19.8, orders: 247 },
          { range: "46-55", percentage: 7.1, orders: 89 },
          { range: "55+", percentage: 2.0, orders: 25 }
        ],
        orderPatterns: [
          { type: "lunch", percentage: 45.2, avgValue: 285.60 },
          { type: "dinner", percentage: 38.9, avgValue: 356.80 },
          { type: "weekend_special", percentage: 15.9, avgValue: 425.70 }
        ]
      },
      loyaltyMetrics: {
        newCustomers: 234,
        returningCustomers: 412,
        loyalCustomers: 156, // 5+ orders
        customerLifetimeValue: 1247.80,
        churnRate: 12.4,
        referralRate: 8.7
      },
      feedbackSummary: {
        totalReviews: 456,
        averageRating: 4.6,
        ratingDistribution: {
          "5": 267,
          "4": 134,
          "3": 38,
          "2": 12,
          "1": 5
        },
        commonPraise: ["Great taste", "Quick delivery", "Good portion size"],
        commonComplaints: ["Delivery delay during peak hours", "Packaging could be better"]
      }
    },

    operationalMetrics: {
      fulfillmentStats: {
        avgPreparationTime: 18.5, // minutes
        avgDeliveryTime: 32.4, // minutes
        onTimeDeliveryRate: 89.7, // percentage
        orderAccuracy: 96.3, // percentage
        cancellationRate: 2.8 // percentage
      },
      staffProductivity: {
        avgOrdersPerHour: 12.8,
        peakHourCapacity: 25,
        staffEfficiencyScore: 87.5,
        customerServiceRating: 4.4
      },
      inventoryInsights: {
        stockTurnovers: [
          { item: "Chicken", turnoverRate: 8.2, stockLevel: "adequate" },
          { item: "Basmati Rice", turnoverRate: 6.7, stockLevel: "low" },
          { item: "Paneer", turnoverRate: 5.4, stockLevel: "adequate" }
        ],
        wastageMetrics: {
          totalWastage: 3.2, // percentage
          costOfWastage: 2847.60,
          mainWasteItems: ["Vegetables", "Dairy products"]
        }
      }
    },

    financialMetrics: {
      revenueBreakdown: {
        foodSales: 350811.03, // 90%
        deliveryCharges: 19472.84, // 5%
        taxes: 19472.84 // 5%
      },
      costStructure: {
        rawMaterials: 155755.52, // 40%
        laborCosts: 77877.76, // 20%
        operationalCosts: 38938.88, // 10%
        platformCommission: 38945.67, // 10%
        netProfit: 77938.87 // 20%
      },
      profitabilityTrends: [
        { month: "2024-10", netProfit: 67845.30, margin: 18.2 },
        { month: "2024-11", netProfit: 72156.80, margin: 19.1 },
        { month: "2024-12", netProfit: 75432.90, margin: 19.8 },
        { month: "2025-01", netProfit: 77938.87, margin: 20.0 }
      ]
    }
  }
};

// Employee Analytics
const employeeAnalytics = {
  "emp-001": {
    employeeId: "emp-001",
    employeeName: "Amit Singh",
    profileAnalytics: {
      profileCompleteness: 92,
      profileViews: 234,
      jobApplications: 12,
      interviewsScheduled: 4,
      jobOffers: 1,
      networkConnections: 56,
      skillsEndorsements: 23,
      communityPosts: 8,
      helpfulVotes: 34
    },
    
    jobSearchActivity: {
      searchesPerWeek: 15,
      averageTimeOnPlatform: 45, // minutes
      mostViewedJobCategories: [
        { category: "Head Chef", views: 34 },
        { category: "Sous Chef", views: 28 },
        { category: "Kitchen Manager", views: 19 }
      ],
      applicationSuccessRate: 33.3, // 4 interviews from 12 applications
      responseRate: 75.0 // 9 responses from 12 applications
    },

    skillsAnalysis: {
      topSkills: [
        { skill: "Indian Cuisine", proficiency: 95, endorsements: 8 },
        { skill: "Menu Planning", proficiency: 88, endorsements: 6 },
        { skill: "Kitchen Management", proficiency: 90, endorsements: 7 },
        { skill: "Food Safety", proficiency: 92, endorsements: 5 }
      ],
      improvementAreas: [
        { skill: "Continental Cuisine", currentLevel: 65, targetLevel: 80 },
        { skill: "Cost Management", currentLevel: 70, targetLevel: 85 }
      ],
      certifications: [
        { name: "Food Safety Manager", issuer: "ServSafe", validUntil: "2026-06-15" },
        { name: "Culinary Arts Diploma", issuer: "Institute of Culinary Arts", year: "2018" }
      ]
    },

    careerProgression: {
      experienceLevel: "Senior",
      yearsOfExperience: 8,
      currentSalaryRange: "60000-80000",
      targetSalaryRange: "70000-90000",
      careerGoals: ["Head Chef", "Restaurant Owner"],
      skillGaps: ["Business Management", "P&L Management"],
      recommendedCourses: [
        "Restaurant Business Management",
        "Advanced Continental Cuisine",
        "Leadership in Kitchen"
      ]
    }
  },

  platformWideEmployeeMetrics: {
    totalActiveProfiles: 8932,
    profileCompletenessAvg: 67.8,
    avgJobApplicationsPerUser: 8.5,
    avgInterviewsPerUser: 2.3,
    jobPlacementRate: 34.7,
    avgSalaryIncrease: 18.5,
    
    skillsTrending: [
      { skill: "Digital Menu Management", demand: 89, growth: "+45%" },
      { skill: "Food Delivery Operations", demand: 76, growth: "+38%" },
      { skill: "Sustainable Cooking", demand: 64, growth: "+52%" }
    ],
    
    jobMarketInsights: {
      inDemandPositions: [
        { position: "Delivery Manager", openings: 67, avgSalary: 45000 },
        { position: "Sous Chef", openings: 54, avgSalary: 55000 },
        { position: "Restaurant Manager", openings: 43, avgSalary: 70000 }
      ],
      skillsGap: [
        { skill: "Digital Payment Systems", gap: 67 },
        { skill: "Cloud Kitchen Operations", gap: 54 },
        { skill: "Multi-cuisine Expertise", gap: 48 }
      ]
    }
  }
};

// Marketplace Analytics
const marketplaceAnalytics = {
  overview: {
    totalProducts: 2847,
    totalVendors: 1845,
    totalCategories: 12,
    totalTransactions: 5634,
    totalRevenue: 427115.25,
    avgOrderValue: 75.76,
    vendorSatisfactionScore: 4.3,
    buyerSatisfactionScore: 4.1
  },

  categoryPerformance: [
    {
      categoryId: "cat-001",
      categoryName: "Raw Materials & Ingredients",
      products: 245,
      vendors: 89,
      monthlyRevenue: 156782.40,
      avgOrderValue: 187.50,
      growthRate: 23.4,
      topProducts: [
        { name: "Premium Basmati Rice", sales: 67, revenue: 167500.00 },
        { name: "Organic Spices Mix", sales: 54, revenue: 43200.00 }
      ]
    },
    {
      categoryId: "cat-002", 
      categoryName: "Kitchen Equipment",
      products: 189,
      vendors: 67,
      monthlyRevenue: 89456.70,
      avgOrderValue: 473.20,
      growthRate: 18.7,
      topProducts: [
        { name: "Commercial Gas Burner", sales: 23, revenue: 115000.00 },
        { name: "Industrial Mixer", sales: 12, revenue: 84000.00 }
      ]
    }
  ],

  vendorAnalytics: {
    "vendor-001": {
      vendorId: "vendor-001",
      vendorName: "Metro Food Supplies",
      performance: {
        totalSales: 234567.80,
        totalOrders: 1234,
        avgOrderValue: 190.15,
        customerRating: 4.6,
        fulfillmentRate: 96.8,
        deliveryTime: 2.3, // days average
        returnRate: 2.1
      },
      productCatalog: {
        totalProducts: 156,
        activeProducts: 142,
        featuredProducts: 12,
        categoriesServed: 8,
        newProductsThisMonth: 7
      },
      businessGrowth: {
        monthlyGrowthRate: 15.7,
        repeatCustomerRate: 68.4,
        revenueGrowth: 234.5, // percentage YoY
        marketShare: 8.9 // percentage in food supplies
      }
    }
  },

  buyerBehaviorAnalytics: {
    purchasePatterns: [
      { day: "Monday", orders: 156, avgValue: 87.50 },
      { day: "Tuesday", orders: 134, avgValue: 92.30 },
      { day: "Wednesday", orders: 178, avgValue: 78.90 },
      { day: "Thursday", orders: 198, avgValue: 101.20 },
      { day: "Friday", orders: 234, avgValue: 95.60 },
      { day: "Saturday", orders: 189, avgValue: 112.40 },
      { day: "Sunday", orders: 123, avgValue: 89.70 }
    ],
    seasonalTrends: [
      { season: "Festival Season", demand: "+45%", topCategories: ["Ingredients", "Decorations"] },
      { season: "Summer", demand: "+28%", topCategories: ["Beverages", "Cooling Equipment"] },
      { season: "Monsoon", demand: "-12%", topCategories: ["Indoor Equipment"] }
    ],
    paymentPreferences: [
      { method: "Net Banking", percentage: 34.5 },
      { method: "UPI", percentage: 28.7 },
      { method: "Credit Card", percentage: 19.8 },
      { method: "Payment on Delivery", percentage: 17.0 }
    ]
  }
};

// System Performance Analytics
const systemAnalytics = {
  performance: {
    serverUptime: 99.97,
    averageResponseTime: 145, // milliseconds
    apiCallsPerMinute: 2847,
    databaseQueryTime: 23, // milliseconds
    errorRate: 0.03, // percentage
    activeConnections: 1567,
    peakTrafficTime: "19:00-21:00"
  },

  userEngagement: {
    dailyActiveUsers: 5634,
    weeklyActiveUsers: 28456,
    monthlyActiveUsers: 89234,
    avgSessionDuration: 18.5, // minutes
    pageViewsPerSession: 12.3,
    bounceRate: 23.4,
    userRetentionRates: {
      day1: 78.5,
      day7: 45.2,
      day30: 32.1
    }
  },

  featureUsage: [
    { feature: "Order Management", usage: 89.7, satisfaction: 4.5 },
    { feature: "Marketplace", usage: 67.4, satisfaction: 4.2 },
    { feature: "Job Portal", usage: 54.8, satisfaction: 4.3 },
    { feature: "Messaging", usage: 78.9, satisfaction: 4.4 },
    { feature: "Analytics Dashboard", usage: 45.6, satisfaction: 4.6 },
    { feature: "AI Assistant", usage: 23.4, satisfaction: 4.1 }
  ],

  mobileUsage: {
    mobileTrafficPercentage: 78.9,
    averageMobileSessionTime: 12.4, // minutes
    mobileAppRating: 4.3,
    pushNotificationOpenRate: 34.7,
    mobileConversionRate: 23.8
  }
};

// Financial Reports
const financialReports = {
  monthlyReport: {
    month: "January 2025",
    totalRevenue: 2847392.50,
    totalExpenses: 1708435.50,
    netProfit: 1138957.00,
    profitMargin: 40.0,
    
    revenueStreams: [
      { stream: "Restaurant Commissions", amount: 2278714.00, percentage: 80.0 },
      { stream: "Marketplace Commissions", amount: 427115.25, percentage: 15.0 },
      { stream: "Job Posting Fees", amount: 113847.63, percentage: 4.0 },
      { stream: "Premium Subscriptions", amount: 27715.62, percentage: 1.0 }
    ],
    
    expenses: [
      { category: "Technology Infrastructure", amount: 341687.10, percentage: 20.0 },
      { category: "Staff Salaries", amount: 512605.65, percentage: 30.0 },
      { category: "Marketing & Advertising", amount: 170843.55, percentage: 10.0 },
      { category: "Operations", amount: 341687.10, percentage: 20.0 },
      { category: "Customer Support", amount: 170843.55, percentage: 10.0 },
      { category: "Legal & Compliance", amount: 85421.78, percentage: 5.0 },
      { category: "Others", amount: 85346.77, percentage: 5.0 }
    ],
    
    keyMetrics: {
      customerAcquisitionCost: 156.78,
      customerLifetimeValue: 1247.50,
      paybackPeriod: 7.9, // months
      churnRate: 12.4,
      revenuePerUser: 221.67
    }
  },

  quarterlyProjections: {
    q2_2025: {
      projectedRevenue: 8742177.50,
      projectedGrowthRate: 18.5,
      expectedNewUsers: 3456,
      targetProfitMargin: 42.0,
      investmentRequired: 567890.00
    }
  }
};

module.exports = {
  platformAnalytics,
  restaurantAnalytics,
  employeeAnalytics,
  marketplaceAnalytics,
  systemAnalytics,
  financialReports
};