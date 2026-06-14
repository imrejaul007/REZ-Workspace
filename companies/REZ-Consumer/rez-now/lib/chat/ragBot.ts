/**
 * RAG-Powered Menu Chatbot
 *
 * Provides intelligent menu assistance using Retrieval-Augmented Generation.
 * Features:
 * - Answer menu questions
 * - Recommend dishes
 * - Take orders
 * - Dietary advice
 * - Cross-sell suggestions
 */

import { logger } from '@/lib/utils/logger';
import { MenuItem, DietaryPreferences, TasteProfile } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RagQuery {
  userId: string;
  storeId: string;
  storeSlug: string;
  query: string;
  context: {
    orderHistory?: string[];
    dietaryRestrictions?: string[];
    preferences?: string[];
    sessionHistory?: ChatMessage[];
  };
}

export interface MenuItemReference {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  image?: string;
  dietary?: {
    isVegan?: boolean;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    isHalal?: boolean;
    allergens?: string[];
  };
  relevanceScore: number;
}

export interface RagAction {
  type: 'recommend' | 'order' | 'navigate' | 'add_to_cart' | 'show_menu';
  label: string;
  data: {
    itemIds?: string[];
    menuItem?: MenuItemReference;
    categorySlug?: string;
    url?: string;
    quantity?: number;
  };
}

export interface RagResponse {
  answer: string;
  sources: MenuItemReference[];
  actions: RagAction[];
  confidence: number;
  intent: 'menu_query' | 'order' | 'recommendation' | 'dietary' | 'general' | 'unknown';
  suggestedQuestions?: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Configuration ─────────────────────────────────────────────────────────────

const LLM_API_URL = process.env.LLM_API_URL || 'https://api.anthropic.com/v1/messages';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'claude-3-5-haiku-20241107';

// ── Menu Retrieval ─────────────────────────────────────────────────────────────

/**
 * Retrieve relevant menu items for a query
 * In production, this would use a vector database (e.g., Pinecone, Weaviate)
 */
export async function retrieveRelevantItems(
  query: string,
  storeSlug: string,
  menuItems: MenuItem[],
  limit: number = 5
): Promise<MenuItemReference[]> {
  const normalizedQuery = query.toLowerCase();

  // Simple keyword matching - in production, use embeddings
  const scoredItems = menuItems.map(item => {
    let score = 0;
    const searchable = [
      item.name,
      item.description || '',
      item.categoryId || '',
      ...(item.ingredients || []),
    ].join(' ').toLowerCase();

    // Check for dietary requirements
    if (normalizedQuery.includes('vegan') && item.dietary?.isVegan) score += 3;
    if (normalizedQuery.includes('vegetarian') && item.dietary?.isVegetarian) score += 3;
    if (normalizedQuery.includes('gluten') && normalizedQuery.includes('free') && item.dietary?.isGlutenFree) score += 3;
    if (normalizedQuery.includes('halal') && item.dietary?.isHalal) score += 3;

    // Check for allergens to avoid
    const allergenKeywords = ['nut-free', 'dairy-free', 'egg-free', 'shellfish-free'];
    for (const allergen of allergenKeywords) {
      if (normalizedQuery.includes(allergen)) {
        const allergenName = allergen.replace('-free', '');
        if (!item.allergens?.some(a => a.toLowerCase().includes(allergenName))) {
          score += 2;
        }
      }
    }

    // Check for item attributes
    if (normalizedQuery.includes('spicy') && item.spicyLevel && item.spicyLevel > 0) score += 2;
    if (normalizedQuery.includes('popular') && item.isPopular) score += 3;
    if (normalizedQuery.includes('bestseller') && item.badge?.toLowerCase().includes('best seller')) score += 3;
    if (normalizedQuery.includes('chef') && (item.isChefSpecial || item.badge?.toLowerCase().includes('chef'))) score += 3;

    // Direct name match
    if (item.name.toLowerCase().includes(normalizedQuery)) score += 5;
    if (normalizedQuery.includes(item.name.toLowerCase())) score += 5;

    // Category match
    if (item.categoryId?.toLowerCase().includes(normalizedQuery)) score += 2;

    // Ingredient match
    if (item.ingredients?.some(i => i.toLowerCase().includes(normalizedQuery))) score += 3;

    // Description match
    if (item.description?.toLowerCase().includes(normalizedQuery)) score += 1;

    return { item, score };
  });

  // Sort by score and return top items
  return scoredItems
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => ({
      id: s.item.id,
      name: s.item.name,
      price: s.item.price,
      description: s.item.description || undefined,
      category: s.item.categoryId,
      image: s.item.image || s.item.imageHd || undefined,
      dietary: s.item.dietary,
      relevanceScore: s.score,
    }));
}

/**
 * Detect user intent from query
 */
export function detectIntent(query: string): RagResponse['intent'] {
  const normalizedQuery = query.toLowerCase();

  const intentPatterns: { intent: RagResponse['intent']; patterns: RegExp[] }[] = [
    {
      intent: 'order',
      patterns: [
        /order\s+now/i, /place\s+order/i, /i\s+want\s+to\s+order/i,
        /can\s+i\s+get/i, /add\s+.*\s+to\s+(my\s+)?(order|cart)/i,
        /i'll\s+have/i, /i\s+would\s+like/i,
      ],
    },
    {
      intent: 'recommendation',
      patterns: [
        /recommend/i, /suggest/i, /what\s+(do|would)\s+you\s+recommend/i,
        /what'?s?\s+good/i, /best\s+/i, /favorite/i, /popular/i,
        /chef'?s?\s+(special|pick|recommendation)/i,
      ],
    },
    {
      intent: 'dietary',
      patterns: [
        /vegan/i, /vegetarian/i, /gluten[\s-]?free/i, /halal/i,
        /kosher/i, /allergy|allergen/i, /nut[\s-]?free/i,
        /dairy[\s-]?free/i, /egg[\s-]?free/i,
      ],
    },
    {
      intent: 'menu_query',
      patterns: [
        /what'?s?\s+(in|on)\s+(the\s+)?menu/i, /menu/i,
        /do\s+you\s+have/i, /is\s+there/i, /tell\s+me\s+about/i,
        /what\s+is/i, /ingredients/i, /nutrition/i, /calories/i,
      ],
    },
  ];

  for (const { intent, patterns } of intentPatterns) {
    if (patterns.some(pattern => pattern.test(normalizedQuery))) {
      return intent;
    }
  }

  return 'general';
}

// ── LLM Integration ─────────────────────────────────────────────────────────────

/**
 * Generate response using LLM with retrieved context
 */
async function generateLLMResponse(
  query: string,
  intent: RagResponse['intent'],
  contextItems: MenuItemReference[],
  context: RagQuery['context'],
  userPreferences?: DietaryPreferences
): Promise<{ answer: string; confidence: number }> {
  // If no LLM API key, use rule-based responses
  if (!LLM_API_KEY) {
    return generateRuleBasedResponse(query, intent, contextItems, userPreferences);
  }

  try {
    const contextText = contextItems.length > 0
      ? `Relevant menu items:\n${contextItems.map(item =>
          `- ${item.name}: ${item.description || 'No description'} (Price: ₹${(item.price/100).toFixed(2)})`
        ).join('\n')}`
      : 'No specific menu items found for this query.';

    const userPrefsText = userPreferences
      ? `User dietary preferences: ${Object.entries(userPreferences).filter(([_, v]) => v === true).map(([k]) => k).join(', ')}`
      : '';

    const systemPrompt = `You are a helpful restaurant menu assistant for REZ. Your role is to:
1. Answer questions about the menu
2. Make personalized recommendations
3. Help customers find items based on dietary needs
4. Assist with placing orders

Keep responses friendly, concise, and helpful. Use emoji sparingly.
Format prices in INR (₹).`;

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LLM_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Query: ${query}\n\n${contextText}\n\n${userPrefsText}\n\nContext: User is ordering from a restaurant via REZ.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.content?.[0]?.text || 'I apologize, but I had trouble generating a response.';

    return {
      answer,
      confidence: 0.85,
    };
  } catch (error) {
    logger.error('[RAG Bot] LLM error, falling back to rule-based', { error });
    return generateRuleBasedResponse(query, intent, contextItems, userPreferences);
  }
}

/**
 * Generate rule-based response when LLM is unavailable
 */
function generateRuleBasedResponse(
  query: string,
  intent: RagResponse['intent'],
  contextItems: MenuItemReference[],
  userPreferences?: DietaryPreferences
): { answer: string; confidence: number } {
  const normalizedQuery = query.toLowerCase();

  // Handle recommendations
  if (intent === 'recommendation' || normalizedQuery.includes('recommend')) {
    if (contextItems.length > 0) {
      const topItem = contextItems[0];
      return {
        answer: `Based on your preferences, I'd recommend the ${topItem.name}! ${
          topItem.description ? `It's ${topItem.description.toLowerCase()}` : ''
        } It's priced at ₹${(topItem.price/100).toFixed(2)}. Would you like me to add it to your order?`,
        confidence: 0.75,
      };
    }
    return {
      answer: "Our chef's special dishes are very popular right now! Check out our 'Chef Specials' section on the menu for great recommendations.",
      confidence: 0.6,
    };
  }

  // Handle dietary queries
  if (intent === 'dietary') {
    if (contextItems.length > 0) {
      const itemsList = contextItems.map(i => i.name).join(', ');
      return {
        answer: `Great news! We have several options that match your dietary needs: ${itemsList}. Would you like more details about unknown of these?`,
        confidence: 0.8,
      };
    }
    return {
      answer: "I understand you're looking for dietary-specific options. Could you tell me more specifically what you're looking for (vegan, gluten-free, halal, etc.)?",
      confidence: 0.6,
    };
  }

  // Handle menu queries
  if (intent === 'menu_query' || normalizedQuery.includes('menu')) {
    if (contextItems.length > 0) {
      const item = contextItems[0];
      return {
        answer: `Here's what I found: **${item.name}** - ${
          item.description || 'No description available'
        }\nPrice: ₹${(item.price/100).toFixed(2)}${
          item.dietary ? '\n' + formatDietaryInfo(item.dietary) : ''
        }`,
        confidence: 0.85,
      };
    }
    return {
      answer: "You can browse our full menu by scrolling through the categories. Each dish shows ingredients, dietary info, and pricing. Let me know if you have a specific question!",
      confidence: 0.5,
    };
  }

  // Handle order intent
  if (intent === 'order' && contextItems.length > 0) {
    const item = contextItems[0];
    return {
      answer: `I can help you order the ${item.name}! Tap the 'Add to Cart' button on the item, or tell me how many you'd like to order.`,
      confidence: 0.9,
    };
  }

  // Default response
  return {
    answer: "I'm here to help with your order! You can ask me about our menu, get recommendations, or let me know what you're craving. What can I help you with today?",
    confidence: 0.4,
  };
}

function formatDietaryInfo(dietary: NonNullable<MenuItemReference['dietary']>): string {
  const labels: string[] = [];
  if (dietary.isVegan) labels.push('Vegan');
  if (dietary.isVegetarian) labels.push('Vegetarian');
  if (dietary.isGlutenFree) labels.push('Gluten-Free');
  if (dietary.isHalal) labels.push('Halal');
  if (dietary.allergens?.length) labels.push(`Contains: ${dietary.allergens.join(', ')}`);
  return labels.length > 0 ? `Dietary: ${labels.join(' | ')}` : '';
}

// ── Main RAG Processor ─────────────────────────────────────────────────────────

/**
 * Process a user query with RAG
 */
export async function processQuery(
  q: RagQuery,
  menuItems: MenuItem[]
): Promise<RagResponse> {
  try {
    // Step 1: Detect intent
    const intent = detectIntent(q.query);

    // Step 2: Retrieve relevant menu items
    const relevantItems = await retrieveRelevantItems(
      q.query,
      q.storeSlug,
      menuItems
    );

    // Step 3: Build context from order history
    // In production, fetch user's previous orders and preferences

    // Step 4: Generate response
    const { answer, confidence } = await generateLLMResponse(
      q.query,
      intent,
      relevantItems,
      q.context
    );

    // Step 5: Extract actions
    const actions = buildActions(intent, relevantItems, q.query);

    // Step 6: Generate suggested questions
    const suggestedQuestions = generateSuggestedQuestions(intent);

    return {
      answer,
      sources: relevantItems,
      actions,
      confidence,
      intent,
      suggestedQuestions,
    };
  } catch (error) {
    logger.error('[RAG Bot] Error processing query', { error, query: q.query });
    return {
      answer: "I apologize, but I encountered an error processing your request. Please try again or browse our menu directly.",
      sources: [],
      actions: [],
      confidence: 0,
      intent: 'unknown',
    };
  }
}

/**
 * Build action buttons based on intent and retrieved items
 */
function buildActions(
  intent: RagResponse['intent'],
  items: MenuItemReference[],
  query: string
): RagAction[] {
  const actions: RagAction[] = [];

  if (intent === 'recommendation' && items.length > 0) {
    actions.push({
      type: 'recommend',
      label: `View ${items[0].name}`,
      data: { menuItem: items[0] },
    });
  }

  if (intent === 'order' && items.length > 0) {
    actions.push({
      type: 'add_to_cart',
      label: `Add ${items[0].name} to Cart`,
      data: { itemIds: [items[0].id], quantity: 1 },
    });
  }

  if (intent === 'menu_query' && items.length > 0) {
    actions.push({
      type: 'navigate',
      label: 'View Full Menu',
      data: { url: '/menu' },
    });
  }

  // Always provide a way to browse menu
  if (actions.length === 0) {
    actions.push({
      type: 'show_menu',
      label: 'Browse Menu',
      data: { url: '/menu' },
    });
  }

  return actions;
}

/**
 * Generate suggested follow-up questions
 */
function generateSuggestedQuestions(intent: RagResponse['intent']): string[] {
  switch (intent) {
    case 'recommendation':
      return [
        "What's popular today?",
        "Any vegan options?",
        "Show me main courses",
      ];
    case 'dietary':
      return [
        "Show me vegetarian options",
        "What gluten-free items do you have?",
        "Any spicy dishes?",
      ];
    case 'menu_query':
      return [
        "What's the most popular dish?",
        "Any recommendations for tonight?",
        "Can I see the drinks menu?",
      ];
    case 'order':
      return [
        "What's good here?",
        "Any special offers?",
        "Show me appetizers",
      ];
    default:
      return [
        "What do you recommend?",
        "Show me popular dishes",
        "I'm looking for something spicy",
      ];
  }
}

// ── Cross-sell Suggestions ─────────────────────────────────────────────────────

/**
 * Get cross-sell suggestions based on current cart
 */
export function getCrossSellSuggestions(
  cartItems: MenuItem[],
  menuItems: MenuItem[]
): MenuItemReference[] {
  if (cartItems.length === 0) return [];

  // Find complementary items
  const cartCategories = new Set(cartItems.map(i => i.categoryId));

  // Suggest items from different categories
  const suggestions = menuItems
    .filter(item =>
      !cartCategories.has(item.categoryId) &&
      !cartItems.some(cart => cart.id === item.id)
    )
    .slice(0, 3)
    .map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description || undefined,
      category: item.categoryId,
      image: item.image || item.imageHd || undefined,
      dietary: item.dietary,
      relevanceScore: 1,
    }));

  return suggestions;
}

// ── Export ─────────────────────────────────────────────────────────────────────

export default {
  processQuery,
  retrieveRelevantItems,
  detectIntent,
  getCrossSellSuggestions,
};
