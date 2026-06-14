// Comprehensive Services Data for RestaurantHub
// This file contains all types of services offered on the platform

// FINANCIAL SERVICES
const financialServices = [
  {
    id: "fin-001",
    name: "Restaurant Business Loan - Quick Approval",
    category: "Financial Services",
    subcategory: "Business Loans",
    provider: {
      name: "QuickFin Solutions",
      rating: 4.7,
      location: "Pan India",
      verified: true,
      license: "NBFC License - RBI Approved"
    },
    loanAmount: {
      min: 100000,
      max: 5000000,
      currency: "INR"
    },
    interestRate: {
      min: 12.5,
      max: 18.5,
      unit: "% per annum"
    },
    tenure: {
      min: 12,
      max: 60,
      unit: "months"
    },
    processingFee: "1.5% + GST",
    description: "Fast approval business loans specifically designed for restaurants. Minimal documentation, quick disbursal, and flexible repayment options.",
    features: [
      "Approval within 48 hours",
      "Minimal documentation required",
      "No collateral needed up to ₹10 lakhs",
      "Flexible repayment schedules",
      "Competitive interest rates",
      "Online application process"
    ],
    eligibility: [
      "Restaurant operational for minimum 1 year",
      "Minimum annual turnover of ₹15 lakhs",
      "Good credit score (650+)",
      "Valid FSSAI license",
      "GST registration required"
    ],
    requiredDocuments: [
      "PAN Card & Aadhaar Card",
      "Bank statements (6 months)",
      "GST returns (6 months)",
      "FSSAI license copy",
      "Restaurant ownership/lease documents",
      "ITR for last 2 years"
    ],
    applicationProcess: [
      "Submit online application with basic details",
      "Upload required documents",
      "Initial verification within 24 hours",
      "Physical verification (if required)",
      "Loan approval and documentation",
      "Amount disbursed to bank account"
    ],
    pricing: "Starting from ₹1,500 processing fee",
    deliveryTime: "48-72 hours for approval",
    successRate: "85%",
    customerTestimonials: [
      {
        name: "Rajesh Mehta",
        restaurant: "Spice Garden",
        comment: "Got ₹5 lakh loan approved in just 2 days. Process was smooth and transparent."
      }
    ],
    contactInfo: {
      phone: "+91-1800-123-4567",
      email: "loans@quickfin.com",
      website: "www.quickfin.com/restaurant-loans"
    }
  },
  {
    id: "fin-002",
    name: "Comprehensive Restaurant Insurance",
    category: "Financial Services",
    subcategory: "Insurance",
    provider: {
      name: "SafeGuard Insurance",
      rating: 4.5,
      location: "Pan India",
      verified: true,
      license: "IRDAI License No. 157"
    },
    coverage: {
      propertyInsurance: "Up to ₹1 Crore",
      equipmentInsurance: "Up to ₹50 Lakhs",
      publicLiability: "Up to ₹25 Lakhs",
      employeeInsurance: "Up to ₹5 Lakhs per employee"
    },
    premium: {
      starting: 15000,
      currency: "INR",
      period: "annually"
    },
    description: "Comprehensive insurance coverage for restaurants including property, equipment, public liability, and employee insurance. Protects your business from unforeseen circumstances.",
    coverageDetails: [
      "Fire and natural calamities damage",
      "Kitchen equipment breakdown",
      "Food poisoning liability",
      "Employee accident coverage",
      "Business interruption losses",
      "Theft and burglary protection"
    ],
    exclusions: [
      "Pre-existing equipment damage",
      "War and terrorism acts",
      "Nuclear risks",
      "Willful negligence"
    ],
    claimProcess: [
      "Report incident within 24 hours",
      "Submit claim form with documents",
      "Surveyor inspection (if required)",
      "Claim assessment and approval",
      "Settlement within 15-30 days"
    ],
    additionalBenefits: [
      "24/7 claim support helpline",
      "Cashless claim settlement",
      "Annual health check-up for employees",
      "Free risk assessment consultation"
    ],
    pricing: "Starting from ₹15,000 annually",
    deliveryTime: "Policy issued within 24 hours"
  },
  {
    id: "fin-003",
    name: "Restaurant Credit Facility - Buy Now Pay Later",
    category: "Financial Services",
    subcategory: "Credit Facilities",
    provider: {
      name: "RestaurantHub Credit",
      rating: 4.8,
      location: "Pan India",
      verified: true,
      license: "RBI Approved Credit Provider"
    },
    creditLimit: {
      min: 50000,
      max: 500000,
      currency: "INR"
    },
    repaymentPeriod: "30-90 days",
    interestRate: "0% for first 30 days, 1.5% per month thereafter",
    description: "Exclusive credit facility for RestaurantHub restaurants. Purchase supplies, equipment, and services on credit with flexible payment options.",
    features: [
      "Instant credit approval for verified restaurants",
      "0% interest for first 30 days",
      "Flexible repayment options",
      "No prepayment penalties",
      "Automatic credit limit increase based on usage",
      "Detailed spending analytics and reports"
    ],
    eligibility: [
      "Verified restaurant on RestaurantHub",
      "Minimum 6 months operational history",
      "Good payment track record",
      "Monthly revenue of ₹2 lakhs+"
    ],
    applicationProcess: [
      "Complete restaurant verification on platform",
      "Submit financial documents",
      "Automated credit assessment",
      "Credit limit approval within 24 hours",
      "Start purchasing immediately"
    ],
    benefits: [
      "Improved cash flow management",
      "Volume discounts on bulk purchases",
      "Priority customer support",
      "Monthly spending insights",
      "Integration with accounting software"
    ]
  }
];

// MARKETING & DIGITAL SERVICES
const marketingServices = [
  {
    id: "mkt-001",
    name: "Complete Social Media Management",
    category: "Marketing & Digital Services",
    subcategory: "Social Media",
    provider: {
      name: "FoodieMarketing Pro",
      rating: 4.9,
      location: "Pan India",
      verified: true,
      portfolio: "500+ restaurants served"
    },
    packages: [
      {
        name: "Starter Package",
        price: 15000,
        duration: "1 month",
        features: [
          "15 Instagram posts",
          "15 Facebook posts",
          "5 Instagram stories daily",
          "Basic hashtag research",
          "Monthly analytics report"
        ]
      },
      {
        name: "Premium Package",
        price: 25000,
        duration: "1 month",
        features: [
          "30 Instagram posts",
          "30 Facebook posts",
          "5 Instagram stories daily",
          "1 professional food photoshoot",
          "Advanced hashtag strategy",
          "Influencer collaboration (1 per month)",
          "Weekly analytics reports",
          "Customer engagement management"
        ]
      },
      {
        name: "Enterprise Package",
        price: 45000,
        duration: "1 month",
        features: [
          "45 Instagram posts",
          "45 Facebook posts",
          "Daily Instagram stories",
          "2 professional food photoshoots",
          "Video content creation (5 videos)",
          "Multiple influencer collaborations",
          "Google My Business management",
          "24/7 customer support",
          "Real-time analytics dashboard"
        ]
      }
    ],
    description: "Complete social media management service for restaurants. From content creation to community management, we handle everything to boost your online presence.",
    servicesIncluded: [
      "Content creation and curation",
      "Professional food photography",
      "Video production and editing",
      "Hashtag research and optimization",
      "Community management",
      "Influencer partnerships",
      "Analytics and reporting",
      "Social media advertising"
    ],
    platforms: ["Instagram", "Facebook", "Google My Business", "YouTube"],
    deliverables: [
      "Branded social media posts",
      "High-quality food photographs",
      "Engaging video content",
      "Monthly performance reports",
      "Competitor analysis",
      "Growth strategy recommendations"
    ],
    results: {
      averageGrowth: "150% follower increase in 3 months",
      engagementRate: "Average 8-12% engagement rate",
      leadGeneration: "25% increase in online orders"
    },
    clientTestimonials: [
      {
        name: "Priya Sharma",
        restaurant: "Cafe Delight",
        comment: "Our Instagram following grew from 500 to 5000 in just 4 months. Orders increased by 40%!"
      }
    ]
  },
  {
    id: "mkt-002",
    name: "Professional Food Photography & Videography",
    category: "Marketing & Digital Services",
    subcategory: "Photography",
    provider: {
      name: "Culinary Lens Studio",
      rating: 4.8,
      location: "Bangalore, Mumbai, Delhi",
      verified: true,
      experience: "8+ years in food photography"
    },
    services: [
      {
        name: "Basic Food Shoot",
        price: 8000,
        duration: "Half day (4 hours)",
        deliverables: [
          "20 edited high-resolution photos",
          "Social media ready formats",
          "Basic styling and lighting",
          "2 rounds of revisions"
        ]
      },
      {
        name: "Premium Food Shoot",
        price: 15000,
        duration: "Full day (8 hours)",
        deliverables: [
          "40 edited high-resolution photos",
          "Social media + print ready formats",
          "Professional styling and props",
          "Advanced lighting setup",
          "3 rounds of revisions",
          "Behind-the-scenes content"
        ]
      },
      {
        name: "Video Production Package",
        price: 25000,
        duration: "2 days",
        deliverables: [
          "1 promotional video (60-90 seconds)",
          "5 short social media videos",
          "Raw footage provided",
          "Professional editing and color grading",
          "Background music and effects",
          "Multiple format exports"
        ]
      }
    ],
    description: "Professional food photography and videography services to showcase your dishes in the best light. Perfect for menus, social media, and marketing materials.",
    equipment: [
      "Professional DSLR cameras",
      "Studio lighting equipment",
      "Professional food styling props",
      "4K video recording capability",
      "Drone footage (outdoor shoots)"
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
      "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400",
      "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400"
    ],
    process: [
      "Initial consultation and planning",
      "Menu selection and styling discussion",
      "Professional photoshoot at restaurant",
      "Post-production editing",
      "Delivery of final assets",
      "Usage rights and licensing"
    ]
  },
  {
    id: "mkt-003",
    name: "Restaurant Website Development & SEO",
    category: "Marketing & Digital Services",
    subcategory: "Website Development",
    provider: {
      name: "WebBite Solutions",
      rating: 4.7,
      location: "Pan India",
      verified: true,
      projectsCompleted: "200+ restaurant websites"
    },
    packages: [
      {
        name: "Basic Website",
        price: 25000,
        features: [
          "5-page responsive website",
          "Menu integration",
          "Contact form",
          "Google Maps integration",
          "Basic SEO setup",
          "Mobile optimization",
          "1 year hosting included"
        ]
      },
      {
        name: "Advanced Website",
        price: 45000,
        features: [
          "10-page responsive website",
          "Online ordering system",
          "Table booking system",
          "Customer reviews section",
          "Photo gallery",
          "Social media integration",
          "Advanced SEO optimization",
          "Analytics setup",
          "1 year hosting & SSL"
        ]
      },
      {
        name: "E-commerce Website",
        price: 75000,
        features: [
          "Full e-commerce functionality",
          "Online ordering & delivery",
          "Payment gateway integration",
          "Inventory management",
          "Customer accounts",
          "Order tracking system",
          "Multi-location support",
          "Admin dashboard",
          "Mobile app integration ready"
        ]
      }
    ],
    description: "Professional restaurant website development with modern design, online ordering capabilities, and search engine optimization to boost your online presence.",
    technicalFeatures: [
      "Responsive design for all devices",
      "Fast loading times (<3 seconds)",
      "SEO optimized content",
      "Secure payment processing",
      "Content management system",
      "Analytics and tracking",
      "Social media integration",
      "Search engine friendly URLs"
    ],
    deliveryTimeline: [
      "Day 1-3: Design mockups and approval",
      "Day 4-10: Development and coding",
      "Day 11-12: Testing and QA",
      "Day 13-14: Content upload and review",
      "Day 15: Launch and go-live"
    ],
    supportIncluded: [
      "3 months free technical support",
      "Website training session",
      "Basic content updates",
      "Security updates",
      "Backup management",
      "Performance monitoring"
    ]
  }
];

// UTILITY SERVICES
const utilityServices = [
  {
    id: "util-001",
    name: "Commercial LPG Gas Supply & Maintenance",
    category: "Utility Services",
    subcategory: "LPG Gas",
    provider: {
      name: "Bharat Gas Commercial Division",
      rating: 4.8,
      location: "Pan India",
      verified: true,
      license: "Petroleum & Explosives Safety Organization (PESO)"
    },
    services: [
      {
        name: "Regular LPG Supply",
        cylinders: [
          {
            type: "19kg Commercial Cylinder",
            price: 850,
            deposit: 1500,
            features: ["ISI marked", "Safety tested", "Home delivery"]
          },
          {
            type: "47.5kg Bulk Cylinder",
            price: 2100,
            deposit: 3500,
            features: ["High capacity", "Cost effective", "Commercial grade"]
          }
        ]
      },
      {
        name: "Pipeline Gas Connection",
        price: 15000,
        description: "Direct pipeline connection for high-volume restaurants",
        features: [
          "Continuous gas supply",
          "No cylinder handling required",
          "Cost effective for high usage",
          "Automatic meter reading",
          "Safety monitoring system"
        ]
      }
    ],
    deliveryService: {
      deliveryTime: "Same day delivery available",
      emergencyService: "24/7 emergency gas supply",
      servicingAreas: "All major cities",
      minimumOrder: "1 cylinder",
      bulkDiscounts: "Available for 10+ cylinders"
    },
    safetyFeatures: [
      "Regular safety inspections",
      "Leak detection equipment",
      "Emergency response team",
      "Safety training for staff",
      "Insurance coverage included"
    ],
    maintenanceServices: [
      "Annual safety inspection",
      "Burner and regulator maintenance",
      "Gas line pressure testing",
      "Emergency repair services",
      "Equipment replacement"
    ],
    contactInfo: {
      emergencyHelpline: "1800-233-3555",
      customerCare: "+91-1800-123-BGAS",
      onlineBooking: "www.bharatgas.co.in/commercial"
    }
  },
  {
    id: "util-002",
    name: "Restaurant Water Purification & Supply",
    category: "Utility Services",
    subcategory: "Water Supply",
    provider: {
      name: "AquaPure Water Solutions",
      rating: 4.7,
      location: "Bangalore, Mumbai, Delhi, Chennai",
      verified: true,
      certifications: ["ISI Certified", "WHO Standards", "BIS Approved"]
    },
    services: [
      {
        name: "Commercial RO Water Purifier",
        models: [
          {
            name: "AquaPure Pro 100LPH",
            capacity: "100 liters per hour",
            price: 35000,
            features: [
              "7-stage purification",
              "TDS controller",
              "UV sterilization",
              "Stainless steel tank",
              "1 year warranty"
            ]
          },
          {
            name: "AquaPure Industrial 500LPH",
            capacity: "500 liters per hour",
            price: 85000,
            features: [
              "Industrial grade components",
              "Automatic cleaning",
              "Remote monitoring",
              "Food grade materials",
              "2 years warranty"
            ]
          }
        ]
      },
      {
        name: "Bottled Water Supply",
        options: [
          {
            type: "20L Bottles",
            price: 45,
            minimumOrder: 20,
            delivery: "Daily delivery available"
          },
          {
            type: "5L Bottles",
            price: 25,
            minimumOrder: 50,
            delivery: "Twice daily delivery"
          }
        ]
      }
    ],
    installationService: {
      inspection: "Free site inspection",
      installation: "Professional installation by certified technicians",
      commissioning: "System testing and commissioning",
      training: "Staff training on operation and maintenance"
    },
    maintenancePackages: [
      {
        name: "Basic AMC",
        price: 3000,
        duration: "1 year",
        services: [
          "Quarterly filter replacement",
          "Bi-annual service",
          "Emergency breakdown support",
          "Water quality testing"
        ]
      },
      {
        name: "Comprehensive AMC",
        price: 6000,
        duration: "1 year",
        services: [
          "Monthly preventive maintenance",
          "All consumables included",
          "24/7 breakdown support",
          "Remote monitoring",
          "Annual equipment upgrade"
        ]
      }
    ],
    waterQuality: {
      tdsReduction: "Up to 90% TDS reduction",
      bacteriaRemoval: "99.99% bacteria removal",
      virusRemoval: "99.99% virus removal",
      heavyMetals: "Complete heavy metal removal",
      certification: "WHO & BIS standards compliant"
    }
  },
  {
    id: "util-003",
    name: "Restaurant Waste Management & Disposal",
    category: "Utility Services",
    subcategory: "Waste Management",
    provider: {
      name: "EcoClean Waste Solutions",
      rating: 4.6,
      location: "Bangalore, Pune, Hyderabad",
      verified: true,
      certifications: ["Pollution Control Board Authorized", "ISO 14001"]
    },
    services: [
      {
        name: "Organic Waste Management",
        description: "Collection and processing of food waste into compost",
        pricing: {
          perKg: 15,
          monthlyPackage: 5000,
          includes: "Daily collection, processing, compost delivery"
        },
        process: [
          "Segregated waste collection",
          "Transportation to processing facility",
          "Aerobic composting process",
          "Quality compost production",
          "Free compost delivery to restaurants"
        ]
      },
      {
        name: "Cooking Oil Disposal",
        description: "Safe disposal and recycling of used cooking oil",
        pricing: {
          perLiter: 2,
          bulkDiscount: "10% off for 100+ liters",
          collection: "Free collection for 50+ liters"
        },
        environmentalBenefit: "Prevents drain clogging and environmental pollution"
      },
      {
        name: "General Waste Collection",
        description: "Regular collection of non-organic waste",
        pricing: {
          monthly: 2500,
          includes: "Daily collection, segregation, recycling"
        }
      }
    ],
    sustainabilityFeatures: [
      "Zero landfill solution",
      "Compost production from food waste",
      "Cooking oil conversion to biodiesel",
      "Plastic waste recycling",
      "Carbon footprint reduction certificate"
    ],
    complianceServices: [
      "Pollution Control Board compliance",
      "Waste audit reports",
      "Environmental clearance documentation",
      "Sustainability certificates",
      "Regular compliance monitoring"
    ],
    equipmentProvided: [
      "Color-coded waste bins",
      "Organic waste containers",
      "Oil collection drums",
      "Weighing scales",
      "Collection schedule charts"
    ]
  }
];

// SUBSCRIPTION SERVICES
const subscriptionServices = [
  {
    id: "sub-001",
    name: "Restaurant POS System - Cloud Based",
    category: "Subscription Services",
    subcategory: "POS Systems",
    provider: {
      name: "RestaurantPOS Pro",
      rating: 4.8,
      location: "Pan India",
      verified: true,
      clientBase: "10,000+ restaurants"
    },
    plans: [
      {
        name: "Starter Plan",
        price: 1500,
        period: "monthly",
        features: [
          "Single outlet support",
          "Basic billing and invoicing",
          "Inventory management",
          "Sales reports",
          "Customer support",
          "Cloud backup"
        ],
        limitations: [
          "Max 1000 transactions/month",
          "Basic reports only",
          "Email support only"
        ]
      },
      {
        name: "Professional Plan",
        price: 3000,
        period: "monthly",
        features: [
          "Multi-outlet support (up to 3)",
          "Advanced billing features",
          "Comprehensive inventory management",
          "Detailed analytics and reports",
          "Staff management",
          "Table management",
          "Online ordering integration",
          "24/7 phone support"
        ],
        limitations: [
          "Max 10,000 transactions/month",
          "Up to 3 outlets only"
        ]
      },
      {
        name: "Enterprise Plan",
        price: 6000,
        period: "monthly",
        features: [
          "Unlimited outlets",
          "Complete restaurant management",
          "Advanced analytics and AI insights",
          "Custom reports and dashboards",
          "API integrations",
          "Multi-location inventory sync",
          "CRM and loyalty programs",
          "Dedicated account manager",
          "On-site support"
        ],
        limitations: ["None"]
      }
    ],
    description: "Complete cloud-based POS system designed specifically for restaurants. Manage billing, inventory, staff, and analytics from anywhere.",
    coreFeatures: [
      "Touch-screen ordering interface",
      "Kitchen display system (KDS)",
      "Real-time inventory tracking",
      "Staff performance analytics",
      "Customer relationship management",
      "Multi-payment gateway support",
      "Offline mode capability",
      "Data backup and security"
    ],
    integrations: [
      "Zomato & Swiggy ordering",
      "Payment gateways (Razorpay, PayU)",
      "Accounting software (Tally, QuickBooks)",
      "Delivery management systems",
      "Social media platforms",
      "Email marketing tools"
    ],
    hardwareSupport: [
      "iPad and Android tablets",
      "Thermal receipt printers",
      "Cash drawers",
      "Barcode scanners",
      "Kitchen display monitors",
      "Payment terminals"
    ],
    setupServices: {
      included: [
        "Software installation and setup",
        "Menu digitization",
        "Staff training (2 hours)",
        "Basic customization",
        "Go-live support"
      ],
      additional: [
        "Advanced customization - ₹5,000",
        "Extended training - ₹2,000/day",
        "On-site setup - ₹3,000",
        "Data migration - ₹10,000"
      ]
    }
  },
  {
    id: "sub-002",
    name: "Inventory Management Software Subscription",
    category: "Subscription Services",
    subcategory: "Inventory Management",
    provider: {
      name: "StockMaster Solutions",
      rating: 4.6,
      location: "Pan India",
      verified: true,
      specialization: "Restaurant inventory management"
    },
    plans: [
      {
        name: "Basic Plan",
        price: 999,
        period: "monthly",
        features: [
          "Inventory tracking for 500 items",
          "Basic purchase order management",
          "Low stock alerts",
          "Simple reporting",
          "Mobile app access",
          "Email support"
        ]
      },
      {
        name: "Advanced Plan",
        price: 2499,
        period: "monthly",
        features: [
          "Inventory tracking for unlimited items",
          "Advanced purchase order management",
          "Vendor management system",
          "Recipe costing and food cost analysis",
          "Waste tracking and reporting",
          "Multi-location support",
          "API integrations",
          "Phone and chat support"
        ]
      }
    ],
    description: "Comprehensive inventory management solution for restaurants. Track ingredients, manage suppliers, control costs, and reduce waste.",
    keyFeatures: [
      "Real-time inventory tracking",
      "Automated purchase orders",
      "Recipe cost calculation",
      "Waste management tracking",
      "Supplier performance analytics",
      "Expiry date management",
      "Barcode scanning support",
      "Mobile app for stock updates"
    ],
    benefits: [
      "Reduce food waste by 25%",
      "Lower inventory costs by 15%",
      "Improve supplier relationships",
      "Accurate recipe costing",
      "Better menu pricing decisions",
      "Compliance with food safety regulations"
    ],
    reportingFeatures: [
      "Stock movement reports",
      "Purchase analysis",
      "Vendor performance reports",
      "Cost variance analysis",
      "Waste tracking reports",
      "ABC analysis for inventory optimization"
    ]
  },
  {
    id: "sub-003",
    name: "Cloud Accounting Software for Restaurants",
    category: "Subscription Services",
    subcategory: "Accounting Software",
    provider: {
      name: "RestaurantBooks",
      rating: 4.7,
      location: "Pan India",
      verified: true,
      expertise: "Restaurant financial management"
    },
    plans: [
      {
        name: "Essential Plan",
        price: 1299,
        period: "monthly",
        features: [
          "Basic bookkeeping",
          "Income and expense tracking",
          "GST compliance",
          "Bank reconciliation",
          "Basic financial reports",
          "Unlimited invoices"
        ]
      },
      {
        name: "Professional Plan",
        price: 2499,
        period: "monthly",
        features: [
          "Advanced financial management",
          "Multi-location accounting",
          "Payroll management",
          "Advanced reporting and analytics",
          "Budgeting and forecasting",
          "Tax planning tools",
          "Accountant collaboration",
          "Priority support"
        ]
      }
    ],
    description: "Specialized cloud accounting software designed for restaurant businesses. Handle GST, payroll, financial reporting, and compliance easily.",
    restaurantSpecificFeatures: [
      "Food cost accounting",
      "Tip management and distribution",
      "Multi-revenue stream tracking",
      "Seasonal business planning",
      "Daily sales reconciliation",
      "Cash flow management for restaurants",
      "Franchise accounting (multi-outlet)",
      "Integration with POS systems"
    ],
    complianceFeatures: [
      "Automatic GST calculation",
      "GST return filing assistance",
      "TDS calculations and filing",
      "Professional tax management",
      "Audit trail maintenance",
      "Statutory reports generation"
    ],
    integrations: [
      "Popular POS systems",
      "Banking platforms",
      "Payment gateways",
      "Payroll systems",
      "Inventory management software",
      "E-commerce platforms"
    ]
  }
];

module.exports = {
  financialServices,
  marketingServices,
  utilityServices,
  subscriptionServices
};