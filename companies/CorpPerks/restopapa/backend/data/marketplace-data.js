// Comprehensive Marketplace Data for RestaurantHub
// This file contains all categories, products, services, and vendor information

// MARKETPLACE CATEGORIES
const categories = [
  {
    id: "cat-001",
    name: "Raw Materials & Ingredients",
    slug: "raw-materials",
    icon: "🌾",
    description: "Fresh ingredients, spices, and raw materials for cooking",
    subcategories: ["Rice & Grains", "Spices & Seasonings", "Oils & Vinegars", "Flour & Baking", "Meat & Poultry", "Seafood", "Dairy Products"],
    productCount: 245,
    featured: true
  },
  {
    id: "cat-002",
    name: "Kitchen Equipment",
    slug: "kitchen-equipment",
    icon: "🍳",
    description: "Professional kitchen appliances and cooking equipment",
    subcategories: ["Cooking Equipment", "Refrigeration", "Food Prep Tools", "Dishware", "Cutlery", "Small Appliances"],
    productCount: 156,
    featured: true
  },
  {
    id: "cat-003",
    name: "Fresh Produce",
    slug: "fresh-produce",
    icon: "🥗",
    description: "Fresh fruits, vegetables, and organic produce",
    subcategories: ["Vegetables", "Fruits", "Herbs", "Organic Produce", "Exotic Items", "Frozen Items"],
    productCount: 189,
    featured: true
  },
  {
    id: "cat-004",
    name: "Packaging & Disposables",
    slug: "packaging",
    icon: "📦",
    description: "Food packaging, containers, and disposable items",
    subcategories: ["Food Containers", "Takeaway Packaging", "Disposable Cutlery", "Napkins & Tissues", "Bags", "Eco-Friendly Options"],
    productCount: 134,
    featured: false
  },
  {
    id: "cat-005",
    name: "Utility Services",
    slug: "utilities",
    icon: "⚡",
    description: "Essential utilities for restaurant operations",
    subcategories: ["LPG Gas", "Water Supply", "Electricity", "Internet", "Waste Management", "Cleaning Services"],
    productCount: 78,
    featured: true
  },
  {
    id: "cat-006",
    name: "Marketing & Digital Services",
    slug: "marketing",
    icon: "📱",
    description: "Digital marketing and promotional services",
    subcategories: ["Social Media", "Website Development", "SEO Services", "Photography", "Graphic Design", "Content Creation"],
    productCount: 67,
    featured: false
  },
  {
    id: "cat-007",
    name: "Financial Services",
    slug: "finance",
    icon: "💰",
    description: "Financial solutions and business services",
    subcategories: ["Business Loans", "Insurance", "Accounting", "Tax Services", "Payment Solutions", "Credit Facilities"],
    productCount: 45,
    featured: false
  },
  {
    id: "cat-008",
    name: "Space & Real Estate",
    slug: "space-rentals",
    icon: "🏢",
    description: "Restaurant spaces and real estate solutions",
    subcategories: ["Restaurant Spaces", "Kitchen Rental", "Storage Facilities", "Commercial Properties", "Event Venues", "Co-working Kitchens"],
    productCount: 89,
    featured: true
  },
  {
    id: "cat-009",
    name: "Subscription Services",
    slug: "subscriptions",
    icon: "📅",
    description: "Recurring services and subscription-based solutions",
    subcategories: ["Software Subscriptions", "Maintenance Services", "Delivery Services", "Inventory Management", "POS Systems", "Cloud Services"],
    productCount: 56,
    featured: false
  },
  {
    id: "cat-010",
    name: "Bundle Deals & Offers",
    slug: "bundles",
    icon: "🎁",
    description: "Special combo deals and bulk purchase offers",
    subcategories: ["Starter Packages", "Monthly Bundles", "Seasonal Offers", "Bulk Discounts", "Equipment Combos", "Service Packages"],
    productCount: 34,
    featured: true
  }
];

// COMPREHENSIVE PRODUCT CATALOG
const products = [
  // RAW MATERIALS & INGREDIENTS
  {
    id: "prod-001",
    name: "Premium Basmati Rice - Restaurant Grade",
    category: "Raw Materials & Ingredients",
    subcategory: "Rice & Grains",
    price: 2500,
    originalPrice: 2650,
    unit: "25kg bag",
    minOrder: 2,
    description: "Long grain basmati rice perfect for restaurants. Aged for 2 years for superior aroma and texture. Ideal for biryanis and pulao.",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400"
    ],
    vendor: {
      name: "Metro Food Supplies",
      rating: 4.6,
      location: "Bangalore",
      verified: true
    },
    specifications: {
      "Grain Length": "6.5-7.0 mm",
      "Moisture": "Max 14%",
      "Broken Grains": "Max 2%",
      "Shelf Life": "12 months",
      "Origin": "Punjab, India"
    },
    nutritionalInfo: {
      calories: "130 per 100g",
      protein: "2.7g",
      carbohydrates: "28g",
      fat: "0.3g"
    },
    tags: ["Premium", "Restaurant Grade", "Aged", "Aromatic"],
    inStock: true,
    stockQuantity: 500,
    discount: 5.7,
    creditEligible: true,
    deliveryTime: "24-48 hours",
    reviews: {
      rating: 4.5,
      count: 125
    }
  },
  {
    id: "prod-002",
    name: "Organic Garam Masala Powder",
    category: "Raw Materials & Ingredients",
    subcategory: "Spices & Seasonings",
    price: 450,
    originalPrice: 500,
    unit: "1kg pack",
    minOrder: 5,
    description: "Premium organic garam masala blend made from 12 carefully selected whole spices. Ground fresh and packed to preserve authentic flavors.",
    images: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
      "https://images.unsplash.com/photo-1505253468034-514d2507d914?w=400"
    ],
    vendor: {
      name: "Spice Garden Co.",
      rating: 4.8,
      location: "Kerala",
      verified: true
    },
    specifications: {
      "Ingredients": "Cardamom, Cinnamon, Cloves, Bay Leaves, Black Pepper, Cumin, Coriander",
      "Certification": "Organic Certified",
      "Processing": "Traditional Stone Ground",
      "Shelf Life": "18 months"
    },
    tags: ["Organic", "Premium", "Authentic", "Stone Ground"],
    inStock: true,
    stockQuantity: 200,
    discount: 10,
    creditEligible: true,
    deliveryTime: "2-3 days",
    reviews: {
      rating: 4.8,
      count: 89
    }
  },

  // KITCHEN EQUIPMENT
  {
    id: "prod-003",
    name: "Commercial Gas Burner - 4 Ring",
    category: "Kitchen Equipment",
    subcategory: "Cooking Equipment",
    price: 25000,
    originalPrice: 28000,
    unit: "1 unit",
    minOrder: 1,
    description: "Heavy-duty 4-ring gas burner designed for commercial kitchens. Made with stainless steel body and cast iron burner heads for durability.",
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
    ],
    vendor: {
      name: "Kitchen Pro Equipment",
      rating: 4.7,
      location: "Mumbai",
      verified: true
    },
    specifications: {
      "Material": "Stainless Steel 304 Grade",
      "Burner Type": "Cast Iron",
      "BTU Output": "60,000 BTU/hr",
      "Dimensions": "36\" x 24\" x 32\"",
      "Warranty": "2 years"
    },
    tags: ["Commercial Grade", "Stainless Steel", "Heavy Duty", "4 Ring"],
    inStock: true,
    stockQuantity: 15,
    discount: 10.7,
    creditEligible: true,
    deliveryTime: "5-7 days",
    reviews: {
      rating: 4.7,
      count: 45
    }
  },
  {
    id: "prod-004",
    name: "Industrial Deep Freezer - 500L",
    category: "Kitchen Equipment",
    subcategory: "Refrigeration",
    price: 55000,
    originalPrice: 60000,
    unit: "1 unit",
    minOrder: 1,
    description: "Energy-efficient 500L deep freezer with digital temperature control. Perfect for storing large quantities of frozen ingredients.",
    images: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      "https://images.unsplash.com/photo-1556909107-f6e7ad7d3136?w=400"
    ],
    vendor: {
      name: "CoolTech Appliances",
      rating: 4.5,
      location: "Delhi",
      verified: true
    },
    specifications: {
      "Capacity": "500 Liters",
      "Temperature Range": "-18°C to -25°C",
      "Energy Rating": "4 Star",
      "Defrost Type": "Manual",
      "Warranty": "3 years"
    },
    tags: ["Industrial", "Energy Efficient", "Large Capacity", "Digital Control"],
    inStock: true,
    stockQuantity: 8,
    discount: 8.3,
    creditEligible: true,
    deliveryTime: "7-10 days",
    reviews: {
      rating: 4.5,
      count: 32
    }
  },

  // FRESH PRODUCE
  {
    id: "prod-005",
    name: "Farm Fresh Organic Tomatoes",
    category: "Fresh Produce",
    subcategory: "Vegetables",
    price: 80,
    unit: "1kg",
    minOrder: 10,
    description: "Fresh, juicy organic tomatoes sourced directly from certified organic farms. Perfect for salads, curries, and sauces.",
    images: [
      "https://images.unsplash.com/photo-1546470427-e2e26c255305?w=400",
      "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=400"
    ],
    vendor: {
      name: "Green Valley Farms",
      rating: 4.6,
      location: "Pune",
      verified: true
    },
    specifications: {
      "Variety": "Hybrid",
      "Certification": "Organic Certified",
      "Harvest": "Daily",
      "Shelf Life": "5-7 days refrigerated"
    },
    nutritionalInfo: {
      calories: "18 per 100g",
      vitaminC: "28mg",
      lycopene: "High",
      fiber: "1.2g"
    },
    tags: ["Organic", "Fresh", "Farm Direct", "Daily Harvest"],
    inStock: true,
    stockQuantity: 500,
    creditEligible: false,
    deliveryTime: "Same day",
    reviews: {
      rating: 4.6,
      count: 156
    }
  },

  // PACKAGING & DISPOSABLES
  {
    id: "prod-006",
    name: "Biodegradable Food Containers - Set of 100",
    category: "Packaging & Disposables",
    subcategory: "Food Containers",
    price: 850,
    originalPrice: 950,
    unit: "100 pieces",
    minOrder: 5,
    description: "Eco-friendly biodegradable food containers made from sugarcane bagasse. Microwave and freezer safe with leak-proof design.",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb788?w=400"
    ],
    vendor: {
      name: "EcoPackaging Solutions",
      rating: 4.4,
      location: "Chennai",
      verified: true
    },
    specifications: {
      "Material": "Sugarcane Bagasse",
      "Size": "750ml capacity",
      "Temperature Resistance": "-20°C to 120°C",
      "Biodegradable": "90 days",
      "Certification": "FSC Certified"
    },
    tags: ["Biodegradable", "Eco-Friendly", "Leak Proof", "Microwave Safe"],
    inStock: true,
    stockQuantity: 200,
    discount: 10.5,
    creditEligible: true,
    deliveryTime: "3-5 days",
    reviews: {
      rating: 4.4,
      count: 78
    }
  },

  // UTILITY SERVICES
  {
    id: "prod-007",
    name: "Commercial LPG Gas Cylinder - 19kg",
    category: "Utility Services",
    subcategory: "LPG Gas",
    price: 850,
    unit: "19kg cylinder",
    minOrder: 1,
    description: "High-quality commercial LPG gas cylinder perfect for restaurant kitchens. Fast delivery and exchange service available.",
    images: [
      "https://images.unsplash.com/photo-1574263867128-a5d64b1db3b1?w=400"
    ],
    vendor: {
      name: "Bharat Gas Commercial",
      rating: 4.8,
      location: "Pan India",
      verified: true
    },
    specifications: {
      "Capacity": "19 kg",
      "Gas Type": "Commercial LPG",
      "Cylinder Type": "Steel",
      "Safety": "ISI Marked",
      "Service": "Home Delivery Available"
    },
    tags: ["Commercial", "Home Delivery", "Exchange Service", "ISI Marked"],
    inStock: true,
    stockQuantity: 100,
    creditEligible: true,
    deliveryTime: "Same day",
    reviews: {
      rating: 4.8,
      count: 234
    }
  },

  // MARKETING SERVICES
  {
    id: "prod-008",
    name: "Social Media Marketing Package - Complete",
    category: "Marketing & Digital Services",
    subcategory: "Social Media",
    price: 25000,
    unit: "1 month",
    minOrder: 1,
    description: "Complete social media marketing package for restaurants including content creation, daily posts, story management, and analytics.",
    images: [
      "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400",
      "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400"
    ],
    vendor: {
      name: "FoodieMarketing Pro",
      rating: 4.9,
      location: "Pan India",
      verified: true
    },
    specifications: {
      "Platforms": "Instagram, Facebook, Google My Business",
      "Content": "30 Posts + 30 Stories per month",
      "Photography": "1 food photoshoot included",
      "Analytics": "Weekly performance reports",
      "Duration": "Monthly subscription"
    },
    tags: ["Complete Package", "Professional", "Analytics Included", "Food Photography"],
    inStock: true,
    stockQuantity: 50,
    creditEligible: true,
    deliveryTime: "2-3 days to start",
    reviews: {
      rating: 4.9,
      count: 67
    }
  }
];

// VENDOR PROFILES
const vendors = [
  {
    id: "vendor-001",
    businessName: "Metro Food Supplies",
    ownerName: "Rajesh Kumar",
    email: "rajesh@metrofoodsupplies.com",
    phone: "+91-9876543210",
    category: "Raw Materials Supplier",
    description: "Leading supplier of premium quality rice, grains, and spices to restaurants across India. 15+ years of experience in the food industry.",
    address: {
      street: "123 Food Park, Whitefield",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560066"
    },
    businessDetails: {
      gstNumber: "29ABCDE1234F1Z5",
      established: "2008",
      employees: "50-100",
      turnover: "₹5-10 Crores"
    },
    certifications: ["FSSAI License", "ISO 22000", "Organic Certification"],
    rating: 4.6,
    reviewCount: 245,
    verified: true,
    premium: true,
    productsCount: 156,
    completedOrders: 2340,
    responseTime: "2 hours",
    deliveryAreas: ["Bangalore", "Chennai", "Hyderabad", "Coimbatore"],
    paymentMethods: ["Credit", "Net Banking", "UPI", "Cheque"],
    minimumOrder: "₹2,000",
    gallery: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400"
    ]
  },
  {
    id: "vendor-002",
    businessName: "Kitchen Pro Equipment",
    ownerName: "Priya Sharma",
    email: "priya@kitchenpro.com",
    phone: "+91-9876543211",
    category: "Equipment Supplier",
    description: "Specialized in commercial kitchen equipment and appliances. We provide installation, maintenance, and warranty services.",
    address: {
      street: "45 Industrial Estate, Andheri",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400053"
    },
    businessDetails: {
      gstNumber: "27ABCDE1234F1Z5",
      established: "2012",
      employees: "20-50",
      turnover: "₹10-25 Crores"
    },
    certifications: ["ISI Certified", "CE Marked", "BIS Approved"],
    rating: 4.7,
    reviewCount: 189,
    verified: true,
    premium: true,
    productsCount: 89,
    completedOrders: 1567,
    responseTime: "4 hours",
    deliveryAreas: ["Mumbai", "Pune", "Nashik", "Thane"],
    paymentMethods: ["Credit", "EMI Available", "Net Banking", "Cheque"],
    minimumOrder: "₹10,000",
    specialServices: ["Installation", "AMC", "Warranty Support"],
    gallery: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
    ]
  },
  {
    id: "vendor-003",
    businessName: "Green Valley Farms",
    ownerName: "Arun Patel",
    email: "arun@greenvalley.com",
    phone: "+91-9876543212",
    category: "Fresh Produce Supplier",
    description: "Certified organic farm supplying fresh vegetables and fruits directly to restaurants. Farm-to-table freshness guaranteed.",
    address: {
      street: "Village Khed, Tal. Rajgurunagar",
      city: "Pune",
      state: "Maharashtra",
      pincode: "410505"
    },
    businessDetails: {
      gstNumber: "27XYZAB1234F1Z5",
      established: "2015",
      employees: "100-200",
      turnover: "₹2-5 Crores"
    },
    certifications: ["Organic Certified", "FSSAI License", "Fair Trade"],
    rating: 4.6,
    reviewCount: 324,
    verified: true,
    premium: false,
    productsCount: 78,
    completedOrders: 3456,
    responseTime: "1 hour",
    deliveryAreas: ["Pune", "Mumbai", "Nashik", "Aurangabad"],
    paymentMethods: ["Cash", "UPI", "Net Banking"],
    minimumOrder: "₹500",
    specialServices: ["Same Day Delivery", "Bulk Discounts", "Subscription Plans"],
    farmDetails: {
      totalArea: "50 acres",
      organic: true,
      crops: ["Vegetables", "Fruits", "Herbs"],
      harvestSchedule: "Daily"
    },
    gallery: [
      "https://images.unsplash.com/photo-1546470427-e2e26c255305?w=400",
      "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=400"
    ]
  }
];

// JOB CATEGORIES AND POSITIONS
const jobCategories = [
  {
    id: "job-cat-001",
    name: "Kitchen Staff",
    positions: ["Head Chef", "Sous Chef", "Line Cook", "Prep Cook", "Kitchen Assistant", "Dishwasher"],
    averageSalary: "₹15,000 - ₹80,000",
    openings: 234
  },
  {
    id: "job-cat-002",
    name: "Service Staff",
    positions: ["Restaurant Manager", "Waiter/Waitress", "Bartender", "Hostess", "Cashier", "Server"],
    averageSalary: "₹12,000 - ₹50,000",
    openings: 456
  },
  {
    id: "job-cat-003",
    name: "Management",
    positions: ["General Manager", "Assistant Manager", "Shift Supervisor", "Team Leader", "Floor Manager"],
    averageSalary: "₹25,000 - ₹120,000",
    openings: 123
  },
  {
    id: "job-cat-004",
    name: "Delivery & Logistics",
    positions: ["Delivery Boy", "Driver", "Logistics Coordinator", "Dispatch Manager", "Fleet Manager"],
    averageSalary: "₹15,000 - ₹40,000",
    openings: 345
  },
  {
    id: "job-cat-005",
    name: "Specialized Roles",
    positions: ["Pastry Chef", "Pizza Maker", "Barista", "Sommelier", "Food Photographer", "Nutritionist"],
    averageSalary: "₹20,000 - ₹100,000",
    openings: 89
  }
];

// SAMPLE JOB LISTINGS
const jobListings = [
  {
    id: "job-001",
    title: "Head Chef - Fine Dining Restaurant",
    position: "Head Chef",
    restaurant: {
      name: "The Golden Spoon",
      logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100",
      location: "Indiranagar, Bangalore",
      rating: 4.6,
      verified: true
    },
    salary: {
      min: 60000,
      max: 100000,
      currency: "INR",
      period: "monthly"
    },
    experience: {
      min: 5,
      max: 10,
      unit: "years"
    },
    jobType: "Full-time",
    workingHours: "10 hours/day",
    description: "We are seeking an experienced Head Chef to lead our kitchen team in a premium fine dining restaurant. The ideal candidate should have expertise in multi-cuisine cooking and team management.",
    requirements: [
      "5+ years of experience as a Head Chef or Senior Sous Chef",
      "Expertise in Continental, Indian, and Asian cuisines",
      "Strong leadership and team management skills",
      "Food safety and hygiene certification (HACCP preferred)",
      "Ability to work under pressure and maintain quality standards",
      "Menu planning and cost control experience"
    ],
    responsibilities: [
      "Oversee all kitchen operations and food preparation",
      "Design and update seasonal menus",
      "Manage kitchen staff and maintain food quality standards",
      "Ensure compliance with food safety regulations",
      "Control food costs and minimize wastage",
      "Train and mentor junior kitchen staff"
    ],
    benefits: [
      "Competitive salary with performance bonuses",
      "Health insurance for self and family",
      "Paid time off and sick leave",
      "Professional development opportunities",
      "Staff meals and accommodation assistance",
      "Annual performance appraisal"
    ],
    qualifications: [
      "Diploma/Degree in Hotel Management or Culinary Arts",
      "Professional cooking certification",
      "Food safety certification"
    ],
    postedDate: "2025-01-03",
    applicationDeadline: "2025-01-20",
    status: "active",
    applications: 45,
    views: 234,
    urgency: "high",
    featured: true
  },
  {
    id: "job-002",
    title: "Experienced Waiter - Multi-Cuisine Restaurant",
    position: "Waiter/Waitress",
    restaurant: {
      name: "Spice Junction",
      logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100",
      location: "Koramangala, Bangalore",
      rating: 4.3,
      verified: true
    },
    salary: {
      min: 18000,
      max: 25000,
      currency: "INR",
      period: "monthly"
    },
    experience: {
      min: 1,
      max: 3,
      unit: "years"
    },
    jobType: "Full-time",
    workingHours: "9 hours/day",
    description: "Join our vibrant team as a Waiter/Waitress in a popular multi-cuisine restaurant. We're looking for enthusiastic individuals with excellent customer service skills.",
    requirements: [
      "1+ years of experience in restaurant service",
      "Excellent communication skills in English and local language",
      "Pleasant personality and professional appearance",
      "Ability to work in a fast-paced environment",
      "Basic knowledge of food and beverages",
      "Flexibility to work in shifts including weekends"
    ],
    responsibilities: [
      "Greet customers and take orders accurately",
      "Serve food and beverages promptly",
      "Handle customer queries and complaints professionally",
      "Process payments and maintain cash handling accuracy",
      "Maintain cleanliness of dining area",
      "Assist in restaurant opening and closing procedures"
    ],
    benefits: [
      "Competitive salary plus tips",
      "Performance-based incentives",
      "Staff meals provided",
      "Medical insurance coverage",
      "Career growth opportunities",
      "Friendly work environment"
    ],
    qualifications: [
      "High school education or equivalent",
      "Previous restaurant experience preferred",
      "Good physical stamina"
    ],
    postedDate: "2025-01-04",
    applicationDeadline: "2025-01-25",
    status: "active",
    applications: 78,
    views: 456,
    urgency: "medium",
    featured: false
  },
  {
    id: "job-003",
    title: "Sous Chef - Italian Restaurant",
    position: "Sous Chef",
    restaurant: {
      name: "Italiano Perfetto",
      logo: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=100",
      location: "UB City Mall, Bangalore",
      rating: 4.8,
      verified: true
    },
    salary: {
      min: 35000,
      max: 55000,
      currency: "INR",
      period: "monthly"
    },
    experience: {
      min: 3,
      max: 6,
      unit: "years"
    },
    jobType: "Full-time",
    workingHours: "10 hours/day",
    description: "Exciting opportunity for a skilled Sous Chef to join our authentic Italian restaurant. Looking for someone passionate about Italian cuisine and kitchen operations.",
    requirements: [
      "3+ years of experience in Italian cuisine",
      "Strong knowledge of pasta, pizza, and Italian cooking techniques",
      "Leadership skills and ability to supervise kitchen staff",
      "Food safety certification required",
      "Ability to work under pressure during peak hours",
      "Creative flair for menu development"
    ],
    responsibilities: [
      "Assist Head Chef in daily kitchen operations",
      "Prepare and cook Italian dishes to restaurant standards",
      "Supervise and train junior kitchen staff",
      "Maintain food quality and presentation standards",
      "Manage inventory and reduce food wastage",
      "Ensure kitchen hygiene and safety protocols"
    ],
    benefits: [
      "Attractive salary package",
      "Health and life insurance",
      "Annual bonus based on performance",
      "Learning opportunities with Italian chefs",
      "Staff dining privileges",
      "Career advancement prospects"
    ],
    qualifications: [
      "Culinary arts certification or equivalent experience",
      "Italian cuisine specialization preferred",
      "Food handler's permit"
    ],
    postedDate: "2025-01-02",
    applicationDeadline: "2025-01-18",
    status: "active",
    applications: 32,
    views: 187,
    urgency: "high",
    featured: true
  }
];

module.exports = {
  categories,
  products,
  vendors,
  jobCategories,
  jobListings
};