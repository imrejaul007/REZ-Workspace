/**
 * WAITRON AI BRAIN
 * Real AI for Restaurant Operations
 * Uses Claude SDK for natural language understanding, recommendations, and learning
 */

import Anthropic from '@anthropic-ai/sdk';
import mongoose from 'mongoose';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

export interface ParsedOrder {
  items: Array<{
    name: string;
    quantity: number;
    dietary: string[];
    extras: string[];
    modifications: string[];
  }>;
  dietary: string[];
  specialRequests: string[];
  confidence: number;
}

export interface Recommendation {
  item: any;
  reason: string;
  score: number;
  price: number;
}

export interface PairingSuggestion {
  drink: any;
  reason: string;
  price: number;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  score: number;
  positives: string[];
  negatives: string[];
  summary: string;
}

export interface CustomerPreference {
  dietary: string[];
  favoriteItems: string[];
  averageOrderValue: number;
  visitFrequency: string;
  lastOrderDate: Date;
}

export class WaitronAIBrain {
  /**
   * Parse natural language order into structured data
   * "I want a vegetarian pasta with extra cheese and no onions"
   * -> { items: [{name: "Pasta", dietary: ["vegetarian"], extras: ["cheese"], modifications: ["no onions"]}], ... }
   */
  async understandOrder(text: string): Promise<ParsedOrder> {
    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback to simple parsing if no API key
      return this.fallbackParse(text);
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Parse this food order into structured JSON. Return ONLY valid JSON, no markdown or explanation.

Order: "${text}"

Return this exact JSON structure:
{
  "items": [
    {
      "name": "exact dish name",
      "quantity": 1,
      "dietary": ["vegetarian", "gluten-free", etc],
      "extras": ["extra cheese", "extra sauce"],
      "modifications": ["no onions", "less spicy"]
    }
  ],
  "dietary": ["vegetarian", "vegan", "halal", "kosher"],
  "specialRequests": ["birthday decoration", "allergic to nuts"],
  "confidence": 0.95
}`
        }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(content.trim());
    } catch (error) {
      console.error('AI Parse error:', error);
      return this.fallbackParse(text);
    }
  }

  /**
   * Fallback simple parser when no API key
   */
  private fallbackParse(text: string): ParsedOrder {
    const lower = text.toLowerCase();
    const items: ParsedOrder['items'] = [];

    // Simple extraction patterns
    const quantities: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5
    };

    const dietaryPatterns = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher', 'jain'];
    const foundDietary = dietaryPatterns.filter(d => lower.includes(d));

    // Extract extras
    const extras: string[] = [];
    if (lower.includes('extra')) {
      const extraMatch = text.match(/extra (\w+)/i);
      if (extraMatch) extras.push(extraMatch[1]);
    }

    // Extract modifications
    const modifications: string[] = [];
    if (lower.includes('no ')) {
      const noMatch = text.match(/no (\w+)/gi);
      if (noMatch) modifications.push(...noMatch.map(n => n.replace('no ', '')));
    }
    if (lower.includes('without ')) {
      const withoutMatch = text.match(/without (\w+)/gi);
      if (withoutMatch) modifications.push(...withoutMatch.map(w => w.replace('without ', '')));
    }

    // Extract main item name
    let itemName = text
      .replace(/\b(please|i want|i need|can i get|give me|want|order)\b/gi, '')
      .replace(/\b(with|without|no|extra)\b[\s\w]*/gi, '')
      .trim()
      .split(/[,and]+/)[0]
      .trim();

    if (itemName.length > 2) {
      items.push({
        name: itemName,
        quantity: 1,
        dietary: foundDietary,
        extras,
        modifications
      });
    }

    return {
      items,
      dietary: foundDietary,
      specialRequests: [],
      confidence: items.length > 0 ? 0.75 : 0.5
    };
  }

  /**
   * Get personalized menu recommendations based on preferences
   */
  async recommendItems(restaurantId: string, preferences: {
    dietary?: string[];
    budget?: number;
    occasion?: string;
    previousOrders?: string[];
  }): Promise<{ recommendations: Recommendation[]; reasoning: string }> {
    try {
      // Get available menu items using mongoose directly
      const menuItems = await (mongoose.connection.models.MenuItem as any).find({
        restaurantId,
        isAvailable: true
      });

      if (!menuItems.length) {
        return { recommendations: [], reasoning: 'No menu items available' };
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        // Fallback: simple recommendation
        const filtered = preferences.budget
          ? menuItems.filter(i => i.price <= preferences.budget!)
          : menuItems;

        return {
          recommendations: filtered.slice(0, 5).map(item => ({
            item,
            reason: 'Popular choice matching your preferences',
            score: 0.8,
            price: item.price
          })),
          reasoning: 'Based on available items matching your criteria'
        };
      }

      // Use AI for smart recommendations
      const menuList = menuItems.map(i =>
        `- ${i.name} (₹${i.price}) - ${i.category} - tags: ${i.tags?.join(', ') || 'none'}`
      ).join('\n');

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `You are a restaurant recommendation AI. Based on customer preferences, recommend items from the menu.

Customer Preferences:
- Dietary: ${preferences.dietary?.join(', ') || 'none specified'}
- Budget: ${preferences.budget ? `₹${preferences.budget}` : 'not specified'}
- Occasion: ${preferences.occasion || 'not specified'}
- Previous favorites: ${preferences.previousOrders?.join(', ') || 'none'}

Menu Items:
${menuList}

Return JSON with:
{
  "recommendations": [
    {
      "itemName": "exact name from menu",
      "reason": "why this is recommended",
      "score": 0.95
    }
  ],
  "reasoning": "overall explanation of recommendations"
}`
        }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(content.trim());

      // Map recommendations back to full menu items
      const recommendations: Recommendation[] = parsed.recommendations.map((r: any) => {
        const menuItem = menuItems.find(i =>
          i.name.toLowerCase().includes(r.itemName.toLowerCase()) ||
          r.itemName.toLowerCase().includes(i.name.toLowerCase())
        );
        return menuItem ? {
          item: menuItem,
          reason: r.reason,
          score: r.score,
          price: menuItem.price
        } : null;
      }).filter(Boolean);

      return {
        recommendations: recommendations.filter(Boolean),
        reasoning: parsed.reasoning
      };
    } catch (error) {
      console.error('Recommendation error:', error);
      return { recommendations: [], reasoning: 'Error generating recommendations' };
    }
  }

  /**
   * Suggest drink/food pairings for items
   */
  async suggestPairing(restaurantId: string, items: string[]): Promise<{ pairings: PairingSuggestion[]; reasoning: string }> {
    try {
      const menuItems = await (mongoose.connection.models.MenuItem as any).find({
        restaurantId,
        isAvailable: true
      });

      // Find beverages or complementary items
      const beverages = menuItems.filter(i =>
        ['beverages', 'drinks', 'cocktails', 'wine', 'beer'].includes(i.category.toLowerCase())
      );

      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          pairings: beverages.slice(0, 3).map(b => ({
            drink: b,
            reason: 'Complements your selection',
            price: b.price
          })),
          reasoning: 'Based on item categories'
        };
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Suggest drink pairings for these items: ${items.join(', ')}

Available drinks:
${beverages.map(b => `- ${b.name} (₹${b.price}) - ${b.description || ''}`).join('\n')}

Return JSON:
{
  "pairings": [
    {
      "drinkName": "exact name from menu",
      "reason": "why it pairs well",
      "price": 250
    }
  ],
  "reasoning": "overall pairing philosophy"
}`
        }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(content.trim());

      const pairings: PairingSuggestion[] = parsed.pairings.map((p: any) => {
        const drink = beverages.find(b =>
          b.name.toLowerCase().includes(p.drinkName.toLowerCase())
        );
        return drink ? {
          drink,
          reason: p.reason,
          price: drink.price
        } : null;
      }).filter(Boolean);

      return {
        pairings: pairings.filter(Boolean),
        reasoning: parsed.reasoning
      };
    } catch (error) {
      console.error('Pairing error:', error);
      return { pairings: [], reasoning: 'Error generating pairings' };
    }
  }

  /**
   * Analyze review sentiment
   */
  async analyzeSentiment(review: string): Promise<SentimentAnalysis> {
    if (!process.env.ANTHROPIC_API_KEY) {
      // Simple fallback
      const positiveWords = ['amazing', 'excellent', 'great', 'love', 'delicious', 'best', 'wonderful', 'fantastic'];
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'slow', 'cold', 'disappointed'];

      const lower = review.toLowerCase();
      const posCount = positiveWords.filter(w => lower.includes(w)).length;
      const negCount = negativeWords.filter(w => lower.includes(w)).length;

      let sentiment: SentimentAnalysis['sentiment'] = 'neutral';
      if (posCount > negCount) sentiment = 'positive';
      else if (negCount > posCount) sentiment = 'negative';

      return {
        sentiment,
        score: (posCount - negCount) / Math.max(posCount + negCount, 1),
        positives: posCount > 0 ? ['positive aspects detected'] : [],
        negatives: negCount > 0 ? ['negative aspects detected'] : [],
        summary: `Review mentions ${posCount} positive and ${negCount} negative aspects`
      };
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyze this restaurant review sentiment. Return ONLY valid JSON.

Review: "${review}"

Return JSON:
{
  "sentiment": "positive|negative|mixed|neutral",
  "score": 0.85,
  "positives": ["food quality", "service speed", "ambiance"],
  "negatives": ["long wait time", "cold food"],
  "summary": "brief summary"
}`
        }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(content.trim());
    } catch (error) {
      console.error('Sentiment error:', error);
      return { sentiment: 'neutral', score: 0, positives: [], negatives: [], summary: 'Error analyzing' };
    }
  }

  /**
   * Learn customer preferences from orders
   */
  async learnPreference(userId: string, order: any): Promise<void> {
    try {
      // Analyze order patterns
      const dietary = order.items?.flatMap((i: any) => i.dietary || []) || [];
      const itemNames = order.items?.map((i: any) => i.name) || [];
      const totalValue = order.total || 0;

      // This would typically store to a preference database
      // For now, we log the learning
      console.log(`Learning for ${userId}:`, {
        preferences: dietary,
        favorites: itemNames,
        avgValue: totalValue
      });

      // Could integrate with HOJAI memory for persistent learning
      if (process.env.HOJAI_URL) {
        await fetch(`${process.env.HOJAI_URL}/api/memory/store`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'restaurant_preference',
            data: { dietary, favorites: itemNames, lastOrder: new Date(), value: totalValue }
          })
        });
      }
    } catch (error) {
      console.error('Learning error:', error);
    }
  }

  /**
   * Generate upsell suggestions based on current order
   */
  async suggestUpsells(restaurantId: string, currentItems: string[], budget?: number): Promise<{
    suggestions: Array<{ item: any; reason: string; price: number }>;
    reasoning: string;
  }> {
    try {
      const menuItems = await (mongoose.connection.models.MenuItem as any).find({
        restaurantId,
        isAvailable: true
      });

      // Find items not in current order
      const currentLower = currentItems.map(i => i.toLowerCase());
      const upsellItems = menuItems.filter(i =>
        !currentLower.some(c => i.name.toLowerCase().includes(c))
      );

      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          suggestions: upsellItems.slice(0, 3).map(item => ({
            item,
            reason: 'Complements your order',
            price: item.price
          })),
          reasoning: 'Based on order composition'
        };
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Suggest upsells for an order containing: ${currentItems.join(', ')}

Available items:
${upsellItems.map(i => `- ${i.name} (₹${i.price})`).join('\n')}

Return JSON with upsell suggestions that complement the current order.
Consider: appetizers if ordering mains, desserts after mains, drinks throughout.`
        }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(content.trim());

      const suggestions = parsed.suggestions.map((s: any) => {
        const item = upsellItems.find(u =>
          u.name.toLowerCase().includes(s.itemName.toLowerCase())
        );
        return item ? { item, reason: s.reason, price: item.price } : null;
      }).filter(Boolean);

      return { suggestions: suggestions.filter(Boolean), reasoning: parsed.reasoning || 'AI-generated upsells' };
    } catch (error) {
      console.error('Upsell error:', error);
      return { suggestions: [], reasoning: 'Error generating upsells' };
    }
  }

  /**
   * Generate personalized greeting based on customer history
   */
  async generateGreeting(customerName: string, visitCount: number, lastOrder?: string): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) {
      if (visitCount === 0) return `Welcome ${customerName}! First time with us?`;
      if (visitCount < 3) return `Welcome back, ${customerName}! Great to see you again.`;
      return `Hello ${customerName}! Your favorite ${lastOrder || 'dishes'} await.`;
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `Generate a warm restaurant greeting. Keep it under 50 characters.

Customer: ${customerName}
Visit count: ${visitCount}
Last order: ${lastOrder || 'first visit'}

Return a friendly, personalized greeting.`
        }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      return content.trim().substring(0, 100);
    } catch (error) {
      return `Welcome, ${customerName}!`;
    }
  }
}

export const waitronAI = new WaitronAIBrain();