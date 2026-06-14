/**
 * useOffersPage Hook Tests
 */

interface Offer {
  id: string;
  title: string;
  discount: number;
  category: string;
  page: number;
}

function paginateOffers(offers: Offer[], page: number, pageSize: number): Offer[] {
  const start = (page - 1) * pageSize;
  return offers.slice(start, start + pageSize);
}

function filterOffers(offers: Offer[], category: string): Offer[] {
  if (!category) return offers;
  return offers.filter((o) => o.category === category);
}

const mockOffers: Offer[] = [
  { id: '1', title: 'Summer Sale', discount: 20, category: 'fashion', page: 1 },
  { id: '2', title: 'Tech Deals', discount: 15, category: 'electronics', page: 1 },
  { id: '3', title: 'Food Offers', discount: 10, category: 'food', page: 1 },
  { id: '4', title: 'Beauty Deals', discount: 25, category: 'beauty', page: 2 },
];

describe('useOffersPage', () => {
  it('should fetch offers with pagination', () => {
    const page1 = paginateOffers(mockOffers, 1, 3);
    expect(page1).toHaveLength(3);
    expect(page1[0].id).toBe('1');
    expect(page1[2].id).toBe('3');

    const page2 = paginateOffers(mockOffers, 2, 3);
    expect(page2).toHaveLength(1);
    expect(page2[0].id).toBe('4');
  });

  it('should apply filters to offers', () => {
    const fashionOffers = filterOffers(mockOffers, 'fashion');
    expect(fashionOffers).toHaveLength(1);
    expect(fashionOffers[0].title).toBe('Summer Sale');
    expect(fashionOffers[0].category).toBe('fashion');

    const allOffers = filterOffers(mockOffers, '');
    expect(allOffers).toHaveLength(mockOffers.length);
  });
});
