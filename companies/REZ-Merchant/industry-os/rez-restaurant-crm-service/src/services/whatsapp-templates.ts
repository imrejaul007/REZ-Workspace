/**
 * Restaurant WhatsApp Templates
 *
 * Pre-defined message templates for restaurant WhatsApp notifications.
 * These templates follow WhatsApp Business API guidelines and 24-hour session rules.
 *
 * Template Variables:
 * {{1}} = Customer/Guest Name
 * {{2}} = Order Number / Confirmation Number
 * {{3}} = Items / Date
 * {{4}} = Amount / Time
 * {{5}} = Delivery info / Guest count
 * {{6}} = Restaurant name / Table info
 * {{7}} = Additional info
 *
 * Categories:
 * - UTILITY: Order updates, reservation reminders (24-hour compliant)
 * - MARKETING: Birthday offers, deals, re-engagement
 * - AUTHENTICATION: OTP, verification codes
 */

// ============================================================================
// Template Types
// ============================================================================

export type RestaurantTemplateType =
  // Order Templates
  | 'order_confirmation'
  | 'order_confirmed'
  | 'order_preparing'
  | 'order_ready'
  | 'order_ready_takeaway'
  | 'order_ready_dinein'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'delivery_driver_assigned'
  | 'delivery_driver_arriving'

  // Reservation Templates
  | 'reservation_confirmation'
  | 'reservation_reminder_2h'
  | 'reservation_reminder_30m'
  | 'reservation_cancelled'

  // Marketing Templates
  | 'birthday_offer'
  | 'anniversary_offer'
  | 'reengagement'
  | 'special_deal'
  | 'loyalty_reminder'
  | 'welcome'

  // Staff Templates
  | 'staff_new_order'
  | 'staff_low_stock'
  | 'staff_review_alert';

export type TemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';

export interface WhatsAppTemplate {
  id: RestaurantTemplateType;
  name: string;
  category: TemplateCategory;
  description: string;
  body: string;
  header?: string;
  footer?: string;
  buttons?: Array<{
    type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
  example?: {
    body?: string[];
    header?: string[];
  };
  compliance?: {
    requiresCustomerConsent: boolean;
    unsubscribeOption: boolean;
  };
}

// ============================================================================
// Template Definitions
// ============================================================================

export const RESTAURANT_WHATSAPP_TEMPLATES: Record<RestaurantTemplateType, WhatsAppTemplate> = {

  // =========================================================================
  // ORDER TEMPLATES
  // =========================================================================

  order_confirmation: {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    category: 'UTILITY',
    description: 'Sent when customer places an order',
    body: `Hi {{1}}! 🎉\n\nYour order #{{2}} has been received!\n\n📋 Items: {{3}}\n💰 Total: {{4}}\n\n{{5}}\n\nTrack your order in real-time. Thank you for ordering with us!`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: [
        'Hi John! 🎉\nYour order #ORD123ABC has been received!\n\n📋 Items: 2x Butter Chicken, 1x Naan\n💰 Total: ₹450\n\nPickup from: Taj Restaurant',
      ],
    },
  },

  order_confirmed: {
    id: 'order_confirmed',
    name: 'Order Confirmed',
    category: 'UTILITY',
    description: 'Sent when order is confirmed after payment',
    body: `Hi {{1}}! ✅\n\nGreat news! Your order #{{2}} is confirmed.\n\n💰 Amount: {{3}}\n⏱️ {{4}}\n\nWe\'ll notify you when it\'s ready!`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Hi John! ✅\nGreat news! Your order #ORD123ABC is confirmed.\n\n💰 Amount: ₹450\n⏱️ 30-45 minutes'],
    },
  },

  order_preparing: {
    id: 'order_preparing',
    name: 'Order Preparing',
    category: 'UTILITY',
    description: 'Sent when kitchen starts preparing the order',
    body: `Hi {{1}}! 👨‍🍳\n\nGood news! Your order #{{2}} is now being prepared with love.\n\n⏱️ Estimated: {{3}}\n\nWe\'ll let you know when it\'s ready!`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Hi John! 👨‍🍳\nGood news! Your order #ORD123ABC is now being prepared with love.\n\n⏱️ Estimated: 20 minutes'],
    },
  },

  order_ready_takeaway: {
    id: 'order_ready_takeaway',
    name: 'Order Ready - Takeaway',
    category: 'UTILITY',
    description: 'Sent when takeaway order is ready for pickup',
    body: `Hi {{1}}! 📦\n\nYour order #{{2}} is ready for pickup!\n\n🏪 Pickup from: {{3}}\n\nSee you soon!`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Hi John! 📦\nYour order #ORD123ABC is ready for pickup!\n\n🏪 Pickup from: Taj Restaurant'],
    },
  },

  order_ready_dinein: {
    id: 'order_ready_dinein',
    name: 'Order Ready - Dine In',
    category: 'UTILITY',
    description: 'Sent when dine-in order is served',
    body: `Hi {{1}}! 🍽️\n\nYour order #{{2}} is being served!\n\nEnjoy your meal! Let us know if you need anything.`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Hi John! 🍽️\nYour order #ORD123ABC is being served!\n\nEnjoy your meal!'],
    },
  },

  order_out_for_delivery: {
    id: 'order_out_for_delivery',
    name: 'Out for Delivery',
    category: 'UTILITY',
    description: 'Sent when order is dispatched for delivery',
    body: `Hi {{1}}! 🚴\n\nYour order #{{2}} from {{3}} is out for delivery!\n\n⏱️ Estimated arrival: {{4}}\n\nTrack your order in real-time!`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Hi John! 🚴\nYour order #ORD123ABC from Taj Restaurant is out for delivery!\n\n⏱️ Estimated arrival: 15-20 mins'],
    },
  },

  order_delivered: {
    id: 'order_delivered',
    name: 'Order Delivered',
    category: 'UTILITY',
    description: 'Sent when order is delivered',
    body: `Hi {{1}}! 🎉\n\nYour order #{{2}} from {{3}} has been delivered!\n\n💰 Total: {{4}}\n\nThank you for ordering! Please rate your experience.`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Hi John! 🎉\nYour order #ORD123ABC from Taj Restaurant has been delivered!\n\n💰 Total: ₹450'],
    },
  },

  order_cancelled: {
    id: 'order_cancelled',
    name: 'Order Cancelled',
    category: 'UTILITY',
    description: 'Sent when order is cancelled',
    body: `Hi {{1}}! ℹ️\n\nYour order #{{2}} has been cancelled.\n\n💰 Refund of {{3}} will be processed within 5-7 business days.\n\nWe hope to serve you again soon!`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Hi John! ℹ️\nYour order #ORD123ABC has been cancelled.\n\n💰 Refund of ₹450 will be processed within 5-7 business days.'],
    },
  },

  // =========================================================================
  // RESERVATION TEMPLATES
  // =========================================================================

  reservation_confirmation: {
    id: 'reservation_confirmation',
    name: 'Reservation Confirmation',
    category: 'UTILITY',
    description: 'Sent when a reservation is confirmed',
    body: `Hi {{1}}! ✅\n\nYour reservation is confirmed!\n\n🔖 Confirmation: {{2}}\n📅 {{3}} at {{4}}\n👥 {{5}} guests\n🏪 {{6}}\n🪑 {{7}}\n\nWe look forward to seeing you! Reply STOP to unsubscribe.`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: [
        'Hi John! ✅\nYour reservation is confirmed!\n\n🔖 Confirmation: ABC123\n📅 Sat, 15 Jun at 7:00 PM\n👥 4 guests\n🏪 Taj Restaurant\n🪑 Table 5',
      ],
    },
  },

  reservation_reminder_2h: {
    id: 'reservation_reminder_2h',
    name: 'Reservation Reminder - 2 Hours',
    category: 'UTILITY',
    description: 'Sent 2 hours before reservation',
    body: `Hi {{1}}! ⏰\n\nFriendly reminder: Your reservation is in 2 hours!\n\n🔖 {{2}}\n📅 {{3}} at {{4}}\n👥 {{5}} guests\n🏪 {{6}}\n🪑 {{7}}\n\nSee you soon!`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: [
        'Hi John! ⏰\nFriendly reminder: Your reservation is in 2 hours!\n\n🔖 ABC123\n📅 Sat, 15 Jun at 7:00 PM\n👥 4 guests\n🏪 Taj Restaurant\n🪑 Table 5',
      ],
    },
  },

  reservation_reminder_30m: {
    id: 'reservation_reminder_30m',
    name: 'Reservation Reminder - 30 Minutes',
    category: 'UTILITY',
    description: 'Sent 30 minutes before reservation',
    body: `Hi {{1}}! 🚗\n\nYour reservation at {{6}} is in 30 minutes!\n\n🔖 {{2}}\n📅 {{3}} at {{4}}\n👥 {{5}} guests\n🪑 {{7}}\n\nWe\'re getting your table ready!`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: [
        'Hi John! 🚗\nYour reservation at Taj Restaurant is in 30 minutes!\n\n🔖 ABC123\n📅 Sat, 15 Jun at 7:00 PM\n👥 4 guests\n🪑 Table 5',
      ],
    },
  },

  reservation_cancelled: {
    id: 'reservation_cancelled',
    name: 'Reservation Cancelled',
    category: 'UTILITY',
    description: 'Sent when a reservation is cancelled',
    body: `Hi {{1}}! ℹ️\n\nYour reservation {{2}} for {{3}} at {{4}} has been cancelled.\n\nWe hope to welcome you another time. Reply STOP to unsubscribe.`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Hi John! ℹ️\nYour reservation ABC123 for Sat, 15 Jun at 7:00 PM has been cancelled.'],
    },
  },

  // =========================================================================
  // MARKETING TEMPLATES
  // =========================================================================

  birthday_offer: {
    id: 'birthday_offer',
    name: 'Birthday Offer',
    category: 'MARKETING',
    description: 'Sent on customer\'s birthday with exclusive offer',
    body: `Happy Birthday, {{1}}! 🎂🎉\n\n{{2}} on us!\n\nUse code: *{{3}}*\nValid for {{4}} days\n\nCelebrate at {{5}}. Book now!`,
    footer: 'Powered by REZ | Valid for registered customers only',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Happy Birthday, John! 🎂🎉\n\n20% OFF on us!\n\nUse code: BDAY2024\nValid for 7 days\n\nCelebrate at Taj Restaurant. Book now!'],
    },
  },

  anniversary_offer: {
    id: 'anniversary_offer',
    name: 'Anniversary Offer',
    category: 'MARKETING',
    description: 'Sent on customer\'s anniversary with special offer',
    body: `Happy Anniversary, {{1}}! 💑🎉\n\n{{2}} years with us! Enjoy {{3}}% OFF with code *{{4}}*\n\nValid for {{5}} days\nCelebrate at {{6}}!`,
    footer: 'Powered by REZ | Valid for registered customers only',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Happy Anniversary, John! 💑🎉\n\n2 years with us! Enjoy 25% OFF with code ANNIV2024\n\nValid for 7 days\nCelebrate at Taj Restaurant!'],
    },
  },

  reengagement: {
    id: 'reengagement',
    name: 'Re-engagement',
    category: 'MARKETING',
    description: 'Sent to customers who haven\'t visited in a while',
    body: `Hi {{1}}! 👋\n\nWe miss you! It\'s been {{2}} days since your last visit to {{3}}.\n\nWe\'ve got something special waiting for you...\n\nUse code *WELCOMEBACK* for 15% OFF on your next order!`,
    footer: 'Powered by REZ | Valid for registered customers only',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Hi John! 👋\n\nWe miss you! It\'s been 45 days since your last visit to Taj Restaurant.\n\nWe\'ve got something special waiting for you...\n\nUse code WELCOMEBACK for 15% OFF!'],
    },
  },

  special_deal: {
    id: 'special_deal',
    name: 'Special Deal',
    category: 'MARKETING',
    description: 'Sent for special deals and limited-time offers',
    body: `Hi {{1}}! 🔥\n\n{{2}}\n\n{{3}}\n\nUse code: *{{4}}*\nValid till {{5}}\n{{6}}`,
    footer: 'Powered by REZ | Limited time offer',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: [
        'Hi John! 🔥\n\nWeekend Special!\n\nGet 30% OFF on all biryanis this weekend!\n\nUse code: BIRYANI30\nValid till 30 Jun',
      ],
    },
  },

  loyalty_reminder: {
    id: 'loyalty_reminder',
    name: 'Loyalty Points Reminder',
    category: 'MARKETING',
    description: 'Sent when points are about to expire',
    body: `Hi {{1}}! ⏰\n\n{{2}} of your loyalty points expire on {{3}}!\n\nYou currently have {{4}} points.\n\nDon\'t miss out - visit us soon to redeem!`,
    footer: 'Powered by REZ | Points valid for 12 months',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: ['Hi John! ⏰\n\n500 of your loyalty points expire on 30 Jun!\n\nYou currently have 1250 points.\n\nDon\'t miss out - visit us soon to redeem!'],
    },
  },

  welcome: {
    id: 'welcome',
    name: 'Welcome Message',
    category: 'MARKETING',
    description: 'Sent when a new customer registers',
    body: `Welcome to REZ, {{1}}! 🎉\n\nYou\'re now part of our food family!\n\n🍽️ Order delicious food\n🎁 Earn loyalty points\n💰 Redeem exciting rewards\n\nUse code *WELCOME100* for 100 bonus points on your first order!`,
    footer: 'Powered by REZ',
    compliance: {
      requiresCustomerConsent: true,
      unsubscribeOption: true,
    },
    example: {
      body: [
        'Welcome to REZ, John! 🎉\n\nYou\'re now part of our food family!\n\n🍽️ Order delicious food\n🎁 Earn loyalty points\n💰 Redeem exciting rewards',
      ],
    },
  },

  // =========================================================================
  // STAFF TEMPLATES
  // =========================================================================

  staff_new_order: {
    id: 'staff_new_order',
    name: 'New Order Alert',
    category: 'UTILITY',
    description: 'Alert sent to staff when a new order is received',
    body: `🔔 NEW ORDER #{{1}}\n\n📋 Items: {{2}}\n💰 Total: {{3}}\n📱 Customer: {{4}}\n⏱️ Type: {{5}}\n\n{{6}}`,
    footer: 'REZ Restaurant OS',
    compliance: {
      requiresCustomerConsent: false,
      unsubscribeOption: false,
    },
    example: {
      body: [
        '🔔 NEW ORDER #ORD123ABC\n\n📋 Items: 2x Butter Chicken, 1x Naan\n💰 Total: ₹450\n📱 Customer: John\n⏱️ Type: DELIVERY\n\n📍 123 Main St, Mumbai',
      ],
    },
  },

  staff_low_stock: {
    id: 'staff_low_stock',
    name: 'Low Stock Alert',
    category: 'UTILITY',
    description: 'Alert sent when stock falls below threshold',
    body: `⚠️ LOW STOCK ALERT\n\n📦 Item: {{1}}\n📊 Current: {{2}}\n🔴 Threshold: {{3}}\n🏪 Branch: {{4}}`,
    footer: 'REZ Restaurant OS',
    compliance: {
      requiresCustomerConsent: false,
      unsubscribeOption: false,
    },
    example: {
      body: [
        '⚠️ LOW STOCK ALERT\n\n📦 Item: Butter Chicken\n📊 Current: 3\n🔴 Threshold: 5\n🏪 Branch: Taj - Andheri',
      ],
    },
  },

  staff_review_alert: {
    id: 'staff_review_alert',
    name: 'New Review Alert',
    category: 'UTILITY',
    description: 'Alert sent when a new review is received',
    body: `📢 NEW REVIEW\n\n⭐ Rating: {{1}}\n💬 "{{2}}"\n👤 Customer: {{3}}\n🏪 Branch: {{4}}\n📍 Source: {{5}}`,
    footer: 'REZ Restaurant OS',
    compliance: {
      requiresCustomerConsent: false,
      unsubscribeOption: false,
    },
    example: {
      body: [
        '📢 NEW REVIEW\n\n⭐ Rating: 2/5\n💬 "Food was cold when delivered"\n👤 Customer: John D\n🏪 Branch: Taj - Andheri\n📍 Source: App',
      ],
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get template by ID
 */
export function getTemplate(templateId: RestaurantTemplateType): WhatsAppTemplate | undefined {
  return RESTAURANT_WHATSAPP_TEMPLATES[templateId];
}

/**
 * Get all templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): WhatsAppTemplate[] {
  return Object.values(RESTAURANT_WHATSAPP_TEMPLATES).filter(
    (template) => template.category === category
  );
}

/**
 * Get all marketing templates
 */
export function getMarketingTemplates(): WhatsAppTemplate[] {
  return getTemplatesByCategory('MARKETING');
}

/**
 * Get all utility templates
 */
export function getUtilityTemplates(): WhatsAppTemplate[] {
  return getTemplatesByCategory('UTILITY');
}

/**
 * Get template list for documentation
 */
export function getTemplateList(): Array<{
  id: RestaurantTemplateType;
  name: string;
  category: TemplateCategory;
  description: string;
  variables: string[];
}> {
  return Object.values(RESTAURANT_WHATSAPP_TEMPLATES).map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    variables: getTemplateVariables(template.body),
  }));
}

/**
 * Extract variable placeholders from template body
 */
function getTemplateVariables(body: string): string[] {
  const regex = /\{\{(\d+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(body)) !== null) {
    if (!variables.includes(match[0])) {
      variables.push(match[0]);
    }
  }

  return variables;
}

/**
 * Validate template variables count
 */
export function validateTemplate(
  templateId: RestaurantTemplateType,
  variables: Record<string, string>
): { valid: boolean; errors: string[] } {
  const template = getTemplate(templateId);

  if (!template) {
    return { valid: false, errors: [`Template not found: ${templateId}`] };
  }

  const templateVariables = getTemplateVariables(template.body);
  const errors: string[] = [];

  // Check for missing variables
  for (const varPlaceholder of templateVariables) {
    if (!variables[varPlaceholder]) {
      errors.push(`Missing variable: ${varPlaceholder}`);
    }
  }

  // Check for extra variables
  for (const varKey of Object.keys(variables)) {
    if (!templateVariables.includes(varKey)) {
      errors.push(`Unexpected variable: ${varKey}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Render template with variables
 */
export function renderTemplate(
  templateId: RestaurantTemplateType,
  variables: Record<string, string>
): string | null {
  const template = getTemplate(templateId);

  if (!template) {
    return null;
  }

  let rendered = template.body;

  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.split(key).join(value);
  }

  // Add header if present
  if (template.header) {
    let header = template.header;
    for (const [key, value] of Object.entries(variables)) {
      header = header.split(key).join(value);
    }
    rendered = `${header}\n\n${rendered}`;
  }

  // Add footer if present
  if (template.footer) {
    rendered = `${rendered}\n\n${template.footer}`;
  }

  return rendered;
}

// ============================================================================
// Default Export
// ============================================================================

export default RESTAURANT_WHATSAPP_TEMPLATES;
