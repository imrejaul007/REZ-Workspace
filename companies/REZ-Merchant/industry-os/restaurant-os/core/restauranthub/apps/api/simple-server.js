import logger from './utils/logger';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.API_PORT || 5555;

// Security Headers - Helmet middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health check endpoint
  skip: (req) => req.path === '/api/v1/health'
});

// Strict rate limiting for auth-related endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for sensitive endpoints
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// CORS Configuration - Restrict to specific domains
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://restopapa.com',
  'https://www.restopapa.com',
  'https://app.restopapa.com',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400 // 24 hours
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mock data
const mockRestaurants = [
  {
    id: '1',
    name: 'Spicy Delight',
    description: 'Authentic Indian cuisine with traditional spices',
    cuisineType: ['Indian', 'Vegetarian'],
    address: 'MG Road, Bangalore',
    phone: '+91-9876543210',
    email: 'contact@spicydelight.com',
    rating: 4.5,
    totalReviews: 128,
    isActive: true,
    openingHours: '10:00 AM - 11:00 PM'
  },
  {
    id: '2',
    name: 'Pizza Corner',
    description: 'Fresh Italian pizza made with authentic ingredients',
    cuisineType: ['Italian', 'Pizza'],
    address: 'Brigade Road, Bangalore',
    phone: '+91-9876543211',
    email: 'info@pizzacorner.com',
    rating: 4.2,
    totalReviews: 95,
    isActive: true,
    openingHours: '11:00 AM - 12:00 AM'
  },
  {
    id: '3',
    name: 'Dragon Palace',
    description: 'Delicious Chinese cuisine with modern twist',
    cuisineType: ['Chinese', 'Asian'],
    address: 'Commercial Street, Bangalore',
    phone: '+91-9876543212',
    email: 'orders@dragonpalace.com',
    rating: 4.7,
    totalReviews: 156,
    isActive: true,
    openingHours: '12:00 PM - 11:30 PM'
  }
];

const mockJobs = [
  {
    id: '1',
    title: 'Senior Chef',
    description: 'Looking for an experienced chef to lead our kitchen team',
    restaurantName: 'Spicy Delight',
    location: 'Bangalore',
    salary: '₹40,000 - ₹60,000',
    type: 'FULL_TIME',
    experienceRequired: '3-5 years',
    skills: ['Indian Cuisine', 'Team Leadership', 'Menu Planning'],
    postedDate: '2024-01-15',
    isActive: true
  },
  {
    id: '2',
    title: 'Pizza Maker',
    description: 'Experienced pizza maker for busy restaurant',
    restaurantName: 'Pizza Corner',
    location: 'Bangalore',
    salary: '₹25,000 - ₹35,000',
    type: 'FULL_TIME',
    experienceRequired: '1-3 years',
    skills: ['Pizza Making', 'Dough Preparation', 'Italian Cuisine'],
    postedDate: '2024-01-10',
    isActive: true
  },
  {
    id: '3',
    title: 'Waiter/Waitress',
    description: 'Friendly and professional waiter needed',
    restaurantName: 'Dragon Palace',
    location: 'Bangalore',
    salary: '₹18,000 - ₹25,000',
    type: 'FULL_TIME',
    experienceRequired: '0-2 years',
    skills: ['Customer Service', 'Communication', 'Multi-tasking'],
    postedDate: '2024-01-12',
    isActive: true
  }
];

const mockVendors = [
  {
    id: '1',
    name: 'Fresh Farm Supplies',
    category: 'Vegetables & Fruits',
    description: 'Premium quality farm-fresh vegetables and fruits',
    contact: '+91-9876543213',
    email: 'orders@freshfarm.com',
    location: 'Whitefield, Bangalore',
    rating: 4.6,
    isVerified: true
  },
  {
    id: '2',
    name: 'Spice Masters',
    category: 'Spices & Seasonings',
    description: 'Authentic Indian spices and seasonings wholesale supplier',
    contact: '+91-9876543214',
    email: 'info@spicemasters.com',
    location: 'KR Market, Bangalore',
    rating: 4.8,
    isVerified: true
  }
];

const mockCommunityPosts = [
  {
    id: '1',
    title: 'Best practices for inventory management',
    content: 'Share your tips for managing restaurant inventory efficiently...',
    author: 'Chef Priya',
    authorRole: 'Head Chef',
    restaurant: 'Spicy Delight',
    likes: 25,
    comments: 8,
    tags: ['inventory', 'management', 'tips'],
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'New dessert recipe ideas',
    content: 'Looking for innovative dessert recipes to add to our menu...',
    author: 'Manager Raj',
    authorRole: 'Restaurant Manager',
    restaurant: 'Pizza Corner',
    likes: 18,
    comments: 12,
    tags: ['desserts', 'recipes', 'menu'],
    createdAt: '2024-01-14T15:45:00Z'
  }
];

const mockDashboardStats = {
  totalRestaurants: 3,
  totalJobs: 3,
  totalVendors: 2,
  totalUsers: 156,
  activeRestaurants: 3,
  pendingApplications: 7,
  recentActivity: [
    { type: 'job_posted', message: 'New job posted: Senior Chef at Spicy Delight', time: '2 hours ago' },
    { type: 'restaurant_joined', message: 'Dragon Palace joined the platform', time: '1 day ago' },
    { type: 'vendor_verified', message: 'Spice Masters verified successfully', time: '2 days ago' }
  ]
};

// API Routes
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', message: 'RestoPapa API is running', timestamp: new Date().toISOString() });
});

app.get('/api/v1/restaurants', (req, res) => {
  res.json({
    success: true,
    data: mockRestaurants,
    total: mockRestaurants.length
  });
});

app.get('/api/v1/restaurants/:id', (req, res) => {
  const restaurant = mockRestaurants.find(r => r.id === req.params.id);
  if (restaurant) {
    res.json({ success: true, data: restaurant });
  } else {
    res.status(404).json({ success: false, message: 'Restaurant not found' });
  }
});

app.get('/api/v1/jobs', (req, res) => {
  res.json({
    success: true,
    data: mockJobs,
    total: mockJobs.length
  });
});

app.get('/api/v1/jobs/:id', (req, res) => {
  const job = mockJobs.find(j => j.id === req.params.id);
  if (job) {
    res.json({ success: true, data: job });
  } else {
    res.status(404).json({ success: false, message: 'Job not found' });
  }
});

app.get('/api/v1/vendors', (req, res) => {
  res.json({
    success: true,
    data: mockVendors,
    total: mockVendors.length
  });
});

app.get('/api/v1/community/posts', (req, res) => {
  res.json({
    success: true,
    data: mockCommunityPosts,
    total: mockCommunityPosts.length
  });
});

app.get('/api/v1/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: mockDashboardStats
  });
});

// Marketplace endpoints (vendors/products)
app.get('/api/v1/marketplace/vendors', (req, res) => {
  res.json({
    success: true,
    data: mockVendors,
    total: mockVendors.length
  });
});

app.get('/api/v1/marketplace/products', (req, res) => {
  const mockProducts = [
    {
      id: '1',
      name: 'Organic Tomatoes',
      category: 'Vegetables',
      price: '₹80/kg',
      vendor: 'Fresh Farm Supplies',
      description: 'Fresh organic tomatoes from local farms',
      image: '/images/tomatoes.jpg'
    },
    {
      id: '2',
      name: 'Premium Basmati Rice',
      category: 'Grains',
      price: '₹120/kg',
      vendor: 'Spice Masters',
      description: 'High-quality basmati rice perfect for biryanis',
      image: '/images/rice.jpg'
    }
  ];

  res.json({
    success: true,
    data: mockProducts,
    total: mockProducts.length
  });
});

// User/Profile endpoints
app.get('/api/v1/users/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'ADMIN',
      restaurant: 'Spicy Delight',
      joinedDate: '2023-12-01'
    }
  });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/v1/health',
      'GET /api/v1/restaurants',
      'GET /api/v1/jobs',
      'GET /api/v1/vendors',
      'GET /api/v1/community/posts',
      'GET /api/v1/dashboard/stats',
      'GET /api/v1/marketplace/vendors',
      'GET /api/v1/marketplace/products'
    ]
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 RestoPapa API Server running on http://localhost:${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  logger.info(`🍽️  Restaurants: http://localhost:${PORT}/api/v1/restaurants`);
  logger.info(`💼 Jobs: http://localhost:${PORT}/api/v1/jobs`);
  logger.info(`🏪 Vendors: http://localhost:${PORT}/api/v1/vendors`);
  logger.info(`💬 Community: http://localhost:${PORT}/api/v1/community/posts`);
});