// Comprehensive Restaurant Data for RestaurantHub
// This file contains restaurant profiles, menus, and related information

// RESTAURANT PROFILES
const restaurantProfiles = [
  {
    id: "rest-001",
    businessName: "The Golden Spoon",
    ownerName: "Suresh Mehta",
    email: "owner@goldenspoon.com",
    phone: "+91-9876543220",
    category: "Fine Dining",
    cuisine: ["Continental", "Indian", "Asian"],
    description: "Premium fine dining restaurant offering exquisite culinary experiences with a blend of traditional and contemporary flavors. Perfect ambiance for special occasions.",
    address: {
      street: "12/3 Indiranagar 100 Feet Road",
      landmark: "Near Metro Station",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560038"
    },
    businessDetails: {
      gstNumber: "29ABCDE1234F1Z8",
      fssaiLicense: "11223344556677",
      established: "2018",
      seatingCapacity: 120,
      averageTicketSize: "₹1,200",
      monthlyRevenue: "₹25-30 Lakhs"
    },
    operatingHours: {
      monday: { open: "12:00", close: "23:30", status: "open" },
      tuesday: { open: "12:00", close: "23:30", status: "open" },
      wednesday: { open: "12:00", close: "23:30", status: "open" },
      thursday: { open: "12:00", close: "23:30", status: "open" },
      friday: { open: "12:00", close: "00:00", status: "open" },
      saturday: { open: "12:00", close: "00:00", status: "open" },
      sunday: { open: "12:00", close: "23:30", status: "open" }
    },
    amenities: [
      "Air Conditioning", "WiFi", "Valet Parking", "Bar Counter", 
      "Private Dining", "Live Music", "Outdoor Seating", "Kids Zone"
    ],
    rating: 4.6,
    reviewCount: 1234,
    verified: true,
    premium: true,
    totalEmployees: 45,
    activeJobs: 3,
    completedOrders: 2340,
    gallery: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
      "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400",
      "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400"
    ],
    socialMedia: {
      instagram: "@goldenspoonblr",
      facebook: "TheGoldenSpoonBangalore",
      website: "www.goldenspoon.com"
    },
    awards: [
      "Best Fine Dining Restaurant 2023 - Times Food Awards",
      "Excellence in Service - Zomato Gold",
      "Top Rated Restaurant - TripAdvisor"
    ],
    specialties: [
      "Signature Butter Chicken",
      "Truffle Risotto",
      "Lamb Wellington",
      "Chocolate Lava Cake"
    ],
    menu: {
      categories: [
        {
          name: "Appetizers",
          items: [
            {
              name: "Truffle Arancini",
              description: "Crispy risotto balls with truffle oil and parmesan",
              price: 650,
              isVeg: true,
              isSpicy: false,
              preparationTime: "15 mins"
            },
            {
              name: "Tandoori Prawns",
              description: "Succulent prawns marinated in tandoori spices",
              price: 850,
              isVeg: false,
              isSpicy: true,
              preparationTime: "20 mins"
            }
          ]
        },
        {
          name: "Main Course",
          items: [
            {
              name: "Signature Butter Chicken",
              description: "Tender chicken in rich tomato and cashew gravy",
              price: 1200,
              isVeg: false,
              isSpicy: false,
              preparationTime: "25 mins"
            },
            {
              name: "Lamb Wellington",
              description: "Premium lamb wrapped in puff pastry with herbs",
              price: 1800,
              isVeg: false,
              isSpicy: false,
              preparationTime: "35 mins"
            }
          ]
        },
        {
          name: "Desserts",
          items: [
            {
              name: "Chocolate Lava Cake",
              description: "Warm chocolate cake with molten chocolate center",
              price: 450,
              isVeg: true,
              isSpicy: false,
              preparationTime: "10 mins"
            }
          ]
        }
      ]
    }
  },
  {
    id: "rest-002",
    businessName: "Spice Junction",
    ownerName: "Ramesh Kumar",
    email: "ramesh@spicejunction.com",
    phone: "+91-9876543221",
    category: "Casual Dining",
    cuisine: ["North Indian", "South Indian", "Chinese"],
    description: "Popular family restaurant serving authentic Indian cuisine with a modern twist. Known for generous portions and affordable prices.",
    address: {
      street: "78/A Koramangala 5th Block",
      landmark: "Opposite Forum Mall",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560034"
    },
    businessDetails: {
      gstNumber: "29XYZAB1234F1Z9",
      fssaiLicense: "22334455667788",
      established: "2015",
      seatingCapacity: 80,
      averageTicketSize: "₹400",
      monthlyRevenue: "₹12-15 Lakhs"
    },
    operatingHours: {
      monday: { open: "11:30", close: "22:30", status: "open" },
      tuesday: { open: "11:30", close: "22:30", status: "open" },
      wednesday: { open: "11:30", close: "22:30", status: "open" },
      thursday: { open: "11:30", close: "22:30", status: "open" },
      friday: { open: "11:30", close: "23:00", status: "open" },
      saturday: { open: "11:30", close: "23:00", status: "open" },
      sunday: { open: "11:30", close: "22:30", status: "open" }
    },
    amenities: [
      "Air Conditioning", "Family Seating", "Home Delivery", 
      "Takeaway", "Group Bookings", "Birthday Celebrations"
    ],
    rating: 4.3,
    reviewCount: 856,
    verified: true,
    premium: false,
    totalEmployees: 25,
    activeJobs: 2,
    completedOrders: 4560,
    gallery: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
      "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400",
      "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=400"
    ],
    socialMedia: {
      instagram: "@spicejunctionblr",
      facebook: "SpiceJunctionKoramangala"
    },
    specialties: [
      "Dal Makhani",
      "Chicken Biryani",
      "Paneer Butter Masala",
      "Kulcha Combo"
    ],
    menu: {
      categories: [
        {
          name: "Starters",
          items: [
            {
              name: "Chicken 65",
              description: "Spicy fried chicken with curry leaves and green chili",
              price: 320,
              isVeg: false,
              isSpicy: true,
              preparationTime: "15 mins"
            },
            {
              name: "Paneer Tikka",
              description: "Grilled cottage cheese cubes with bell peppers",
              price: 280,
              isVeg: true,
              isSpicy: false,
              preparationTime: "18 mins"
            }
          ]
        },
        {
          name: "Main Course",
          items: [
            {
              name: "Chicken Biryani",
              description: "Fragrant basmati rice with tender chicken pieces",
              price: 450,
              isVeg: false,
              isSpicy: true,
              preparationTime: "30 mins"
            },
            {
              name: "Dal Makhani",
              description: "Creamy black lentils cooked overnight with butter",
              price: 320,
              isVeg: true,
              isSpicy: false,
              preparationTime: "20 mins"
            }
          ]
        }
      ]
    }
  },
  {
    id: "rest-003",
    businessName: "Italiano Perfetto",
    ownerName: "Marco Rossi",
    email: "marco@italianoperfetto.com",
    phone: "+91-9876543222",
    category: "Fine Dining",
    cuisine: ["Italian", "Mediterranean"],
    description: "Authentic Italian restaurant run by Italian chef Marco Rossi. Features imported ingredients and traditional Italian cooking methods.",
    address: {
      street: "UB City Mall, Level 2",
      landmark: "Vittal Mallya Road",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001"
    },
    businessDetails: {
      gstNumber: "29PQRST1234F1Z7",
      fssaiLicense: "33445566778899",
      established: "2019",
      seatingCapacity: 60,
      averageTicketSize: "₹1,500",
      monthlyRevenue: "₹20-25 Lakhs"
    },
    operatingHours: {
      monday: { open: "12:00", close: "23:00", status: "open" },
      tuesday: { open: "12:00", close: "23:00", status: "open" },
      wednesday: { open: "12:00", close: "23:00", status: "open" },
      thursday: { open: "12:00", close: "23:00", status: "open" },
      friday: { open: "12:00", close: "23:30", status: "open" },
      saturday: { open: "12:00", close: "23:30", status: "open" },
      sunday: { open: "12:00", close: "23:00", status: "open" }
    },
    amenities: [
      "Wine Bar", "Italian Chef", "Romantic Ambiance", "Private Dining",
      "Imported Ingredients", "Wood Fired Pizza Oven"
    ],
    rating: 4.8,
    reviewCount: 456,
    verified: true,
    premium: true,
    totalEmployees: 18,
    activeJobs: 1,
    completedOrders: 1890,
    gallery: [
      "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400",
      "https://images.unsplash.com/photo-1552566595-bdb47734b0b7?w=400",
      "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400"
    ],
    socialMedia: {
      instagram: "@italianoperfetto",
      facebook: "ItalianoPerfettoBangalore",
      website: "www.italianoperfetto.in"
    },
    awards: [
      "Best Italian Restaurant 2024 - Bangalore Times",
      "Authentic Cuisine Award - Italian Chamber of Commerce"
    ],
    specialties: [
      "Truffle Pasta",
      "Neapolitan Pizza",
      "Risotto al Tartufo",
      "Tiramisu"
    ],
    menu: {
      categories: [
        {
          name: "Antipasti",
          items: [
            {
              name: "Bruschetta al Pomodoro",
              description: "Toasted bread with fresh tomatoes, basil and garlic",
              price: 480,
              isVeg: true,
              isSpicy: false,
              preparationTime: "10 mins"
            },
            {
              name: "Antipasto Misto",
              description: "Mixed Italian appetizer platter with cured meats and cheese",
              price: 950,
              isVeg: false,
              isSpicy: false,
              preparationTime: "15 mins"
            }
          ]
        },
        {
          name: "Pizza",
          items: [
            {
              name: "Margherita",
              description: "Classic pizza with tomato, mozzarella and fresh basil",
              price: 750,
              isVeg: true,
              isSpicy: false,
              preparationTime: "12 mins"
            },
            {
              name: "Quattro Stagioni",
              description: "Four seasons pizza with ham, artichokes, mushrooms",
              price: 1150,
              isVeg: false,
              isSpicy: false,
              preparationTime: "15 mins"
            }
          ]
        },
        {
          name: "Pasta",
          items: [
            {
              name: "Truffle Pasta",
              description: "Handmade pasta with black truffle and parmigiano",
              price: 1400,
              isVeg: true,
              isSpicy: false,
              preparationTime: "20 mins"
            },
            {
              name: "Carbonara",
              description: "Traditional Roman pasta with eggs, pancetta and cheese",
              price: 980,
              isVeg: false,
              isSpicy: false,
              preparationTime: "18 mins"
            }
          ]
        }
      ]
    }
  }
];

// EMPLOYEE PROFILES
const employeeProfiles = [
  {
    id: "emp-001",
    fullName: "Rajesh Kumar Singh",
    email: "rajesh.singh@email.com",
    phone: "+91-9876543230",
    dateOfBirth: "1995-08-15",
    gender: "Male",
    address: {
      current: {
        street: "45/2 BTM Layout 2nd Stage",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560076"
      },
      permanent: {
        street: "Village Rampur, Dist. Sitapur",
        city: "Lucknow",
        state: "Uttar Pradesh",
        pincode: "261001"
      }
    },
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    education: "Diploma in Hotel Management",
    totalExperienceMonths: 72,
    skills: [
      "Multi-cuisine cooking",
      "Kitchen management",
      "Food safety protocols",
      "Team leadership",
      "Menu planning",
      "Cost control"
    ],
    certifications: [
      "Food Safety & Hygiene Certification",
      "Basic Fire Safety Training",
      "Customer Service Excellence"
    ],
    languages: ["Hindi", "English", "Kannada"],
    preferredWorkLocation: ["Bangalore", "Chennai"],
    expectedSalary: {
      min: 45000,
      max: 65000,
      currency: "INR",
      period: "monthly"
    },
    workPreferences: {
      jobType: "Full-time",
      shiftPreference: "Day shift",
      willingToRelocate: true,
      availableToStart: "Immediate"
    },
    employmentHistory: [
      {
        restaurant: "Taj Hotel Group",
        position: "Senior Sous Chef",
        duration: "2022-2024",
        salary: "₹55,000",
        responsibilities: [
          "Managed kitchen operations for 200+ cover restaurant",
          "Trained junior chefs and kitchen staff",
          "Maintained food quality and safety standards",
          "Developed new menu items with Head Chef"
        ],
        reasonForLeaving: "Career advancement opportunity"
      },
      {
        restaurant: "Oberoi Hotels",
        position: "Chef de Partie",
        duration: "2020-2022",
        salary: "₹35,000",
        responsibilities: [
          "Handled grill section in fine dining restaurant",
          "Prepared high-quality dishes during peak hours",
          "Maintained inventory and food cost control",
          "Assisted in menu development and testing"
        ],
        reasonForLeaving: "Promotion opportunity"
      }
    ],
    references: [
      {
        name: "Chef Manish Kumar",
        position: "Executive Chef",
        company: "Taj Hotel Group",
        phone: "+91-9876543000",
        email: "manish@tajhotels.com"
      }
    ],
    achievements: [
      "Employee of the Year 2023 - Taj Hotels",
      "Successfully managed kitchen during high-volume events (500+ guests)",
      "Reduced food wastage by 20% through efficient inventory management"
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=300",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300"
    ],
    rating: 4.7,
    reviewCount: 23,
    verified: true,
    applicationsSent: 12,
    profileViews: 234,
    lastActive: "2025-01-04"
  },
  {
    id: "emp-002",
    fullName: "Priya Sharma",
    email: "priya.sharma@email.com",
    phone: "+91-9876543231",
    dateOfBirth: "1998-03-22",
    gender: "Female",
    address: {
      current: {
        street: "23/B Jayanagar 4th Block",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560011"
      }
    },
    profilePicture: "https://images.unsplash.com/photo-1494790108755-2616c96a6ad1?w=200",
    education: "Bachelor's in Hospitality Management",
    totalExperienceMonths: 36,
    skills: [
      "Customer service",
      "Order management",
      "POS system operation",
      "Cash handling",
      "Multi-tasking",
      "Problem solving"
    ],
    certifications: [
      "Customer Service Excellence",
      "POS System Certification",
      "Basic First Aid"
    ],
    languages: ["English", "Hindi", "Kannada", "Tamil"],
    preferredWorkLocation: ["Bangalore"],
    expectedSalary: {
      min: 22000,
      max: 28000,
      currency: "INR",
      period: "monthly"
    },
    workPreferences: {
      jobType: "Full-time",
      shiftPreference: "Any shift",
      willingToRelocate: false,
      availableToStart: "15 days notice"
    },
    employmentHistory: [
      {
        restaurant: "Barbeque Nation",
        position: "Senior Server",
        duration: "2022-2024",
        salary: "₹25,000",
        responsibilities: [
          "Served 8-10 tables efficiently during peak hours",
          "Handled customer complaints and special requests",
          "Trained new servers and maintained service standards",
          "Managed cash transactions and POS operations"
        ],
        reasonForLeaving: "Seeking growth opportunities"
      }
    ],
    achievements: [
      "Best Server Award 2023 - Barbeque Nation",
      "Consistently achieved highest customer satisfaction scores",
      "Handled VIP guests and special events successfully"
    ],
    rating: 4.5,
    reviewCount: 18,
    verified: true,
    applicationsSent: 8,
    profileViews: 156,
    lastActive: "2025-01-03"
  },
  {
    id: "emp-003",
    fullName: "Mohammed Aamir Khan",
    email: "aamir.khan@email.com",
    phone: "+91-9876543232",
    dateOfBirth: "1992-12-10",
    gender: "Male",
    address: {
      current: {
        street: "12/A Shivaji Nagar",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001"
      }
    },
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
    education: "MBA in Hotel Management",
    totalExperienceMonths: 108,
    skills: [
      "Restaurant operations",
      "Staff management",
      "P&L management",
      "Vendor relations",
      "Customer relations",
      "Strategic planning"
    ],
    certifications: [
      "Restaurant Management Certification",
      "Food Safety Manager",
      "Leadership Development Program"
    ],
    languages: ["English", "Hindi", "Urdu", "Kannada"],
    preferredWorkLocation: ["Bangalore", "Mumbai", "Delhi"],
    expectedSalary: {
      min: 75000,
      max: 120000,
      currency: "INR",
      period: "monthly"
    },
    workPreferences: {
      jobType: "Full-time",
      shiftPreference: "Day shift",
      willingToRelocate: true,
      availableToStart: "1 month notice"
    },
    employmentHistory: [
      {
        restaurant: "Pizza Hut",
        position: "Restaurant Manager",
        duration: "2020-2024",
        salary: "₹85,000",
        responsibilities: [
          "Managed complete restaurant operations with 30+ staff",
          "Achieved 15% increase in revenue year-over-year",
          "Implemented cost control measures reducing expenses by 12%",
          "Handled customer relations and maintained quality standards"
        ],
        reasonForLeaving: "Seeking senior management role"
      }
    ],
    achievements: [
      "Best Manager Award 2023 - Pizza Hut India",
      "Successfully opened 2 new restaurant outlets",
      "Maintained 98% customer satisfaction rating"
    ],
    rating: 4.8,
    reviewCount: 31,
    verified: true,
    applicationsSent: 15,
    profileViews: 445,
    lastActive: "2025-01-04"
  }
];

// COMMUNITY DISCUSSIONS
const communityDiscussions = [
  {
    id: "disc-001",
    title: "Best practices for reducing food wastage in restaurants",
    category: "Operations",
    author: {
      name: "Suresh Mehta",
      role: "Restaurant Owner",
      restaurant: "The Golden Spoon",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50"
    },
    content: "We've been struggling with food wastage, especially during slow days. What are some effective strategies you've implemented to minimize wastage while maintaining quality?",
    tags: ["food-wastage", "operations", "cost-control"],
    timestamp: "2025-01-04T10:30:00Z",
    likes: 23,
    comments: 15,
    views: 156,
    isPremium: false,
    comments: [
      {
        id: "comm-001",
        author: {
          name: "Ramesh Kumar",
          role: "Restaurant Owner",
          restaurant: "Spice Junction"
        },
        content: "I've found that implementing a proper inventory rotation system (FIFO) and daily inventory checks help significantly. Also, repurpose ingredients - use overripe tomatoes for sauces, etc.",
        timestamp: "2025-01-04T11:15:00Z",
        likes: 8
      },
      {
        id: "comm-002",
        author: {
          name: "Chef Marco",
          role: "Head Chef",
          restaurant: "Italiano Perfetto"
        },
        content: "Menu engineering is key. Analyze which dishes sell less and either improve them or remove them. Cross-utilize ingredients across multiple dishes to reduce single-use items.",
        timestamp: "2025-01-04T12:00:00Z",
        likes: 12
      }
    ]
  },
  {
    id: "disc-002",
    title: "Finding reliable suppliers for organic vegetables in Bangalore",
    category: "Sourcing",
    author: {
      name: "Priya Patel",
      role: "Restaurant Manager",
      restaurant: "Green Leaf Cafe",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616c96a6ad1?w=50"
    },
    content: "We're looking to switch to organic vegetables to cater to health-conscious customers. Can anyone recommend reliable suppliers in Bangalore with consistent quality and competitive pricing?",
    tags: ["sourcing", "organic", "suppliers", "bangalore"],
    timestamp: "2025-01-03T14:20:00Z",
    likes: 18,
    comments: 9,
    views: 203,
    isPremium: false,
    comments: [
      {
        id: "comm-003",
        author: {
          name: "Arun Patel",
          role: "Vendor",
          restaurant: "Green Valley Farms"
        },
        content: "We supply fresh organic vegetables to 50+ restaurants in Bangalore. Our farm is certified organic and we provide same-day delivery. DM me for details!",
        timestamp: "2025-01-03T15:10:00Z",
        likes: 15
      }
    ]
  }
];

// REVIEWS AND RATINGS
const reviews = [
  {
    id: "rev-001",
    type: "restaurant",
    targetId: "rest-001",
    reviewer: {
      name: "Ankit Sharma",
      role: "Food Blogger",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50"
    },
    rating: 5,
    title: "Exceptional dining experience!",
    content: "The Golden Spoon truly lives up to its reputation. The ambiance is perfect for special occasions, and the food quality is outstanding. Their signature butter chicken is a must-try!",
    visitDate: "2025-01-02",
    timestamp: "2025-01-03T18:30:00Z",
    helpful: 23,
    images: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300"
    ]
  },
  {
    id: "rev-002",
    type: "employee",
    targetId: "emp-001",
    reviewer: {
      name: "Suresh Mehta",
      role: "Restaurant Owner",
      restaurant: "The Golden Spoon"
    },
    rating: 5,
    title: "Outstanding chef with great leadership skills",
    content: "Rajesh worked with us for 2 years and was exceptional. His cooking skills are top-notch and he managed the kitchen team very effectively. Highly recommended for senior chef positions.",
    workingPeriod: "2022-2024",
    timestamp: "2025-01-01T12:00:00Z",
    helpful: 12
  },
  {
    id: "rev-003",
    type: "vendor",
    targetId: "vendor-001",
    reviewer: {
      name: "Ramesh Kumar",
      role: "Restaurant Owner",
      restaurant: "Spice Junction"
    },
    rating: 4,
    title: "Reliable supplier with good quality products",
    content: "Metro Food Supplies has been our regular supplier for rice and grains for over a year. Their quality is consistent and delivery is always on time. Prices are competitive too.",
    timestamp: "2024-12-28T16:45:00Z",
    helpful: 8
  }
];

module.exports = {
  restaurantProfiles,
  employeeProfiles,
  communityDiscussions,
  reviews
};