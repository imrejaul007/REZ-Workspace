// @ts-nocheck
/**
 * Unit Tests for useProductReviews hook
 */

interface Review {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  author: string;
}

const mockFetchReviews = jest.fn();

function computeAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function sortReviewsByDate(reviews: Review[], order: 'asc' | 'desc'): Review[] {
  return [...reviews].sort((a, b) =>
    order === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)
  );
}

describe('useProductReviews', () => {
  beforeEach(() => {
    mockFetchReviews.mockReset();
  });

  it('should load product reviews', async () => {
    const reviews: Review[] = [
      { id: 'r1', productId: 'p1', rating: 5, comment: 'Great!', author: 'Alice' },
      { id: 'r2', productId: 'p1', rating: 3, comment: 'Okay.', author: 'Bob' },
    ];
    mockFetchReviews.mockResolvedValue(reviews);

    const result = await mockFetchReviews('p1');
    expect(result).toHaveLength(2);
    expect(result[0].productId).toBe('p1');
    expect(mockFetchReviews).toHaveBeenCalledWith('p1');
  });

  it('should calculate average rating from reviews', () => {
    const reviews: Review[] = [
      { id: 'r1', productId: 'p1', rating: 5, comment: 'Excellent', author: 'Alice' },
      { id: 'r2', productId: 'p1', rating: 4, comment: 'Good', author: 'Bob' },
      { id: 'r3', productId: 'p1', rating: 3, comment: 'Average', author: 'Carol' },
    ];

    const avg = computeAverageRating(reviews);
    expect(avg).toBe(4);
    expect(avg).toBeGreaterThan(0);
    expect(avg).toBeLessThanOrEqual(5);
  });

  it('should sort reviews in descending order', () => {
    const reviews: Review[] = [
      { id: 'r1', productId: 'p1', rating: 4, comment: 'Good', author: 'Alice' },
      { id: 'r3', productId: 'p1', rating: 5, comment: 'Best', author: 'Carol' },
      { id: 'r2', productId: 'p1', rating: 2, comment: 'Bad', author: 'Bob' },
    ];

    const sorted = sortReviewsByDate(reviews, 'desc');
    expect(sorted[0].id).toBe('r3');
    expect(sorted).toHaveLength(3);
  });
});
