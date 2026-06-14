// Orders and Payment Management Dummy Data
// Comprehensive order data for RestaurantHub platform

const orderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'refunded'];
const paymentMethods = ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod', 'restaurant_credit'];
const orderTypes = ['dine_in', 'takeaway', 'delivery', 'catering', 'bulk_order'];

// Sample Orders Data
const orders = [
  {
    id: "ord-001",
    orderNumber: "RH-2025-001",
    restaurantId: "rest-001",
    restaurantName: "The Golden Spoon",
    customerId: "cust-001",
    customerName: "Rajesh Kumar",
    customerPhone: "+91 9876543210",
    customerEmail: "rajesh.kumar@email.com",
    orderType: "delivery",
    status: "delivered",
    items: [
      {
        id: "item-001",
        name: "Butter Chicken",
        quantity: 2,
        unitPrice: 450,
        totalPrice: 900,
        customizations: ["Medium spicy", "Extra gravy"],
        category: "Main Course"
      },
      {
        id: "item-002", 
        name: "Garlic Naan",
        quantity: 4,
        unitPrice: 85,
        totalPrice: 340,
        customizations: ["Well cooked"],
        category: "Bread"
      },
      {
        id: "item-003",
        name: "Basmati Rice",
        quantity: 2,
        unitPrice: 150,
        totalPrice: 300,
        customizations: [],
        category: "Rice"
      }
    ],
    subtotal: 1540,
    taxes: {
      gst: 138.60, // 9%
      serviceTax: 77.00, // 5%
      deliveryCharge: 50
    },
    totalAmount: 1805.60,
    discounts: {
      couponCode: "FIRST10",
      couponDiscount: 154.00,
      loyaltyDiscount: 0
    },
    finalAmount: 1651.60,
    paymentMethod: "upi",
    paymentStatus: "completed",
    transactionId: "TXN-RH-001-2025",
    deliveryAddress: {
      street: "123 MG Road",
      area: "Koramangala",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560034",
      landmark: "Near Metro Station"
    },
    orderTime: "2025-01-15T12:30:00Z",
    estimatedDeliveryTime: "2025-01-15T13:30:00Z",
    actualDeliveryTime: "2025-01-15T13:25:00Z",
    specialInstructions: "Please call before delivery",
    rating: {
      foodRating: 4.5,
      deliveryRating: 5.0,
      overallRating: 4.8,
      review: "Excellent food and quick delivery!"
    }
  },
  {
    id: "ord-002",
    orderNumber: "RH-2025-002",
    restaurantId: "rest-002",
    restaurantName: "Spice Garden",
    customerId: "cust-002",
    customerName: "Priya Sharma",
    customerPhone: "+91 9876543211",
    customerEmail: "priya.sharma@email.com",
    orderType: "takeaway",
    status: "ready",
    items: [
      {
        id: "item-004",
        name: "Paneer Tikka Masala",
        quantity: 1,
        unitPrice: 380,
        totalPrice: 380,
        customizations: ["Less spicy"],
        category: "Main Course"
      },
      {
        id: "item-005",
        name: "Kulcha",
        quantity: 2,
        unitPrice: 90,
        totalPrice: 180,
        customizations: ["Butter kulcha"],
        category: "Bread"
      }
    ],
    subtotal: 560,
    taxes: {
      gst: 50.40,
      serviceTax: 28.00,
      deliveryCharge: 0
    },
    totalAmount: 638.40,
    discounts: {
      couponCode: null,
      couponDiscount: 0,
      loyaltyDiscount: 32.00 // 5% loyalty discount
    },
    finalAmount: 606.40,
    paymentMethod: "credit_card",
    paymentStatus: "completed",
    transactionId: "TXN-RH-002-2025",
    orderTime: "2025-01-15T13:15:00Z",
    estimatedPickupTime: "2025-01-15T13:45:00Z",
    specialInstructions: "Pack separately please"
  },
  {
    id: "ord-003",
    orderNumber: "RH-2025-003",
    restaurantId: "rest-003",
    restaurantName: "Coastal Delights",
    customerId: "cust-003",
    customerName: "Arjun Patel",
    customerPhone: "+91 9876543212",
    customerEmail: "arjun.patel@email.com",
    orderType: "dine_in",
    status: "preparing",
    tableNumber: "T-12",
    items: [
      {
        id: "item-006",
        name: "Fish Curry",
        quantity: 2,
        unitPrice: 420,
        totalPrice: 840,
        customizations: ["Coconut based", "Medium spicy"],
        category: "Main Course"
      },
      {
        id: "item-007",
        name: "Appam",
        quantity: 6,
        unitPrice: 35,
        totalPrice: 210,
        customizations: [],
        category: "Bread"
      },
      {
        id: "item-008",
        name: "Solkadhi",
        quantity: 2,
        unitPrice: 80,
        totalPrice: 160,
        customizations: ["Less sweet"],
        category: "Beverage"
      }
    ],
    subtotal: 1210,
    taxes: {
      gst: 108.90,
      serviceTax: 60.50,
      deliveryCharge: 0
    },
    totalAmount: 1379.40,
    discounts: {
      couponCode: "WEEKEND15",
      couponDiscount: 206.91,
      loyaltyDiscount: 0
    },
    finalAmount: 1172.49,
    paymentMethod: "pending",
    paymentStatus: "pending",
    orderTime: "2025-01-15T14:20:00Z",
    estimatedServingTime: "2025-01-15T14:50:00Z",
    specialInstructions: "Anniversary celebration - please add complimentary dessert"
  }
];

// Bulk/Catering Orders
const cateringOrders = [
  {
    id: "cat-ord-001",
    orderNumber: "RH-CAT-001",
    restaurantId: "rest-001",
    restaurantName: "The Golden Spoon",
    clientId: "corp-001",
    clientName: "TechCorp Solutions",
    contactPerson: "HR Manager - Sarah Wilson",
    contactPhone: "+91 9876543213",
    contactEmail: "hr@techcorp.com",
    orderType: "catering",
    eventType: "corporate_lunch",
    guestCount: 50,
    status: "confirmed",
    items: [
      {
        id: "cat-item-001",
        name: "Veg Biryani",
        quantity: 30,
        unitPrice: 220,
        totalPrice: 6600,
        category: "Rice"
      },
      {
        id: "cat-item-002",
        name: "Chicken Biryani", 
        quantity: 20,
        unitPrice: 280,
        totalPrice: 5600,
        category: "Rice"
      },
      {
        id: "cat-item-003",
        name: "Raita",
        quantity: 50,
        unitPrice: 60,
        totalPrice: 3000,
        category: "Accompaniment"
      },
      {
        id: "cat-item-004",
        name: "Gulab Jamun",
        quantity: 50,
        unitPrice: 45,
        totalPrice: 2250,
        category: "Dessert"
      }
    ],
    subtotal: 17450,
    taxes: {
      gst: 1570.50,
      serviceTax: 872.50
    },
    totalAmount: 19893.00,
    discounts: {
      bulkDiscount: 1745.00, // 10% bulk discount
      corporateDiscount: 995.00 // 5% corporate discount
    },
    finalAmount: 17153.00,
    paymentMethod: "net_banking",
    paymentStatus: "advance_paid",
    advanceAmount: 8576.50, // 50% advance
    balanceAmount: 8576.50,
    deliveryAddress: {
      company: "TechCorp Solutions",
      street: "Tech Park, Building A",
      area: "Electronic City",
      city: "Bangalore",
      state: "Karnataka", 
      pincode: "560100",
      contactPerson: "Security Desk"
    },
    eventDate: "2025-01-20",
    deliveryTime: "12:00 PM",
    setupRequired: true,
    servingUtensils: true,
    specialRequests: [
      "Vegetarian and non-vegetarian items to be packed separately",
      "Include serving spoons and plates",
      "Setup buffet table in conference room"
    ],
    orderTime: "2025-01-10T10:30:00Z"
  }
];

// Payment Transactions
const paymentTransactions = [
  {
    id: "txn-001",
    transactionId: "TXN-RH-001-2025",
    orderId: "ord-001",
    amount: 1651.60,
    paymentMethod: "upi",
    paymentGateway: "razorpay",
    gatewayTransactionId: "pay_RZP001234567890",
    status: "success",
    timestamp: "2025-01-15T12:32:15Z",
    paymentDetails: {
      upiId: "rajesh@paytm",
      bankReference: "BNK123456789"
    },
    fees: {
      gatewayFee: 16.52, // 1%
      gst: 2.97 // 18% on gateway fee
    },
    netAmount: 1631.11
  },
  {
    id: "txn-002", 
    transactionId: "TXN-RH-002-2025",
    orderId: "ord-002",
    amount: 606.40,
    paymentMethod: "credit_card",
    paymentGateway: "stripe",
    gatewayTransactionId: "ch_stripe123456789",
    status: "success",
    timestamp: "2025-01-15T13:17:30Z",
    paymentDetails: {
      cardLast4: "4567",
      cardType: "visa",
      cardNetwork: "VISA"
    },
    fees: {
      gatewayFee: 18.19, // 3%
      gst: 3.27
    },
    netAmount: 584.94
  },
  {
    id: "txn-003",
    transactionId: "TXN-RH-CAT-001-ADV",
    orderId: "cat-ord-001", 
    amount: 8576.50,
    paymentMethod: "net_banking",
    paymentGateway: "razorpay",
    gatewayTransactionId: "pay_RZP001234567891",
    status: "success",
    timestamp: "2025-01-10T11:15:00Z",
    paymentDetails: {
      bankName: "HDFC Bank",
      accountType: "current"
    },
    fees: {
      gatewayFee: 85.77,
      gst: 15.44
    },
    netAmount: 8475.29,
    paymentType: "advance",
    balanceAmount: 8576.50
  }
];

// Order Analytics Data
const orderAnalytics = {
  dailyStats: {
    date: "2025-01-15",
    totalOrders: 156,
    totalRevenue: 45687.50,
    averageOrderValue: 292.87,
    ordersByType: {
      delivery: 89,
      takeaway: 34,
      dine_in: 28,
      catering: 5
    },
    ordersByStatus: {
      delivered: 98,
      ready: 12,
      preparing: 18,
      confirmed: 21,
      pending: 5,
      cancelled: 2
    },
    paymentMethodStats: {
      upi: 67,
      credit_card: 34,
      debit_card: 23,
      net_banking: 15,
      wallet: 12,
      cod: 5
    },
    topRestaurants: [
      { id: "rest-001", name: "The Golden Spoon", orders: 23, revenue: 6789.45 },
      { id: "rest-002", name: "Spice Garden", orders: 19, revenue: 5234.80 },
      { id: "rest-003", name: "Coastal Delights", orders: 17, revenue: 4987.30 }
    ],
    peakHours: [
      { hour: "12:00-13:00", orders: 34 },
      { hour: "13:00-14:00", orders: 28 },
      { hour: "19:00-20:00", orders: 31 },
      { hour: "20:00-21:00", orders: 26 }
    ]
  },
  weeklyTrends: {
    week: "2025-01-13 to 2025-01-19",
    dailyOrders: [
      { date: "2025-01-13", orders: 142, revenue: 41234.50 },
      { date: "2025-01-14", orders: 167, revenue: 48921.30 },
      { date: "2025-01-15", orders: 156, revenue: 45687.50 },
      { date: "2025-01-16", orders: 178, revenue: 52341.20 },
      { date: "2025-01-17", orders: 189, revenue: 55678.90 },
      { date: "2025-01-18", orders: 201, revenue: 59234.70 },
      { date: "2025-01-19", orders: 164, revenue: 47892.40 }
    ],
    growthRate: 12.5, // % compared to previous week
    repeatCustomerRate: 34.7,
    averageRating: 4.3
  }
};

// Customer Order History
const customerOrderHistory = [
  {
    customerId: "cust-001",
    customerName: "Rajesh Kumar", 
    email: "rajesh.kumar@email.com",
    phone: "+91 9876543210",
    joinDate: "2024-11-15",
    totalOrders: 23,
    totalSpent: 18456.70,
    averageOrderValue: 802.46,
    favoriteRestaurants: [
      { id: "rest-001", name: "The Golden Spoon", orders: 8 },
      { id: "rest-002", name: "Spice Garden", orders: 6 },
      { id: "rest-004", name: "Urban Bites", orders: 4 }
    ],
    favoriteItems: [
      { name: "Butter Chicken", orders: 6 },
      { name: "Biryani", orders: 5 },
      { name: "Garlic Naan", orders: 8 }
    ],
    loyaltyPoints: 1845,
    membershipTier: "Gold",
    lastOrderDate: "2025-01-15",
    orderFrequency: "2-3 times per week",
    preferredPaymentMethod: "upi",
    dietaryPreferences: ["non-vegetarian"],
    addresses: [
      {
        id: "addr-001",
        type: "home",
        street: "123 MG Road",
        area: "Koramangala", 
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560034",
        isDefault: true
      },
      {
        id: "addr-002",
        type: "office",
        street: "456 Brigade Road",
        area: "Commercial Street",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560025",
        isDefault: false
      }
    ]
  }
];

// Refund and Cancellation Data
const refundsAndCancellations = [
  {
    id: "ref-001",
    orderId: "ord-045",
    orderNumber: "RH-2025-045",
    refundId: "REF-RH-001",
    customerId: "cust-015",
    restaurantId: "rest-007",
    reason: "order_not_delivered",
    refundAmount: 897.50,
    refundStatus: "processed",
    refundMethod: "original_payment_method",
    requestDate: "2025-01-14T15:30:00Z",
    processedDate: "2025-01-14T16:45:00Z",
    refundTransactionId: "REF-TXN-001",
    customerComments: "Order was not delivered despite showing as delivered",
    restaurantResponse: "Delivery partner error - customer entitled to full refund",
    adminNotes: "Full refund approved due to delivery failure"
  },
  {
    id: "ref-002",
    orderId: "ord-067",
    orderNumber: "RH-2025-067",
    refundId: "REF-RH-002",
    customerId: "cust-022",
    restaurantId: "rest-003",
    reason: "food_quality_issue",
    refundAmount: 450.00,
    refundStatus: "approved",
    refundMethod: "restaurant_credit",
    requestDate: "2025-01-13T19:20:00Z",
    processedDate: "2025-01-13T20:10:00Z", 
    refundTransactionId: "REF-TXN-002",
    customerComments: "Food was cold and tasted stale",
    restaurantResponse: "Apologize for the quality issue. Will provide restaurant credit",
    adminNotes: "Partial refund as restaurant credit approved"
  }
];

module.exports = {
  orders,
  cateringOrders,
  paymentTransactions,
  orderAnalytics,
  customerOrderHistory,
  refundsAndCancellations,
  orderStatuses,
  paymentMethods,
  orderTypes
};