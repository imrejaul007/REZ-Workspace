import logger from './utils/logger';

// Master Index for RestoPapa Dummy Data
// Consolidates all dummy data for easy import throughout the application

// Re-export all data from individual files
export * from './comprehensive-dummy-data';
export * from './products-services-data';
export * from './orders-transactions-data';
export * from './additional-system-data';

// Import all data for easy access
import { 
  allDummyCustomers, 
  allDummyVendors, 
  allDummyEmployees, 
  dummyAdmins, 
  allUsers 
} from './comprehensive-dummy-data';

import { 
  allDummyProducts, 
  allProductReviews 
} from './products-services-data';

import { 
  allDummyOrders, 
  orderAnalytics 
} from './orders-transactions-data';

import { 
  allBookings, 
  allWalletTransactions, 
  rewardPrograms, 
  allConversations, 
  allJobListings, 
  systemAnalytics 
} from './additional-system-data';

// Master dataset object
export const RestoPapaData = {
  // Users & Authentication
  users: {
    customers: allDummyCustomers,
    vendors: allDummyVendors,
    employees: allDummyEmployees,
    admins: dummyAdmins,
    all: allUsers,
    stats: {
      totalCustomers: allDummyCustomers.length,
      totalVendors: allDummyVendors.length,
      totalEmployees: allDummyEmployees.length,
      totalAdmins: dummyAdmins.length,
      activeUsers: [...allDummyCustomers, ...dummyAdmins].filter(u => u.isActive).length,
      verifiedVendors: allDummyVendors.filter(v => v.isVerified).length
    }
  },

  // Products & Services
  products: {
    all: allDummyProducts,
    available: allDummyProducts.filter(p => p.isAvailable),
    reviews: allProductReviews,
    stats: {
      totalProducts: allDummyProducts.length,
      availableProducts: allDummyProducts.filter(p => p.isAvailable).length,
      totalReviews: allProductReviews.length,
      averageRating: Math.round((allDummyProducts.reduce((sum, p) => sum + p.ratings.average, 0) / allDummyProducts.length) * 100) / 100,
      topRatedProducts: allDummyProducts
        .sort((a, b) => b.ratings.average - a.ratings.average)
        .slice(0, 10)
    }
  },

  // Orders & Transactions
  orders: {
    all: allDummyOrders,
    analytics: orderAnalytics,
    byStatus: {
      delivered: allDummyOrders.filter(o => o.status === 'delivered'),
      pending: allDummyOrders.filter(o => ['placed', 'confirmed', 'preparing'].includes(o.status)),
      active: allDummyOrders.filter(o => ['out_for_delivery', 'ready'].includes(o.status)),
      cancelled: allDummyOrders.filter(o => o.status === 'cancelled')
    },
    stats: {
      totalOrders: allDummyOrders.length,
      totalRevenue: orderAnalytics.totalRevenue,
      averageOrderValue: orderAnalytics.averageOrderValue,
      completionRate: Math.round((allDummyOrders.filter(o => o.status === 'delivered').length / allDummyOrders.length) * 100),
      customerSatisfaction: Math.round(
        allDummyOrders
          .filter(o => o.ratings)
          .reduce((sum, o) => sum + (o.ratings?.overall || 0), 0) /
        allDummyOrders.filter(o => o.ratings).length * 100
      ) / 100
    }
  },

  // Bookings & Reservations
  bookings: {
    all: allBookings,
    byStatus: {
      confirmed: allBookings.filter(b => b.status === 'confirmed'),
      pending: allBookings.filter(b => b.status === 'pending'),
      completed: allBookings.filter(b => b.status === 'completed'),
      cancelled: allBookings.filter(b => b.status === 'cancelled')
    },
    stats: {
      totalBookings: allBookings.length,
      confirmationRate: Math.round((allBookings.filter(b => b.status === 'confirmed').length / allBookings.length) * 100),
      completionRate: Math.round((allBookings.filter(b => b.status === 'completed').length / allBookings.length) * 100),
      averagePartySize: Math.round(
        allBookings
          .filter(b => b.partySize)
          .reduce((sum, b) => sum + (b.partySize || 0), 0) /
        allBookings.filter(b => b.partySize).length
      ),
      totalRevenue: Math.round(allBookings.reduce((sum, b) => sum + b.totalCost, 0) * 100) / 100
    }
  },

  // Wallets & Rewards
  wallets: {
    transactions: allWalletTransactions,
    rewardPrograms: rewardPrograms,
    stats: {
      totalTransactions: allWalletTransactions.length,
      totalCredits: Math.round(
        allWalletTransactions
          .filter(t => t.type === 'credit')
          .reduce((sum, t) => sum + t.amount, 0) * 100
      ) / 100,
      totalDebits: Math.round(
        allWalletTransactions
          .filter(t => t.type === 'debit')
          .reduce((sum, t) => sum + t.amount, 0) * 100
      ) / 100,
      activeRewards: rewardPrograms.filter(r => r.isActive).length
    }
  },

  // Communication
  communications: {
    conversations: allConversations,
    stats: {
      totalConversations: allConversations.length,
      activeConversations: allConversations.filter(c => c.status === 'active').length,
      averageResponseTime: "2.5 hours", // Simulated metric
      satisfactionRate: 4.6 // Simulated metric
    }
  },

  // Jobs & Employment
  jobs: {
    listings: allJobListings,
    stats: {
      totalJobs: allJobListings.length,
      openPositions: allJobListings.filter(j => j.status === 'open').length,
      totalApplications: allJobListings.reduce((sum, j) => sum + j.applicationCount, 0),
      averageApplicationsPerJob: Math.round(
        allJobListings.reduce((sum, j) => sum + j.applicationCount, 0) / allJobListings.length
      )
    }
  },

  // System Analytics
  analytics: {
    system: systemAnalytics,
    performance: {
      responseTime: "150ms",
      uptime: "99.9%",
      activeUsers: Math.floor(allDummyCustomers.length * 0.3), // 30% active at any time
      peakHours: ["12:00-14:00", "18:00-21:00"],
      popularCuisines: ["Italian", "Chinese", "American", "Mexican", "Indian"],
      topPerformingVendors: orderAnalytics.topVendors.slice(0, 5)
    },
    growth: {
      userGrowth: "+15% this month",
      orderGrowth: "+22% this month",
      revenueGrowth: "+18% this month",
      vendorGrowth: "+8% this month"
    }
  }
};

// Helper functions for data access
export const getDataByRole = (role: 'customer' | 'vendor' | 'employee' | 'admin') => {
  switch (role) {
    case 'customer':
      return {
        orders: allDummyOrders.filter(o => allDummyCustomers.find(c => c.id === o.customerId)),
        bookings: allBookings.filter(b => allDummyCustomers.find(c => c.id === b.customerId)),
        wallet: allWalletTransactions.filter(t => allDummyCustomers.find(c => c.id === t.userId)),
        conversations: allConversations.filter(c => 
          c.participants.some(p => p.userRole === 'customer')
        )
      };
    case 'vendor':
      return {
        orders: allDummyOrders,
        bookings: allBookings,
        products: allDummyProducts,
        jobs: allJobListings,
        conversations: allConversations.filter(c => 
          c.participants.some(p => p.userRole === 'vendor')
        )
      };
    case 'admin':
      return RestoPapaData; // Full access
    default:
      return null;
  }
};

export const getVendorData = (vendorId: string) => {
  const vendor = allDummyVendors.find(v => v.id === vendorId);
  if (!vendor) return null;

  return {
    vendor,
    products: allDummyProducts.filter(p => p.vendorId === vendorId),
    orders: allDummyOrders.filter(o => o.vendorId === vendorId),
    bookings: allBookings.filter(b => b.vendorId === vendorId),
    jobs: allJobListings.filter(j => j.vendorId === vendorId),
    employees: allDummyEmployees.filter(e => e.vendorId === vendorId),
    stats: {
      totalOrders: allDummyOrders.filter(o => o.vendorId === vendorId).length,
      totalRevenue: Math.round(
        allDummyOrders
          .filter(o => o.vendorId === vendorId)
          .reduce((sum, o) => sum + o.totalAmount, 0) * 100
      ) / 100,
      averageRating: vendor.rating,
      totalProducts: allDummyProducts.filter(p => p.vendorId === vendorId).length
    }
  };
};

export const getCustomerData = (customerId: string) => {
  const customer = allDummyCustomers.find(c => c.id === customerId);
  if (!customer) return null;

  return {
    customer,
    orders: allDummyOrders.filter(o => o.customerId === customerId),
    bookings: allBookings.filter(b => b.customerId === customerId),
    walletTransactions: allWalletTransactions.filter(t => t.userId === customerId),
    conversations: allConversations.filter(c => 
      c.participants.some(p => p.userId === customerId)
    ),
    stats: {
      totalOrders: allDummyOrders.filter(o => o.customerId === customerId).length,
      totalSpent: Math.round(
        allDummyOrders
          .filter(o => o.customerId === customerId)
          .reduce((sum, o) => sum + o.totalAmount, 0) * 100
      ) / 100,
      favoriteVendors: allDummyOrders
        .filter(o => o.customerId === customerId)
        .reduce((acc, order) => {
          acc[order.vendorId] = (acc[order.vendorId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    }
  };
};

// Export summary statistics
export const SYSTEM_SUMMARY = {
  totalRecords: 
    allDummyCustomers.length + 
    allDummyVendors.length + 
    allDummyEmployees.length + 
    dummyAdmins.length +
    allDummyProducts.length +
    allDummyOrders.length +
    allBookings.length +
    allWalletTransactions.length +
    allConversations.length +
    allJobListings.length,
    
  breakdown: {
    users: allDummyCustomers.length + allDummyVendors.length + allDummyEmployees.length + dummyAdmins.length,
    products: allDummyProducts.length,
    orders: allDummyOrders.length,
    bookings: allBookings.length,
    transactions: allWalletTransactions.length,
    conversations: allConversations.length,
    jobs: allJobListings.length
  },
  
  status: "✅ Complete dummy data system ready for testing and demo",
  lastUpdated: new Date().toISOString()
};

logger.info("🎉 RestoPapa Complete Dummy Data System Loaded!");
logger.info(`📊 Total Records: ${SYSTEM_SUMMARY.totalRecords.toLocaleString()}`);
console.log("📋 Breakdown:", SYSTEM_SUMMARY.breakdown);
console.log(SYSTEM_SUMMARY.status);