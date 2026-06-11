/**
 * STAYBOT AI Brain - Claude-Powered Hotel Intelligence
 * Natural language understanding, recommendations, and personalization
 */

import Anthropic from '@anthropic-ai/sdk';
import { Guest } from '../models';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// System prompts for each AI agent
const SYSTEM_PROMPTS = {
  frontdesk: `You are an expert hotel front desk AI assistant. Parse guest requests and extract:
- request type (pillow, housekeeping, wake-up, restaurant, taxi, wifi, laundry, etc.)
- quantity (for items like pillows, towels)
- time (for wake-up calls, reservations)
- priority (high/medium/low based on urgency)
- special instructions

Return a JSON array of parsed requests. If no valid requests found, return empty array.`,

  concierge: `You are an expert hotel concierge AI with deep knowledge of:
- Local restaurants, attractions, and events
- Travel arrangements and transportation
- Business services and facilities
- Cultural experiences and tours

For recommendations, consider:
- Guest preferences and dietary restrictions
- Budget constraints
- Distance and convenience
- Time of day and current events

Return structured recommendations with place details, reasons, distance, and price range.`,

  roomService: `You are a hotel room service AI assistant. Analyze menu items and guest preferences to provide personalized recommendations. Consider dietary restrictions, past orders, and current context (time of day, special occasions).`,

  revenue: `You are an expert revenue manager AI for hotels. Analyze market conditions, competitor pricing, demand patterns, and historical data to suggest optimal room pricing. Consider:
- Day of week and seasonality
- Local events and conferences
- Competitor prices and demand
- Hotel's positioning and occupancy
- Lead time and booking patterns`,

  feedback: `You are an expert sentiment analysis AI for hotel feedback. Analyze guest feedback and extract:
- Overall sentiment (positive, negative, mixed)
- Specific positives (staff, cleanliness, location, amenities)
- Specific negatives (issues, complaints)
- Actionable insights for hotel management
- Priority level based on severity`
};

export interface ParsedRequest {
  type: string;
  quantity?: number;
  time?: string;
  priority: 'high' | 'medium' | 'low';
  details?: string;
}

export interface RestaurantRecommendation {
  name: string;
  cuisine: string;
  distance: string;
  priceRange: string;
  rating: number;
  reason: string;
  address?: string;
  phone?: string;
}

export interface MenuRecommendation {
  name: string;
  description: string;
  price: number;
  dietary: string[];
  reason: string;
  imageUrl?: string;
}

export interface PricingSuggestion {
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  reason: string;
  confidence: number;
  factors: string[];
}

export interface FeedbackAnalysis {
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  score: number;
  positives: string[];
  negatives: string[];
  insights: string[];
  priority: 'high' | 'medium' | 'low';
  response?: string;
}

export interface PricingInput {
  roomType: string;
  date: string;
  occupancy: number;
  competitorPrices?: { name: string; price: number }[];
  dayOfWeek?: string;
  leadTime?: number;
}

export class StayBotAIBrain {
  private model = 'claude-sonnet-4-20250514';

  /**
   * Parse natural language guest requests into structured data
   */
  async understandRequest(text: string): Promise<{ requests: ParsedRequest[]; confidence: number; raw: string }> {
    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback to simple parsing if no API key
      return this.fallbackParse(text);
    }

    try {
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPTS.frontdesk,
        messages: [{
          role: 'user',
          content: `Parse this hotel guest request: "${text}"

Return a JSON object with:
{
  "requests": [
    {
      "type": "pillow|housekeeping|wake-up|restaurant|taxi|wifi|laundry|room-service|amenity|other",
      "quantity": number (optional, for items like pillows, towels),
      "time": "HH:MM AM/PM" (optional, for wake-up calls, reservations),
      "priority": "high|medium|low",
      "details": "additional details"
    }
  ],
  "confidence": 0.0-1.0
}`
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

      return {
        requests: parsed.requests || [],
        confidence: parsed.confidence || 0.8,
        raw: content
      };
    } catch (error) {
      console.error('AI parsing error:', error);
      return this.fallbackParse(text);
    }
  }

  /**
   * Recommend restaurants based on guest preferences
   */
  async recommendRestaurant(
    guestId: string,
    preferences: { cuisine?: string; budget?: number; dietary?: string[]; occasion?: string }
  ): Promise<{ recommendations: RestaurantRecommendation[]; reasoning: string }> {
    if (!process.env.ANTHROPIC_API_KEY) {
      return this.fallbackRestaurantRec(preferences);
    }

    try {
      // Get guest history for personalization
      const guest = await Guest.findOne({ guestId });
      const guestHistory = guest?.preferences?.join(', ') || 'No prior history';

      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        system: SYSTEM_PROMPTS.concierge,
        messages: [{
          role: 'user',
          content: `A guest is looking for restaurant recommendations.

Guest Profile:
- Guest ID: ${guestId}
- Past preferences: ${guestHistory}
- Requested cuisine: ${preferences.cuisine || 'Any'}
- Budget: ${preferences.budget ? `$${preferences.budget}` : 'Any'}
- Dietary restrictions: ${preferences.dietary?.join(', ') || 'None'}
- Occasion: ${preferences.occasion || 'General dining'}

Provide 5 restaurant recommendations as a JSON array:
{
  "recommendations": [
    {
      "name": "Restaurant Name",
      "cuisine": "Type of cuisine",
      "distance": "0.5 km",
      "priceRange": "$$-$$$$",
      "rating": 4.5,
      "reason": "Why this is a good fit",
      "address": "Full address",
      "phone": "Contact number"
    }
  ],
  "reasoning": "Overall recommendation strategy"
}`
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

      return {
        recommendations: parsed.recommendations || [],
        reasoning: parsed.reasoning || 'Based on your preferences'
      };
    } catch (error) {
      console.error('Restaurant recommendation error:', error);
      return this.fallbackRestaurantRec(preferences);
    }
  }

  /**
   * Recommend room service menu items
   */
  async recommendRoomService(
    guestId: string,
    context: { timeOfDay?: string; dietary?: string[]; specialOccasion?: string }
  ): Promise<{ menu: MenuRecommendation[]; personalizedGreeting: string }> {
    if (!process.env.ANTHROPIC_API_KEY) {
      return this.fallbackRoomService(context);
    }

    try {
      const guest = await Guest.findOne({ guestId });
      const guestName = guest?.name || 'valued guest';
      const loyaltyTier = guest?.loyaltyTier || 'standard';

      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        system: SYSTEM_PROMPTS.roomService,
        messages: [{
          role: 'user',
          content: `Generate personalized room service recommendations.

Guest Profile:
- Name: ${guestName}
- Loyalty Tier: ${loyaltyTier}
- Time of day: ${context.timeOfDay || 'General'}
- Dietary restrictions: ${context.dietary?.join(', ') || 'None'}
- Special occasion: ${context.specialOccasion || 'None'}

Generate 6 menu recommendations as JSON:
{
  "menu": [
    {
      "name": "Dish Name",
      "description": "Brief description",
      "price": 15.99,
      "dietary": ["vegetarian", "gluten-free"],
      "reason": "Why this is recommended",
      "imageUrl": "optional image URL"
    }
  ],
  "personalizedGreeting": "Hi [Name]! Based on your preferences and the [time of day], we recommend..."
}`
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

      return {
        menu: parsed.menu || [],
        personalizedGreeting: parsed.personalizedGreeting || `Hello ${guestName}! Here are our recommendations for you.`
      };
    } catch (error) {
      console.error('Room service recommendation error:', error);
      return this.fallbackRoomService(context);
    }
  }

  /**
   * Suggest optimal room pricing based on market conditions
   */
  async suggestPricing(input: PricingInput): Promise<PricingSuggestion> {
    if (!process.env.ANTHROPIC_API_KEY) {
      return this.fallbackPricing(input);
    }

    try {
      const dayOfWeek = input.dayOfWeek || new Date(input.date).toLocaleDateString('en-US', { weekday: 'long' });
      const leadTime = input.leadTime || 7;

      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPTS.revenue,
        messages: [{
          role: 'user',
          content: `Analyze market conditions and suggest optimal pricing.

Room Details:
- Room Type: ${input.roomType}
- Date: ${input.date} (${dayOfWeek})
- Current Occupancy: ${input.occupancy}%
- Lead Time: ${leadTime} days

Competitor Prices:
${input.competitorPrices?.map(c => `- ${c.name}: $${c.price}`).join('\n') || 'No competitor data available'}

Provide pricing recommendation as JSON:
{
  "suggestedPrice": 150,
  "minPrice": 100,
  "maxPrice": 250,
  "reason": "Detailed reasoning",
  "confidence": 0.85,
  "factors": ["Factor 1", "Factor 2", "Factor 3"]
}`
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

      return {
        suggestedPrice: parsed.suggestedPrice || 100,
        minPrice: parsed.minPrice || 80,
        maxPrice: parsed.maxPrice || 200,
        reason: parsed.reason || 'Based on market analysis',
        confidence: parsed.confidence || 0.7,
        factors: parsed.factors || []
      };
    } catch (error) {
      console.error('Pricing suggestion error:', error);
      return this.fallbackPricing(input);
    }
  }

  /**
   * Analyze guest feedback and extract insights
   */
  async analyzeFeedback(feedback: string): Promise<FeedbackAnalysis> {
    if (!process.env.ANTHROPIC_API_KEY) {
      return this.fallbackFeedback(feedback);
    }

    try {
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPTS.feedback,
        messages: [{
          role: 'user',
          content: `Analyze this hotel guest feedback:

"${feedback}"

Provide analysis as JSON:
{
  "sentiment": "positive|negative|mixed|neutral",
  "score": 0.0-1.0,
  "positives": ["specific positive things mentioned"],
  "negatives": ["specific negative things mentioned"],
  "insights": ["actionable insights for management"],
  "priority": "high|medium|low",
  "response": "Suggested response to the guest"
}`
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

      return {
        sentiment: parsed.sentiment || 'neutral',
        score: parsed.score || 0.5,
        positives: parsed.positives || [],
        negatives: parsed.negatives || [],
        insights: parsed.insights || [],
        priority: parsed.priority || 'medium',
        response: parsed.response
      };
    } catch (error) {
      console.error('Feedback analysis error:', error);
      return this.fallbackFeedback(feedback);
    }
  }

  /**
   * Learn guest preferences from interactions
   */
  async learnGuestPreference(guestId: string, interaction: {
    type: string;
    data: any;
    timestamp: Date;
  }): Promise<{ success: boolean; updatedPreferences: string[] }> {
    try {
      const guest = await Guest.findOne({ guestId });
      if (!guest) {
        return { success: false, updatedPreferences: [] };
      }

      // Extract preference hints from interaction
      const preferenceHints: string[] = [];

      if (interaction.type === 'room_service') {
        if (interaction.data.items) {
          preferenceHints.push(`ordered:${interaction.data.items.join(',')}`);
        }
      }

      if (interaction.type === 'restaurant_booking') {
        if (interaction.data.cuisine) {
          preferenceHints.push(`cuisine:${interaction.data.cuisine}`);
        }
      }

      if (interaction.type === 'housekeeping') {
        if (interaction.data.time) {
          preferenceHints.push(`housekeeping_time:${interaction.data.time}`);
        }
      }

      // Update guest preferences
      const updatedPreferences = [...(guest.preferences || []), ...preferenceHints];
      await Guest.updateOne(
        { guestId },
        { $set: { preferences: updatedPreferences.slice(-50) } }
      );

      return { success: true, updatedPreferences };
    } catch (error) {
      console.error('Learning error:', error);
      return { success: false, updatedPreferences: [] };
    }
  }

  /**
   * Generate personalized welcome message
   */
  async generateWelcomeMessage(guestId: string): Promise<string> {
    try {
      const guest = await Guest.findOne({ guestId });
      if (!guest) {
        return 'Welcome to our hotel! How may I assist you today?';
      }

      const guestName = guest.name.split(' ')[0];
      const loyaltyTier = guest.loyaltyTier;

      const messages: Record<string, string> = {
        standard: `Welcome, ${guestName}! I'm here to make your stay comfortable. What can I help you with?`,
        silver: `Welcome back, ${guestName}! Great to see you again. How can I enhance your stay?`,
        gold: `Welcome, ${guestName}! As a valued Gold member, we have some exclusive offers for you today.`,
        platinum: `Welcome, ${guestName}! Your dedicated concierge is at your service. How may we exceed your expectations?`
      };

      return messages[loyaltyTier] || messages.standard;
    } catch (error) {
      return 'Welcome! How may I assist you today?';
    }
  }

  /**
   * Suggest upsell opportunities based on guest profile
   */
  async suggestUpsells(guestId: string, currentSpend: number): Promise<{ upsells: { name: string; price: number; reason: string; probability: number }[] }> {
    try {
      const guest = await Guest.findOne({ guestId });
      if (!guest) {
        return { upsells: [] };
      }

      const loyaltyTier = guest.loyaltyTier;
      const stayNights = Math.ceil((new Date(guest.checkOut).getTime() - new Date(guest.checkIn).getTime()) / (1000 * 60 * 60 * 24));

      // Base upsells
      const upsells: { name: string; price: number; reason: string; probability: number }[] = [];

      if (stayNights > 2) {
        upsells.push({
          name: 'Late Checkout',
          price: 500,
          reason: 'You have several nights remaining - upgrade your experience',
          probability: 0.4
        });
      }

      if (currentSpend < 2000) {
        upsells.push({
          name: 'Room Upgrade',
          price: 1500,
          reason: 'Enhance your stay with premium amenities',
          probability: 0.3
        });
      }

      if (loyaltyTier === 'standard' || loyaltyTier === 'silver') {
        upsells.push({
          name: 'Spa Package',
          price: 2500,
          reason: 'Relax and rejuvenate during your stay',
          probability: 0.25
        });
      }

      upsells.push({
        name: 'Breakfast Package',
        price: 800,
        reason: 'Start your day with our continental breakfast',
        probability: 0.6
      });

      return { upsells };
    } catch (error) {
      return { upsells: [] };
    }
  }

  // Fallback methods when API key is not available
  private fallbackParse(text: string): { requests: ParsedRequest[]; confidence: number; raw: string } {
    const requests: ParsedRequest[] = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('pillow')) {
      const qtyMatch = text.match(/(\d+)\s*(pillow|bed)/i);
      requests.push({
        type: 'pillow',
        quantity: qtyMatch ? parseInt(qtyMatch[1]) : 1,
        priority: 'medium'
      });
    }
    if (lowerText.includes('wake') || lowerText.includes('alarm')) {
      const timeMatch = text.match(/(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?/i);
      if (timeMatch) {
        requests.push({
          type: 'wake-up',
          time: `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3] || 'AM'}`,
          priority: 'medium'
        });
      }
    }
    if (lowerText.includes('clean') || lowerText.includes('housekeeping')) {
      requests.push({ type: 'housekeeping', priority: 'low' });
    }
    if (lowerText.includes('taxi') || lowerText.includes('uber') || lowerText.includes('cab')) {
      requests.push({ type: 'taxi', priority: 'high' });
    }
    if (lowerText.includes('restaurant') || lowerText.includes('food') || lowerText.includes('dinner')) {
      requests.push({ type: 'restaurant', priority: 'medium' });
    }

    return { requests, confidence: 0.5, raw: 'Fallback parsing' };
  }

  private fallbackRestaurantRec(preferences: { cuisine?: string; budget?: number }): { recommendations: RestaurantRecommendation[]; reasoning: string } {
    return {
      recommendations: [
        {
          name: 'Hotel Restaurant',
          cuisine: preferences.cuisine || 'Multi-cuisine',
          distance: 'On-site',
          priceRange: '$$$',
          rating: 4.5,
          reason: 'Convenient and highly rated'
        }
      ],
      reasoning: 'Based on your preferences'
    };
  }

  private fallbackRoomService(context: { timeOfDay?: string }): { menu: MenuRecommendation[]; personalizedGreeting: string } {
    return {
      menu: [
        { name: 'Signature Burger', description: 'Premium beef with special sauce', price: 450, dietary: [], reason: 'Most popular item' },
        { name: 'Pasta Primavera', description: 'Fresh vegetables in garlic sauce', price: 350, dietary: ['vegetarian'], reason: 'Light and fresh' }
      ],
      personalizedGreeting: `Good ${context.timeOfDay || 'day'}! Here are our recommendations.`
    };
  }

  private fallbackPricing(input: PricingInput): PricingSuggestion {
    const basePrice = 150;
    const dayMultiplier = input.dayOfWeek === 'Friday' || input.dayOfWeek === 'Saturday' ? 1.3 : 1;
    const occupancyMultiplier = 1 + (input.occupancy / 100) * 0.5;
    const suggestedPrice = Math.round(basePrice * dayMultiplier * occupancyMultiplier);

    return {
      suggestedPrice,
      minPrice: Math.round(suggestedPrice * 0.7),
      maxPrice: Math.round(suggestedPrice * 1.5),
      reason: `Based on ${input.occupancy}% occupancy and ${input.dayOfWeek || 'weekday'} rates`,
      confidence: 0.6,
      factors: ['occupancy', 'day_of_week', 'base_price']
    };
  }

  private fallbackFeedback(feedback: string): FeedbackAnalysis {
    const lower = feedback.toLowerCase();
    const positives: string[] = [];
    const negatives: string[] = [];

    if (lower.includes('great') || lower.includes('excellent') || lower.includes('amazing')) positives.push('overall_experience');
    if (lower.includes('staff') || lower.includes('helpful') || lower.includes('friendly')) positives.push('staff_service');
    if (lower.includes('clean')) positives.push('cleanliness');
    if (lower.includes('comfortable') || lower.includes('bed')) negatives.push('bed_comfort');
    if (lower.includes('wifi') || lower.includes('internet')) negatives.push('wifi_quality');
    if (lower.includes('slow') || lower.includes('wait')) negatives.push('service_speed');

    const sentiment = positives.length > negatives.length ? 'positive' : negatives.length > positives.length ? 'negative' : 'mixed';

    return {
      sentiment,
      score: sentiment === 'positive' ? 0.7 : sentiment === 'negative' ? 0.3 : 0.5,
      positives,
      negatives,
      insights: ['Consider following up on areas of improvement'],
      priority: negatives.length > 2 ? 'high' : negatives.length > 0 ? 'medium' : 'low'
    };
  }
}

export const stayBotAIBrain = new StayBotAIBrain();
export default stayBotAIBrain;