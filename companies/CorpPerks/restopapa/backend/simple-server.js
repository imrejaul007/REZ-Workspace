import logger from './utils/logger';

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Import all dummy data
const marketplaceData = require('./data/marketplace-data.js');
const restaurantData = require('./data/restaurant-data.js');
const servicesData = require('./data/services-data.js');
const ordersData = require('./data/orders-data.js');
const messagingData = require('./data/messaging-notifications-data.js');
const analyticsData = require('./data/analytics-reporting-data.js');

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Security headers middleware
app.use((req, res, next) => {
  // Hide server information
  res.removeHeader('X-Powered-By');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
});

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Apply rate limiting
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', generalLimiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://www.your-domain.com']
    : ['http://localhost:3000', 'http://localhost:3006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mock database - In real app, use actual database
const users = [
  {
    id: 'admin-1',
    email: 'admin@resturistan.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    name: 'Admin User',
    isActive: true,
    isEmailVerified: true
  },
  {
    id: 'restaurant-1', 
    email: 'restaurant@resturistan.com',
    passwordHash: bcrypt.hashSync('restaurant123', 10),
    role: 'restaurant',
    name: 'Restaurant Owner',
    isActive: true,
    isEmailVerified: true,
    companyName: 'Sample Restaurant'
  },
  {
    id: 'employee-1',
    email: 'employee@resturistan.com', 
    passwordHash: bcrypt.hashSync('employee123', 10),
    role: 'employee',
    name: 'Employee User',
    isActive: true,
    isEmailVerified: true
  },
  {
    id: 'vendor-1',
    email: 'vendor@resturistan.com',
    passwordHash: bcrypt.hashSync('vendor123', 10),
    role: 'vendor', 
    name: 'Vendor User',
    isActive: true,
    isEmailVerified: true,
    companyName: 'Sample Vendor'
  }
];

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Restaurant SaaS API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Return user data (without password hash)
    const { passwordHash, ...userData } = user;
    
    res.json({
      user: userData,
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, role, name, companyName } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ message: 'Email, password, role, and name are required' });
    }

    // Check if user exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: `${role}-${Date.now()}`,
      email,
      passwordHash,
      role,
      name,
      companyName: companyName || null,
      isActive: true,
      isEmailVerified: false
    };

    users.push(newUser);

    // Generate token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Return user data (without password hash)
    const { passwordHash: _, ...userData } = newUser;
    
    res.status(201).json({
      user: userData,
      token,
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/v1/auth/profile', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { passwordHash, ...userData } = user;
    res.json(userData);

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mock data has been replaced with comprehensive dummy data from imported files

// API Routes

// Jobs API
app.get('/api/v1/jobs', (req, res) => {
  const { search, location, type, experience, category, salaryMin, salaryMax, limit = 20, offset = 0 } = req.query;
  let filteredJobs = [...marketplaceData.jobListings];

  if (search) {
    filteredJobs = filteredJobs.filter(job => 
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase()) ||
      job.requirements.some(req => req.toLowerCase().includes(search.toLowerCase()))
    );
  }

  if (location) {
    filteredJobs = filteredJobs.filter(job => 
      job.location.city.toLowerCase().includes(location.toLowerCase()) ||
      job.location.state.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (type) {
    filteredJobs = filteredJobs.filter(job => job.jobType === type);
  }

  if (experience) {
    filteredJobs = filteredJobs.filter(job => job.experienceLevel === experience);
  }

  if (category) {
    filteredJobs = filteredJobs.filter(job => job.category === category);
  }

  if (salaryMin) {
    filteredJobs = filteredJobs.filter(job => job.salary.min >= parseInt(salaryMin));
  }

  if (salaryMax) {
    filteredJobs = filteredJobs.filter(job => job.salary.max <= parseInt(salaryMax));
  }

  // Apply pagination
  const total = filteredJobs.length;
  const paginatedJobs = filteredJobs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.json({
    success: true,
    data: paginatedJobs,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

app.get('/api/v1/jobs/:id', (req, res) => {
  const job = marketplaceData.jobListings.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  res.json({ success: true, data: job });
});

app.post('/api/v1/jobs', authenticateToken, (req, res) => {
  const newJob = {
    id: `job-${Date.now()}`,
    ...req.body,
    postedBy: req.user.id,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    applications: 0
  };
  marketplaceData.jobListings.push(newJob);
  res.status(201).json({ success: true, data: newJob });
});

// Products API  
app.get('/api/v1/products', (req, res) => {
  const { search, category, vendor, minPrice, maxPrice } = req.query;
  let filteredProducts = [...mockProducts];

  if (search) {
    filteredProducts = filteredProducts.filter(product => 
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (category) {
    filteredProducts = filteredProducts.filter(product => product.category === category);
  }

  if (vendor) {
    filteredProducts = filteredProducts.filter(product => 
      product.vendor.businessName.toLowerCase().includes(vendor.toLowerCase())
    );
  }

  if (minPrice) {
    filteredProducts = filteredProducts.filter(product => product.price >= parseFloat(minPrice));
  }

  if (maxPrice) {
    filteredProducts = filteredProducts.filter(product => product.price <= parseFloat(maxPrice));
  }

  res.json({
    products: filteredProducts,
    total: filteredProducts.length
  });
});

app.get('/api/v1/products/:id', (req, res) => {
  const product = mockProducts.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

// Orders API
app.get('/api/v1/orders', authenticateToken, (req, res) => {
  const { status, type, limit = 20, offset = 0 } = req.query;
  let userOrders = [...ordersData.orders];
  
  // Filter by user role
  if (req.user.role === 'restaurant') {
    userOrders = userOrders.filter(order => order.restaurantId === req.user.id);
  } else if (req.user.role === 'customer') {
    userOrders = userOrders.filter(order => order.customerId === req.user.id);
  }
  
  if (status) {
    userOrders = userOrders.filter(order => order.status === status);
  }
  
  if (type) {
    userOrders = userOrders.filter(order => order.orderType === type);
  }
  
  // Apply pagination
  const total = userOrders.length;
  const paginatedOrders = userOrders.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: paginatedOrders,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

app.get('/api/v1/orders/:id', authenticateToken, (req, res) => {
  const order = ordersData.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

app.post('/api/v1/orders', authenticateToken, (req, res) => {
  const newOrder = {
    id: `ord-${Date.now()}`,
    orderNumber: `RH-${new Date().getFullYear()}-${String(ordersData.orders.length + 1).padStart(3, '0')}`,
    customerId: req.user.id,
    ...req.body,
    status: 'pending',
    paymentStatus: 'pending',
    orderTime: new Date().toISOString()
  };
  ordersData.orders.push(newOrder);
  res.status(201).json({ success: true, data: newOrder });
});

// Comprehensive Marketplace API
app.get('/api/v1/marketplace/products', (req, res) => {
  const { category, search, vendor, minPrice, maxPrice, limit = 50, offset = 0 } = req.query;
  let products = [...marketplaceData.products];

  // Apply filters
  if (category) {
    products = products.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (search) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (vendor) {
    products = products.filter(p => p.vendor.name.toLowerCase().includes(vendor.toLowerCase()));
  }
  if (minPrice) {
    products = products.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    products = products.filter(p => p.price <= parseFloat(maxPrice));
  }

  // Apply pagination
  const total = products.length;
  const paginatedProducts = products.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.json({ 
    success: true, 
    data: paginatedProducts,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

app.get('/api/v1/marketplace/categories', (req, res) => {
  res.json({ success: true, data: marketplaceData.categories });
});

app.get('/api/v1/marketplace/vendors', (req, res) => {
  res.json({ success: true, data: marketplaceData.vendorProfiles });
});

// Dashboard Analytics API
app.get('/api/v1/dashboard/stats', authenticateToken, (req, res) => {
  const { role } = req.user;
  
  let stats = {};
  
  if (role === 'admin') {
    stats = {
      ...analyticsData.platformAnalytics.overview,
      recentActivity: [
        { type: 'user_registered', message: 'New restaurant registered', time: '2 hours ago' },
        { type: 'job_posted', message: 'New job posted by The Golden Spoon', time: '4 hours ago' },
        { type: 'order_placed', message: 'New order placed', time: '6 hours ago' }
      ]
    };
  } else if (role === 'restaurant') {
    const restaurantId = req.user.id;
    const restaurantStats = analyticsData.restaurantAnalytics[restaurantId] || analyticsData.restaurantAnalytics['rest-001'];
    stats = {
      ...restaurantStats.overview,
      recentOrders: ordersData.orders.slice(0, 5).map(order => ({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        amount: order.finalAmount,
        status: order.status,
        time: new Date(order.orderTime).toLocaleString()
      })),
      salesTrend: restaurantStats.salesTrends.daily
    };
  } else if (role === 'employee') {
    const employeeId = req.user.id;
    const employeeStats = analyticsData.employeeAnalytics[employeeId] || analyticsData.employeeAnalytics['emp-001'];
    stats = {
      ...employeeStats.profileAnalytics,
      ...employeeStats.jobSearchActivity,
      recentActivity: [
        { type: 'application_sent', message: 'Applied to Head Chef position', time: '2 days ago' },
        { type: 'profile_viewed', message: 'Your profile was viewed by Spice Garden', time: '3 days ago' }
      ]
    };
  } else if (role === 'vendor') {
    const vendorStats = analyticsData.marketplaceAnalytics.vendorAnalytics['vendor-001'];
    stats = {
      ...vendorStats.performance,
      ...vendorStats.productCatalog,
      recentOrders: ordersData.orders.slice(0, 3).map(order => ({
        orderNumber: order.orderNumber,
        customer: order.restaurantName,
        amount: order.finalAmount,
        time: new Date(order.orderTime).toLocaleString()
      }))
    };
  }

  res.json({ success: true, data: stats });
});

// Add comprehensive analytics endpoints
app.get('/api/v1/analytics/platform', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  res.json({ success: true, data: analyticsData.platformAnalytics });
});

app.get('/api/v1/analytics/restaurant/:restaurantId', authenticateToken, (req, res) => {
  const { restaurantId } = req.params;
  const stats = analyticsData.restaurantAnalytics[restaurantId];
  
  if (!stats) {
    return res.status(404).json({ success: false, message: 'Restaurant analytics not found' });
  }
  
  res.json({ success: true, data: stats });
});

app.get('/api/v1/analytics/marketplace', authenticateToken, (req, res) => {
  res.json({ success: true, data: analyticsData.marketplaceAnalytics });
});

// Restaurant profiles and menus
app.get('/api/v1/restaurants', (req, res) => {
  const { search, cuisine, location, rating, limit = 20, offset = 0 } = req.query;
  let restaurants = [...restaurantData.restaurantProfiles];
  
  if (search) {
    restaurants = restaurants.filter(r => 
      r.businessName.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (cuisine) {
    restaurants = restaurants.filter(r => r.cuisine.includes(cuisine));
  }
  
  if (location) {
    restaurants = restaurants.filter(r => 
      r.location.city.toLowerCase().includes(location.toLowerCase())
    );
  }
  
  if (rating) {
    restaurants = restaurants.filter(r => r.rating.overall >= parseFloat(rating));
  }
  
  const total = restaurants.length;
  const paginatedRestaurants = restaurants.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: paginatedRestaurants,
    pagination: { total, limit: parseInt(limit), offset: parseInt(offset), pages: Math.ceil(total / parseInt(limit)) }
  });
});

app.get('/api/v1/restaurants/:id', (req, res) => {
  const restaurant = restaurantData.restaurantProfiles.find(r => r.id === req.params.id);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }
  res.json({ success: true, data: restaurant });
});

// Employee profiles
app.get('/api/v1/employees', authenticateToken, (req, res) => {
  const { skills, experience, location, availability, limit = 20, offset = 0 } = req.query;
  let employees = [...restaurantData.employeeProfiles];
  
  if (skills) {
    employees = employees.filter(emp => 
      emp.skills.some(skill => skill.toLowerCase().includes(skills.toLowerCase()))
    );
  }
  
  if (experience) {
    employees = employees.filter(emp => emp.experience.totalYears >= parseInt(experience));
  }
  
  if (location) {
    employees = employees.filter(emp => 
      emp.personalInfo.location.city.toLowerCase().includes(location.toLowerCase())
    );
  }
  
  if (availability) {
    employees = employees.filter(emp => emp.availability.status === availability);
  }
  
  const total = employees.length;
  const paginatedEmployees = employees.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: paginatedEmployees,
    pagination: { total, limit: parseInt(limit), offset: parseInt(offset), pages: Math.ceil(total / parseInt(limit)) }
  });
});

app.get('/api/v1/employees/:id', authenticateToken, (req, res) => {
  const employee = restaurantData.employeeProfiles.find(emp => emp.id === req.params.id);
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }
  res.json({ success: true, data: employee });
});

// Services API
app.get('/api/v1/services', (req, res) => {
  const { category, type, location, priceRange, limit = 20, offset = 0 } = req.query;
  let allServices = [
    ...servicesData.financialServices,
    ...servicesData.marketingServices,
    ...servicesData.utilityServices,
    ...servicesData.subscriptionServices
  ];
  
  if (category) {
    allServices = allServices.filter(service => 
      service.category && service.category.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  if (type) {
    allServices = allServices.filter(service => service.serviceType === type);
  }
  
  if (location) {
    allServices = allServices.filter(service => 
      service.coverage && (service.coverage.includes(location) || service.coverage.includes('Pan India'))
    );
  }
  
  const total = allServices.length;
  const paginatedServices = allServices.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: paginatedServices,
    pagination: { total, limit: parseInt(limit), offset: parseInt(offset), pages: Math.ceil(total / parseInt(limit)) }
  });
});

// Messages and notifications
app.get('/api/v1/messages/conversations', authenticateToken, (req, res) => {
  const userConversations = messagingData.conversations.filter(conv => 
    conv.participants.some(p => p.id === req.user.id)
  );
  res.json({ success: true, data: userConversations });
});

app.get('/api/v1/messages/conversations/:id', authenticateToken, (req, res) => {
  const conversation = messagingData.conversations.find(conv => conv.id === req.params.id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }
  
  const messages = messagingData.messages.filter(msg => msg.conversationId === req.params.id);
  res.json({ success: true, data: { conversation, messages } });
});

app.get('/api/v1/notifications', authenticateToken, (req, res) => {
  const { type, status, limit = 20, offset = 0 } = req.query;
  let userNotifications = messagingData.notifications.filter(notif => 
    notif.userId === req.user.id || notif.userType === req.user.role
  );
  
  if (type) {
    userNotifications = userNotifications.filter(notif => notif.type === type);
  }
  
  if (status) {
    userNotifications = userNotifications.filter(notif => notif.status === status);
  }
  
  const total = userNotifications.length;
  const paginatedNotifications = userNotifications.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: paginatedNotifications,
    pagination: { total, limit: parseInt(limit), offset: parseInt(offset), pages: Math.ceil(total / parseInt(limit)) }
  });
});

// Community discussions
app.get('/api/v1/community/discussions', (req, res) => {
  const { category, search, limit = 20, offset = 0 } = req.query;
  let discussions = [...restaurantData.communityDiscussions];
  
  if (category) {
    discussions = discussions.filter(disc => disc.category === category);
  }
  
  if (search) {
    discussions = discussions.filter(disc => 
      disc.title.toLowerCase().includes(search.toLowerCase()) ||
      disc.content.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const total = discussions.length;
  const paginatedDiscussions = discussions.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: paginatedDiscussions,
    pagination: { total, limit: parseInt(limit), offset: parseInt(offset), pages: Math.ceil(total / parseInt(limit)) }
  });
});

// Job categories
app.get('/api/v1/jobs/categories', (req, res) => {
  res.json({ success: true, data: marketplaceData.jobCategories });
});

// Catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /api/v1/health',
      'POST /api/v1/auth/login', 
      'POST /api/v1/auth/register',
      'GET /api/v1/auth/profile',
      'GET /api/v1/jobs',
      'GET /api/v1/jobs/categories',
      'GET /api/v1/marketplace/products',
      'GET /api/v1/marketplace/categories',
      'GET /api/v1/marketplace/vendors',
      'GET /api/v1/restaurants',
      'GET /api/v1/employees',
      'GET /api/v1/services',
      'GET /api/v1/orders',
      'GET /api/v1/messages/conversations',
      'GET /api/v1/notifications',
      'GET /api/v1/community/discussions',
      'GET /api/v1/dashboard/stats',
      'GET /api/v1/analytics/platform'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Restaurant SaaS API Server running on http://localhost:${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  logger.info('');
  logger.info('Demo accounts:');
  logger.info('👑 Admin: admin@resturistan.com / admin123');
  logger.info('🏪 Restaurant: restaurant@resturistan.com / restaurant123'); 
  logger.info('👨‍💼 Employee: employee@resturistan.com / employee123');
  logger.info('🚚 Vendor: vendor@resturistan.com / vendor123');
});