import logger from './utils/logger';

// Additional System Data: Bookings, Wallets, Chats, Jobs, Analytics
// Comprehensive dummy data for remaining modules

import { allDummyCustomers, allDummyVendors, allDummyEmployees } from './comprehensive-dummy-data';
import { allDummyOrders } from './orders-transactions-data';

// BOOKINGS & RESERVATIONS
export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vendorId: string;
  vendorName: string;
  serviceType: 'table_reservation' | 'appointment' | 'service_booking' | 'event_booking';
  date: string;
  time: string;
  duration: number; // in minutes
  partySize?: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled';
  specialRequests?: string;
  assignedStaff?: {
    id: string;
    name: string;
    role: string;
  };
  tableNumber?: string;
  roomNumber?: string;
  services?: string[];
  totalCost: number;
  deposit?: number;
  paymentStatus: 'paid' | 'pending' | 'partial' | 'refunded';
  confirmationCode: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reminderSent?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  rating?: {
    service: number;
    ambiance: number;
    overall: number;
    comment?: string;
  };
}

export const generateBookings = (count: number = 150): Booking[] => {
  const bookings: Booking[] = [];
  const serviceTypes: Booking['serviceType'][] = ['table_reservation', 'appointment', 'service_booking', 'event_booking'];
  const statuses: Booking['status'][] = ['confirmed', 'pending', 'cancelled', 'completed', 'no_show', 'rescheduled'];

  for (let i = 0; i < count; i++) {
    const customer = allDummyCustomers[Math.floor(Math.random() * allDummyCustomers.length)];
    const vendor = allDummyVendors[Math.floor(Math.random() * allDummyVendors.length)];
    const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate booking date (next 30 days)
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + Math.floor(Math.random() * 30));
    
    // Generate time slots
    const hours = Math.floor(Math.random() * 12) + 10; // 10 AM - 10 PM
    const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const booking: Booking = {
      id: `booking_${String(i + 1).padStart(4, '0')}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.mobile,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      serviceType,
      date: bookingDate.toISOString().split('T')[0],
      time,
      duration: serviceType === 'table_reservation' ? 90 + Math.floor(Math.random() * 60) : // 90-150 min
                serviceType === 'appointment' ? 30 + Math.floor(Math.random() * 90) : // 30-120 min
                serviceType === 'service_booking' ? 60 + Math.floor(Math.random() * 120) : // 60-180 min
                180 + Math.floor(Math.random() * 240), // 180-420 min for events
      partySize: serviceType === 'table_reservation' ? Math.floor(Math.random() * 8) + 1 : undefined,
      status,
      specialRequests: Math.random() > 0.6 ? [
        "Window seat preferred", "Birthday celebration", "Quiet corner", "High chair needed",
        "Dietary restrictions", "Anniversary dinner", "Business meeting", "Wheelchair accessible"
      ][Math.floor(Math.random() * 8)] : undefined,
      assignedStaff: Math.random() > 0.3 ? {
        id: `emp_${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
        name: ["Alex Johnson", "Maria Garcia", "David Kim", "Sarah Wilson", "Mike Chen"][Math.floor(Math.random() * 5)],
        role: serviceType === 'table_reservation' ? 'Server' : 'Service Provider'
      } : undefined,
      tableNumber: serviceType === 'table_reservation' ? `Table ${Math.floor(Math.random() * 20) + 1}` : undefined,
      roomNumber: serviceType === 'service_booking' ? `Room ${Math.floor(Math.random() * 10) + 1}` : undefined,
      services: serviceType === 'service_booking' ? [
        "Massage", "Facial", "Haircut", "Manicure", "Pedicure", "Consultation"
      ].slice(0, Math.floor(Math.random() * 3) + 1) : undefined,
      totalCost: Math.round((20 + Math.random() * 180) * 100) / 100,
      deposit: Math.random() > 0.7 ? Math.round((10 + Math.random() * 30) * 100) / 100 : undefined,
      paymentStatus: ['paid', 'pending', 'partial', 'refunded'][Math.floor(Math.random() * 4)] as unknown,
      confirmationCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
      notes: Math.random() > 0.8 ? "Please call 15 minutes before arrival" : undefined,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      reminderSent: Math.random() > 0.3,
      checkInTime: status === 'completed' ? `${hours}:${minutes.toString().padStart(2, '0')}` : undefined,
      checkOutTime: undefined, // Will be set after booking object is created
      rating: status === 'completed' && Math.random() > 0.4 ? {
        service: Math.floor(Math.random() * 2) + 4,
        ambiance: Math.floor(Math.random() * 2) + 4,
        overall: Math.floor(Math.random() * 2) + 4,
        comment: Math.random() > 0.5 ? [
          "Great service!", "Loved the ambiance", "Will come again", 
          "Perfect for our occasion", "Exceeded expectations"
        ][Math.floor(Math.random() * 5)] : undefined
      } : undefined
    };

    bookings.push(booking);
  }

  return bookings.sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime());
};

// WALLETS & REWARDS SYSTEM
export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  category: 'cashback' | 'refund' | 'reward' | 'bonus' | 'payment' | 'withdrawal' | 'transfer';
  amount: number;
  currency: 'USD';
  description: string;
  orderId?: string;
  referenceId?: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  createdAt: string;
  expiresAt?: string;
}

export interface RewardProgram {
  id: string;
  name: string;
  type: 'cashback' | 'points' | 'tier' | 'referral';
  description: string;
  conditions: {
    minSpend?: number;
    validDays?: number;
    maxReward?: number;
    vendorIds?: string[];
  };
  reward: {
    percentage?: number;
    fixedAmount?: number;
    pointsPerDollar?: number;
  };
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

export const generateWalletTransactions = (count: number = 500): WalletTransaction[] => {
  const transactions: WalletTransaction[] = [];
  const categories: WalletTransaction['category'][] = ['cashback', 'refund', 'reward', 'bonus', 'payment', 'withdrawal'];
  const descriptions = {
    cashback: ["Order cashback", "Weekly cashback bonus", "Special promotion cashback"],
    refund: ["Order refund", "Cancelled order refund", "Service refund"],
    reward: ["Loyalty points converted", "Birthday bonus", "Welcome bonus"],
    bonus: ["Referral bonus", "First order bonus", "Review bonus"],
    payment: ["Order payment", "Booking payment", "Service payment"],
    withdrawal: ["Bank transfer", "Cash withdrawal", "Payment to vendor"]
  };

  for (let i = 0; i < count; i++) {
    const user = allDummyCustomers[Math.floor(Math.random() * allDummyCustomers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const type: 'credit' | 'debit' = ['cashback', 'refund', 'reward', 'bonus'].includes(category) ? 'credit' : 
      Math.random() > 0.5 ? 'credit' : 'debit';
    
    const transactionDate = new Date();
    transactionDate.setDate(transactionDate.getDate() - Math.floor(Math.random() * 90));

    const transaction: WalletTransaction = {
      id: `wallet_txn_${String(i + 1).padStart(4, '0')}`,
      userId: user.id,
      type,
      category,
      amount: Math.round((type === 'credit' ? 
        Math.random() * 50 + 1 : // Credit: $1-$50
        Math.random() * 100 + 5) * 100) / 100, // Debit: $5-$105
      currency: 'USD',
      description: descriptions[category][Math.floor(Math.random() * descriptions[category].length)],
      orderId: Math.random() > 0.4 ? `order_${String(Math.floor(Math.random() * 250) + 1).padStart(4, '0')}` : undefined,
      referenceId: `ref_${Math.random().toString(36).substr(2, 9)}`,
      status: Math.random() > 0.05 ? 'completed' : ['pending', 'failed'][Math.floor(Math.random() * 2)] as unknown,
      createdAt: transactionDate.toISOString(),
      expiresAt: category === 'reward' && Math.random() > 0.5 ? 
        new Date(transactionDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString() : undefined
    };

    transactions.push(transaction);
  }

  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const rewardPrograms: RewardProgram[] = [
  {
    id: "reward_001",
    name: "Cashback Rewards",
    type: "cashback",
    description: "Earn 5% cashback on every order",
    conditions: { minSpend: 25 },
    reward: { percentage: 5 },
    isActive: true,
    validFrom: "2023-01-01",
    validUntil: "2024-12-31"
  },
  {
    id: "reward_002", 
    name: "Loyalty Points",
    type: "points",
    description: "Earn 10 points per dollar spent",
    conditions: {},
    reward: { pointsPerDollar: 10 },
    isActive: true,
    validFrom: "2023-01-01",
    validUntil: "2024-12-31"
  },
  {
    id: "reward_003",
    name: "Weekend Bonus",
    type: "cashback", 
    description: "Extra 3% cashback on weekend orders",
    conditions: { validDays: 2, maxReward: 15 },
    reward: { percentage: 3 },
    isActive: true,
    validFrom: "2023-06-01",
    validUntil: "2024-06-01"
  }
];

// CHAT & NOTIFICATIONS
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'vendor' | 'support' | 'system';
  message: string;
  messageType: 'text' | 'image' | 'file' | 'order_update' | 'system_notification';
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
    size: number;
  }[];
  timestamp: string;
  isRead: boolean;
  isDelivered: boolean;
  orderId?: string;
  bookingId?: string;
}

export interface Conversation {
  id: string;
  participants: {
    userId: string;
    userName: string;
    userRole: 'customer' | 'vendor' | 'support';
    avatar: string;
    isOnline: boolean;
    lastSeen?: string;
  }[];
  title: string;
  type: 'customer_vendor' | 'customer_support' | 'group';
  status: 'active' | 'archived' | 'closed';
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  orderId?: string;
  bookingId?: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  type: 'order_update' | 'payment_update' | 'booking_reminder' | 'promotional' | 'system_alert' | 'reward_earned';
  title: string;
  message: string;
  data?;
  isRead: boolean;
  readAt?: string;
  actionButton?: {
    text: string;
    action: string;
    url?: string;
  };
  imageUrl?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'order' | 'payment' | 'booking' | 'promotion' | 'system' | 'reward';
  createdAt: string;
  expiresAt?: string;
}

// JOB LISTINGS & APPLICATIONS  
export interface JobListing {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description: string;
  department: 'kitchen' | 'service' | 'delivery' | 'management' | 'cleaning' | 'security';
  position: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
  experience: 'entry' | 'mid' | 'senior' | 'executive';
  salary: {
    min: number;
    max: number;
    currency: 'USD';
    period: 'hourly' | 'monthly' | 'annually';
  };
  requirements: string[];
  benefits: string[];
  skills: string[];
  workingHours: {
    start: string;
    end: string;
    daysPerWeek: number;
    flexibility: boolean;
  };
  location: {
    address: string;
    city: string;
    state: string;
    remote: boolean;
  };
  applicationCount: number;
  status: 'open' | 'closed' | 'paused' | 'filled';
  urgency: 'low' | 'medium' | 'high';
  postedAt: string;
  closingDate: string;
  interviewProcess: string[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  resume: {
    url: string;
    fileName: string;
  };
  coverLetter?: string;
  experience: {
    position: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  skills: string[];
  availability: {
    startDate: string;
    workingHours: string[];
    flexibleSchedule: boolean;
  };
  expectedSalary?: {
    amount: number;
    period: 'hourly' | 'monthly' | 'annually';
  };
  status: 'submitted' | 'under_review' | 'shortlisted' | 'interview_scheduled' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  appliedAt: string;
  updatedAt: string;
  notes?: string;
  interviewDate?: string;
  interviewFeedback?: {
    rating: number;
    comments: string;
    interviewer: string;
  };
}

// Export all generated data
export const allBookings = generateBookings(150);
export const allWalletTransactions = generateWalletTransactions(500);

// Generate chat conversations (simplified)
export const generateConversations = (count: number = 100): Conversation[] => {
  return Array.from({ length: count }, (_, i) => {
    const customer = allDummyCustomers[Math.floor(Math.random() * allDummyCustomers.length)];
    const vendor = allDummyVendors[Math.floor(Math.random() * allDummyVendors.length)];
    
    return {
      id: `conv_${String(i + 1).padStart(3, '0')}`,
      participants: [
        {
          userId: customer.id,
          userName: customer.name,
          userRole: 'customer' as const,
          avatar: customer.profilePicture,
          isOnline: Math.random() > 0.5,
          lastSeen: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined
        },
        {
          userId: `vendor_user_${vendor.id}`,
          userName: vendor.businessName,
          userRole: 'vendor' as const,
          avatar: vendor.logo,
          isOnline: Math.random() > 0.3,
          lastSeen: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString() : undefined
        }
      ],
      title: `Order inquiry - ${vendor.businessName}`,
      type: 'customer_vendor' as const,
      status: ['active', 'archived', 'closed'][Math.floor(Math.random() * 3)] as unknown,
      lastMessage: [
        "Thanks for your order!", "When will my order be ready?", "Is delivery available?",
        "Can I modify my order?", "Great service, thank you!", "Order confirmed"
      ][Math.floor(Math.random() * 6)],
      lastMessageAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      unreadCount: Math.floor(Math.random() * 5),
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as unknown,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  });
};

// Generate job listings
export const generateJobListings = (count: number = 50): JobListing[] => {
  const jobTitles = [
    "Head Chef", "Line Cook", "Server", "Bartender", "Delivery Driver",
    "Restaurant Manager", "Host/Hostess", "Kitchen Assistant", "Dishwasher",
    "Food Prep Cook", "Cashier", "Barista", "Cleaning Staff"
  ];

  return Array.from({ length: count }, (_, i) => {
    const vendor = allDummyVendors[Math.floor(Math.random() * allDummyVendors.length)];
    const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const postedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    return {
      id: `job_${String(i + 1).padStart(3, '0')}`,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      title,
      description: `We are looking for a skilled ${title.toLowerCase()} to join our team at ${vendor.businessName}. The ideal candidate should have experience in the food service industry and a passion for excellent customer service.`,
      department: ['kitchen', 'service', 'delivery', 'management'][Math.floor(Math.random() * 4)] as unknown,
      position: title,
      employmentType: ['full_time', 'part_time', 'contract'][Math.floor(Math.random() * 3)] as unknown,
      experience: ['entry', 'mid', 'senior'][Math.floor(Math.random() * 3)] as unknown,
      salary: {
        min: 15 + Math.floor(Math.random() * 10),
        max: 25 + Math.floor(Math.random() * 15),
        currency: 'USD',
        period: 'hourly' as const
      },
      requirements: [
        "Previous restaurant experience preferred",
        "Excellent communication skills",
        "Ability to work in fast-paced environment",
        "Flexible schedule availability"
      ],
      benefits: [
        "Health insurance", "Paid time off", "Employee discounts",
        "Training provided", "Career advancement opportunities"
      ],
      skills: [
        "Customer service", "Team work", "Time management",
        "Food safety knowledge", "Cash handling"
      ],
      workingHours: {
        start: "10:00",
        end: "22:00",
        daysPerWeek: 5 + Math.floor(Math.random() * 2),
        flexibility: Math.random() > 0.5
      },
      location: {
        address: vendor.address.street,
        city: vendor.address.city,
        state: vendor.address.state,
        remote: false
      },
      applicationCount: Math.floor(Math.random() * 25),
      status: ['open', 'closed', 'paused'][Math.floor(Math.random() * 3)] as unknown,
      urgency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as unknown,
      postedAt: postedDate.toISOString(),
      closingDate: new Date(postedDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      interviewProcess: ["Phone screening", "In-person interview", "Reference check"]
    };
  });
};

export const allConversations = generateConversations(100);
export const allJobListings = generateJobListings(50);

// Analytics Summary
export const systemAnalytics = {
  users: {
    total: allDummyCustomers.length,
    active: allDummyCustomers.filter(u => u.isActive).length,
    newThisMonth: Math.floor(allDummyCustomers.length * 0.15)
  },
  vendors: {
    total: allDummyVendors.length,
    verified: allDummyVendors.filter(v => v.isVerified).length,
    newThisMonth: Math.floor(allDummyVendors.length * 0.1)
  },
  orders: {
    total: allDummyOrders.length,
    thisMonth: Math.floor(allDummyOrders.length * 0.3),
    revenue: Math.round(allDummyOrders.reduce((sum, order) => sum + order.totalAmount, 0)),
    avgOrderValue: Math.round(allDummyOrders.reduce((sum, order) => sum + order.totalAmount, 0) / allDummyOrders.length)
  },
  bookings: {
    total: allBookings.length,
    confirmed: allBookings.filter(b => b.status === 'confirmed').length,
    completed: allBookings.filter(b => b.status === 'completed').length
  }
};

logger.info("Generated comprehensive system data:");
logger.info(`- ${allBookings.length} bookings`);
logger.info(`- ${allWalletTransactions.length} wallet transactions`); 
logger.info(`- ${allConversations.length} conversations`);
logger.info(`- ${allJobListings.length} job listings`);