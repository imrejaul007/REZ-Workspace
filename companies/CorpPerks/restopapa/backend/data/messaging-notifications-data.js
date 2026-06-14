// Messaging and Notifications Dummy Data
// Comprehensive communication system data for RestaurantHub platform

const messageTypes = ['text', 'image', 'document', 'location', 'order_update', 'system_notification'];
const notificationTypes = ['order', 'payment', 'job', 'message', 'system', 'promotional', 'reminder'];
const messageStatuses = ['sent', 'delivered', 'read', 'failed'];

// Chat Conversations
const conversations = [
  {
    id: "conv-001",
    type: "restaurant_customer",
    participants: [
      {
        id: "rest-001",
        name: "The Golden Spoon",
        role: "restaurant",
        avatar: "/images/restaurants/golden-spoon.jpg",
        online: true
      },
      {
        id: "cust-001", 
        name: "Rajesh Kumar",
        role: "customer",
        avatar: "/images/users/rajesh-kumar.jpg",
        online: false,
        lastSeen: "2025-01-15T13:45:00Z"
      }
    ],
    orderId: "ord-001",
    orderNumber: "RH-2025-001",
    status: "active",
    createdAt: "2025-01-15T12:30:00Z",
    updatedAt: "2025-01-15T13:50:00Z",
    unreadCount: {
      "rest-001": 0,
      "cust-001": 2
    },
    lastMessage: {
      id: "msg-007",
      senderId: "rest-001",
      content: "Your order has been delivered! Thank you for choosing us.",
      timestamp: "2025-01-15T13:50:00Z",
      type: "text"
    }
  },
  {
    id: "conv-002",
    type: "restaurant_employee",
    participants: [
      {
        id: "rest-002",
        name: "Spice Garden",
        role: "restaurant",
        avatar: "/images/restaurants/spice-garden.jpg",
        online: true
      },
      {
        id: "emp-001",
        name: "Amit Singh", 
        role: "employee",
        avatar: "/images/users/amit-singh.jpg",
        online: true
      }
    ],
    jobId: "job-001",
    jobTitle: "Head Chef Position",
    status: "active",
    createdAt: "2025-01-14T09:15:00Z",
    updatedAt: "2025-01-15T14:20:00Z",
    unreadCount: {
      "rest-002": 1,
      "emp-001": 0
    },
    lastMessage: {
      id: "msg-015",
      senderId: "emp-001",
      content: "Thank you for the interview opportunity. I'm very interested in the position.",
      timestamp: "2025-01-15T14:20:00Z", 
      type: "text"
    }
  },
  {
    id: "conv-003",
    type: "employee_employee",
    participants: [
      {
        id: "emp-001",
        name: "Amit Singh",
        role: "employee",
        avatar: "/images/users/amit-singh.jpg",
        online: false,
        lastSeen: "2025-01-15T12:30:00Z"
      },
      {
        id: "emp-002",
        name: "Priya Sharma",
        role: "employee", 
        avatar: "/images/users/priya-sharma.jpg",
        online: true
      }
    ],
    status: "active",
    createdAt: "2025-01-10T16:45:00Z",
    updatedAt: "2025-01-15T11:30:00Z",
    unreadCount: {
      "emp-001": 3,
      "emp-002": 0
    },
    lastMessage: {
      id: "msg-023",
      senderId: "emp-002",
      content: "The interview went really well! Fingers crossed 🤞",
      timestamp: "2025-01-15T11:30:00Z",
      type: "text"
    }
  }
];

// Chat Messages
const messages = [
  // Restaurant-Customer Order Related Messages
  {
    id: "msg-001",
    conversationId: "conv-001",
    senderId: "cust-001",
    senderName: "Rajesh Kumar",
    content: "Hi, I just placed order RH-2025-001. Can you make the butter chicken medium spicy?",
    type: "text",
    timestamp: "2025-01-15T12:35:00Z",
    status: "read",
    readBy: [
      {
        userId: "rest-001",
        readAt: "2025-01-15T12:37:00Z"
      }
    ]
  },
  {
    id: "msg-002", 
    conversationId: "conv-001",
    senderId: "rest-001",
    senderName: "The Golden Spoon",
    content: "Hi Rajesh! Absolutely, we'll make it medium spicy as requested. Your order is confirmed and we'll start preparing it shortly.",
    type: "text", 
    timestamp: "2025-01-15T12:37:00Z",
    status: "read",
    readBy: [
      {
        userId: "cust-001",
        readAt: "2025-01-15T12:38:00Z"
      }
    ]
  },
  {
    id: "msg-003",
    conversationId: "conv-001", 
    senderId: "rest-001",
    senderName: "The Golden Spoon",
    content: "Your order is now being prepared. Estimated time: 25 minutes.",
    type: "order_update",
    timestamp: "2025-01-15T12:50:00Z",
    status: "read",
    orderStatus: "preparing",
    estimatedTime: "25 minutes",
    readBy: [
      {
        userId: "cust-001",
        readAt: "2025-01-15T12:52:00Z"
      }
    ]
  },
  {
    id: "msg-004",
    conversationId: "conv-001",
    senderId: "cust-001", 
    senderName: "Rajesh Kumar",
    content: "Great! Also, can you add extra gravy to the butter chicken?",
    type: "text",
    timestamp: "2025-01-15T13:00:00Z",
    status: "read",
    readBy: [
      {
        userId: "rest-001", 
        readAt: "2025-01-15T13:02:00Z"
      }
    ]
  },
  {
    id: "msg-005",
    conversationId: "conv-001",
    senderId: "rest-001",
    senderName: "The Golden Spoon",
    content: "Sure thing! Extra gravy added to your butter chicken. No additional charges 😊",
    type: "text",
    timestamp: "2025-01-15T13:02:00Z", 
    status: "read",
    readBy: [
      {
        userId: "cust-001",
        readAt: "2025-01-15T13:03:00Z"
      }
    ]
  },
  {
    id: "msg-006",
    conversationId: "conv-001",
    senderId: "rest-001",
    senderName: "The Golden Spoon",
    content: "Your order is ready for pickup/delivery!",
    type: "order_update",
    timestamp: "2025-01-15T13:25:00Z",
    status: "read",
    orderStatus: "ready",
    readBy: [
      {
        userId: "cust-001",
        readAt: "2025-01-15T13:26:00Z"
      }
    ]
  },
  {
    id: "msg-007",
    conversationId: "conv-001",
    senderId: "rest-001",
    senderName: "The Golden Spoon", 
    content: "Your order has been delivered! Thank you for choosing us.",
    type: "order_update",
    timestamp: "2025-01-15T13:50:00Z",
    status: "delivered",
    orderStatus: "delivered"
  },
  
  // Restaurant-Employee Job Related Messages
  {
    id: "msg-008",
    conversationId: "conv-002",
    senderId: "emp-001",
    senderName: "Amit Singh",
    content: "Hello, I'm interested in the Head Chef position you posted. I have 8 years of experience in fine dining.",
    type: "text",
    timestamp: "2025-01-14T09:20:00Z",
    status: "read",
    readBy: [
      {
        userId: "rest-002",
        readAt: "2025-01-14T09:45:00Z"
      }
    ]
  },
  {
    id: "msg-009",
    conversationId: "conv-002", 
    senderId: "rest-002",
    senderName: "Spice Garden",
    content: "Hi Amit! Thank you for your interest. Your profile looks impressive. Would you be available for an interview this week?",
    type: "text",
    timestamp: "2025-01-14T09:45:00Z",
    status: "read",
    readBy: [
      {
        userId: "emp-001",
        readAt: "2025-01-14T10:15:00Z"
      }
    ]
  },
  {
    id: "msg-010",
    conversationId: "conv-002",
    senderId: "emp-001",
    senderName: "Amit Singh",
    content: "Yes, I'm available any day after 2 PM. My current notice period is 30 days.",
    type: "text",
    timestamp: "2025-01-14T10:15:00Z", 
    status: "read",
    readBy: [
      {
        userId: "rest-002",
        readAt: "2025-01-14T11:00:00Z"
      }
    ]
  },
  {
    id: "msg-011",
    conversationId: "conv-002",
    senderId: "rest-002",
    senderName: "Spice Garden",
    content: "Perfect! How about Thursday at 3 PM? We're located at MG Road. I'll share the exact address.",
    type: "text",
    timestamp: "2025-01-14T11:00:00Z",
    status: "read",
    readBy: [
      {
        userId: "emp-001",
        readAt: "2025-01-14T11:30:00Z"
      }
    ]
  },
  {
    id: "msg-012",
    conversationId: "conv-002",
    senderId: "rest-002",
    senderName: "Spice Garden",
    content: "📍 Spice Garden Restaurant, 234 MG Road, Brigade Road Junction, Bangalore - 560025. Look for the red awning!",
    type: "location",
    timestamp: "2025-01-14T11:02:00Z",
    status: "read",
    location: {
      address: "234 MG Road, Brigade Road Junction, Bangalore - 560025",
      coordinates: {
        lat: 12.9716,
        lng: 77.5946
      }
    },
    readBy: [
      {
        userId: "emp-001",
        readAt: "2025-01-14T11:30:00Z"
      }
    ]
  },
  {
    id: "msg-013",
    conversationId: "conv-002",
    senderId: "emp-001",
    senderName: "Amit Singh",
    content: "Thursday 3 PM works perfectly! I'll be there. Should I bring any specific documents?",
    type: "text", 
    timestamp: "2025-01-14T11:30:00Z",
    status: "read",
    readBy: [
      {
        userId: "rest-002",
        readAt: "2025-01-14T12:00:00Z"
      }
    ]
  },
  {
    id: "msg-014",
    conversationId: "conv-002",
    senderId: "rest-002",
    senderName: "Spice Garden",
    content: "Please bring your resume, experience certificates, and a government ID. Looking forward to meeting you!",
    type: "text",
    timestamp: "2025-01-14T12:00:00Z",
    status: "read",
    readBy: [
      {
        userId: "emp-001",
        readAt: "2025-01-15T08:00:00Z"
      }
    ]
  },
  {
    id: "msg-015", 
    conversationId: "conv-002",
    senderId: "emp-001",
    senderName: "Amit Singh",
    content: "Thank you for the interview opportunity. I'm very interested in the position.",
    type: "text",
    timestamp: "2025-01-15T14:20:00Z",
    status: "delivered"
  },

  // Employee-Employee Community Messages
  {
    id: "msg-016",
    conversationId: "conv-003",
    senderId: "emp-002",
    senderName: "Priya Sharma",
    content: "Hey Amit! How did your interview at Spice Garden go?",
    type: "text",
    timestamp: "2025-01-15T10:30:00Z",
    status: "read",
    readBy: [
      {
        userId: "emp-001",
        readAt: "2025-01-15T11:00:00Z"
      }
    ]
  },
  {
    id: "msg-017",
    conversationId: "conv-003", 
    senderId: "emp-001",
    senderName: "Amit Singh",
    content: "It went really well! The head chef position seems perfect for my experience. They said they'll get back to me within a week.",
    type: "text",
    timestamp: "2025-01-15T11:00:00Z",
    status: "read",
    readBy: [
      {
        userId: "emp-002",
        readAt: "2025-01-15T11:15:00Z"
      }
    ]
  },
  {
    id: "msg-018",
    conversationId: "conv-003",
    senderId: "emp-002",
    senderName: "Priya Sharma",
    content: "That's awesome! Spice Garden has a great reputation. What's the salary range they mentioned?",
    type: "text",
    timestamp: "2025-01-15T11:15:00Z",
    status: "read",
    readBy: [
      {
        userId: "emp-001",
        readAt: "2025-01-15T11:20:00Z"
      }
    ]
  },
  {
    id: "msg-019",
    conversationId: "conv-003",
    senderId: "emp-001",
    senderName: "Amit Singh",
    content: "They're offering 65-75k depending on the final evaluation. Plus, they have good benefits like health insurance and performance bonuses.",
    type: "text",
    timestamp: "2025-01-15T11:20:00Z",
    status: "read",
    readBy: [
      {
        userId: "emp-002",
        readAt: "2025-01-15T11:25:00Z"
      }
    ]
  },
  {
    id: "msg-020",
    conversationId: "conv-003",
    senderId: "emp-002", 
    senderName: "Priya Sharma",
    content: "Wow, that's a great offer! I'm also looking for new opportunities. Any openings for sous chef at Spice Garden?",
    type: "text",
    timestamp: "2025-01-15T11:25:00Z",
    status: "read",
    readBy: [
      {
        userId: "emp-001",
        readAt: "2025-01-15T11:28:00Z"
      }
    ]
  },
  {
    id: "msg-021",
    conversationId: "conv-003",
    senderId: "emp-001",
    senderName: "Amit Singh",
    content: "They mentioned they're expanding their kitchen team. I can put in a good word for you if I get selected!",
    type: "text",
    timestamp: "2025-01-15T11:28:00Z",
    status: "read",
    readBy: [
      {
        userId: "emp-002",
        readAt: "2025-01-15T11:30:00Z"
      }
    ]
  },
  {
    id: "msg-022",
    conversationId: "conv-003",
    senderId: "emp-002",
    senderName: "Priya Sharma",
    content: "That would be amazing! Thanks, Amit. Keep me posted on your results.",
    type: "text",
    timestamp: "2025-01-15T11:30:00Z",
    status: "read",
    readBy: [
      {
        userId: "emp-001",
        readAt: "2025-01-15T11:32:00Z"
      }
    ]
  },
  {
    id: "msg-023",
    conversationId: "conv-003",
    senderId: "emp-002",
    senderName: "Priya Sharma",
    content: "The interview went really well! Fingers crossed 🤞",
    type: "text", 
    timestamp: "2025-01-15T11:30:00Z",
    status: "delivered"
  }
];

// Push Notifications
const notifications = [
  {
    id: "notif-001",
    userId: "cust-001",
    userType: "customer",
    type: "order",
    title: "Order Confirmed!",
    body: "Your order #RH-2025-001 from The Golden Spoon has been confirmed.",
    data: {
      orderId: "ord-001",
      orderNumber: "RH-2025-001", 
      restaurantId: "rest-001",
      restaurantName: "The Golden Spoon",
      estimatedTime: "25 minutes",
      orderValue: "₹1,651.60"
    },
    status: "delivered",
    createdAt: "2025-01-15T12:32:00Z",
    deliveredAt: "2025-01-15T12:32:05Z",
    readAt: "2025-01-15T12:35:00Z",
    actionUrl: "/orders/ord-001",
    priority: "high",
    category: "order_updates"
  },
  {
    id: "notif-002",
    userId: "cust-001",
    userType: "customer", 
    type: "order",
    title: "Order Being Prepared",
    body: "Great news! Your order from The Golden Spoon is now being prepared.",
    data: {
      orderId: "ord-001",
      orderNumber: "RH-2025-001",
      restaurantId: "rest-001",
      restaurantName: "The Golden Spoon",
      estimatedTime: "20 minutes",
      status: "preparing"
    },
    status: "delivered",
    createdAt: "2025-01-15T12:50:00Z",
    deliveredAt: "2025-01-15T12:50:03Z",
    readAt: "2025-01-15T12:52:00Z",
    actionUrl: "/orders/ord-001",
    priority: "medium",
    category: "order_updates"
  },
  {
    id: "notif-003",
    userId: "cust-001",
    userType: "customer",
    type: "order",
    title: "Order Ready!",
    body: "Your order #RH-2025-001 is ready for pickup/delivery!",
    data: {
      orderId: "ord-001",
      orderNumber: "RH-2025-001",
      restaurantId: "rest-001", 
      restaurantName: "The Golden Spoon",
      status: "ready",
      deliveryTime: "5 minutes"
    },
    status: "delivered",
    createdAt: "2025-01-15T13:25:00Z",
    deliveredAt: "2025-01-15T13:25:02Z",
    readAt: "2025-01-15T13:26:00Z",
    actionUrl: "/orders/ord-001",
    priority: "high",
    category: "order_updates"
  },
  {
    id: "notif-004",
    userId: "cust-001",
    userType: "customer",
    type: "order",
    title: "Order Delivered!",
    body: "Your order from The Golden Spoon has been successfully delivered. Enjoy your meal!",
    data: {
      orderId: "ord-001",
      orderNumber: "RH-2025-001",
      restaurantId: "rest-001",
      restaurantName: "The Golden Spoon", 
      status: "delivered",
      deliveredAt: "2025-01-15T13:50:00Z"
    },
    status: "delivered",
    createdAt: "2025-01-15T13:50:00Z",
    deliveredAt: "2025-01-15T13:50:01Z",
    actionUrl: "/orders/ord-001",
    priority: "medium",
    category: "order_updates",
    actionButton: {
      text: "Rate Order",
      action: "rate_order"
    }
  },
  {
    id: "notif-005",
    userId: "rest-001",
    userType: "restaurant",
    type: "order", 
    title: "New Order Received!",
    body: "You have a new order #RH-2025-001 from Rajesh Kumar worth ₹1,651.60",
    data: {
      orderId: "ord-001",
      orderNumber: "RH-2025-001",
      customerId: "cust-001",
      customerName: "Rajesh Kumar",
      orderValue: "₹1,651.60",
      items: 3,
      orderType: "delivery"
    },
    status: "delivered",
    createdAt: "2025-01-15T12:30:00Z",
    deliveredAt: "2025-01-15T12:30:02Z",
    readAt: "2025-01-15T12:31:00Z",
    actionUrl: "/dashboard/restaurant/orders/ord-001",
    priority: "urgent",
    category: "new_orders"
  },
  {
    id: "notif-006",
    userId: "emp-001",
    userType: "employee",
    type: "job",
    title: "Job Application Update",
    body: "Spice Garden has viewed your application for Head Chef position.",
    data: {
      jobId: "job-001", 
      jobTitle: "Head Chef",
      restaurantId: "rest-002",
      restaurantName: "Spice Garden",
      applicationStatus: "under_review",
      appliedDate: "2025-01-14T09:20:00Z"
    },
    status: "delivered",
    createdAt: "2025-01-14T09:45:00Z",
    deliveredAt: "2025-01-14T09:45:03Z",
    readAt: "2025-01-14T10:00:00Z",
    actionUrl: "/jobs/job-001/applications",
    priority: "medium",
    category: "job_updates"
  },
  {
    id: "notif-007",
    userId: "emp-001",
    userType: "employee",
    type: "message",
    title: "New Message from Spice Garden",
    body: "You have a new message regarding the Head Chef position.",
    data: {
      conversationId: "conv-002",
      senderId: "rest-002", 
      senderName: "Spice Garden",
      messagePreview: "Hi Amit! Thank you for your interest. Your profile looks impressive...",
      jobId: "job-001"
    },
    status: "delivered",
    createdAt: "2025-01-14T09:45:00Z",
    deliveredAt: "2025-01-14T09:45:05Z",
    readAt: "2025-01-14T10:15:00Z",
    actionUrl: "/messages/conv-002",
    priority: "high",
    category: "messages"
  },
  {
    id: "notif-008",
    userId: "admin-001",
    userType: "admin",
    type: "system",
    title: "Daily Report Ready",
    body: "Platform daily analytics report for January 15, 2025 is now available.",
    data: {
      reportDate: "2025-01-15",
      totalOrders: 156,
      totalRevenue: "₹45,687.50", 
      newRegistrations: 12,
      activeUsers: 1247
    },
    status: "delivered",
    createdAt: "2025-01-16T00:30:00Z",
    deliveredAt: "2025-01-16T00:30:01Z",
    actionUrl: "/dashboard/admin/reports/daily/2025-01-15",
    priority: "low",
    category: "admin_reports"
  },
  {
    id: "notif-009",
    userId: "rest-002",
    userType: "restaurant",
    type: "promotional",
    title: "Boost Your Visibility!",
    body: "Promote your restaurant to reach 25% more customers. Special offer: 20% off on featured listings.",
    data: {
      offerCode: "FEATURE20",
      validUntil: "2025-01-31",
      discountPercent: 20,
      normalPrice: "₹2,500",
      discountedPrice: "₹2,000"
    },
    status: "delivered",
    createdAt: "2025-01-15T10:00:00Z",
    deliveredAt: "2025-01-15T10:00:02Z",
    actionUrl: "/dashboard/restaurant/promotions",
    priority: "low",
    category: "promotions"
  },
  {
    id: "notif-010",
    userId: "emp-002",
    userType: "employee",
    type: "reminder",
    title: "Profile Incomplete",
    body: "Complete your profile to get 3x more job matches. Add your certifications and work experience.",
    data: {
      completionPercentage: 65,
      missingFields: ["certifications", "detailed_work_experience", "skills_assessment"],
      estimatedTime: "10 minutes"
    },
    status: "delivered", 
    createdAt: "2025-01-15T09:00:00Z",
    deliveredAt: "2025-01-15T09:00:01Z",
    actionUrl: "/profile/employee/complete",
    priority: "medium",
    category: "profile_reminders"
  }
];

// Email Notifications
const emailNotifications = [
  {
    id: "email-001",
    userId: "cust-001",
    userType: "customer",
    template: "order_confirmation",
    subject: "Order Confirmation - The Golden Spoon (#RH-2025-001)",
    recipientEmail: "rajesh.kumar@email.com",
    recipientName: "Rajesh Kumar",
    data: {
      orderId: "ord-001",
      orderNumber: "RH-2025-001",
      restaurantName: "The Golden Spoon",
      orderItems: [
        { name: "Butter Chicken", quantity: 2, price: "₹900" },
        { name: "Garlic Naan", quantity: 4, price: "₹340" },
        { name: "Basmati Rice", quantity: 2, price: "₹300" }
      ],
      totalAmount: "₹1,651.60",
      estimatedDeliveryTime: "25 minutes",
      deliveryAddress: "123 MG Road, Koramangala, Bangalore - 560034"
    },
    status: "sent",
    sentAt: "2025-01-15T12:32:30Z",
    deliveredAt: "2025-01-15T12:32:45Z",
    openedAt: "2025-01-15T12:35:20Z",
    clickedAt: "2025-01-15T12:36:00Z"
  },
  {
    id: "email-002",
    userId: "emp-001", 
    userType: "employee",
    template: "interview_confirmation",
    subject: "Interview Confirmation - Head Chef Position at Spice Garden",
    recipientEmail: "amit.singh@email.com",
    recipientName: "Amit Singh",
    data: {
      jobTitle: "Head Chef",
      restaurantName: "Spice Garden",
      interviewDate: "2025-01-17T15:00:00Z",
      interviewLocation: "234 MG Road, Brigade Road Junction, Bangalore - 560025",
      contactPerson: "Restaurant Manager",
      contactPhone: "+91 9876543214",
      documentsRequired: ["Resume", "Experience Certificates", "Government ID"],
      additionalInstructions: "Please arrive 15 minutes early. Look for the red awning."
    },
    status: "sent",
    sentAt: "2025-01-14T12:15:00Z",
    deliveredAt: "2025-01-14T12:15:12Z",
    openedAt: "2025-01-14T13:20:00Z"
  },
  {
    id: "email-003",
    userId: "rest-001",
    userType: "restaurant",
    template: "weekly_report", 
    subject: "Weekly Performance Report - The Golden Spoon (Jan 8-14, 2025)",
    recipientEmail: "owner@goldenspoon.com",
    recipientName: "Golden Spoon Management",
    data: {
      weekPeriod: "January 8-14, 2025",
      totalOrders: 89,
      totalRevenue: "₹26,745.80",
      averageOrderValue: "₹300.51",
      customerRating: 4.6,
      topSellingItems: [
        { name: "Butter Chicken", orders: 23 },
        { name: "Biryani", orders: 19 },
        { name: "Garlic Naan", orders: 31 }
      ],
      newCustomers: 12,
      repeatCustomers: 34,
      recommendations: [
        "Consider promoting your weekend special offers",
        "Your delivery time has improved by 15%",
        "Customer reviews mention excellent food quality"
      ]
    },
    status: "sent",
    sentAt: "2025-01-15T06:00:00Z",
    deliveredAt: "2025-01-15T06:00:08Z",
    openedAt: "2025-01-15T08:30:00Z",
    clickedAt: "2025-01-15T08:32:00Z"
  }
];

// In-App Notification Settings
const notificationSettings = [
  {
    userId: "cust-001",
    userType: "customer",
    preferences: {
      pushNotifications: {
        enabled: true,
        orderUpdates: true,
        promotions: false,
        recommendations: true,
        messages: true
      },
      emailNotifications: {
        enabled: true,
        orderConfirmations: true,
        newsletters: false,
        promotions: false,
        weeklyReports: false
      },
      smsNotifications: {
        enabled: true,
        orderUpdates: true,
        deliveryAlerts: true,
        promotions: false
      },
      inAppNotifications: {
        enabled: true,
        sound: true,
        vibration: true,
        badgeCount: true
      }
    },
    quietHours: {
      enabled: true,
      startTime: "22:00",
      endTime: "08:00",
      timezone: "Asia/Kolkata"
    }
  },
  {
    userId: "rest-001", 
    userType: "restaurant",
    preferences: {
      pushNotifications: {
        enabled: true,
        newOrders: true,
        paymentUpdates: true,
        customerMessages: true,
        systemAlerts: true
      },
      emailNotifications: {
        enabled: true,
        dailyReports: true,
        weeklyReports: true,
        monthlyReports: true,
        systemUpdates: true
      },
      smsNotifications: {
        enabled: false,
        urgentAlerts: true,
        systemMaintenance: true
      },
      inAppNotifications: {
        enabled: true,
        sound: true,
        vibration: false,
        badgeCount: true
      }
    },
    quietHours: {
      enabled: false
    }
  },
  {
    userId: "emp-001",
    userType: "employee",
    preferences: {
      pushNotifications: {
        enabled: true,
        jobMatches: true,
        applicationUpdates: true,
        messages: true,
        networkUpdates: false
      },
      emailNotifications: {
        enabled: true,
        jobAlerts: true,
        applicationConfirmations: true,
        newsletters: true,
        careerTips: true
      },
      smsNotifications: {
        enabled: false,
        interviewReminders: true,
        jobOffers: true
      },
      inAppNotifications: {
        enabled: true,
        sound: false,
        vibration: true,
        badgeCount: true
      }
    },
    quietHours: {
      enabled: true,
      startTime: "20:00",
      endTime: "09:00",
      timezone: "Asia/Kolkata"
    }
  }
];

module.exports = {
  conversations,
  messages,
  notifications,
  emailNotifications,
  notificationSettings,
  messageTypes,
  notificationTypes,
  messageStatuses
};