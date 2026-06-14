// Comprehensive Dummy Data for RestoPapa System
// This file contains realistic sample data for all modules, roles, and screens

export interface User {
  id: string;
  email: string;
  name: string;
  mobile: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
  };
  profilePicture: string;
  role: 'customer' | 'vendor' | 'employee' | 'admin';
  joinedDate: string;
  isActive: boolean;
  walletBalance?: number;
  rewardPoints?: number;
  preferences?: string[];
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  logo: string;
  bannerImage: string;
  description: string;
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
  };
  operatingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  licenses: string[];
  joinedDate: string;
  totalRevenue?: number;
  totalOrders?: number;
}

export interface Employee {
  id: string;
  userId: string;
  vendorId: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  skills: string[];
  performance: {
    rating: number;
    completedTasks: number;
    customerRating: number;
  };
  shift: {
    start: string;
    end: string;
    daysOfWeek: string[];
  };
  isActive: boolean;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  subCategory: string;
  price: number;
  originalPrice?: number;
  images: string[];
  tags: string[];
  isAvailable: boolean;
  stock: number;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  preparationTime: string;
  ratings: {
    average: number;
    count: number;
  };
  nutrition?: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
  allergens?: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  createdAt: string;
}

// 50 Dummy Customers
export const dummyCustomers: User[] = [
  {
    id: "cust_001",
    email: "sarah.johnson@email.com",
    name: "Sarah Johnson",
    mobile: "+1-555-0101",
    location: {
      address: "123 Oak Street, Apt 4B",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    profilePicture: "/avatars/female1.jpg",
    role: "customer",
    joinedDate: "2023-01-15",
    isActive: true,
    walletBalance: 125.50,
    rewardPoints: 2450,
    preferences: ["Italian", "Vegetarian", "Fast Delivery"]
  },
  {
    id: "cust_002",
    email: "mike.chen@email.com",
    name: "Mike Chen",
    mobile: "+1-555-0102",
    location: {
      address: "456 Pine Avenue",
      city: "Brooklyn",
      state: "NY",
      zipCode: "11201",
      coordinates: { lat: 40.6892, lng: -73.9442 }
    },
    profilePicture: "/avatars/male1.jpg",
    role: "customer",
    joinedDate: "2023-02-08",
    isActive: true,
    walletBalance: 75.25,
    rewardPoints: 1820,
    preferences: ["Chinese", "Spicy", "Late Night"]
  },
  {
    id: "cust_003",
    email: "emily.rodriguez@email.com",
    name: "Emily Rodriguez",
    mobile: "+1-555-0103",
    location: {
      address: "789 Maple Drive",
      city: "Queens",
      state: "NY",
      zipCode: "11375",
      coordinates: { lat: 40.7282, lng: -73.7949 }
    },
    profilePicture: "/avatars/female2.jpg",
    role: "customer",
    joinedDate: "2023-01-22",
    isActive: true,
    walletBalance: 200.00,
    rewardPoints: 3150,
    preferences: ["Mexican", "Healthy", "Organic"]
  },
  {
    id: "cust_004",
    email: "david.kim@email.com",
    name: "David Kim",
    mobile: "+1-555-0104",
    location: {
      address: "321 Elm Street",
      city: "Manhattan",
      state: "NY",
      zipCode: "10002",
      coordinates: { lat: 40.7831, lng: -73.9712 }
    },
    profilePicture: "/avatars/male2.jpg",
    role: "customer",
    joinedDate: "2023-03-05",
    isActive: true,
    walletBalance: 50.75,
    rewardPoints: 890,
    preferences: ["Korean", "BBQ", "Delivery"]
  },
  {
    id: "cust_005",
    email: "jessica.williams@email.com",
    name: "Jessica Williams",
    mobile: "+1-555-0105",
    location: {
      address: "654 Cedar Lane",
      city: "Bronx",
      state: "NY",
      zipCode: "10451",
      coordinates: { lat: 40.8168, lng: -73.9179 }
    },
    profilePicture: "/avatars/female3.jpg",
    role: "customer",
    joinedDate: "2023-02-18",
    isActive: true,
    walletBalance: 175.30,
    rewardPoints: 2780,
    preferences: ["American", "Comfort Food", "Family Style"]
  }
  // ... [Additional 45 customers will follow similar pattern]
];

// Generate remaining 45 customers programmatically
const additionalCustomers = Array.from({ length: 45 }, (_, index) => {
  const id = `cust_${String(index + 6).padStart(3, '0')}`;
  const firstNames = ["Alex", "Jamie", "Taylor", "Jordan", "Casey", "Morgan", "Riley", "Avery", "Parker", "Quinn"];
  const lastNames = ["Smith", "Brown", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White"];
  const cities = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
  const preferences = [
    ["Pizza", "Italian", "Quick Bite"],
    ["Sushi", "Japanese", "Fresh"],
    ["Burgers", "American", "Casual"],
    ["Thai", "Spicy", "Authentic"],
    ["Mediterranean", "Healthy", "Vegetarian"],
    ["Indian", "Curry", "Spicy"],
    ["French", "Fine Dining", "Wine"],
    ["Greek", "Fresh", "Healthy"],
    ["Vietnamese", "Pho", "Noodles"],
    ["Turkish", "Kebab", "Grilled"]
  ];

  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const preferenceSet = preferences[Math.floor(Math.random() * preferences.length)];

  return {
    id,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    name: `${firstName} ${lastName}`,
    mobile: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    location: {
      address: `${Math.floor(Math.random() * 999) + 1} ${["Oak", "Pine", "Maple", "Elm", "Cedar"][Math.floor(Math.random() * 5)]} Street`,
      city,
      state: "NY",
      zipCode: String(Math.floor(Math.random() * 90000) + 10000),
      coordinates: { 
        lat: 40.7 + Math.random() * 0.3, 
        lng: -74 + Math.random() * 0.3 
      }
    },
    profilePicture: `/avatars/${Math.random() > 0.5 ? 'male' : 'female'}${Math.floor(Math.random() * 5) + 1}.jpg`,
    role: "customer" as const,
    joinedDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    isActive: Math.random() > 0.05, // 95% active
    walletBalance: Math.round((Math.random() * 300) * 100) / 100,
    rewardPoints: Math.floor(Math.random() * 5000),
    preferences: preferenceSet
  };
});

// Combine all customers
export const allDummyCustomers = [...dummyCustomers, ...additionalCustomers];

// 20 Dummy Vendors/Restaurants
export const dummyVendors: Vendor[] = [
  {
    id: "vendor_001",
    userId: "user_vendor_001",
    businessName: "Bella Vista Italian Kitchen",
    category: "restaurant",
    logo: "/logos/bella-vista.png",
    bannerImage: "/banners/bella-vista-banner.jpg",
    description: "Authentic Italian cuisine with a modern twist. Family-owned restaurant serving traditional recipes passed down through generations.",
    contactInfo: {
      phone: "+1-555-BELLA1",
      email: "info@bellavistany.com",
      website: "www.bellavistany.com",
      socialMedia: {
        facebook: "facebook.com/bellavistany",
        instagram: "@bellavistany",
        twitter: "@bellavistany"
      }
    },
    address: {
      street: "234 Little Italy Street",
      city: "Manhattan",
      state: "NY",
      zipCode: "10012",
      coordinates: { lat: 40.7193, lng: -73.9969 }
    },
    operatingHours: {
      monday: { open: "11:00", close: "22:00", isOpen: true },
      tuesday: { open: "11:00", close: "22:00", isOpen: true },
      wednesday: { open: "11:00", close: "22:00", isOpen: true },
      thursday: { open: "11:00", close: "22:00", isOpen: true },
      friday: { open: "11:00", close: "23:00", isOpen: true },
      saturday: { open: "11:00", close: "23:00", isOpen: true },
      sunday: { open: "12:00", close: "21:00", isOpen: true }
    },
    rating: 4.7,
    totalReviews: 1247,
    isVerified: true,
    licenses: ["Food Service License", "Liquor License", "Health Department Certified"],
    joinedDate: "2022-03-15",
    totalRevenue: 245000,
    totalOrders: 3420
  },
  {
    id: "vendor_002",
    userId: "user_vendor_002",
    businessName: "Dragon Palace Chinese Cuisine",
    category: "restaurant",
    logo: "/logos/dragon-palace.png",
    bannerImage: "/banners/dragon-palace-banner.jpg",
    description: "Authentic Szechuan and Cantonese dishes prepared by master chefs. Over 20 years of culinary excellence in NYC.",
    contactInfo: {
      phone: "+1-555-DRAGON",
      email: "orders@dragonpalaceny.com",
      website: "www.dragonpalaceny.com",
      socialMedia: {
        facebook: "facebook.com/dragonpalaceny",
        instagram: "@dragonpalaceny"
      }
    },
    address: {
      street: "567 Chinatown Avenue",
      city: "Manhattan",
      state: "NY",
      zipCode: "10013",
      coordinates: { lat: 40.7155, lng: -73.9976 }
    },
    operatingHours: {
      monday: { open: "11:30", close: "22:30", isOpen: true },
      tuesday: { open: "11:30", close: "22:30", isOpen: true },
      wednesday: { open: "11:30", close: "22:30", isOpen: true },
      thursday: { open: "11:30", close: "22:30", isOpen: true },
      friday: { open: "11:30", close: "23:30", isOpen: true },
      saturday: { open: "11:30", close: "23:30", isOpen: true },
      sunday: { open: "12:00", close: "22:00", isOpen: true }
    },
    rating: 4.5,
    totalReviews: 892,
    isVerified: true,
    licenses: ["Food Service License", "Health Department Certified"],
    joinedDate: "2022-01-20",
    totalRevenue: 180000,
    totalOrders: 2850
  },
  {
    id: "vendor_003",
    userId: "user_vendor_003",
    businessName: "Brooklyn Burger Co.",
    category: "fast_casual",
    logo: "/logos/brooklyn-burger.png",
    bannerImage: "/banners/brooklyn-burger-banner.jpg",
    description: "Gourmet burgers made with locally sourced ingredients. Craft beer selection and hand-cut fries that keep customers coming back.",
    contactInfo: {
      phone: "+1-555-BURGER",
      email: "hello@brooklynburger.co",
      website: "www.brooklynburger.co",
      socialMedia: {
        facebook: "facebook.com/brooklynburgerco",
        instagram: "@brooklynburgerco",
        twitter: "@brooklynburger"
      }
    },
    address: {
      street: "890 Atlantic Avenue",
      city: "Brooklyn",
      state: "NY",
      zipCode: "11238",
      coordinates: { lat: 40.6782, lng: -73.9442 }
    },
    operatingHours: {
      monday: { open: "11:00", close: "23:00", isOpen: true },
      tuesday: { open: "11:00", close: "23:00", isOpen: true },
      wednesday: { open: "11:00", close: "23:00", isOpen: true },
      thursday: { open: "11:00", close: "23:00", isOpen: true },
      friday: { open: "11:00", close: "00:00", isOpen: true },
      saturday: { open: "11:00", close: "00:00", isOpen: true },
      sunday: { open: "12:00", close: "22:00", isOpen: true }
    },
    rating: 4.6,
    totalReviews: 1534,
    isVerified: true,
    licenses: ["Food Service License", "Liquor License", "Health Department Certified"],
    joinedDate: "2022-05-10",
    totalRevenue: 320000,
    totalOrders: 4200
  }
  // ... Additional 17 vendors following similar pattern
];

// Generate remaining 17 vendors
const restaurantNames = [
  "Sakura Sushi House", "Taco Libre Mexican", "Mumbai Palace Indian", "Le Petit Café French",
  "Athens Greek Taverna", "Bangkok Street Thai", "Istanbul Kebab House", "Pho Saigon Vietnamese",
  "Seoul BBQ Korean", "Mediterranean Oasis", "Smokey Joe's BBQ", "Green Garden Vegan",
  "Pasta Amore Italian", "Spice Route Indian", "Tokyo Ramen Bar", "Caribbean Vibes",
  "Farm Fresh American"
];

const businessCategories = ["restaurant", "fast_casual", "fine_dining", "cafe", "food_truck"];
const additionalVendors = restaurantNames.map((name, index) => {
  const id = `vendor_${String(index + 4).padStart(3, '0')}`;
  const category = businessCategories[Math.floor(Math.random() * businessCategories.length)];
  
  return {
    id,
    userId: `user_${id}`,
    businessName: name,
    category,
    logo: `/logos/${name.toLowerCase().replace(/ /g, '-')}.png`,
    bannerImage: `/banners/${name.toLowerCase().replace(/ /g, '-')}-banner.jpg`,
    description: `Delicious ${name.split(' ')[name.split(' ').length - 1]} cuisine with fresh ingredients and authentic flavors. A local favorite for quality and service.`,
    contactInfo: {
      phone: `+1-555-${String(Math.floor(Math.random() * 900000) + 100000)}`,
      email: `info@${name.toLowerCase().replace(/ /g, '')}.com`,
      website: `www.${name.toLowerCase().replace(/ /g, '')}.com`,
      socialMedia: {
        instagram: `@${name.toLowerCase().replace(/ /g, '')}`,
        facebook: `facebook.com/${name.toLowerCase().replace(/ /g, '')}`
      }
    },
    address: {
      street: `${Math.floor(Math.random() * 9000) + 1000} ${["Broadway", "Main St", "Park Ave", "First Ave", "Second Ave"][Math.floor(Math.random() * 5)]}`,
      city: ["Manhattan", "Brooklyn", "Queens"][Math.floor(Math.random() * 3)],
      state: "NY",
      zipCode: String(Math.floor(Math.random() * 90000) + 10000),
      coordinates: { 
        lat: 40.7 + Math.random() * 0.3, 
        lng: -74 + Math.random() * 0.3 
      }
    },
    operatingHours: {
      monday: { open: "11:00", close: "22:00", isOpen: true },
      tuesday: { open: "11:00", close: "22:00", isOpen: true },
      wednesday: { open: "11:00", close: "22:00", isOpen: true },
      thursday: { open: "11:00", close: "22:00", isOpen: true },
      friday: { open: "11:00", close: "23:00", isOpen: true },
      saturday: { open: "11:00", close: "23:00", isOpen: true },
      sunday: { open: "12:00", close: "21:00", isOpen: true }
    },
    rating: 3.8 + Math.random() * 1.2, // Random rating between 3.8-5.0
    totalReviews: Math.floor(Math.random() * 1500) + 100,
    isVerified: Math.random() > 0.2, // 80% verified
    licenses: ["Food Service License", "Health Department Certified"],
    joinedDate: new Date(2022, Math.floor(Math.random() * 24), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    totalRevenue: Math.floor(Math.random() * 400000) + 50000,
    totalOrders: Math.floor(Math.random() * 5000) + 500
  };
});

export const allDummyVendors = [...dummyVendors, ...additionalVendors];

// 10 Dummy Employees
export const dummyEmployees: Employee[] = [
  {
    id: "emp_001",
    userId: "user_emp_001",
    vendorId: "vendor_001",
    position: "Head Chef",
    department: "Kitchen",
    salary: 65000,
    hireDate: "2022-06-15",
    skills: ["Italian Cuisine", "Menu Planning", "Team Leadership", "Food Safety"],
    performance: {
      rating: 4.8,
      completedTasks: 1250,
      customerRating: 4.9
    },
    shift: {
      start: "14:00",
      end: "23:00",
      daysOfWeek: ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    },
    isActive: true
  },
  {
    id: "emp_002",
    userId: "user_emp_002",
    vendorId: "vendor_001",
    position: "Server",
    department: "Front of House",
    salary: 35000,
    hireDate: "2023-01-20",
    skills: ["Customer Service", "POS Systems", "Wine Knowledge", "Multitasking"],
    performance: {
      rating: 4.6,
      completedTasks: 2100,
      customerRating: 4.7
    },
    shift: {
      start: "17:00",
      end: "01:00",
      daysOfWeek: ["friday", "saturday", "sunday"]
    },
    isActive: true
  },
  {
    id: "emp_003",
    userId: "user_emp_003",
    vendorId: "vendor_002",
    position: "Delivery Driver",
    department: "Delivery",
    salary: 32000,
    hireDate: "2022-11-08",
    skills: ["Navigation", "Customer Service", "Time Management", "Vehicle Maintenance"],
    performance: {
      rating: 4.4,
      completedTasks: 3200,
      customerRating: 4.5
    },
    shift: {
      start: "11:00",
      end: "19:00",
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    isActive: true
  },
  {
    id: "emp_004",
    userId: "user_emp_004",
    vendorId: "vendor_003",
    position: "Sous Chef",
    department: "Kitchen",
    salary: 52000,
    hireDate: "2022-08-12",
    skills: ["Burger Preparation", "Food Prep", "Kitchen Management", "Quality Control"],
    performance: {
      rating: 4.7,
      completedTasks: 1800,
      customerRating: 4.6
    },
    shift: {
      start: "10:00",
      end: "18:00",
      daysOfWeek: ["monday", "wednesday", "friday", "saturday", "sunday"]
    },
    isActive: true
  },
  {
    id: "emp_005",
    userId: "user_emp_005",
    vendorId: "vendor_003",
    position: "Cashier",
    department: "Front of House",
    salary: 28000,
    hireDate: "2023-03-01",
    skills: ["Cash Handling", "Customer Service", "Order Processing", "Problem Solving"],
    performance: {
      rating: 4.3,
      completedTasks: 2800,
      customerRating: 4.4
    },
    shift: {
      start: "11:00",
      end: "19:00",
      daysOfWeek: ["tuesday", "wednesday", "thursday", "friday", "saturday"]
    },
    isActive: true
  }
];

// Generate remaining 5 employees
const positions = ["Line Cook", "Bartender", "Host/Hostess", "Kitchen Assistant", "Manager"];
const departments = ["Kitchen", "Front of House", "Bar", "Management"];

const additionalEmployees = positions.map((position, index) => {
  const id = `emp_${String(index + 6).padStart(3, '0')}`;
  const vendorId = `vendor_${String(Math.floor(Math.random() * 3) + 1).padStart(3, '0')}`;
  const department = departments[Math.floor(Math.random() * departments.length)];
  
  return {
    id,
    userId: `user_${id}`,
    vendorId,
    position,
    department,
    salary: Math.floor(Math.random() * 40000) + 25000,
    hireDate: new Date(2022, Math.floor(Math.random() * 24), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    skills: ["Customer Service", "Team Work", "Time Management", "Attention to Detail"],
    performance: {
      rating: 3.5 + Math.random() * 1.5,
      completedTasks: Math.floor(Math.random() * 3000) + 500,
      customerRating: 3.8 + Math.random() * 1.2
    },
    shift: {
      start: `${Math.floor(Math.random() * 6) + 8}:00`,
      end: `${Math.floor(Math.random() * 6) + 18}:00`,
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"].slice(0, Math.floor(Math.random() * 3) + 3)
    },
    isActive: Math.random() > 0.1 // 90% active
  };
});

export const allDummyEmployees = [...dummyEmployees, ...additionalEmployees];

// 5 Dummy Admins
export const dummyAdmins: User[] = [
  {
    id: "admin_001",
    email: "admin@restopapa.com",
    name: "System Administrator",
    mobile: "+1-555-ADMIN",
    location: {
      address: "RestoPapa HQ",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    profilePicture: "/avatars/admin1.jpg",
    role: "admin",
    joinedDate: "2022-01-01",
    isActive: true,
    preferences: ["All Access", "System Management", "User Support"]
  },
  {
    id: "admin_002",
    email: "support@restopapa.com",
    name: "Support Manager",
    mobile: "+1-555-SUPP1",
    location: {
      address: "RestoPapa HQ",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    profilePicture: "/avatars/admin2.jpg",
    role: "admin",
    joinedDate: "2022-02-01",
    isActive: true,
    preferences: ["Customer Support", "Vendor Relations", "Issue Resolution"]
  },
  {
    id: "admin_003",
    email: "operations@restopapa.com",
    name: "Operations Manager",
    mobile: "+1-555-OPS01",
    location: {
      address: "RestoPapa HQ",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    profilePicture: "/avatars/admin3.jpg",
    role: "admin",
    joinedDate: "2022-03-01",
    isActive: true,
    preferences: ["Operations", "Analytics", "Performance Monitoring"]
  },
  {
    id: "admin_004",
    email: "marketing@restopapa.com",
    name: "Marketing Manager",
    mobile: "+1-555-MARK1",
    location: {
      address: "RestoPapa HQ",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    profilePicture: "/avatars/admin4.jpg",
    role: "admin",
    joinedDate: "2022-04-01",
    isActive: true,
    preferences: ["Marketing", "Promotions", "User Acquisition"]
  },
  {
    id: "admin_005",
    email: "finance@restopapa.com",
    name: "Finance Manager",
    mobile: "+1-555-FIN01",
    location: {
      address: "RestoPapa HQ",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    profilePicture: "/avatars/admin5.jpg",
    role: "admin",
    joinedDate: "2022-05-01",
    isActive: true,
    preferences: ["Financial Analysis", "Revenue Tracking", "Payment Processing"]
  }
];

// Export all user data combined
export const allUsers = [
  ...allDummyCustomers,
  ...dummyAdmins,
  // Vendor and employee users will be derived from vendor/employee data
];