/**
 * Comprehensive Sales Training Data - v2
 *
 * Expanded training data for:
 * - Transaction patterns
 * - Sales scenarios
 * - Behavioral triggers
 * - Industry-specific patterns
 * - Psychological triggers
 * - Conversation flows
 * - Objection handling
 */

// ==================== EXTENDED TRANSACTION PATTERNS ====================

export const EXTENDED_TRANSACTION_PATTERNS = {
  // Restaurant patterns
  restaurant: {
    peak_hours: {
      breakfast: { start: 7, end: 10, avg_check: 400 },
      brunch: { start: 10, end: 14, avg_check: 600 },
      lunch: { start: 12, end: 15, avg_check: 500 },
      evening_snacks: { start: 16, end: 18, avg_check: 350 },
      dinner: { start: 19, end: 23, avg_check: 800 },
      late_night: { start: 23, end: 2, avg_check: 700 },
    },
    popular_items: [
      'biryani', 'pizza', 'burger', 'pasta', 'thali',
      'biryani', 'tandoori', 'south indian', 'chinese',
      'sushi', 'ramen', 'pho', 'tacos', 'burrito',
    ],
    upsell_items: [
      { base: 'biryani', upsell: 'raita', conversion: 0.45 },
      { base: 'pizza', upsell: 'garlic bread', conversion: 0.55 },
      { base: 'burger', upsell: 'fries + drink combo', conversion: 0.60 },
      { base: 'thali', upsell: 'sweet', conversion: 0.35 },
      { base: 'main course', upsell: 'appetizer', conversion: 0.40 },
      { base: 'tea/coffee', upsell: 'cake/pastry', conversion: 0.30 },
    ],
    occasion_multipliers: {
      solo_dining: 1.0,
      couple: 1.5,
      family_3: 2.2,
      family_4: 2.8,
      friends_4: 3.0,
      friends_6: 4.5,
      corporate: 3.5,
      celebration: 2.0,
      date_night: 1.8,
      birthday: 2.2,
      anniversary: 1.9,
    },
    dietary_preferences: [
      'vegetarian', 'vegan', 'jain', 'halal', 'kosher',
      'gluten_free', 'dairy_free', 'nut_free', 'low_carb', 'keto',
    ],
    price_segments: {
      budget: { min: 100, max: 300, avg: 200 },
      casual: { min: 300, max: 600, avg: 450 },
      mid_range: { min: 600, max: 1200, avg: 900 },
      premium: { min: 1200, max: 2500, avg: 1800 },
      luxury: { min: 2500, max: 10000, avg: 5000 },
    },
  },

  // Hotel patterns
  hotel: {
    booking_lead_time: {
      last_minute: { hours_before: 24, avg_rate: 1.3 },
      short_notice: { hours_before: 72, avg_rate: 1.15 },
      standard: { hours_before: 168, avg_rate: 1.0 },
      early_bird: { hours_before: 720, avg_rate: 0.85 },
      super_early: { hours_before: 2160, avg_rate: 0.75 },
    },
    room_types: {
      standard: { base: 1.0, avg_upgrade_rate: 0.25 },
      deluxe: { base: 1.4, avg_upgrade_rate: 0.20 },
      suite: { base: 2.2, avg_upgrade_rate: 0.15 },
      presidential: { base: 4.0, avg_upgrade_rate: 0.05 },
    },
    add_ons: [
      { name: 'breakfast', avg_value: 450, conversion: 0.65 },
      { name: 'parking', avg_value: 250, conversion: 0.40 },
      { name: 'early_checkin', avg_value: 500, conversion: 0.30 },
      { name: 'late_checkout', avg_value: 500, conversion: 0.35 },
      { name: 'airport_transfer', avg_value: 800, conversion: 0.25 },
      { name: 'spa_credit', avg_value: 1500, conversion: 0.20 },
      { name: 'dinner_included', avg_value: 1200, conversion: 0.45 },
    ],
    stay_duration: {
      single: { multiplier: 1.0, discount: 0 },
      weekend: { multiplier: 1.2, discount: 0 },
      week: { multiplier: 0.9, discount: 10 },
      month: { multiplier: 0.7, discount: 25 },
    },
  },

  // Spa patterns
  spa: {
    popular_services: [
      'massage_60', 'massage_90', 'facial', 'body_scrub',
      'aromatherapy', 'hot_stone', 'couple_package',
      'manicure', 'pedicure', 'hair_treatment',
    ],
    service_duration: {
      massage_30: 30, massage_60: 60, massage_90: 90,
      facial: 60, body_scrub: 90, aromatherapy: 60,
      hot_stone: 90, couple_package: 120,
    },
    combo_packages: [
      { name: 'Essential', services: ['massage_60', 'facial'], savings: 0.10 },
      { name: 'Premium', services: ['massage_90', 'facial', 'manicure'], savings: 0.15 },
      { name: 'Ultimate', services: ['massage_90', 'body_scrub', 'facial', 'manicure'], savings: 0.20 },
      { name: 'Couple Retreat', services: ['massage_60', 'massage_60', 'jacuzzi'], savings: 0.15 },
    ],
    upsell_triggers: [
      { after: 'massage', suggest: 'steam/sauna', conversion: 0.35 },
      { after: 'massage', suggest: 'facial upgrade', conversion: 0.28 },
      { after: 'facial', suggest: 'eye treatment', conversion: 0.25 },
      { after: 'manicure', suggest: 'pedicure', conversion: 0.40 },
    ],
  },

  // Entertainment patterns
  entertainment: {
    movie: {
      ticket_types: ['regular', 'imax', '4dx', 'premium'],
      add_ons: [
        { name: 'popcorn_combo', avg_value: 350, conversion: 0.70 },
        { name: 'imax_upgrade', avg_value: 200, conversion: 0.40 },
        { name: 'premium_seating', avg_value: 150, conversion: 0.35 },
        { name: '3d_glasses', avg_value: 80, conversion: 0.50 },
      ],
      time_slots: {
        morning: { start: 9, end: 12, demand: 0.6 },
        afternoon: { start: 12, end: 17, demand: 0.8 },
        evening: { start: 17, end: 20, demand: 1.0 },
        night: { start: 20, end: 24, demand: 1.2 },
      },
    },
    events: {
      types: ['concert', 'comedy', 'sports', 'theatre', 'festival'],
      ticket_tiers: ['general', 'silver', 'gold', 'vip'],
      add_ons: [
        { name: 'meet_greet', avg_value: 5000, conversion: 0.15 },
        { name: 'vip_lounge', avg_value: 2500, conversion: 0.25 },
        { name: 'parking', avg_value: 500, conversion: 0.40 },
        { name: 'merchandise', avg_value: 1500, conversion: 0.20 },
      ],
    },
  },

  // Retail patterns
  retail: {
    categories: [
      'fashion', 'electronics', 'groceries', 'home_decor',
      'beauty', 'sports', 'books', 'toys',
    ],
    discount_triggers: [
      { threshold: 500, discount: 5 },
      { threshold: 1000, discount: 10 },
      { threshold: 2500, discount: 15 },
      { threshold: 5000, discount: 20 },
      { threshold: 10000, discount: 25 },
    ],
    bundle_opportunities: [
      { base: 'shirt', suggest: ['pants', 'belt', 'shoes'], combo_discount: 15 },
      { base: 'laptop', suggest: ['bag', 'mouse', 'headphones'], combo_discount: 12 },
      { base: 'perfume', suggest: ['deodorant', 'body_lotion'], combo_discount: 10 },
    ],
  },

  // Travel patterns
  travel: {
    modes: ['flight', 'train', 'bus', 'cab'],
    add_ons: {
      flight: ['priority_boarding', 'extra_baggage', 'seat_selection', 'meals', 'travel_insurance'],
      train: ['food_order', 'premium_seat', 'tatkal_booking'],
      cab: ['outstation', 'rental', 'airport_transfer'],
    },
    booking_triggers: [
      'weekend_getaway', 'vacation', 'business_trip', 'emergency',
      'festive_travel', 'wedding', 'family_visit', 'honeymoon',
    ],
  },
};

// ==================== SALES SCENARIOS ====================

export const SALES_SCENARIOS = [
  // Restaurant scenarios
  {
    id: 'resto_casual',
    category: 'restaurant',
    context: 'User searching for casual dining',
    triggers: ['hungry', 'grab food', 'eat something', 'dinner ideas'],
    responses: [
      'Found {count} great spots near you! Most popular: {top_name} with {rating} stars.',
      '{count} places match. Want something specific?',
    ],
    upsell_timing: 'after_selection',
    upsell_script: 'Would you like to add our Combo Deal - main course + drink + dessert at 15% off?',
  },
  {
    id: 'resto_celebration',
    category: 'restaurant',
    context: 'User celebrating special occasion',
    triggers: ['birthday', 'anniversary', 'celebrate', 'special occasion'],
    responses: [
      'Congratulations! I\'ve found {count} perfect spots for celebrations.',
    ],
    upsell_timing: 'immediate',
    upsell_script: 'Many offer complimentary decoration + cake. Want me to check availability?',
  },
  {
    id: 'resto_date',
    category: 'restaurant',
    context: 'Couple looking for romantic dinner',
    triggers: ['date night', 'romantic', 'couple dinner', 'just us'],
    responses: [
      'Here are {count} romantic spots perfect for couples!',
    ],
    upsell_timing: 'immediate',
    upsell_script: 'Book our Couple\'s Package - private seating + rose decoration + champagne at ₹{price}',
  },

  // Hotel scenarios
  {
    id: 'hotel_business',
    category: 'hotel',
    context: 'Business traveler',
    triggers: ['business trip', 'work travel', 'client meeting', 'corporate'],
    responses: [
      'Found {count} business-friendly hotels with WiFi & workspace.',
    ],
    upsell_timing: 'immediate',
    upsell_script: 'Upgrade to Executive Room with lounge access + breakfast - just ₹{extra}',
  },
  {
    id: 'hotel_vacation',
    category: 'hotel',
    context: 'Family vacation',
    triggers: ['family vacation', 'holiday', 'kids friendly', 'resort'],
    responses: [
      'Great choice! Found {count} family resorts with kids activities.',
    ],
    upsell_timing: 'after_selection',
    upsell_script: 'Book 2 nights, get 3rd night free + kids eat free!',
  },
  {
    id: 'hotel_romantic',
    category: 'hotel',
    context: 'Couple\'s getaway',
    triggers: ['honeymoon', 'romantic getaway', 'couple retreat', ' anniversary'],
    responses: [
      'Perfect for romance! {count} couples-friendly properties available.',
    ],
    upsell_timing: 'immediate',
    upsell_script: 'Add Romantic Package - candle dinner + flower decor + spa - ₹{price}',
  },

  // Spa scenarios
  {
    id: 'spa_relax',
    category: 'spa',
    context: 'User wants relaxation',
    triggers: ['relax', 'spa', 'massage', 'pamper', 'stress'],
    responses: [
      'Found {count} relaxing spa options!',
    ],
    upsell_timing: 'immediate',
    upsell_script: 'Try our 90-min massage + steam combo - most popular for relaxation!',
  },
  {
    id: 'spa_couple',
    category: 'spa',
    context: 'Couple looking for spa',
    triggers: ['couple spa', 'together', 'we both', 'spa day'],
    responses: [
      'Perfect for couples! Found {count} partner packages.',
    ],
    upsell_timing: 'immediate',
    upsell_script: 'Couple Retreat: 2x60min massage + jacuzzi + champagne - save 15%!',
  },

  // Entertainment scenarios
  {
    id: 'movie_weekend',
    category: 'entertainment',
    context: 'User planning movie outing',
    triggers: ['movie', 'watch film', 'cinema', 'latest show'],
    responses: [
      '{count} movies playing near you! Top rated: {top_name}',
    ],
    upsell_timing: 'after_selection',
    upsell_script: 'Add Popcorn Combo - large popcorn + 2 drinks at just ₹{price}',
  },
  {
    id: 'event_excited',
    category: 'entertainment',
    context: 'User interested in event',
    triggers: ['concert', 'show', 'event', 'live'],
    responses: [
      'Exciting! Found {count} upcoming events. Last tickets for {top_name}!',
    ],
    upsell_timing: 'immediate',
    upsell_script: 'VIP passes include backstage access + meet & greet - limited availability!',
  },

  // Cross-category scenarios
  {
    id: 'dinner_movie',
    category: 'cross_sell',
    context: 'User planning dinner + activity',
    triggers: ['dinner and movie', 'evening plans', 'date night ideas'],
    responses: [
      'Perfect combo! Here\'s a plan: Dinner at {restaurant} + Movie at {cinema}',
    ],
    upsell_timing: 'immediate',
    upsell_script: 'Book both together and save ₹{savings}!',
  },
  {
    id: 'stay_dine',
    category: 'cross_sell',
    context: 'User booking hotel + dining',
    triggers: ['hotel with restaurant', 'stay and eat', 'dining included'],
    responses: [
      'Great choice! {count} hotels with amazing restaurants.',
    ],
    upsell_timing: 'immediate',
    upsell_script: 'Add Half Board - breakfast + dinner included - just ₹{extra}/day',
  },
];

// ==================== PSYCHOLOGICAL TRIGGERS ====================

export const PSYCHOLOGICAL_TRIGGERS = {
  // Urgency triggers
  urgency: [
    { trigger: 'scarcity', message: 'Only {count} slots left at this price!', effectiveness: 0.85 },
    { trigger: 'time_limit', message: 'This deal expires in {time}!', effectiveness: 0.80 },
    { trigger: 'high_demand', message: '{count} people booked this in the last hour.', effectiveness: 0.75 },
    { trigger: 'price_rise', message: 'Prices go up at midnight. Book now to save ₹{savings}!', effectiveness: 0.78 },
    { trigger: 'last_chance', message: 'Last day to book with {discount}% off!', effectiveness: 0.82 },
  ],

  // Social proof
  social_proof: [
    { trigger: 'popular', message: '{count}+ bookings this month!', effectiveness: 0.72 },
    { trigger: 'rating', message: 'Rated {rating} by {count} customers', effectiveness: 0.68 },
    { trigger: 'recommendation', message: 'Most guests who booked {similar} also booked this.', effectiveness: 0.65 },
    { trigger: 'celebrity', message: 'Celebrity favorite!', effectiveness: 0.60 },
    { trigger: 'new', message: 'Just opened! Be among the first to try.', effectiveness: 0.58 },
  ],

  // Authority triggers
  authority: [
    { trigger: 'expert', message: 'Recommended by top chefs/critics', effectiveness: 0.62 },
    { trigger: 'award', message: 'Award-winning {category}', effectiveness: 0.70 },
    { trigger: 'certified', message: 'Certified authentic {cuisine}', effectiveness: 0.55 },
    { trigger: 'premium', message: 'Part of our exclusive Premium collection', effectiveness: 0.58 },
  ],

  // Reciprocity triggers
  reciprocity: [
    { trigger: 'free_gift', message: 'Free {item} with every booking!', effectiveness: 0.78 },
    { trigger: 'loyalty_points', message: 'Earn {points} coins on this booking', effectiveness: 0.72 },
    { trigger: 'bonus', message: 'As a {tier} member, you get exclusive access!', effectiveness: 0.75 },
    { trigger: 'complimentary', message: 'Complimentary upgrade for you today!', effectiveness: 0.82 },
  ],

  // Commitment triggers
  commitment: [
    { trigger: 'small_yes', message: 'Can I book for {date}? Just a quick confirmation.', effectiveness: 0.70 },
    { trigger: 'default', message: 'Should I go ahead with the best option?', effectiveness: 0.65 },
    { trigger: 'preview', message: 'Here\'s a summary - looks good?', effectiveness: 0.60 },
  ],

  // Likeability triggers
  likeability: [
    { trigger: 'personal', message: 'Based on your preferences, I think you\'ll love this!', effectiveness: 0.68 },
    { trigger: 'similar', message: 'Guests like you rated this {rating} stars!', effectiveness: 0.62 },
    { trigger: 'curation', message: 'I hand-picked this just for you.', effectiveness: 0.70 },
  ],
};

// ==================== OBJECTION HANDLERS ====================

export const COMPREHENSIVE_OBJECTION_HANDLERS = {
  // Price objections
  'too_expensive': [
    { response: 'I understand. With your {coins} coins, you save ₹{value}. Want to apply?', weight: 0.35 },
    { response: 'Let me show you similar options at ₹{lower_price} with good reviews.', weight: 0.30 },
    { response: 'We have EMI starting at just ₹{emi}/month. Interested?', weight: 0.25 },
    { response: 'Book today and I\'ll include complimentary {addon} worth ₹{addon_value}.', weight: 0.20 },
    { response: 'This includes {inclusions} - great value for what you\'re getting.', weight: 0.25 },
  ],
  'cheaper_elsewhere': [
    { response: 'I can match that price if you share the link!', weight: 0.30 },
    { response: 'That price doesn\'t include {inclusions}. Ours does.', weight: 0.35 },
    { response: 'We offer Price Match + extra benefits. Shall I proceed?', weight: 0.30 },
  ],
  'need_discount': [
    { response: 'You\'re a {tier} member - here\'s {discount}% exclusive discount!', weight: 0.40 },
    { response: 'Book 2 and get 20% off the second. Want to add something?', weight: 0.30 },
    { response: 'Midweek bookings get 15% off. Can you shift to {day}?', weight: 0.25 },
  ],

  // Timing objections
  'not_now': [
    { response: 'No problem! I\'ll set a reminder for {day}.', weight: 0.30 },
    { response: 'Prices might change. Want me to hold the current price for 24 hours?', weight: 0.35 },
    { response: 'I can send you a notification when prices drop.', weight: 0.25 },
  ],
  'thinking': [
    { response: 'Take your time! Here\'s a quick summary to help decide.', weight: 0.30 },
    { response: 'Any specific questions I can answer for you?', weight: 0.25 },
    { response: 'I\'ll keep this option reserved for you until {time}.', weight: 0.30 },
  ],
  'check_with_spouse': [
    { response: 'Absolutely! I\'ll send you the details to share.', weight: 0.25 },
    { response: 'Share with them - they can book from here too if you like.', weight: 0.20 },
    { response: 'I\'ll save this and remind you in a few hours.', weight: 0.25 },
  ],

  // Interest objections
  'not_interested': [
    { response: 'No problem! Let me know if you change your mind.', weight: 0.15 },
    { response: 'Can you tell me what you\'re looking for instead?', weight: 0.25 },
    { response: 'Just so you know, this {category} has {count} new options.', weight: 0.20 },
  ],
  'already_booked_elsewhere': [
    { response: 'Great! Did you know you can earn coins on that booking too?', weight: 0.25 },
    { response: 'If anything changes, I\'ll be happy to help rebook.', weight: 0.15 },
    { response: 'For future visits, we have exclusive deals for members!', weight: 0.20 },
  ],
  'not_my_style': [
    { response: 'Got it! Want me to show {similar} instead?', weight: 0.30 },
    { response: 'What style would you prefer? I\'ll find something better.', weight: 0.35 },
  ],

  // Trust objections
  'never_heard': [
    { response: 'We have {count}+ happy customers! Here\'s what they say: {rating} avg.', weight: 0.30 },
    { response: 'Part of ReZ ecosystem - trusted by millions across India.', weight: 0.25 },
    { response: 'Would you like to see verified reviews from recent guests?', weight: 0.25 },
  ],
  'worried_quality': [
    { response: '100% satisfaction guarantee. If not happy, we\'ll make it right.', weight: 0.35 },
    { response: 'Show me what others said: {count} 5-star reviews!', weight: 0.30 },
    { response: 'I personally recommend this based on your preferences.', weight: 0.25 },
  ],

  // Logistics objections
  'too_far': [
    { response: 'Found {count} options much closer with similar ratings!', weight: 0.35 },
    { response: 'Just {distance} from you. Door-to-door: {travel_time}', weight: 0.25 },
    { response: 'We can arrange pickup. Want me to check availability?', weight: 0.25 },
  ],
  'not_available': [
    { response: 'How about {alternative_date}? Best availability then.', weight: 0.35 },
    { response: 'Found similar at {alternative_place} with instant confirmation!', weight: 0.30 },
    { response: 'Join waitlist - we\'ll notify you first when slots open.', weight: 0.25 },
  ],
  'wrong_timing': [
    { response: 'Best time is {best_day} - {discount}% discount + more availability.', weight: 0.35 },
    { response: 'Perfect timing! {count} slots open at {suggested_time}.', weight: 0.30 },
    { response: 'Early morning or late evening have better availability. Interested?', weight: 0.25 },
  ],
};

// ==================== SALES CONVERSATION FLOWS ====================

export const SALES_CONVERSATION_FLOWS = {
  // High-intent flow
  high_intent: {
    steps: [
      {
        trigger: 'user_expresses_interest',
        response: 'Found {count} options. Here\'s the top match: {top}',
        next_step: 'show_details',
      },
      {
        trigger: 'user_asks_questions',
        response: 'Great question! {answer}. Anything else?',
        next_step: 'address_concerns',
      },
      {
        trigger: 'user_shows_interest',
        response: 'Perfect choice! Should I check availability for {date}?',
        next_step: 'confirm_booking',
      },
      {
        trigger: 'user_confirms',
        response: 'Booking confirmed! You\'ll earn {coins} coins.',
        upsell: 'While I have you - add {upsell} for just {price}?',
        next_step: 'upsell',
      },
      {
        trigger: 'upsell_response',
        response: 'Added! Total: ₹{total}. See you at {venue}!',
        next_step: 'farewell',
      },
    ],
  },

  // Medium-intent flow
  medium_intent: {
    steps: [
      {
        trigger: 'user_browsing',
        response: 'Found {count} options matching your vibe. Want me to filter?',
        next_step: 'understand_preferences',
      },
      {
        trigger: 'user_shares_preference',
        response: 'Got it! {top_match} looks perfect for you.',
        next_step: 'build_interest',
      },
      {
        trigger: 'user_engages',
        response: '{highlight} - that\'s why guests love it!',
        next_step: 'create_urgency',
      },
      {
        trigger: 'user_interested',
        response: 'Should I hold the best price for 24 hours while you decide?',
        next_step: 'commit',
      },
    ],
  },

  // Low-intent flow
  low_intent: {
    steps: [
      {
        trigger: 'user_browsing',
        response: 'Hey! What brings you here today? I can help find something great.',
        next_step: 'discover_needs',
      },
      {
        trigger: 'user_shares_vague_need',
        response: 'Cool! Let me show you what\'s trending and popular right now.',
        next_step: 'show_options',
      },
      {
        trigger: 'user_explores',
        response: 'See anything you like? I can tell you more.',
        next_step: 'qualify_interest',
      },
      {
        trigger: 'user_shows_curiosity',
        response: 'That\'s a popular one! When you\'re ready, I\'m here.',
        next_step: 'plant_seed',
      },
    ],
  },

  // Recovery flow
  recovery: {
    steps: [
      {
        trigger: 'user_abandons',
        response: 'Hey! Need help with anything?',
        next_step: 'offer_assistance',
      },
      {
        trigger: 'user_explains_issue',
        response: 'I see. Let me help sort that out.',
        next_step: 'resolve',
      },
      {
        trigger: 'issue_resolved',
        response: 'All set! Here\'s a {discount}% discount for your trouble.',
        next_step: 'close',
      },
    ],
  },
};

// ==================== CUSTOMER PERSONALITY PROFILES ====================

export const CUSTOMER_PERSONALITIES = {
  deal_hunter: {
    traits: ['price_sensitive', 'compares_options', 'delays_purchase'],
    triggers: ['discount', 'sale', 'limited_time', 'best_price'],
    responses: ['Show me the discount!', 'Is this the lowest price?', 'What\'s included?'],
    upsell_approach: 'Emphasize value, not luxury. Show ROI.',
  },
  quality_seeker: {
    traits: ['brand_conscious', 'reads_reviews', 'wants_best'],
    triggers: ['premium', 'top_rated', 'award_winning', 'exclusive'],
    responses: ['Is this the best in the city?', 'What makes it special?', 'Show me reviews.'],
    upsell_approach: 'Emphasize quality, exclusivity, and reputation.',
  },
  convenience_focused: {
    traits: ['time_poor', 'wants_quick', 'friction_averse'],
    triggers: ['instant', 'easy', 'quick', 'nearby'],
    responses: ['Can I book in one click?', 'How far?', 'Is it easy to find?'],
    upsell_approach: 'Emphasize speed, ease, and proximity.',
  },
  experience_shopper: {
    traits: ['wants_memorable', 'shares_on_social', 'tries_new_things'],
    triggers: ['unique', 'instagram', 'new', 'trending'],
    responses: ['Is this photogenic?', 'Have you been?', 'What\'s the vibe?'],
    upsell_approach: 'Emphasize uniqueness, photo opportunities, and shareability.',
  },
  loyal_customer: {
    traits: ['brand_loyal', 'already_trusts', 'wants_recognition'],
    triggers: ['member_exclusive', 'thank_you', 'priority', 'insider'],
    responses: ['I\'ve been here before', 'What\'s new?', 'Do you remember me?'],
    upsell_approach: 'Acknowledge loyalty, offer personalized perks.',
  },
  research_mode: {
    traits: ['asks_many_questions', 'compares_thoroughly', 'deliberates'],
    triggers: ['details', 'specifications', 'comparison', 'options'],
    responses: ['What\'s included?', 'How is this different from {other}?', 'Show me all options.'],
    upsell_approach: 'Provide detailed info, comparisons, and honest recommendations.',
  },
};

// ==================== upsell/cross-sell SCRIPTS ====================

export const SALES_SCRIPTS = {
  welcome: [
    'Hey {name}! Looking for something specific today?',
    'Welcome back, {name}! I have some great deals for {tier} members.',
    'Hi there! What\'s on your mind?',
  ],

  needs_qualification: [
    'What kind of experience are you looking for?',
    'Is this for yourself or with others?',
    'Any specific preferences or requirements?',
    'Working with a budget or looking for the best?',
  ],

  recommendation_intro: [
    'Based on what you told me, I think you\'ll love this.',
    'I found something that matches perfectly.',
    'Here\'s my top pick for you:',
  ],

  urgency_creation: [
    'Only {count} left at this price.',
    'This deal expires in {hours} hours.',
    'I can only hold this price for {time}.',
    '{count} people are looking at this right now.',
  ],

  objection_preemption: [
    'Before you ask - yes, cancellation is free.',
    'I know you\'re comparing options, so here\'s everything you need.',
    'Most guests worry about X, but here\'s why it\'s not an issue.',
  ],

  closing_techniques: [
    { name: 'assumptive', script: 'Shall I go ahead and book for {date}?' },
    { name: 'alternative', script: 'Would you prefer {option_a} or {option_b}?' },
    { name: 'urgency', script: 'Since you\'re interested, let me check availability now.' },
    { name: 'value', script: 'This includes {value} worth ₹{amount} - great deal!' },
  ],

  post_booking: [
    'Booking confirmed! You\'ll receive a confirmation at {email}.',
    'All set! Your coins will be credited after the visit.',
    'Done! Show your booking QR at the entrance.',
  ],

  upsell_intro: [
    'Since you\'re here...',
    'Quick question -',
    'Before you go -',
    'If you\'re interested -',
  ],

  farewell: [
    'Enjoy your {category}! Let me know how it was.',
    'Have a great time! I\'ll see you next time.',
    'Done! Questions anytime - I\'m here to help.',
  ],
};

// ==================== PERFORMANCE METRICS ====================

export const SALES_METRICS = {
  conversion_metrics: [
    { name: 'view_to_inquiry_rate', target: 0.15, description: 'Views that lead to inquiry' },
    { name: 'inquiry_to_booking_rate', target: 0.35, description: 'Inquiries that convert to booking' },
    { name: 'cart_abandonment_rate', target: 0.25, description: 'Carts abandoned before booking' },
    { name: 'upsell_success_rate', target: 0.20, description: 'Upsell offers accepted' },
    { name: 'cross_sell_success_rate', target: 0.15, description: 'Cross-sell offers accepted' },
  ],

  value_metrics: [
    { name: 'average_order_value', target: 1500, description: 'Average booking value' },
    { name: 'aov_with_upsell', target: 1850, description: 'AOV including upsells' },
    { name: 'coins_redeemed_rate', target: 0.40, description: 'Coins used vs earned' },
    { name: 'repeat_booking_rate', target: 0.30, description: 'Users who book again' },
  ],

  engagement_metrics: [
    { name: 'messages_per_session', target: 5, description: 'Average chat messages' },
    { name: 'quick_response_rate', target: 0.90, description: 'Responses under 3 seconds' },
    { name: 'resolution_rate', target: 0.85, description: 'Queries resolved in chat' },
    { name: 'handoff_rate', target: 0.10, description: 'Chats needing human help' },
  ],

  retention_metrics: [
    { name: 'day_7_retention', target: 0.40, description: 'Users back within 7 days' },
    { name: 'day_30_retention', target: 0.25, description: 'Users back within 30 days' },
    { name: 'net_promoter_score', target: 50, description: 'NPS score' },
    { name: 'referral_rate', target: 0.15, description: 'Users who refer others' },
  ],
};

// ==================== SEASONAL PROMOS ====================

export const SEASONAL_PROMOS = {
  january: {
    name: 'New Year Reset',
    offers: ['First booking 20% off', 'New year resolution deals', 'Detox & wellness packages'],
    target: ['spa', 'gym', 'healthy_food'],
  },
  february: {
    name: 'Valentine\'s Romance',
    offers: ['Couple packages 25% off', 'Romantic dinner deals', 'Staycation specials'],
    target: ['restaurant', 'hotel', 'spa'],
  },
  march: {
    name: 'Spring Fest',
    offers: ['Holi celebration deals', 'Festival dining offers', 'Holiday packages'],
    target: ['restaurant', 'entertainment'],
  },
  april: {
    name: 'Summer Sale',
    offers: ['Peak season discounts', 'Early bird offers', 'Summer camp packages'],
    target: ['hotel', 'travel', 'events'],
  },
  may: {
    name: 'Pre-Monsoon',
    offers: ['Indoor activity deals', 'Monsoon preparation packages', 'Cozy stay packages'],
    target: ['restaurant', 'cafe', 'spa'],
  },
  june: {
    name: 'Festival Season Start',
    offers: ['端午 offers', 'Family packages', 'Group booking deals'],
    target: ['restaurant', 'hotel', 'entertainment'],
  },
  july: {
    name: 'Monsoon Madness',
    offers: ['Indoor experience deals', 'Rainy day specials', 'Cozy dining offers'],
    target: ['restaurant', 'cafe', 'entertainment'],
  },
  august: {
    name: 'Independence Day',
    offers: ['Independence sale', 'Freedom packages', 'patriotic deals'],
    target: ['all_categories'],
  },
  september: {
    name: 'Festive Season Kickoff',
    offers: ['Pre-Diwali offers', 'Upcoming festival deals', 'Gift packages'],
    target: ['all_categories'],
  },
  october: {
    name: 'Diwali Celebrations',
    offers: ['Diwali special packages', 'Corporate gifting', 'Family reunion deals'],
    target: ['restaurant', 'hotel', 'retail'],
  },
  november: {
    name: 'Black Friday Style',
    offers: ['Biggest sale of the year', 'Up to 50% off', 'Limited flash deals'],
    target: ['all_categories'],
  },
  december: {
    name: 'Holiday Season',
    offers: ['Christmas specials', 'New Year Eve packages', 'Year-end celebrations'],
    target: ['hotel', 'restaurant', 'entertainment'],
  },
};
