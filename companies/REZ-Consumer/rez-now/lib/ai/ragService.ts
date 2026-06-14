import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RAGQuery {
  userId: string;
  query: string;
  context: {
    menuItems?: unknown[];
    orderHistory?: unknown[];
    preferences?: string[];
  };
}

interface RAGResponse {
  answer: string;
  sources: string[];
  actions?: {
    type: 'recommend' | 'order' | 'navigate' | 'help';
    data;
  }[];
  confidence: number;
}

const SYSTEM_PROMPT = `You are REZ AI assistant. You help customers with restaurant orders.
You have access to menu items, order history, and user preferences.
Be helpful, concise, and suggest items they might like.
Suggest items naturally in conversation.
Always be polite and friendly.`;

export async function processQuery(query: RAGQuery): Promise<RAGResponse> {
  // Build context from menu items
  const menuContext = query.context.menuItems
    ?.map((item) => `${item.name}: ${item.description} - ₹${item.price}`)
    .join('\n') || 'No menu available';

  // Build order history
  const historyContext = query.context.orderHistory
    ?.slice(0, 5)
    .map((order) => `${order.date}: ${order.items.map((i) => i.name).join(', ')}`)
    .join('\n') || 'No order history';

  const messages = [
    {
      role: 'user' as const,
      content: `Menu:\n${menuContext}\n\nOrder History:\n${historyContext}\n\nQuestion: ${query.query}`,
    },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const answer = response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    answer,
    sources: query.context.menuItems?.map((i) => i.name) || [],
    confidence: 0.9,
  };
}

export async function recommendItems(userId: string, preferences: string[]) {
  const prompt = `User likes: ${preferences.join(', ')}
Suggest 3 menu items they might like based on preferences. Return JSON array with items.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text' ? JSON.parse(response.content[0].text) : [];
}
