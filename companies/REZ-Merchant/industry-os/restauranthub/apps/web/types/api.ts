// Common API response types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?;
}

// Dashboard-specific types
export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  activeCustomers: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'job' | 'application' | 'order' | 'review' | 'supplier' | 'community';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  metadata?: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
}

export interface QuickStat {
  id: string;
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format: 'number' | 'currency' | 'percentage';
  period: string;
  icon?: string;
  color?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

// Enhanced Job types with better UI support
export interface JobStatus {
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'FILLED';
  color: string;
  label: string;
}

export interface JobLocation {
  city: string;
  state: string;
  country: string;
  remote: boolean;
  hybrid: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface JobCompany {
  id: string;
  name: string;
  logo?: string;
  verified: boolean;
  rating?: number;
  location: string;
  description?: string;
  website?: string;
  size?: string;
  industry?: string;
}

export interface JobSalary {
  min?: number;
  max?: number;
  currency: string;
  period: 'hourly' | 'monthly' | 'yearly';
  negotiable: boolean;
  disclosed: boolean;
}

export interface JobMetrics {
  views: number;
  applications: number;
  saves: number;
  shares: number;
  clickThroughRate: number;
  conversionRate: number;
}

export interface EnhancedJob {
  id: string;
  title: string;
  slug: string;
  company: JobCompany;
  description: string;
  shortDescription: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  location: JobLocation;
  employment: {
    type: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';
    experience: string;
    department: string;
    shift?: string;
    schedule?: string;
  };
  salary: JobSalary;
  application: {
    deadline?: string;
    method: 'internal' | 'external' | 'email';
    externalUrl?: string;
    email?: string;
    status: JobStatus['status'];
    instructions?: string;
  };
  metrics: JobMetrics;
  tags: string[];
  skills: string[];
  featured: boolean;
  urgent: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
}

// Supplier/Vendor types
export interface SupplierProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: {
    amount: number;
    unit: string;
    currency: string;
  };
  availability: 'in-stock' | 'out-of-stock' | 'limited';
  minimumOrder?: number;
  images: string[];
  specifications?: Record<string, unknown>;
}

export interface SupplierRating {
  overall: number;
  quality: number;
  delivery: number;
  service: number;
  value: number;
  reviewCount: number;
}

export interface EnhancedSupplier {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  category: string[];
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
    contactPerson?: string;
  };
  business: {
    type: string;
    established: string;
    size: string;
    certifications: string[];
    licenses: string[];
  };
  rating: SupplierRating;
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    responseTime: number; // in hours
  };
  products: SupplierProduct[];
  verified: boolean;
  featured: boolean;
  premium: boolean;
  activeDeals: number;
  deliveryRadius: number;
  minimumOrder: number;
  paymentMethods: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Community types
export interface CommunityUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  role: string;
  title?: string;
  company?: string;
  reputation: number;
  level: number;
  badges: {
    type: string;
    title: string;
    icon: string;
    earnedAt: string;
  }[];
  stats: {
    postsCount: number;
    commentsCount: number;
    likesReceived: number;
    helpfulAnswers: number;
  };
  verified: boolean;
  online: boolean;
  lastSeen: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  type: 'discussion' | 'question' | 'announcement' | 'guide' | 'showcase';
  category: string;
  tags: string[];
  author: CommunityUser;
  images: string[];
  attachments: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
  interactions: {
    liked: boolean;
    bookmarked: boolean;
    following: boolean;
  };
  status: {
    published: boolean;
    pinned: boolean;
    locked: boolean;
    featured: boolean;
    solved: boolean;
  };
  moderation: {
    reported: boolean;
    approved: boolean;
    moderatedAt?: string;
    moderatorId?: string;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Restaurant types
export interface RestaurantMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  availability: boolean;
  popular: boolean;
  spicy?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  allergens: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface RestaurantHours {
  [day: string]: {
    open: string;
    close: string;
    isOpen: boolean;
    breaks?: {
      start: string;
      end: string;
    }[];
  };
}

export interface RestaurantAnalytics {
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
    change: {
      today: number;
      week: number;
      month: number;
      year: number;
    };
  };
  orders: {
    today: number;
    week: number;
    month: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    retention: number;
  };
  menu: {
    totalItems: number;
    popularItems: RestaurantMenuItem[];
    categories: string[];
  };
  ratings: {
    overall: number;
    food: number;
    service: number;
    ambiance: number;
    value: number;
    reviewCount: number;
  };
}

export interface EnhancedRestaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  cuisine: string[];
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    neighborhood?: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  images: {
    logo?: string;
    banner?: string;
    gallery: string[];
  };
  ratings: {
    overall: number;
    reviewCount: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  priceRange: 1 | 2 | 3 | 4; // $ to $$$$
  features: string[];
  amenities: string[];
  dietaryOptions: string[];
  paymentMethods: string[];
  hours: RestaurantHours;
  delivery: {
    available: boolean;
    radius: number;
    fee: number;
    minOrder: number;
    estimatedTime: number;
  };
  reservation: {
    available: boolean;
    onlineBooking: boolean;
    maxPartySize: number;
    advanceBooking: number; // days
  };
  status: {
    active: boolean;
    verified: boolean;
    premium: boolean;
    featured: boolean;
    currentlyOpen: boolean;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  analytics: RestaurantAnalytics;
  menu: RestaurantMenuItem[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  location?: string;
  category?: string[];
  priceRange?: [number, number];
  rating?: number;
  distance?: number;
  features?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  facets: {
    categories: { name: string; count: number }[];
    locations: { name: string; count: number }[];
    priceRanges: { range: string; count: number }[];
    ratings: { rating: number; count: number }[];
  };
  suggestions?: string[];
  didYouMean?: string;
}

// Loading and error states
export interface LoadingState {
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
  retryCount: number;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

export interface PaginatedState<T> extends LoadingState {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  touched: Record<string, boolean>;
  dirty: boolean;
  valid: boolean;
  submitting: boolean;
}

// UI Component types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: string;
  description?: string;
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value, record: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number, pageSize?: number) => void;
  };
  selection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[]) => void;
  };
  expandable?: {
    expandedRowRender: (record: T) => React.ReactNode;
    rowExpandable?: (record: T) => boolean;
  };
}