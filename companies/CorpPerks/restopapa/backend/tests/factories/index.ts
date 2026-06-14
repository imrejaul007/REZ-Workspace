// ============================================
// TEST DATA FACTORIES
// ============================================

let idCounter = 0;
function generateId(): string {
  return `test-${++idCounter}-${Date.now()}`;
}

// ============================================
// USER FACTORIES
// ============================================

export interface UserFactoryOptions {
  id?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
  lastLogin?: Date | null;
}

export function createUser(options: UserFactoryOptions = {}) {
  return {
    id: options.id || generateId(),
    email: options.email || `user${idCounter}@test.com`,
    phone: options.phone || `+91987654321${idCounter % 10}`,
    passwordHash: options.passwordHash || '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYWPQFQfKQX.',
    role: options.role || 'user',
    isEmailVerified: options.isEmailVerified ?? true,
    isPhoneVerified: options.isPhoneVerified ?? true,
    isActive: options.isActive ?? true,
    lastLogin: options.lastLogin ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createAdminUser(options: Partial<UserFactoryOptions> = {}) {
  return createUser({ ...options, role: 'admin', isEmailVerified: true });
}

export function createRestaurantUser(options: Partial<UserFactoryOptions> = {}) {
  return createUser({ ...options, role: 'restaurant', isEmailVerified: true });
}

export function createVendorUser(options: Partial<UserFactoryOptions> = {}) {
  return createUser({ ...options, role: 'vendor', isEmailVerified: true });
}

// ============================================
// RESTAURANT FACTORIES
// ============================================

export interface RestaurantFactoryOptions {
  id?: string;
  userId?: string;
  businessName?: string;
  description?: string;
  category?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  isVerified?: boolean;
  trustScore?: number;
  status?: string;
}

export function createRestaurant(options: RestaurantFactoryOptions = {}) {
  return {
    id: options.id || generateId(),
    userId: options.userId || generateId(),
    businessName: options.businessName || `Restaurant ${idCounter}`,
    description: options.description || 'A great restaurant',
    category: options.category || 'casual_dining',
    logoUrl: options.logoUrl || '/images/logo.jpg',
    coverImageUrl: options.coverImageUrl || '/images/cover.jpg',
    isVerified: options.isVerified ?? false,
    trustScore: options.trustScore ?? 75,
    status: options.status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================
// PRODUCT FACTORIES (Vendor Offerings)
// ============================================

export interface ProductFactoryOptions {
  id?: string;
  vendorId?: string;
  title?: string;
  description?: string;
  category?: string;
  priceRange?: string;
  images?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export function createProduct(options: ProductFactoryOptions = {}) {
  return {
    id: options.id || generateId(),
    vendorId: options.vendorId || generateId(),
    title: options.title || `Product ${idCounter}`,
    description: options.description || 'A great product',
    category: options.category || 'food',
    priceRange: options.priceRange || '₹100-500',
    images: options.images || '/images/default.jpg',
    isFeatured: options.isFeatured ?? false,
    isActive: options.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================
// ORDER FACTORIES
// ============================================

export interface OrderItemFactoryOptions {
  productId?: string;
  quantity?: number;
  unitPrice?: number;
}

export function createOrderItem(options: OrderItemFactoryOptions = {}) {
  const unitPrice = options.unitPrice || 250;
  const quantity = options.quantity || 2;
  return {
    id: generateId(),
    productId: options.productId || generateId(),
    quantity,
    unitPrice,
    totalPrice: unitPrice * quantity,
  };
}

export interface OrderFactoryOptions {
  id?: string;
  userId?: string;
  vendorId?: string;
  status?: string;
  subtotal?: number;
  gstAmount?: number;
  deliveryFee?: number;
  coinDiscount?: number;
  totalAmount?: number;
  creditUsed?: number;
  items?: ReturnType<typeof createOrderItem>[];
}

export function createOrder(options: OrderFactoryOptions = {}) {
  const items = options.items || [createOrderItem(), createOrderItem()];
  const subtotal = options.subtotal || items.reduce((sum, item) => sum + item.totalPrice, 0);
  const gstAmount = options.gstAmount || Math.round(subtotal * 0.18);
  const deliveryFee = subtotal >= 1000 ? 0 : 50;
  const coinDiscount = options.coinDiscount || 0;
  const creditUsed = options.creditUsed || 0;
  const totalAmount = options.totalAmount || subtotal + gstAmount + deliveryFee - coinDiscount;

  return {
    id: options.id || generateId(),
    userId: options.userId || generateId(),
    vendorId: options.vendorId || generateId(),
    status: options.status || 'pending',
    subtotal,
    gstAmount,
    deliveryFee,
    coinDiscount,
    creditUsed,
    totalAmount,
    paymentMethod: 'online',
    deliveryAddress: JSON.stringify({ line1: '123 Test St', city: 'Mumbai' }),
    notes: null,
    trackingNumber: null,
    estimatedDelivery: null,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items,
  };
}

// ============================================
// CREDIT TRANSACTION FACTORIES
// ============================================

export interface CreditTransactionFactoryOptions {
  id?: string;
  userId?: string;
  type?: 'credit' | 'debit';
  amount?: number;
  balance?: number;
  description?: string;
  orderId?: string | null;
}

export function createCreditTransaction(options: CreditTransactionFactoryOptions = {}) {
  return {
    id: options.id || generateId(),
    userId: options.userId || generateId(),
    type: options.type || 'credit',
    amount: options.amount || 100,
    balance: options.balance || 0,
    description: options.description || 'Test transaction',
    orderId: options.orderId || null,
    createdAt: new Date(),
  };
}

// ============================================
// JOB FACTORIES
// ============================================

export interface JobFactoryOptions {
  id?: string;
  restaurantId?: string;
  title?: string;
  description?: string;
  position?: string;
  department?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  location?: string;
  requirements?: string;
  benefits?: string;
  status?: string;
  isPremium?: boolean;
}

export function createJob(options: JobFactoryOptions = {}) {
  return {
    id: options.id || generateId(),
    restaurantId: options.restaurantId || generateId(),
    title: options.title || `Job ${idCounter}`,
    description: options.description || 'A great job opportunity',
    position: options.position || `Position ${idCounter}`,
    department: options.department || 'Operations',
    employmentType: options.employmentType || 'full_time',
    salaryMin: options.salaryMin || 25000,
    salaryMax: options.salaryMax || 35000,
    experienceMin: options.experienceMin || 0,
    experienceMax: options.experienceMax || 60,
    location: options.location || 'Mumbai, Maharashtra',
    requirements: options.requirements || 'Good communication skills',
    benefits: options.benefits || 'Health insurance',
    status: options.status || 'open',
    isPremium: options.isPremium ?? false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdBy: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================
// EMPLOYEE FACTORIES
// ============================================

export interface EmployeeFactoryOptions {
  id?: string;
  userId?: string;
  fullName?: string;
  skills?: string;
  education?: string;
  currentLocation?: string;
  totalExperienceMonths?: number;
  reliabilityScore?: number;
}

export function createEmployee(options: EmployeeFactoryOptions = {}) {
  return {
    id: options.id || generateId(),
    userId: options.userId || generateId(),
    fullName: options.fullName || `Employee ${idCounter}`,
    dateOfBirth: null,
    gender: null,
    maritalStatus: null,
    totalExperienceMonths: options.totalExperienceMonths || 24,
    education: options.education || 'B.Tech',
    certifications: null,
    skills: options.skills || 'JavaScript, React, Node.js',
    profilePictureUrl: null,
    resumeUrl: null,
    aadhaarVerificationStatus: 'pending',
    reliabilityScore: options.reliabilityScore || 75,
    isProfileComplete: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================
// NOTIFICATION FACTORIES
// ============================================

export interface NotificationFactoryOptions {
  id?: string;
  userId?: string;
  type?: string;
  title?: string;
  message?: string;
  data?: Record<string, any>;
  isRead?: boolean;
}

export function createNotification(options: NotificationFactoryOptions = {}) {
  return {
    id: options.id || generateId(),
    userId: options.userId || generateId(),
    type: options.type || 'order_update',
    title: options.title || 'Order Update',
    message: options.message || 'Your order has been confirmed',
    data: options.data || { orderId: generateId() },
    isRead: options.isRead ?? false,
    createdAt: new Date(),
  };
}

// ============================================
// MOCKS HELPERS
// ============================================

export function createMockPrismaService(overrides = {}) {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    restaurant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    marketplaceOrder: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    vendorOffering: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    creditTransaction: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    getUserById: jest.fn(),
    getUserByEmail: jest.fn(),
    recordAnalyticsEvent: jest.fn().mockResolvedValue({}),
    $transaction: jest.fn((callback) => callback(jest.fn())),
    ...overrides,
  };
}
