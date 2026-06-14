/**
 * Sales Training Data - Transaction & Purchase Patterns
 *
 * Used to train the AI for:
 * - Understanding purchase intent
 * - Price sensitivity
 * - Upsell/cross-sell timing
 * - Customer lifecycle
 */

export const TRANSACTION_PATTERNS = {
  // Purchase frequency by category
  frequency: {
    restaurant: { min_days: 3, max_days: 14, avg_days: 7 },
    spa: { min_days: 14, max_days: 60, avg_days: 30 },
    hotel: { min_days: 30, max_days: 180, avg_days: 90 },
    movie: { min_days: 7, max_days: 30, avg_days: 14 },
    cafe: { min_days: 1, max_days: 7, avg_days: 3 },
    gym: { min_days: 30, max_days: 365, avg_days: 30 },
    events: { min_days: 1, max_days: 90, avg_days: 14 },
  },

  // Price ranges by category
  price_ranges: {
    restaurant: { min: 200, max: 5000, avg: 800 },
    spa: { min: 500, max: 10000, avg: 2000 },
    hotel: { min: 1500, max: 50000, avg: 5000 },
    movie: { min: 200, max: 800, avg: 400 },
    cafe: { min: 100, max: 800, avg: 300 },
    gym: { min: 1000, max: 5000, avg: 2000 },
    events: { min: 500, max: 20000, avg: 3000 },
  },

  // Time-based triggers
  timing: {
    morning: { hour: [6, 7, 8, 9, 10, 11], categories: ['cafe', 'gym', 'hotel'] },
    afternoon: { hour: [12, 13, 14], categories: ['restaurant', 'cafe'] },
    evening: { hour: [17, 18, 19], categories: ['restaurant', 'events', 'movie'] },
    night: { hour: [20, 21, 22], categories: ['restaurant', 'movie', 'events'] },
  },

  // Occasion multipliers
  occasions: {
    birthday: 1.5,
    anniversary: 1.3,
    date_night: 1.4,
    business: 1.2,
    celebration: 1.6,
    casual: 1.0,
    urgent: 1.8,
  },
};

// Purchase intent signals
export const PURCHASE_INTENT_SIGNALS = {
  // High intent
  high: [
    'i want to book',
    'can i reserve',
    'is it available',
    'how much is',
    'show me the price',
    'book for tonight',
    'need it now',
    'confirm booking',
  ],

  // Medium intent
  medium: [
    'looking for',
    'thinking about',
    'considering',
    'maybe later',
    'what do you have',
    'show me options',
    'anything nearby',
    'not sure yet',
  ],

  // Low intent
  low: [
    'browsing',
    'just checking',
    'maybe someday',
    'not really',
    'not interested',
    'later maybe',
    'ask me again',
    'just looking',
  ],
};

// Upsell triggers
export const UPSELL_TRIGGERS = [
  // Complimentary items
  { trigger: 'ordering food', suggest: 'add drink', conversion_rate: 0.35 },
  { trigger: 'ordering main course', suggest: 'add appetizer', conversion_rate: 0.28 },
  { trigger: 'ordering appetizer', suggest: 'add soup', conversion_rate: 0.22 },

  // Experience upgrades
  { trigger: 'basic room', suggest: 'premium room', conversion_rate: 0.18 },
  { trigger: 'standard ticket', suggest: 'VIP ticket', conversion_rate: 0.25 },
  { trigger: 'regular massage', suggest: 'hot stone massage', conversion_rate: 0.15 },

  // Bundle suggestions
  { trigger: 'single booking', suggest: 'combo package', conversion_rate: 0.32 },
  { trigger: 'one person', suggest: 'couple package', conversion_rate: 0.12 },
  { trigger: 'one item', suggest: 'meal deal', conversion_rate: 0.40 },
];

// Cross-sell patterns
export const CROSS_SELL_PATTERNS = [
  { from: 'restaurant', to: 'spa', message: 'Relax after your meal!', conversion_rate: 0.15 },
  { from: 'restaurant', to: 'movie', message: 'Catch a show after dinner!', conversion_rate: 0.12 },
  { from: 'hotel', to: 'restaurant', message: 'Dine at our acclaimed restaurant.', conversion_rate: 0.22 },
  { from: 'hotel', to: 'spa', message: 'Unwind with our spa services.', conversion_rate: 0.18 },
  { from: 'movie', to: 'restaurant', message: 'Celebrate with dinner!', conversion_rate: 0.20 },
  { from: 'gym', to: 'spa', message: 'Recovery is part of training!', conversion_rate: 0.14 },
  { from: 'cafe', to: 'bookstore', message: 'Cozy up with a good book!', conversion_rate: 0.08 },
  { from: 'events', to: 'hotel', message: 'Stay close to the venue!', conversion_rate: 0.25 },
];

// Price sensitivity thresholds
export const PRICE_SENSITIVITY = {
  luxury: { threshold: 5000, discount_needed: 0.05 },
  premium: { threshold: 2000, discount_needed: 0.10 },
  mid_range: { threshold: 800, discount_needed: 0.15 },
  budget: { threshold: 300, discount_needed: 0.20 },
  economy: { threshold: 100, discount_needed: 0.25 },
};

// Sales objection handlers
export const OBJECTION_HANDLERS = {
  'too_expensive': [
    { response: 'I understand. Would you like to use your {coins} coins for a {value} discount?', success_rate: 0.35 },
    { response: 'We have a flexible EMI option starting at ₹{emi}/month.', success_rate: 0.28 },
    { response: 'Let me show you similar options at a better price.', success_rate: 0.42 },
  ],
  'not_interested': [
    { response: 'No problem! I\'ll remind you in a few days.', success_rate: 0.15 },
    { response: 'Is there something specific you\'re looking for?', success_rate: 0.22 },
    { response: 'Just so you know, prices might change soon.', success_rate: 0.18 },
  ],
  'need_to_think': [
    { response: 'Take your time! I\'ll hold this offer for 24 hours.', success_rate: 0.30 },
    { response: 'Can I help with unknown questions?', success_rate: 0.25 },
    { response: 'Here\'s a summary to help you decide.', success_rate: 0.35 },
  ],
  'wrong_timing': [
    { response: 'I can set a reminder for when you\'re ready.', success_rate: 0.40 },
    { response: 'This weekend might work better for you?', success_rate: 0.32 },
    { response: 'Shall I book for {next_week} instead?', success_rate: 0.28 },
  ],
  'already_booked': [
    { response: 'Great! Can I help with anything else?', success_rate: 0.50 },
    { response: 'Would you like to add the spa package?', success_rate: 0.22 },
    { response: 'Invite a friend and earn 100 coins!', success_rate: 0.18 },
  ],
};

// Sales conversation templates
export const SALES_TEMPLATES = {
  greeting: [
    'Hi {name}! Ready to find something great today?',
    'Welcome back, {name}! I have some amazing deals for you.',
    'Hey {name}! What can I help you discover today?',
  ],

  after_search: [
    'Found {count} great options! Here\'s my top pick: {recommendation}',
    '{count} places match what you\'re looking for. Want me to narrow it down?',
    'I found some perfect matches! {suggestion}',
  ],

  after_booking: [
    'Booking confirmed! 🎉 You\'ll earn {coins} coins from this.',
    'All set! See you at {venue}. Use coins on your next visit!',
    'Confirmed! {coins} coins added to your wallet. Enjoy!',
  ],

  upsell_intro: [
    'Great choice! Just so you know, there\'s an amazing deal on {upsell}...',
    'If you\'re up for it, {suggestion} would pair perfectly with this!',
    'Side note: upgrading to {premium} would save you {savings}!',
  ],

  loyalty_reminder: [
    '{tier} member special! You have {coins} coins worth ₹{value}.',
    'As a {tier} member, you get {discount}% off today only!',
    'Your loyalty is paying off! {coins} coins ready to use.',
  ],

  urgency_creation: [
    'Only {slots} left at this price!',
    'This deal ends in {time}!',
    '{count} people booked this in the last hour.',
    'Prices go up at midnight!',
  ],

  goodbye: [
    'Enjoy your {category}! I\'ll see you again soon.',
    'Have a great time! Your next visit is on us with those coins.',
    'Done! Can\'t wait to hear how it was. Come back and tell me!',
  ],
};

// Customer lifecycle stages
export const CUSTOMER_STAGES = {
  new: {
    description: 'First 3 transactions',
    triggers: ['welcome_offer', 'first_timer_discount', 'popular_picks'],
    next_stage: 'exploring',
  },
  exploring: {
    description: '4-10 transactions',
    triggers: ['variety_suggestions', 'new_category_intro', 'loyalty_preview'],
    next_stage: 'regular',
  },
  regular: {
    description: '11-30 transactions',
    triggers: ['personalized_recommendations', 'loyalty_rewards', 'priority_access'],
    next_stage: 'loyal',
  },
  loyal: {
    description: '31+ transactions',
    triggers: ['vip_treatment', 'exclusive_events', 'feedback_sought'],
    next_stage: 'advocate',
  },
  advocate: {
    description: 'Referral active',
    triggers: ['referral_bonuses', 'community_invites', 'co_creation'],
    next_stage: 'advocate',
  },
};

// Sales metrics to track
export const SALES_METRICS = [
  'conversion_rate',
  'average_order_value',
  'upsell_rate',
  'cross_sell_rate',
  'customer_lifetime_value',
  'repeat_purchase_rate',
  'cart_abandonment_rate',
  'response_rate',
  'retention_rate',
];
