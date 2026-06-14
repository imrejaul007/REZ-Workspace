/**
 * UNIFIED TRAINING DATA - Do App + Support Copilot
 *
 * SOURCE: ReZ Mind (Central Brain)
 * URL: https://rez-intent-graph.onrender.com
 *
 * This file is a local fallback. The primary source is ReZ Mind API.
 * Both Do App and Support Copilot fetch training data from ReZ Mind.
 */

// ==================== UNIFIED INTENT TYPES ====================

export enum UnifiedIntent {
  // Commerce Intents
  ORDER_FOOD = 'order_food',
  BOOK_TABLE = 'book_table',
  BOOK_HOTEL = 'book_hotel',
  BOOK_SPA = 'book_spa',
  BOOK_EVENT = 'book_event',
  BOOK_GYM = 'book_gym',
  ORDER_TAKEAWAY = 'order_takeaway',
  ORDER_PICKUP = 'order_pickup',

  // Transaction Intents
  CHECK_STATUS = 'check_status',
  CANCEL_ORDER = 'cancel_order',
  CANCEL_BOOKING = 'cancel_booking',
  MODIFY_ORDER = 'modify_order',
  MODIFY_BOOKING = 'modify_booking',
  RESCHEDULE = 'reschedule',

  // Payment Intents
  MAKE_PAYMENT = 'make_payment',
  REFUND_REQUEST = 'refund_request',
  PAYMENT_ISSUE = 'payment_issue',
  CHECK_BALANCE = 'check_balance',
  USE_COINS = 'use_coins',
  REDEEM_VOUCHER = 'redeem_voucher',

  // Support Intents
  COMPLAINT = 'complaint',
  HELP_REQUEST = 'help_request',
  TRACK_ORDER = 'track_order',
  GET_SUPPORT = 'get_support',

  // Discovery Intents
  SEARCH_RESTAURANT = 'search_restaurant',
  SEARCH_HOTEL = 'search_hotel',
  SEARCH_SERVICE = 'search_service',
  SEARCH_SPA = 'search_spa',
  SEARCH_EVENT = 'search_event',
  BROWSE_NEARBY = 'browse_nearby',
  MOOD_DISCOVERY = 'mood_discovery',

  // Loyalty Intents
  VIEW_OFFERS = 'view_offers',
  CHECK_KARMA = 'check_karma',
  CHECK_POINTS = 'check_points',
  VIEW_REWARDS = 'view_rewards',
  REFER_FRIEND = 'refer_friend',

  // Feedback Intents
  POSITIVE_FEEDBACK = 'positive_feedback',
  NEGATIVE_FEEDBACK = 'negative_feedback',
  WRITE_REVIEW = 'write_review',

  // Greetings
  GREETING = 'greeting',

  // Unknown
  UNKNOWN = 'unknown',
}

// ==================== INTENT PATTERNS ====================

export const UNIFIED_INTENT_PATTERNS: Record<UnifiedIntent, {
  patterns: string[];
  priority: number;
  weight: number;
  category: 'commerce' | 'transaction' | 'payment' | 'support' | 'discovery' | 'loyalty' | 'feedback';
  response: string;
}> = {
  // === COMMERCE INTENTS ===
  [UnifiedIntent.ORDER_FOOD]: {
    priority: 2,
    weight: 2,
    category: 'commerce',
    patterns: [
      'order food', 'order biryani', 'order pizza', 'want to order',
      'order karo', 'biryani order', 'pizza bhejo', 'food order',
      'kuch khana bhejo', 'I am hungry', 'dinner for 2', 'lunch order',
      'order lunch', 'order dinner', 'order snacks', 'order breakfast',
      'veg food chahiye', 'non veg order', 'repeat last order', 'same as before',
      'order takeaway', 'order delivery', 'get food', 'buy food',
      'send food', 'delivery food', 'food delivery', 'order online',
      'online order', 'place order', 'food for 3', 'dinner for family',
      'hungry now', 'food needed', 'grab food', 'quick food',
    ],
    response: 'What would you like to order? I can help you find the best options!',
  },

  [UnifiedIntent.BOOK_TABLE]: {
    priority: 2,
    weight: 2,
    category: 'commerce',
    patterns: [
      'book a table', 'reserve table', 'booking for dinner', 'table for 4',
      'reserve karo', 'table book', 'booking table', 'reserve karo table',
      'table for tonight', 'book for 6 people', 'advance booking',
      'booth reservation', 'dinner reservation', 'lunch booking',
      'weekend booking', 'anniversary dinner', 'birthday dinner',
      'romantic dinner', 'couple booking', 'family dinner',
      'party booking', 'group booking', 'office lunch booking',
      'table available', 'slots available', 'reserve tonight',
    ],
    response: 'Let me find you the best tables available! When and for how many?',
  },

  [UnifiedIntent.BOOK_HOTEL]: {
    priority: 2,
    weight: 2,
    category: 'commerce',
    patterns: [
      'book hotel', 'hotel booking', 'book room', 'room booking',
      'stay tonight', 'book stay', 'reserve room', 'hotel reservation',
      'accommodation', 'where to stay', 'hotel chahiye', 'room chahiye',
      'book a stay', 'holiday package', 'weekend getaway', 'vacation stay',
      'business hotel', 'luxury stay', 'budget hotel', 'family room',
      'couple room', 'honeymoon package', 'check in', 'check out',
      'book for tonight', 'urgent hotel', 'last minute booking',
    ],
    response: 'Found some amazing hotels! When do you need it and for how many nights?',
  },

  [UnifiedIntent.BOOK_SPA]: {
    priority: 2,
    weight: 2,
    category: 'commerce',
    patterns: [
      'book spa', 'spa booking', 'massage karvana', 'relaxation',
      'spa appointment', 'book massage', 'massage booking', 'spa service',
      'body massage', 'couple spa', 'aromatherapy', 'hot stone massage',
      'spa day', 'pamper myself', 'spa package', 'wellness booking',
      'rejuvenation', 'spa therapy', 'spa for two', 'salon appointment',
      'facial booking', 'beauty treatment', 'spa reservation',
    ],
    response: 'Let me find you the best spa experiences! What type of service?',
  },

  [UnifiedIntent.BOOK_EVENT]: {
    priority: 2,
    weight: 2,
    category: 'commerce',
    patterns: [
      'book event', 'event tickets', 'concert ticket', 'movie tickets',
      'show booking', 'book tickets', 'ticket chahiye', 'show ticket',
      'party tickets', 'festival pass', 'comedian show', 'live music',
      'DJ night', 'open mic', 'theatre show', 'sports event',
      'cricket match', 'football tickets', 'booking for show',
      'premium seats', 'VIP tickets', 'general admission',
    ],
    response: 'Here are the hottest events! What are you in the mood for?',
  },

  [UnifiedIntent.BOOK_GYM]: {
    priority: 2,
    weight: 2,
    category: 'commerce',
    patterns: [
      'join gym', 'gym membership', 'book gym', 'fitness class',
      'yoga class', 'personal trainer', 'workout session',
      'gym trial', 'fitness package', 'crossfit', 'zumba class',
      'pilates booking', 'personal training', 'gym booking',
      'exercise plan', 'health package', 'fitness membership',
    ],
    response: 'Found some great fitness options! What type of workout?',
  },

  [UnifiedIntent.ORDER_TAKEAWAY]: {
    priority: 2,
    weight: 2,
    category: 'commerce',
    patterns: [
      'takeaway', 'take out', 'pick up order', 'collect food',
      'pickup from restaurant', 'self pickup', 'order for pickup',
      'take away', 'grab and go', 'takeout order',
    ],
    response: 'What would you like for takeaway?',
  },

  [UnifiedIntent.ORDER_PICKUP]: {
    priority: 2,
    weight: 2,
    category: 'commerce',
    patterns: [
      'pickup', 'pick up', 'collect order', 'pickup order',
      'will pick up', 'self collect', 'come pick up',
    ],
    response: 'Sure! Which restaurant should I arrange pickup from?',
  },

  // === TRANSACTION INTENTS ===
  [UnifiedIntent.CHECK_STATUS]: {
    priority: 1,
    weight: 3,
    category: 'transaction',
    patterns: [
      'where is my order', 'order status', 'track order', 'order kahan',
      'mera order kahan', 'track delivery', 'delivery status',
      'order tracking', 'when will arrive', 'order update',
      'kahan hai order', 'order kaha hai', 'delivery kahan',
      'parcel status', 'shipment tracking', 'package location',
      'arriving', 'eta', 'estimated time', 'how long',
      'order placed', 'confirmation', 'order number',
    ],
    response: 'Let me check your order status...',
  },

  [UnifiedIntent.CANCEL_ORDER]: {
    priority: 1,
    weight: 3,
    category: 'transaction',
    patterns: [
      'cancel order', 'cancel karo', 'cancel the order', 'stop order',
      'cancel delivery', 'band karo', 'nahi chahiye', 'changed mind',
      "don't want", 'not needed anymore', 'remove order',
      'undo order', 'delete order', 'cancel my food',
      'stop delivery', 'abort order', 'cancel food order',
      'discard order', 'revoke order', 'remove from order',
      'cancel it', 'please cancel', 'want to cancel',
      'cancel the booking', 'order cancel', 'cannot order',
    ],
    response: 'I can help you cancel. Please confirm - do you want to cancel this order?',
  },

  [UnifiedIntent.CANCEL_BOOKING]: {
    priority: 1,
    weight: 3,
    category: 'transaction',
    patterns: [
      'cancel booking', 'cancel reservation', 'booking cancel',
      'reschedule instead', 'change plan', 'not coming',
      'booking band karo', 'reservation cancel', 'table cancel',
      'hotel cancel', 'booking hatao', 'refuse booking',
      'withdraw booking', 'terminate booking',
    ],
    response: 'I can cancel your booking. Please confirm the booking details.',
  },

  [UnifiedIntent.MODIFY_ORDER]: {
    priority: 1,
    weight: 2,
    category: 'transaction',
    patterns: [
      'modify order', 'change order', 'update order', 'edit order',
      'add item', 'remove item', 'extra item', 'more food',
      'add to order', 'something extra', 'change items',
      'edit items', 'modify items', 'update items',
      'extra napkins', 'extra sauce', 'more drinks',
      'add drink', 'extra rice', 'extra bread',
    ],
    response: 'What would you like to modify in your order?',
  },

  [UnifiedIntent.MODIFY_BOOKING]: {
    priority: 1,
    weight: 2,
    category: 'transaction',
    patterns: [
      'modify booking', 'change booking', 'update booking',
      'edit reservation', 'change time', 'change date',
      'update time', 'reschedule', 'change guest count',
      'booking update', 'alter reservation', 'modify reservation',
    ],
    response: 'What would you like to change in your booking?',
  },

  [UnifiedIntent.RESCHEDULE]: {
    priority: 1,
    weight: 2,
    category: 'transaction',
    patterns: [
      'reschedule', 'change date', 'change time', 'move booking',
      'different date', 'different time', 'other slot',
      'another day', 'next week', 'tomorrow instead',
      'shift booking', 'postpone', 'delay booking',
    ],
    response: 'What new date and time would you prefer?',
  },

  // === PAYMENT INTENTS ===
  [UnifiedIntent.MAKE_PAYMENT]: {
    priority: 2,
    weight: 2,
    category: 'payment',
    patterns: [
      'pay', 'payment', 'pay now', 'make payment', 'complete payment',
      'paytm', 'upi', 'card payment', 'online payment',
      'pay via', 'pay with', 'payment method', 'how to pay',
      'pay bill', 'settle payment', 'transaction',
    ],
    response: 'Sure! Here are the payment options available.',
  },

  [UnifiedIntent.REFUND_REQUEST]: {
    priority: 1,
    weight: 3,
    category: 'payment',
    patterns: [
      'refund', 'refund chahiye', 'money return', 'refund for order',
      'return money', 'refund request', 'refund karo',
      'payment refund', 'refund the money', 'want refund',
      'give me back money', 'money back', 'cash refund',
    ],
    response: 'I understand you need a refund. Let me process this for you.',
  },

  [UnifiedIntent.PAYMENT_ISSUE]: {
    priority: 1,
    weight: 3,
    category: 'payment',
    patterns: [
      'payment failed', 'payment error', 'transaction failed', 'payment not working',
      'money deducted', 'amount not received', 'payment problem',
      'payment issue', 'troubleshoot payment', 'payment not going',
      'payment error', 'payment declined', 'card rejected',
      'payment stuck', 'transaction stuck', 'payment not processing',
    ],
    response: 'I\'m sorry about the payment issue. Let me help you resolve it.',
  },

  [UnifiedIntent.CHECK_BALANCE]: {
    priority: 3,
    weight: 2,
    category: 'payment',
    patterns: [
      'check balance', 'my balance', 'wallet balance', 'coins balance',
      'how much coins', 'account balance', 'how many coins',
      'balance check', 'available balance', 'remaining coins',
      'total coins', 'coins kiti', 'paisa kitna hai',
    ],
    response: 'Your balance: {coins} coins worth ₹{value}.',
  },

  [UnifiedIntent.USE_COINS]: {
    priority: 3,
    weight: 2,
    category: 'payment',
    patterns: [
      'use coins', 'redeem coins', 'coins use karo', 'apply coins',
      'discount with coins', 'coins lagana', 'use my coins',
      'pay with coins', 'coins payment', 'coin redemption',
      'use my points', 'points redeem',
    ],
    response: 'You have {coins} coins worth ₹{value}. Want to use them on this booking?',
  },

  [UnifiedIntent.REDEEM_VOUCHER]: {
    priority: 3,
    weight: 2,
    category: 'payment',
    patterns: [
      'redeem voucher', 'apply coupon', 'coupon code', 'promo code',
      'voucher code', 'gift card', 'discount code',
      'apply offer', 'use coupon', 'coupon chahiye',
      'promocode', 'coupon number', 'offer code',
    ],
    response: 'Please share your coupon or voucher code.',
  },

  // === SUPPORT INTENTS ===
  [UnifiedIntent.COMPLAINT]: {
    priority: 1,
    weight: 4,
    category: 'support',
    patterns: [
      'complaint', 'issue', 'problem', 'wrong order', 'bad food',
      'food cold', 'late delivery', 'missing item', 'wrong item',
      'damaged packaging', 'poor quality', 'bad experience',
      'not satisfied', 'disappointed', 'worst', 'terrible',
      'bakwas', 'kharab', 'sara khana', 'tasteless', 'undercooked',
      'too oily', 'less quantity', 'less food', 'incomplete order',
      'dirty place', 'rude staff', 'unhygienic', 'not clean',
      'broken item', 'damaged product', 'leaked package',
      'late by hours', 'never delivered', 'worst service',
      'frustrated', 'angry', 'very upset', 'complaint kar na',
      'shikayat', 'problem hai', 'issue hai',
    ],
    response: 'I\'m really sorry for the inconvenience. Let me help resolve this immediately.',
  },

  [UnifiedIntent.HELP_REQUEST]: {
    priority: 2,
    weight: 2,
    category: 'support',
    patterns: [
      'help', 'need help', 'help chahiye', 'support',
      'can you help', 'i need assistance', 'assistance',
      'how to use', 'how does it work', 'guidance',
      'instructions', 'tell me how', 'explain',
      'stuck', 'confused', 'not understanding', 'how to book',
      'how to order', 'guide me', 'help me with',
      'speak to someone', 'talk to agent', 'human',
      'customer care', 'call support', 'contact us',
    ],
    response: 'I\'m here to help! What do you need assistance with?',
  },

  [UnifiedIntent.TRACK_ORDER]: {
    priority: 1,
    weight: 3,
    category: 'support',
    patterns: [
      'track my order', 'track order', 'where is my food',
      'order tracking', 'delivery tracking', 'order kahan',
      'food kahan', 'order status', 'delivery status',
      'when food', 'when will arrive', 'eta',
      'order placed', 'order confirmed', 'preparing',
      'out for delivery', 'driver assigned', 'coming soon',
    ],
    response: 'Let me track your order right away!',
  },

  [UnifiedIntent.GET_SUPPORT]: {
    priority: 2,
    weight: 2,
    category: 'support',
    patterns: [
      'call support', 'contact support', 'talk to someone',
      'speak to agent', 'customer service', 'reach out',
      'get help', 'live chat', 'chat with us', 'call us',
      'email support', 'whatsapp support', 'help line',
    ],
    response: 'I can connect you with our support team. How would you prefer to be contacted?',
  },

  // === DISCOVERY INTENTS ===
  [UnifiedIntent.SEARCH_RESTAURANT]: {
    priority: 2,
    weight: 2,
    category: 'discovery',
    patterns: [
      'search restaurant', 'find restaurants', 'nearby restaurants',
      ' restaurants near me', 'food places', 'eateries nearby',
      'dining options', 'best restaurants', 'top rated food',
      'veg restaurant', 'non veg', 'italian restaurant',
      'chinese restaurant', 'pizza place', 'burger joint',
      'biryani place', 'cafe nearby', 'coffee shop',
      'food court', 'restaurant search', 'look for food',
    ],
    response: 'Found some great restaurants nearby! What cuisine are you craving?',
  },

  [UnifiedIntent.SEARCH_HOTEL]: {
    priority: 2,
    weight: 2,
    category: 'discovery',
    patterns: [
      'search hotel', 'find hotels', 'hotels near me',
      'stay options', 'accommodation nearby', 'places to stay',
      'budget hotels', 'luxury hotels', 'business hotels',
      'family hotels', 'couple friendly', 'pet friendly',
      'hotel nearby', 'lodge', 'inn', 'resort',
    ],
    response: 'Found some great hotels! What\'s your budget and location preference?',
  },

  [UnifiedIntent.SEARCH_SERVICE]: {
    priority: 2,
    weight: 2,
    category: 'discovery',
    patterns: [
      'search service', 'find services', 'services nearby',
      'what services', 'available services', 'service providers',
      'experts nearby', 'professional services',
    ],
    response: 'Here are the services available in your area!',
  },

  [UnifiedIntent.SEARCH_SPA]: {
    priority: 2,
    weight: 2,
    category: 'discovery',
    patterns: [
      'search spa', 'find spa', 'spa near me', 'spa nearby',
      'massage centers', 'wellness centers', 'relaxation services',
      'beauty salons', 'salon nearby', 'spa services',
    ],
    response: 'Found some amazing spas and wellness centers! What treatment interest you?',
  },

  [UnifiedIntent.SEARCH_EVENT]: {
    priority: 2,
    weight: 2,
    category: 'discovery',
    patterns: [
      'search event', 'find events', 'events near me',
      'upcoming events', 'what\'s happening', 'things to do',
      'concerts', 'shows', 'parties', 'festivals',
      'live music', 'comedy shows', 'sports events',
    ],
    response: 'Here are the hottest events! What type of event?',
  },

  [UnifiedIntent.BROWSE_NEARBY]: {
    priority: 3,
    weight: 1,
    category: 'discovery',
    patterns: [
      'nearby', 'around me', 'near me', 'around here',
      'what\'s nearby', 'nearby places', 'around',
      'explore', 'discover', 'find nearby', 'local places',
      'surrounding', 'in this area', 'here',
    ],
    response: 'Here\'s what\'s around you!',
  },

  [UnifiedIntent.MOOD_DISCOVERY]: {
    priority: 3,
    weight: 1,
    category: 'discovery',
    patterns: [
      'i\'m bored', 'want to relax', 'need adventure', 'feeling lazy',
      'mood kharab', 'celebrate karna hai', 'romantic date',
      'family outing', 'friends gathering', 'solo trip',
      'spontaneous', 'surprise me', 'suggest something',
      'what should i do', 'unknown ideas', 'not sure what to do',
    ],
    response: 'Based on your mood, here are some perfect suggestions!',
  },

  // === LOYALTY INTENTS ===
  [UnifiedIntent.VIEW_OFFERS]: {
    priority: 3,
    weight: 2,
    category: 'loyalty',
    patterns: [
      'view offers', 'show offers', 'available deals', 'discounts',
      'deals', 'promotions', 'sales', 'special offers',
      'today\'s offers', 'best deals', 'money saving',
      'discount codes', 'cashback offers', 'buy one get one',
      'free delivery', 'combo deals', 'package deals',
    ],
    response: 'Here are the best offers available for you!',
  },

  [UnifiedIntent.CHECK_KARMA]: {
    priority: 3,
    weight: 2,
    category: 'loyalty',
    patterns: [
      'check karma', 'my karma', 'karma status', 'tier status',
      'membership level', 'loyalty status', 'rank',
      'karma points', 'loyalty points', 'member status',
      'bronze', 'silver', 'gold', 'platinum',
      'what tier am i', 'my tier', 'membership tier',
    ],
    response: 'Your Karma status: {tier} | Points: {points} | Progress: {progress}%',
  },

  [UnifiedIntent.CHECK_POINTS]: {
    priority: 3,
    weight: 2,
    category: 'loyalty',
    patterns: [
      'check points', 'my points', 'coins check', 'loyalty coins',
      'reward points', 'earned points', 'total points',
      'points history', 'points redeem', 'my rewards',
      'coins kitne', 'points kitne', 'total coins',
    ],
    response: 'You have {coins} coins worth ₹{value}!',
  },

  [UnifiedIntent.VIEW_REWARDS]: {
    priority: 3,
    weight: 2,
    category: 'loyalty',
    patterns: [
      'view rewards', 'my rewards', 'available rewards',
      'reward points', 'loyalty rewards', 'member rewards',
      'exclusive rewards', 'member benefits', 'vip rewards',
      'gold rewards', 'platinum rewards', 'rewards program',
    ],
    response: 'As a {tier} member, here are your exclusive rewards!',
  },

  [UnifiedIntent.REFER_FRIEND]: {
    priority: 4,
    weight: 1,
    category: 'loyalty',
    patterns: [
      'refer friend', 'share app', 'tell friends', 'referral',
      'invite friends', 'earn coins', 'referral code',
      'share link', 'invite someone', 'tell others',
      'refer and earn', 'referral program', 'share and earn',
    ],
    response: 'Share your referral code and earn coins! Your code: {referral_code}',
  },

  // === FEEDBACK INTENTS ===
  [UnifiedIntent.POSITIVE_FEEDBACK]: {
    priority: 2,
    weight: 1,
    category: 'feedback',
    patterns: [
      'thank you', 'thanks', 'good', 'great', 'excellent',
      'amazing', 'wonderful', 'fantastic', 'loved it',
      'best experience', 'very good', 'awesome',
      'khush hu', 'bahut acha', 'mast hai', 'shandaar',
      'highly recommend', 'five stars', 'would come again',
    ],
    response: 'Thank you so much! We\'re thrilled you had a great experience!',
  },

  [UnifiedIntent.NEGATIVE_FEEDBACK]: {
    priority: 1,
    weight: 2,
    category: 'feedback',
    patterns: [
      'bad', 'worst', 'terrible', 'poor', 'not good',
      'disappointed', 'unsatisfied', 'not happy', 'angry',
      'frustrated', 'upset', 'complaint', 'not recommended',
      'waste of money', 'never coming back', 'avoid this place',
      'kharab hai', 'bekaar', 'buzurg', 'worst experience',
    ],
    response: 'I\'m so sorry to hear that. Let me make this right for you.',
  },

  [UnifiedIntent.WRITE_REVIEW]: {
    priority: 3,
    weight: 1,
    category: 'feedback',
    patterns: [
      'write review', 'give review', 'feedback', 'rate',
      'stars', 'rating', 'review dena', 'share experience',
      'tell others', 'write feedback', 'post review',
      'review for', 'rate this', 'how was it',
    ],
    response: 'I\'d love to hear your experience! How would you rate it?',
  },

  // === GREETINGS ===
  [UnifiedIntent.GREETING]: {
    priority: 5,
    weight: 1,
    category: 'discovery',
    patterns: [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon',
      'good evening', 'good night', 'namaste', 'namaskar',
      'kaise ho', 'kya haal', 'what\'s up', 'yo', 'sup',
      'hola', 'hey there', 'hi there', 'greetings',
    ],
    response: 'Hey there! How can I help you today?',
  },

  // === UNKNOWN ===
  [UnifiedIntent.UNKNOWN]: {
    priority: 10,
    weight: 0,
    category: 'discovery',
    patterns: [],
    response: 'I\'m not sure I understood that. Could you rephrase?',
  },
};

// ==================== LANGUAGE PATTERNS ====================

export const HINGLISH_PATTERNS = {
  // Common Hinglish words
  'bhejo': 'send',
  'chahiye': 'need/want',
  'karo': 'do',
  'hao': 'are',
  'hai': 'is',
  'kahan': 'where',
  'mera': 'my',
  'karo': 'do',
  'sab': 'all',
  'kuch': 'some',
  'acha': 'good',
  'bahut': 'very',
  'nahi': 'no/not',
  'liye': 'for',
  'ke': 'of',
  'ko': 'to',
  'se': 'from',
  'me': 'in',
  'par': 'on',
  'tak': 'until',
  'ke': 'to',
  'hatao': 'remove',
  'lena': 'take',
  'dena': 'give',
  'jao': 'go',
  'aao': 'come',
  'dekho': 'see',
  'suno': 'listen',
  'bolo': 'speak',
  'likho': 'write',
  'milo': 'meet',
  'jao': 'go',
  'raha': 'is',
  'rahi': 'is',
  'hain': 'are',
  'tha': 'was',
  'the': 'were',
};

// ==================== CONTEXTUAL ENTITIES ====================

export interface ExtractedEntity {
  type: 'food_item' | 'restaurant' | 'hotel' | 'service' | 'event' | 'quantity' | 'time' | 'date' | 'location' | 'price';
  value: string;
  confidence: number;
}

export const FOOD_ENTITIES = [
  'biryani', 'pizza', 'burger', 'pasta', 'noodles', 'rice',
  'thali', 'roti', 'naan', 'dal', 'sabzi', 'paneer',
  'chicken', 'mutton', 'fish', 'prawn', 'egg',
  'salad', 'soup', 'dessert', 'ice cream', 'cake',
  'coffee', 'tea', 'juice', 'shake', 'lassi',
  'samosa', 'vada', 'idli', 'dosa', 'uttapam',
  'chinese', 'italian', 'mexican', 'thai', 'japanese',
];

export const PRICE_INDICATORS = [
  'cheap', 'expensive', 'budget', 'affordable', 'premium', 'luxury',
  'low price', 'high price', 'under 500', 'under 1000', 'under 2000',
  'less than', 'more than', 'between', 'around', 'approximately',
];

// ==================== RESPONSE TEMPLATES ====================

export const RESPONSE_TEMPLATES = {
  greeting: [
    'Hey {name}! How can I help you today?',
    'Hi there! What would you like to do?',
    'Welcome back! Ready to find something great?',
    'Hello! I\'m here to help you with anything!',
  ],

  order_confirmed: [
    'Your order is confirmed! 🎉 Order #{orderId}',
    'Done! Your order #{orderId} is being prepared.',
    'Order confirmed! Estimated delivery: {eta}',
  ],

  booking_confirmed: [
    'Booking confirmed! ✅ {entityName} on {date} at {time}',
    'All set! Your reservation at {entityName} is confirmed.',
    'Reserved! See you at {entityName} on {date}.',
  ],

  cancellation_confirmed: [
    'Cancelled successfully. Your refund will be processed in 3-5 days.',
    'Done! The order has been cancelled.',
    'Cancellation confirmed. Sorry to see you go!',
  ],

  complaint_acknowledged: [
    'I\'m really sorry for the inconvenience. Let me help fix this right away.',
    'That\'s not the experience we want for you. Let me escalate this.',
    'I understand your frustration. This will be addressed immediately.',
  ],

  refund_initiated: [
    'Your refund of ₹{amount} has been initiated. Expected in 3-5 days.',
    'Refund processed! The amount will reflect in your account within 3-5 days.',
  ],

  coins_reminder: [
    'You have {coins} coins worth ₹{value}. Use them on your next booking!',
    'Did you know you have {coins} coins? That\'s ₹{value} off your next order!',
  ],

  loyalty_tier: [
    'As a {tier} member, you enjoy {discount}% extra on all bookings!',
    'Your {tier} status gets you exclusive access and perks!',
  ],

  fallback: [
    'I\'m not quite sure I understood. Could you rephrase that?',
    'Let me help you with that. Can you tell me more?',
    'I\'m here to help! What exactly are you looking for?',
  ],
};

// ==================== ESCALATION RULES ====================

export const ESCALATION_RULES = {
  // Keywords that trigger human escalation
  escalate_keywords: [
    'manager', 'supervisor', 'human', 'real person', 'speak to someone',
    'lawyer', 'legal', 'police', 'sue', 'court', 'WHO', 'media',
    'twitter', 'social media', 'facebook', 'instagram post',
    'refund not received', 'already complained', '3rd time',
  ],

  // Sentiment thresholds
  high_frustration: ['angry', 'furious', 'lawsuit', 'police', 'suing'],
  high_value_dispute: 5000, // Escalate refunds above this

  // Time-based escalation
  after_hours_escalate: true,
  weekend_escalate: false,
};

// ==================== SENTIMENT PATTERNS ====================

export const SENTIMENT_PATTERNS = {
  positive: [
    'love', 'amazing', 'awesome', 'excellent', 'great', 'fantastic',
    'wonderful', 'perfect', 'best', 'delicious', 'tasty', 'yummy',
    'satisfied', 'happy', 'pleased', 'recommend', 'thank', 'thanks',
  ],
  negative: [
    'hate', 'terrible', 'awful', 'horrible', 'worst', 'bad',
    'disappointed', 'angry', 'frustrated', 'upset', 'poor',
    'disgusting', 'tasteless', 'cold', 'late', 'missing', 'wrong',
    'not good', 'kharab', 'bekaar', 'bakwas', 'worst',
  ],
  neutral: [
    'okay', 'ok', 'fine', 'alright', 'average', 'decent',
    'normal', 'usual', 'standard',
  ],
};

// ==================== QUICK ACTIONS ====================

export const QUICK_ACTIONS = [
  { label: 'Order Food', icon: '🍔', intent: UnifiedIntent.ORDER_FOOD },
  { label: 'Book Table', icon: '🍽️', intent: UnifiedIntent.BOOK_TABLE },
  { label: 'Book Hotel', icon: '🏨', intent: UnifiedIntent.BOOK_HOTEL },
  { label: 'Book Spa', icon: '💆', intent: UnifiedIntent.BOOK_SPA },
  { label: 'Track Order', icon: '📦', intent: UnifiedIntent.TRACK_ORDER },
  { label: 'My Wallet', icon: '💰', intent: UnifiedIntent.CHECK_BALANCE },
  { label: 'View Offers', icon: '🎁', intent: UnifiedIntent.VIEW_OFFERS },
  { label: 'My Karma', icon: '⭐', intent: UnifiedIntent.CHECK_KARMA },
];

// ==================== EXPORT ====================

export default {
  UnifiedIntent,
  UNIFIED_INTENT_PATTERNS,
  HINGLISH_PATTERNS,
  FOOD_ENTITIES,
  PRICE_INDICATORS,
  RESPONSE_TEMPLATES,
  ESCALATION_RULES,
  SENTIMENT_PATTERNS,
  QUICK_ACTIONS,
};
