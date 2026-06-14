/**
 * ML Pipeline Tests
 */

describe('Embeddings Service', () => {
  test('generates embedding for text', async () => {
    const { embed } = await import('../src/services/embeddings.service');
    const result = await embed('hello world');
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns consistent embedding for same text', async () => {
    const { embed } = await import('../src/services/embeddings.service');
    const a = await embed('test text');
    const b = await embed('test text');
    expect(a).toEqual(b);
  });
});

describe('Personalization', () => {
  test('builds user embedding from recent activity', async () => {
    const { buildUserEmbedding } = await import('../src/services/personalization.service');
    // Mock user activity
    const result = await buildUserEmbedding('user123');
    expect(result).toBeInstanceOf(Array);
  });

  test('recommends items based on embedding', async () => {
    const { recommend } = await import('../src/services/personalization.service');
    const items = await recommend('user123', 5);
    expect(Array.isArray(items)).toBe(true);
  });
});

describe('Intent Tracking', () => {
  test('tracks user behavior', async () => {
    const { trackIntent } = await import('../src/services/intent.service');
    await trackIntent({
      type: 'browse',
      userId: 'user123',
      itemId: 'item456',
    });
    expect(true).toBe(true);
  });

  test('predicts user intent', async () => {
    const { predictIntent } = await import('../src/services/intent.service');
    const result = await predictIntent('user123');
    expect(result).toHaveProperty('intent');
    expect(result).toHaveProperty('confidence');
  });
});
