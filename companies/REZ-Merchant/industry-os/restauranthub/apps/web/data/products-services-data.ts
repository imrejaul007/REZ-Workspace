import logger from './utils/logger';

// Products and Services Data for RestoPapa
// 10-15 products per vendor with realistic details

import { allDummyVendors } from './comprehensive-dummy-data';

export interface DummyProduct {
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

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  helpfulCount: number;
}

// Italian Restaurant Products (Bella Vista Italian Kitchen)
const bellaVistaProducts: DummyProduct[] = [
  {
    id: "prod_001",
    vendorId: "vendor_001",
    name: "Margherita Pizza",
    description: "Classic Neapolitan pizza with fresh mozzarella, San Marzano tomatoes, and fresh basil on our house-made sourdough crust.",
    category: "Pizza",
    subCategory: "Classic",
    price: 18.99,
    originalPrice: 22.99,
    images: [
      "/products/margherita-pizza-1.jpg",
      "/products/margherita-pizza-2.jpg",
      "/products/margherita-pizza-3.jpg"
    ],
    tags: ["Popular", "Vegetarian", "Classic", "Signature"],
    isAvailable: true,
    stock: 50,
    minOrderQuantity: 1,
    maxOrderQuantity: 5,
    preparationTime: "15-20 minutes",
    ratings: {
      average: 4.8,
      count: 324
    },
    nutrition: {
      calories: 850,
      protein: "35g",
      carbs: "88g",
      fat: "35g"
    },
    allergens: ["Gluten", "Dairy"],
    isVegetarian: true,
    isVegan: false,
    createdAt: "2023-01-15"
  },
  {
    id: "prod_002",
    vendorId: "vendor_001",
    name: "Spaghetti Carbonara",
    description: "Authentic Roman pasta with pancetta, eggs, Pecorino Romano cheese, and freshly cracked black pepper.",
    category: "Pasta",
    subCategory: "Cream-based",
    price: 24.99,
    images: [
      "/products/carbonara-1.jpg",
      "/products/carbonara-2.jpg"
    ],
    tags: ["Traditional", "Rich", "Comfort Food"],
    isAvailable: true,
    stock: 30,
    minOrderQuantity: 1,
    maxOrderQuantity: 3,
    preparationTime: "12-15 minutes",
    ratings: {
      average: 4.7,
      count: 198
    },
    nutrition: {
      calories: 920,
      protein: "42g",
      carbs: "65g",
      fat: "55g"
    },
    allergens: ["Gluten", "Dairy", "Eggs"],
    isVegetarian: false,
    isVegan: false,
    createdAt: "2023-01-15"
  },
  {
    id: "prod_003",
    vendorId: "vendor_001",
    name: "Osso Buco alla Milanese",
    description: "Slow-braised veal shanks in white wine, vegetables, and herbs, served with saffron risotto.",
    category: "Main Course",
    subCategory: "Meat",
    price: 42.99,
    images: [
      "/products/osso-buco-1.jpg",
      "/products/osso-buco-2.jpg",
      "/products/osso-buco-3.jpg"
    ],
    tags: ["Premium", "Traditional", "Slow-cooked", "Signature"],
    isAvailable: true,
    stock: 12,
    minOrderQuantity: 1,
    maxOrderQuantity: 2,
    preparationTime: "25-30 minutes",
    ratings: {
      average: 4.9,
      count: 87
    },
    nutrition: {
      calories: 1150,
      protein: "68g",
      carbs: "45g",
      fat: "65g"
    },
    allergens: ["Dairy"],
    isVegetarian: false,
    isVegan: false,
    createdAt: "2023-02-01"
  },
  {
    id: "prod_004",
    vendorId: "vendor_001",
    name: "Caprese Salad",
    description: "Fresh mozzarella di bufala, ripe tomatoes, and basil drizzled with premium extra virgin olive oil.",
    category: "Salad",
    subCategory: "Fresh",
    price: 16.99,
    images: ["/products/caprese-salad-1.jpg"],
    tags: ["Fresh", "Light", "Vegetarian", "Healthy"],
    isAvailable: true,
    stock: 25,
    minOrderQuantity: 1,
    maxOrderQuantity: 4,
    preparationTime: "5 minutes",
    ratings: {
      average: 4.6,
      count: 156
    },
    nutrition: {
      calories: 320,
      protein: "18g",
      carbs: "12g",
      fat: "24g"
    },
    allergens: ["Dairy"],
    isVegetarian: true,
    isVegan: false,
    createdAt: "2023-01-20"
  },
  {
    id: "prod_005",
    vendorId: "vendor_001",
    name: "Tiramisu",
    description: "Classic Italian dessert with ladyfingers soaked in espresso, mascarpone cream, and dusted with cocoa powder.",
    category: "Dessert",
    subCategory: "Traditional",
    price: 9.99,
    images: ["/products/tiramisu-1.jpg", "/products/tiramisu-2.jpg"],
    tags: ["Classic", "Coffee", "Sweet", "Popular"],
    isAvailable: true,
    stock: 20,
    minOrderQuantity: 1,
    maxOrderQuantity: 6,
    preparationTime: "2 minutes",
    ratings: {
      average: 4.8,
      count: 245
    },
    nutrition: {
      calories: 450,
      protein: "8g",
      carbs: "35g",
      fat: "32g"
    },
    allergens: ["Dairy", "Eggs", "Gluten"],
    isVegetarian: true,
    isVegan: false,
    createdAt: "2023-01-15"
  }
];

// Chinese Restaurant Products (Dragon Palace)
const dragonPalaceProducts: DummyProduct[] = [
  {
    id: "prod_006",
    vendorId: "vendor_002",
    name: "Peking Duck",
    description: "Traditional roasted duck served with pancakes, cucumber, scallions, and hoisin sauce.",
    category: "Main Course",
    subCategory: "Duck",
    price: 38.99,
    images: [
      "/products/peking-duck-1.jpg",
      "/products/peking-duck-2.jpg"
    ],
    tags: ["Signature", "Traditional", "Premium", "Crispy"],
    isAvailable: true,
    stock: 8,
    minOrderQuantity: 1,
    maxOrderQuantity: 2,
    preparationTime: "35-40 minutes",
    ratings: {
      average: 4.9,
      count: 167
    },
    nutrition: {
      calories: 1200,
      protein: "75g",
      carbs: "45g",
      fat: "80g"
    },
    allergens: ["Gluten", "Soy"],
    isVegetarian: false,
    isVegan: false,
    createdAt: "2023-01-10"
  },
  {
    id: "prod_007",
    vendorId: "vendor_002",
    name: "Kung Pao Chicken",
    description: "Spicy Sichuan dish with diced chicken, peanuts, vegetables, and dried chili peppers in savory sauce.",
    category: "Main Course",
    subCategory: "Chicken",
    price: 22.99,
    images: ["/products/kung-pao-chicken-1.jpg"],
    tags: ["Spicy", "Popular", "Nuts", "Traditional"],
    isAvailable: true,
    stock: 35,
    minOrderQuantity: 1,
    maxOrderQuantity: 4,
    preparationTime: "15-18 minutes",
    ratings: {
      average: 4.6,
      count: 289
    },
    nutrition: {
      calories: 680,
      protein: "45g",
      carbs: "25g",
      fat: "42g"
    },
    allergens: ["Peanuts", "Soy"],
    isVegetarian: false,
    isVegan: false,
    createdAt: "2023-01-10"
  },
  {
    id: "prod_008",
    vendorId: "vendor_002",
    name: "Mapo Tofu",
    description: "Silky tofu in spicy Sichuan sauce with minced pork, fermented black beans, and numbing peppercorns.",
    category: "Main Course",
    subCategory: "Tofu",
    price: 18.99,
    images: ["/products/mapo-tofu-1.jpg"],
    tags: ["Spicy", "Vegetarian Option", "Traditional", "Sichuan"],
    isAvailable: true,
    stock: 28,
    minOrderQuantity: 1,
    maxOrderQuantity: 3,
    preparationTime: "12-15 minutes",
    ratings: {
      average: 4.4,
      count: 134
    },
    nutrition: {
      calories: 420,
      protein: "28g",
      carbs: "18g",
      fat: "28g"
    },
    allergens: ["Soy"],
    isVegetarian: false,
    isVegan: false,
    createdAt: "2023-01-12"
  }
];

// Burger Restaurant Products (Brooklyn Burger Co.)
const brooklynBurgerProducts: DummyProduct[] = [
  {
    id: "prod_009",
    vendorId: "vendor_003",
    name: "Brooklyn Classic Burger",
    description: "8oz grass-fed beef patty, aged cheddar, lettuce, tomato, red onion, and house special sauce on brioche bun.",
    category: "Burger",
    subCategory: "Beef",
    price: 16.99,
    images: [
      "/products/brooklyn-classic-1.jpg",
      "/products/brooklyn-classic-2.jpg"
    ],
    tags: ["Signature", "Classic", "Popular", "Grass-fed"],
    isAvailable: true,
    stock: 45,
    minOrderQuantity: 1,
    maxOrderQuantity: 5,
    preparationTime: "12-15 minutes",
    ratings: {
      average: 4.7,
      count: 412
    },
    nutrition: {
      calories: 820,
      protein: "48g",
      carbs: "45g",
      fat: "52g"
    },
    allergens: ["Gluten", "Dairy", "Eggs"],
    isVegetarian: false,
    isVegan: false,
    createdAt: "2023-02-15"
  },
  {
    id: "prod_010",
    vendorId: "vendor_003",
    name: "Impossible Veggie Burger",
    description: "Plant-based Impossible patty with vegan cheese, avocado, sprouts, and chipotle mayo on whole grain bun.",
    category: "Burger",
    subCategory: "Plant-based",
    price: 18.99,
    images: ["/products/impossible-burger-1.jpg"],
    tags: ["Vegan", "Plant-based", "Healthy", "Trending"],
    isAvailable: true,
    stock: 30,
    minOrderQuantity: 1,
    maxOrderQuantity: 4,
    preparationTime: "10-12 minutes",
    ratings: {
      average: 4.5,
      count: 187
    },
    nutrition: {
      calories: 650,
      protein: "35g",
      carbs: "42g",
      fat: "38g"
    },
    allergens: ["Gluten", "Soy"],
    isVegetarian: true,
    isVegan: true,
    createdAt: "2023-03-01"
  },
  {
    id: "prod_011",
    vendorId: "vendor_003",
    name: "Hand-Cut Truffle Fries",
    description: "Golden crispy fries tossed with truffle oil, parmesan cheese, and fresh herbs.",
    category: "Side",
    subCategory: "Fries",
    price: 12.99,
    originalPrice: 15.99,
    images: ["/products/truffle-fries-1.jpg"],
    tags: ["Premium", "Crispy", "Truffle", "Shareable"],
    isAvailable: true,
    stock: 60,
    minOrderQuantity: 1,
    maxOrderQuantity: 8,
    preparationTime: "8-10 minutes",
    ratings: {
      average: 4.8,
      count: 298
    },
    nutrition: {
      calories: 480,
      protein: "8g",
      carbs: "55g",
      fat: "26g"
    },
    allergens: ["Dairy"],
    isVegetarian: true,
    isVegan: false,
    createdAt: "2023-02-20"
  }
];

// Generate products for all vendors systematically
const generateProductsForVendor = (vendor, startId: number): DummyProduct[] => {
  const productTypes = {
    "restaurant": {
      categories: ["Appetizer", "Main Course", "Dessert", "Beverage"],
      items: [
        "Signature Appetizer Platter", "Chef's Special Salad", "Grilled Salmon",
        "Ribeye Steak", "Chicken Parmesan", "Vegetarian Pasta", "Chocolate Lava Cake",
        "Fresh Fruit Tart", "House Wine", "Craft Cocktail", "Fresh Juice", "Coffee"
      ]
    },
    "fast_casual": {
      categories: ["Burger", "Sandwich", "Salad", "Side", "Drink"],
      items: [
        "Classic Burger", "Spicy Chicken Sandwich", "Club Sandwich", "Caesar Salad",
        "Power Bowl", "French Fries", "Onion Rings", "Milkshake", "Soda", "Iced Tea"
      ]
    },
    "fine_dining": {
      categories: ["Amuse Bouche", "Starter", "Main Course", "Dessert", "Wine"],
      items: [
        "Caviar Service", "Foie Gras", "Lobster Bisque", "Wagyu Beef", "Duck Confit",
        "Tasting Menu", "Soufflé", "Chocolate Tasting", "Wine Pairing", "Champagne"
      ]
    },
    "cafe": {
      categories: ["Coffee", "Tea", "Pastry", "Sandwich", "Salad"],
      items: [
        "Espresso", "Cappuccino", "Latte", "Green Tea", "Croissant", "Muffin",
        "Panini", "Wrap", "Quinoa Salad", "Smoothie"
      ]
    }
  };

  const vendorTypes = productTypes[vendor.category as keyof typeof productTypes] || productTypes.restaurant;
  const products: DummyProduct[] = [];

  for (let i = 0; i < 12; i++) {
    const category = vendorTypes.categories[i % vendorTypes.categories.length];
    const itemIndex = i % vendorTypes.items.length;
    const item = vendorTypes.items[itemIndex];
    
    const basePrice = Math.random() * 30 + 8; // $8-$38
    const hasDiscount = Math.random() > 0.7;
    const originalPrice = hasDiscount ? basePrice * 1.2 : undefined;

    products.push({
      id: `prod_${String(startId + i).padStart(3, '0')}`,
      vendorId: vendor.id,
      name: item,
      description: `Delicious ${item.toLowerCase()} prepared with fresh ingredients and authentic flavors. A customer favorite at ${vendor.businessName}.`,
      category: category,
      subCategory: ["Premium", "Regular", "Signature"][Math.floor(Math.random() * 3)],
      price: Math.round(basePrice * 100) / 100,
      originalPrice: originalPrice ? Math.round(originalPrice * 100) / 100 : undefined,
      images: [`/products/${item.toLowerCase().replace(/ /g, '-')}-1.jpg`],
      tags: [
        ["Popular", "Signature", "New", "Limited"][Math.floor(Math.random() * 4)],
        ["Fresh", "Organic", "Local", "Premium"][Math.floor(Math.random() * 4)],
        ["Healthy", "Comfort", "Traditional", "Modern"][Math.floor(Math.random() * 4)]
      ],
      isAvailable: Math.random() > 0.1, // 90% available
      stock: Math.floor(Math.random() * 50) + 10,
      minOrderQuantity: 1,
      maxOrderQuantity: Math.floor(Math.random() * 5) + 3,
      preparationTime: `${Math.floor(Math.random() * 20) + 5}-${Math.floor(Math.random() * 10) + 15} minutes`,
      ratings: {
        average: 3.5 + Math.random() * 1.5,
        count: Math.floor(Math.random() * 300) + 20
      },
      nutrition: {
        calories: Math.floor(Math.random() * 800) + 200,
        protein: `${Math.floor(Math.random() * 40) + 5}g`,
        carbs: `${Math.floor(Math.random() * 60) + 10}g`,
        fat: `${Math.floor(Math.random() * 30) + 5}g`
      },
      allergens: [
        ["Gluten", "Dairy", "Nuts", "Soy", "Eggs"][Math.floor(Math.random() * 5)]
      ].slice(0, Math.floor(Math.random() * 3)),
      isVegetarian: Math.random() > 0.6,
      isVegan: Math.random() > 0.8,
      createdAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
    });
  }

  return products;
};

// Generate all products
const handCraftedProducts = [...bellaVistaProducts, ...dragonPalaceProducts, ...brooklynBurgerProducts];
let currentProductId = handCraftedProducts.length + 1;

const generatedProducts = allDummyVendors
  .filter(vendor => !["vendor_001", "vendor_002", "vendor_003"].includes(vendor.id))
  .flatMap(vendor => {
    const products = generateProductsForVendor(vendor, currentProductId);
    currentProductId += products.length;
    return products;
  });

export const allDummyProducts = [...handCraftedProducts, ...generatedProducts];

// Generate Reviews for Products
export const generateProductReviews = (productId: string, count: number = 20): Review[] => {
  const reviewTexts = [
    "Absolutely delicious! Will definitely order again.",
    "Great quality and fast delivery. Highly recommend!",
    "The flavors were amazing and portion size was perfect.",
    "Fresh ingredients and excellent preparation. 5 stars!",
    "Not bad but could use more seasoning.",
    "Exceeded my expectations. Best meal I've had in weeks!",
    "Good value for money. Tasty and well-presented.",
    "Average food, nothing special but decent.",
    "Outstanding! This is why I keep coming back.",
    "Could be better. The presentation was nice though.",
    "Perfect for a quick lunch. Will order again.",
    "Authentic flavors and generous portions.",
    "A bit pricey but worth it for the quality.",
    "Fresh and flavorful. Arrived hot and well-packed.",
    "Disappointing. Expected more based on reviews.",
    "Incredible! My new favorite dish.",
    "Solid choice. Good ingredients and preparation.",
    "Too salty for my taste but overall decent.",
    "Excellent customer service and great food!",
    "Perfect comfort food. Exactly what I was craving."
  ];

  const userNames = [
    "Sarah M.", "John D.", "Emily R.", "Michael C.", "Jessica W.", "David K.",
    "Amanda L.", "Ryan T.", "Lisa H.", "Brian S.", "Nicole P.", "Kevin J.",
    "Rachel G.", "Mark A.", "Jennifer B.", "Chris N.", "Ashley F.", "Justin M."
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: `review_${productId}_${String(index + 1).padStart(3, '0')}`,
    productId,
    userId: `cust_${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
    userName: userNames[Math.floor(Math.random() * userNames.length)],
    userAvatar: `/avatars/${Math.random() > 0.5 ? 'male' : 'female'}${Math.floor(Math.random() * 5) + 1}.jpg`,
    rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars mostly
    comment: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
    images: Math.random() > 0.8 ? [`/reviews/review-${productId}-${index}.jpg`] : undefined,
    createdAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    helpfulCount: Math.floor(Math.random() * 25)
  }));
};

// Generate reviews for top products
export const allProductReviews = allDummyProducts
  .slice(0, 50) // Reviews for first 50 products
  .flatMap(product => generateProductReviews(product.id, Math.floor(Math.random() * 15) + 5));

logger.info(`Generated ${allDummyProducts.length} products for ${allDummyVendors.length} vendors`);
logger.info(`Generated ${allProductReviews.length} reviews for products`);