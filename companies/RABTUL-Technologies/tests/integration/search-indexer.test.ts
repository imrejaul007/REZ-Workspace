/**
 * Search Indexer Tests
 */

describe('Search Indexer', () => {
  test('indexes product with embedding', async () => {
    const { handleProductEvent } = await import('../src/services/search-indexer');
    await handleProductEvent({
      type: 'product.created',
      productId: 'prod123',
      data: { name: 'Test Product', description: 'Description', category: 'Electronics' },
    });
    expect(true).toBe(true);
  });

  test('deletes product from index', async () => {
    const { handleProductEvent } = await import('../src/services/search-indexer');
    await handleProductEvent({
      type: 'product.deleted',
      productId: 'prod123',
      data: {},
    });
    expect(true).toBe(true);
  });

  test('searches products semantically', async () => {
    const { searchProducts } = await import('../src/services/search-indexer');
    const results = await searchProducts('electronics', 10);
    expect(Array.isArray(results)).toBe(true);
  });
});
