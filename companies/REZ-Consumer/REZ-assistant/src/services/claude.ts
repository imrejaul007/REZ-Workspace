import Anthropic from '@anthropic-ai/sdk';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

class ClaudeService {
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set');
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const client = this.getClient();

      // Convert messages to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: anthropicMessages
      });

      // Return the text content from the response
      const textContent = response.content.find(
        block => block.type === 'text'
      );

      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      return textContent.text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to get response from Claude');
    }
  }

  async detectIntent(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Simple intent detection patterns
    const intents = {
      'order_food': ['order', 'food', 'hungry', 'eat', 'delivery', 'restaurant'],
      'book_ride': ['ride', 'cab', 'taxi', 'pickup', 'travel', 'go to'],
      'check_balance': ['balance', 'wallet', 'coins', 'money'],
      'pay_bill': ['pay', 'bill', 'payment', 'invoice'],
      'general': []
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }
}

export const claudeService = new ClaudeService();