import { Vendor, Product, RestaurantListing, SubscriptionPlan } from '@/types/marketplace';

export const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'CityGas LPG Solutions',
    category: 'utilities',
    logo: '/vendors/citygas.png',
    rating: 4.8,
    reviewCount: 324,
    description: 'Leading LPG supplier for restaurants with 24/7 emergency support',
    services: ['lpg_gas'],
    products: [],
    certifications: ['ISO 9001', 'Safety Certified'],
    minOrderValue: 500,
    deliveryTime: 'Same day',
    location: 'New York, NY',
    contact: {
      phone: '+1-212-555-0101',
      email: 'sales@citygas.com',
      website: 'www.citygas.com'
    },
    bulkDiscount: 15,
    subscriptionPlans: [
      {
        id: 'lpg-monthly',
        name: 'Monthly LPG Supply',
        description: 'Regular monthly delivery with priority support',
        price: 1200,
        billingCycle: 'monthly',
        features: ['Automatic refills', 'Priority delivery', '24/7 support', 'Free safety inspection'],
        deliveryFrequency: 'Monthly'
      }
    ]
  },
  {
    id: '2',
    name: 'PureWater Supply Co.',
    category: 'utilities',
    logo: '/vendors/purewater.png',
    rating: 4.6,
    reviewCount: 189,
    description: 'Premium water delivery service for restaurants and commercial kitchens',
    services: ['water_supply'],
    products: [],
    certifications: ['FDA Approved', 'NSF Certified'],
    minOrderValue: 200,
    deliveryTime: 'Next day',
    location: 'New York, NY',
    contact: {
      phone: '+1-212-555-0102',
      email: 'orders@purewater.com'
    },
    bulkDiscount: 20,
    subscriptionPlans: [
      {
        id: 'water-weekly',
        name: 'Weekly Water Delivery',
        description: 'Scheduled weekly water delivery',
        price: 350,
        billingCycle: 'weekly',
        features: ['Flexible scheduling', 'Quality guarantee', 'Free cooler maintenance'],
        deliveryFrequency: 'Weekly'
      }
    ]
  },
  {
    id: '3',
    name: 'TaxPro Business Services',
    category: 'finance',
    logo: '/vendors/taxpro.png',
    rating: 4.9,
    reviewCount: 567,
    description: 'Complete tax and accounting solutions for restaurants',
    services: ['tax_filing', 'accounting'],
    products: [],
    certifications: ['CPA Certified', 'QuickBooks ProAdvisor'],
    deliveryTime: '48 hours',
    location: 'New York, NY',
    contact: {
      phone: '+1-212-555-0103',
      email: 'help@taxpro.com',
      website: 'www.taxpro.com'
    },
    subscriptionPlans: [
      {
        id: 'tax-quarterly',
        name: 'Quarterly Tax Filing',
        description: 'Complete quarterly tax preparation and filing',
        price: 899,
        billingCycle: 'quarterly',
        features: ['Tax preparation', 'E-filing', 'Audit support', 'Year-round consultation'],
        minimumCommitment: 4
      }
    ]
  },
  {
    id: '4',
    name: 'Digital Marketing Hub',
    category: 'marketing',
    logo: '/vendors/digihub.png',
    rating: 4.7,
    reviewCount: 423,
    description: 'Full-service digital marketing agency specializing in restaurants',
    services: ['marketing'],
    products: [],
    certifications: ['Google Partner', 'Facebook Marketing Partner'],
    deliveryTime: '1 week',
    location: 'New York, NY',
    contact: {
      phone: '+1-212-555-0104',
      email: 'grow@digihub.com',
      website: 'www.digihub.com'
    },
    subscriptionPlans: [
      {
        id: 'marketing-monthly',
        name: 'Complete Marketing Package',
        description: 'Social media, SEO, and content marketing',
        price: 2500,
        billingCycle: 'monthly',
        features: ['Social media management', 'SEO optimization', 'Content creation', 'Monthly analytics report'],
        minimumCommitment: 6
      }
    ]
  },
  {
    id: '5',
    name: 'Restaurant Supply Wholesale',
    category: 'food_supplies',
    logo: '/vendors/rsw.png',
    rating: 4.5,
    reviewCount: 892,
    description: 'One-stop shop for all restaurant supplies and ingredients',
    services: [],
    products: [],
    certifications: ['USDA Approved', 'Organic Certified'],
    minOrderValue: 1000,
    deliveryTime: '2-3 days',
    location: 'Brooklyn, NY',
    contact: {
      phone: '+1-718-555-0105',
      email: 'orders@rsw.com',
      website: 'www.rsw.com'
    },
    bulkDiscount: 25
  },
  {
    id: '6',
    name: 'ProClean Services',
    category: 'maintenance',
    logo: '/vendors/proclean.png',
    rating: 4.8,
    reviewCount: 276,
    description: 'Professional cleaning and pest control for restaurants',
    services: ['pest_control', 'waste_management'],
    products: [],
    certifications: ['EPA Certified', 'Green Cleaning Certified'],
    deliveryTime: 'Same day',
    location: 'Queens, NY',
    contact: {
      phone: '+1-718-555-0106',
      email: 'service@proclean.com'
    },
    subscriptionPlans: [
      {
        id: 'cleaning-weekly',
        name: 'Weekly Deep Cleaning',
        description: 'Professional kitchen and dining area cleaning',
        price: 800,
        billingCycle: 'weekly',
        features: ['Deep kitchen cleaning', 'Dining area sanitization', 'Equipment cleaning', 'Health code compliance'],
        deliveryFrequency: 'Weekly'
      }
    ]
  },
  {
    id: '7',
    name: 'Kitchen Equipment Pro',
    category: 'equipment',
    logo: '/vendors/kitchenpro.png',
    rating: 4.6,
    reviewCount: 534,
    description: 'Commercial kitchen equipment sales and service',
    services: ['maintenance'],
    products: [],
    certifications: ['NSF Certified', 'Energy Star Partner'],
    minOrderValue: 2000,
    deliveryTime: '1 week',
    location: 'Manhattan, NY',
    contact: {
      phone: '+1-212-555-0107',
      email: 'sales@kitchenpro.com',
      website: 'www.kitchenpro.com'
    },
    bulkDiscount: 30
  },
  {
    id: '8',
    name: 'FreshLinen Laundry Services',
    category: 'services',
    logo: '/vendors/freshlinen.png',
    rating: 4.7,
    reviewCount: 198,
    description: 'Commercial laundry service for restaurants and hotels',
    services: ['laundry'],
    products: [],
    certifications: ['Health Department Approved'],
    deliveryTime: '24 hours',
    location: 'Bronx, NY',
    contact: {
      phone: '+1-718-555-0108',
      email: 'service@freshlinen.com'
    },
    subscriptionPlans: [
      {
        id: 'laundry-daily',
        name: 'Daily Linen Service',
        description: 'Daily pickup and delivery of linens',
        price: 450,
        billingCycle: 'weekly',
        features: ['Daily pickup', 'Next-day delivery', 'Stain treatment', 'Free replacement for damaged items'],
        deliveryFrequency: 'Daily'
      }
    ]
  }
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    vendorId: '5',
    name: 'Premium Olive Oil',
    category: 'ingredients',
    description: 'Extra virgin olive oil, cold-pressed, imported from Italy',
    images: ['/products/olive-oil.jpg'],
    price: 45,
    unit: 'gallon',
    inStock: true,
    minQuantity: 1,
    bulkPricing: [
      { minQuantity: 10, maxQuantity: 49, price: 40, discount: 11 },
      { minQuantity: 50, maxQuantity: 99, price: 35, discount: 22 },
      { minQuantity: 100, price: 30, discount: 33 }
    ],
    specifications: {
      'Origin': 'Italy',
      'Type': 'Extra Virgin',
      'Acidity': '< 0.8%',
      'Container': 'Glass bottle'
    },
    deliveryOptions: ['Standard', 'Express', 'Scheduled']
  },
  {
    id: 'p2',
    vendorId: '5',
    name: 'Organic Tomatoes',
    category: 'ingredients',
    description: 'Fresh organic tomatoes, locally sourced',
    images: ['/products/tomatoes.jpg'],
    price: 3.50,
    unit: 'lb',
    inStock: true,
    minQuantity: 10,
    bulkPricing: [
      { minQuantity: 50, maxQuantity: 99, price: 3.00, discount: 14 },
      { minQuantity: 100, maxQuantity: 499, price: 2.75, discount: 21 },
      { minQuantity: 500, price: 2.50, discount: 29 }
    ],
    specifications: {
      'Type': 'Roma',
      'Organic': 'Yes',
      'Source': 'Local farms'
    },
    deliveryOptions: ['Same day', 'Next day', 'Scheduled']
  },
  {
    id: 'p3',
    vendorId: '7',
    name: 'Commercial Range - 6 Burner',
    category: 'kitchen_equipment',
    description: 'Professional gas range with 6 burners and double oven',
    images: ['/products/range.jpg'],
    price: 3500,
    unit: 'unit',
    inStock: true,
    minQuantity: 1,
    bulkPricing: [
      { minQuantity: 3, maxQuantity: 5, price: 3200, discount: 9 },
      { minQuantity: 6, price: 3000, discount: 14 }
    ],
    specifications: {
      'Burners': '6',
      'BTU': '30,000 per burner',
      'Oven Capacity': '4.5 cu ft each',
      'Warranty': '2 years'
    },
    deliveryOptions: ['White glove delivery', 'Installation included']
  },
  {
    id: 'p4',
    vendorId: '5',
    name: 'Biodegradable Take-out Containers',
    category: 'packaging',
    description: 'Eco-friendly containers made from sugarcane fiber',
    images: ['/products/containers.jpg'],
    price: 0.35,
    unit: 'piece',
    inStock: true,
    minQuantity: 200,
    bulkPricing: [
      { minQuantity: 1000, maxQuantity: 4999, price: 0.30, discount: 14 },
      { minQuantity: 5000, maxQuantity: 9999, price: 0.25, discount: 29 },
      { minQuantity: 10000, price: 0.20, discount: 43 }
    ],
    specifications: {
      'Material': 'Sugarcane fiber',
      'Size': '9" x 9" x 3"',
      'Microwave Safe': 'Yes',
      'Compostable': 'Yes'
    },
    deliveryOptions: ['Standard', 'Express']
  },
  {
    id: 'p5',
    vendorId: '5',
    name: 'Commercial Grade Sanitizer',
    category: 'cleaning',
    description: 'EPA approved sanitizer for food service',
    images: ['/products/sanitizer.jpg'],
    price: 25,
    unit: 'gallon',
    inStock: true,
    minQuantity: 4,
    bulkPricing: [
      { minQuantity: 20, maxQuantity: 49, price: 22, discount: 12 },
      { minQuantity: 50, maxQuantity: 99, price: 20, discount: 20 },
      { minQuantity: 100, price: 18, discount: 28 }
    ],
    specifications: {
      'EPA Registered': 'Yes',
      'Active Ingredient': 'Quaternary Ammonium',
      'Dilution Ratio': '1:256',
      'Contact Time': '60 seconds'
    },
    deliveryOptions: ['Standard', 'Hazmat delivery']
  }
];

export const mockRestaurantListings: RestaurantListing[] = [
  {
    id: 'rl1',
    type: 'sale',
    title: 'Established Italian Restaurant for Sale',
    description: 'Profitable Italian restaurant with loyal customer base, fully equipped kitchen, and prime location.',
    images: ['/listings/italian-restaurant.jpg'],
    price: 750000,
    location: {
      address: '123 Main Street',
      city: 'Manhattan',
      state: 'NY',
      zipCode: '10001',
      coordinates: {
        lat: 40.7128,
        lng: -74.0060
      }
    },
    details: {
      size: '3,500 sq ft',
      seatingCapacity: 85,
      kitchenEquipped: true,
      parkingSpaces: 15,
      yearEstablished: 2010,
      revenue: '$1.2M annually',
      reason: 'Owner retiring'
    },
    amenities: ['Full bar', 'Outdoor seating', 'Private dining room', 'Wine cellar', 'Pizza oven'],
    contact: {
      name: 'John Smith',
      phone: '+1-212-555-0201',
      email: 'john@restaurantbroker.com'
    },
    availability: 'Immediate',
    terms: 'Cash or financing available'
  },
  {
    id: 'rl2',
    type: 'rent',
    title: 'Restaurant Space for Rent - Turnkey Operation',
    description: 'Fully equipped restaurant space available for immediate occupancy. Previous tenant was successful sushi restaurant.',
    images: ['/listings/restaurant-space.jpg'],
    price: 8500,
    location: {
      address: '456 Broadway',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11211',
      coordinates: {
        lat: 40.7081,
        lng: -73.9571
      }
    },
    details: {
      size: '2,200 sq ft',
      seatingCapacity: 60,
      kitchenEquipped: true,
      parkingSpaces: 8,
      yearEstablished: 2015
    },
    amenities: ['Hood system', 'Walk-in cooler', 'Prep stations', 'POS system included', 'Furnished dining area'],
    contact: {
      name: 'Sarah Johnson',
      phone: '+1-718-555-0202',
      email: 'sarah@commercialrealty.com'
    },
    availability: 'March 1st',
    terms: '5-year lease minimum, first and last month required'
  },
  {
    id: 'rl3',
    type: 'lease',
    title: 'Food Court Space - High Traffic Mall',
    description: 'Prime food court location in busy shopping mall. Perfect for fast-casual concept.',
    images: ['/listings/food-court.jpg'],
    price: 4500,
    location: {
      address: '789 Mall Drive',
      city: 'Queens',
      state: 'NY',
      zipCode: '11375',
      coordinates: {
        lat: 40.7282,
        lng: -73.7949
      }
    },
    details: {
      size: '800 sq ft',
      seatingCapacity: 30,
      kitchenEquipped: false,
      yearEstablished: 2020
    },
    amenities: ['Shared seating area', 'Grease trap', 'Electrical hookups', 'Storage space'],
    contact: {
      name: 'Mike Chen',
      phone: '+1-718-555-0203',
      email: 'mike@mallmanagement.com'
    },
    availability: 'Negotiable',
    terms: '3-year lease with option to renew'
  }
];

export const vendorCategories = [
  { value: 'all', label: 'All Categories' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'food_supplies', label: 'Food Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'services', label: 'Services' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance & Tax' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'real_estate', label: 'Real Estate' }
];

export const serviceTypes = [
  { value: 'all', label: 'All Services' },
  { value: 'lpg_gas', label: 'LPG Gas Supply' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'tax_filing', label: 'Tax Filing' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'waste_management', label: 'Waste Management' },
  { value: 'laundry', label: 'Laundry Service' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'delivery', label: 'Delivery Service' }
];

export const orderTypes = [
  { value: 'all', label: 'All Order Types' },
  { value: 'single', label: 'Single Order' },
  { value: 'bulk', label: 'Bulk Order' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'subscription', label: 'Subscription' }
];

// Import comprehensive data for integration
import { allDummyVendors } from './comprehensive-dummy-data';
import { allDummyProducts } from './products-services-data';

// Export comprehensive data with aliases for backward compatibility
export const comprehensiveVendors = allDummyVendors;
export const comprehensiveProducts = allDummyProducts;

// Combined exports for maximum compatibility
export const allMarketplaceData = {
  vendors: [...mockVendors, ...allDummyVendors],
  products: [...mockProducts, ...allDummyProducts],
  restaurantListings: mockRestaurantListings,
  stats: {
    totalVendors: mockVendors.length + allDummyVendors.length,
    totalProducts: mockProducts.length + allDummyProducts.length,
    totalListings: mockRestaurantListings.length
  }
};