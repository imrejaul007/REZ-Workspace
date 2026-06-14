// Go4Food Shared Constants

// ===================
// Platforms
// ===================

export const PLATFORMS = {
  REZ: 'rez',
  SWIGGY: 'swiggy',
  ZOMATO: 'zomato',
  MAGICPIN: 'magicpin',
  DIRECT: 'direct',
  DOMINOS: 'dominos',
  PIZZAHUT: 'pizzahut',
  BK: 'bk',
} as const;

export const PLATFORM_NAMES: Record<string, string> = {
  [PLATFORMS.REZ]: 'ReZ',
  [PLATFORMS.SWIGGY]: 'Swiggy',
  [PLATFORMS.ZOMATO]: 'Zomato',
  [PLATFORMS.MAGICPIN]: 'Magicpin',
  [PLATFORMS.DIRECT]: 'Direct',
  [PLATFORMS.DOMINOS]: "Domino's",
  [PLATFORMS.PIZZAHUT]: 'Pizza Hut',
  [PLATFORMS.BK]: 'Burger King',
};

export const PLATFORM_LOGOS: Record<string, string> = {
  [PLATFORMS.REZ]: '/icons/platforms/rez.svg',
  [PLATFORMS.SWIGGY]: '/icons/platforms/swiggy.svg',
  [PLATFORMS.ZOMATO]: '/icons/platforms/zomato.svg',
  [PLATFORMS.MAGICPIN]: '/icons/platforms/magicpin.svg',
  [PLATFORMS.DIRECT]: '/icons/platforms/direct.svg',
  [PLATFORMS.DOMINOS]: '/icons/platforms/dominos.svg',
  [PLATFORMS.PIZZAHUT]: '/icons/platforms/pizzahut.svg',
  [PLATFORMS.BK]: '/icons/platforms/bk.svg',
};

// ===================
// Dietary Tags
// ===================

export const DIETARY_TAGS = [
  'vegetarian',
  'vegan',
  'non-vegetarian',
  'jain',
  'halal',
  'kosher',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'egg-only',
] as const;

export const DIETARY_TAG_LABELS: Record<string, string> = {
  vegetarian: '🥬 Vegetarian',
  vegan: '🌱 Vegan',
  'non-vegetarian': '🍖 Non-Vegetarian',
  jain: '🙏 Jain',
  halal: '☪️ Halal',
  kosher: '✡️ Kosher',
  'gluten-free': '🌾 Gluten-Free',
  'dairy-free': '🥛 Dairy-Free',
  'nut-free': '🥜 Nut-Free',
  'egg-only': '🥚 Egg',
};

// ===================
// Cuisine Categories
// ===================

export const CUISINES = [
  'indian',
  'chinese',
  'italian',
  'mexican',
  'thai',
  'japanese',
  'korean',
  'american',
  'mediterranean',
  'middle-eastern',
  'french',
  'spanish',
  'vietnamese',
  'indonesian',
  'malaysian',
  'continental',
  'cafe',
  'desserts',
  'fast-food',
  'street-food',
] as const;

export const CUISINE_LABELS: Record<string, string> = {
  indian: '🇮🇳 Indian',
  chinese: '🥡 Chinese',
  italian: '🍝 Italian',
  mexican: '🌮 Mexican',
  thai: '🍜 Thai',
  japanese: '🍣 Japanese',
  korean: '🥘 Korean',
  american: '🍔 American',
  mediterranean: '🫒 Mediterranean',
  'middle-eastern': '🥙 Middle Eastern',
  french: '🥐 French',
  spanish: '� pa',
  vietnamese: '🍲 Vietnamese',
  indonesian: '🍛 Indonesian',
  malaysian: '🍲 Malaysian',
  continental: '🍽️ Continental',
  cafe: '☕ Cafe',
  desserts: '🍰 Desserts',
  'fast-food': '🍟 Fast Food',
  'street-food': '🛒 Street Food',
};

// ===================
// Allergens
// ===================

export const ALLERGENS = [
  'dairy',
  'eggs',
  'fish',
  'shellfish',
  'tree-nuts',
  'peanuts',
  'gluten',
  'soy',
  'sesame',
  'mustard',
  'celery',
  'lupin',
  'molluscs',
  'sulphites',
] as const;

export const ALLERGEN_LABELS: Record<string, string> = {
  dairy: '🥛 Dairy',
  eggs: '🥚 Eggs',
  fish: '🐟 Fish',
  shellfish: '🦐 Shellfish',
  'tree-nuts': '🌰 Tree Nuts',
  peanuts: '🥜 Peanuts',
  gluten: '🌾 Gluten',
  soy: '🫘 Soy',
  sesame: '🌱 Sesame',
  mustard: '🟡 Mustard',
  celery: '🥬 Celery',
  lupin: '🌸 Lupin',
  molluscs: '🐚 Molluscs',
  sulphites: '🍷 Sulphites',
};

// ===================
// Deal Types
// ===================

export const DEAL_TYPE_LABELS: Record<string, string> = {
  PERCENTAGE_OFF: '🔥 Percentage Off',
  FLAT_OFF: '💰 Flat Off',
  FREE_DELIVERY: '🚚 Free Delivery',
  BUY_ONE_GET_ONE: '🎁 Buy One Get One',
  CASHBACK: '💵 Cashback',
};

export const DEAL_SOURCE_LABELS: Record<string, string> = {
  REZ: 'ReZ',
  RESTAURANT: 'Restaurant',
  BANK: 'Bank',
  PLATFORM: 'Platform',
};

// ===================
// Group Types
// ===================

export const GROUP_TYPE_LABELS: Record<string, string> = {
  CITY: '📍 City',
  CUISINE: '🍽️ Cuisine',
  LIFESTYLE: '💚 Lifestyle',
  GENERAL: '💬 General',
};

// ===================
// Post Types
// ===================

export const POST_TYPE_LABELS: Record<string, string> = {
  REVIEW: '⭐ Review',
  DEAL: '🏷️ Deal',
  QUESTION: '❓ Question',
  DISCOVERY: '✨ Discovery',
  TIP: '💡 Tip',
};

// ===================
// Price Ranges
// ===================

export const PRICE_RANGES = [
  { id: '0-200', label: 'Under ₹200', min: 0, max: 200 },
  { id: '200-500', label: '₹200 - ₹500', min: 200, max: 500 },
  { id: '500-1000', label: '₹500 - ₹1000', min: 500, max: 1000 },
  { id: '1000-2000', label: '₹1000 - ₹2000', min: 1000, max: 2000 },
  { id: '2000+', label: 'Above ₹2000', min: 2000, max: null },
] as const;

// ===================
// Order Time
// ===================

export const ORDER_TIMES = [
  { id: 'breakfast', label: 'Breakfast', hours: [6, 11] },
  { id: 'lunch', label: 'Lunch', hours: [11, 15] },
  { id: 'evening-snacks', label: 'Evening Snacks', hours: [15, 18] },
  { id: 'dinner', label: 'Dinner', hours: [18, 23] },
  { id: 'late-night', label: 'Late Night', hours: [23, 6] },
] as const;

// ===================
// Search
// ===================

export const SEARCH_SUGGESTIONS = [
  'Biryani near me',
  'Pizza under 500',
  'Best cafes in Bangalore',
  'Healthy food options',
  'Chinese food delivery',
  'Street food near me',
  'Vegan restaurants',
  'Birthday cakes',
] as const;

export const TRENDING_SEARCHES = [
  'Chicken 65',
  'Masala Dosa',
  'Butter Chicken',
  'Margherita Pizza',
  'Bacon Burger',
  'Sushi Platter',
  'Pad Thai',
  'Momos',
] as const;

// ===================
// Pagination
// ===================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ===================
// Cache TTL (seconds)
// ===================

export const CACHE_TTL = {
  SEARCH: 300, // 5 minutes
  RESTAURANT: 600, // 10 minutes
  DISH: 3600, // 1 hour
  DEALS: 300, // 5 minutes
  COMMUNITY: 60, // 1 minute
  USER: 300, // 5 minutes
} as const;
