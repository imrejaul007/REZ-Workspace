import { getUICopy } from '@/lib/utils/storeType';
import { StoreType } from '@/lib/types';

const ALL_STORE_TYPES: StoreType[] = [
  'restaurant',
  'cafe',
  'cloud_kitchen',
  'retail',
  'salon',
  'hotel',
  'service',
  'general',
];

const COPY_KEYS = [
  'addToCartLabel',
  'orderConfirmMessage',
  'preparingMessage',
  'readyMessage',
  'itemLabel',
  'categoryLabel',
] as const;

// ── All store types return complete, non-empty copy ───────────────────────────

describe('getUICopy — completeness', () => {
  it.each(ALL_STORE_TYPES)(
    '%s: returns non-empty strings for all required keys',
    (storeType) => {
      const copy = getUICopy(storeType);
      for (const key of COPY_KEYS) {
        expect(typeof copy[key]).toBe('string');
        expect(copy[key].length).toBeGreaterThan(0);
      }
    },
  );
});

// ── Specific copy values for each store type ─────────────────────────────────

describe('getUICopy — restaurant', () => {
  it('returns "Add" as addToCartLabel', () => {
    expect(getUICopy('restaurant').addToCartLabel).toBe('Add');
  });

  it('uses "dish" as itemLabel', () => {
    expect(getUICopy('restaurant').itemLabel).toBe('dish');
  });

  it('uses food-specific preparing message', () => {
    expect(getUICopy('restaurant').preparingMessage).toBe('Your food is being prepared');
  });

  it('uses food-specific ready message', () => {
    expect(getUICopy('restaurant').readyMessage).toBe('Your food is ready!');
  });
});

describe('getUICopy — retail', () => {
  it('returns "Add to bag" as addToCartLabel (distinct from food stores)', () => {
    expect(getUICopy('retail').addToCartLabel).toBe('Add to bag');
  });

  it('uses "product" as itemLabel', () => {
    expect(getUICopy('retail').itemLabel).toBe('product');
  });
});

describe('getUICopy — salon', () => {
  it('returns "Book" as addToCartLabel', () => {
    expect(getUICopy('salon').addToCartLabel).toBe('Book');
  });

  it('uses "service" as itemLabel', () => {
    expect(getUICopy('salon').itemLabel).toBe('service');
  });

  it('uses "service type" as categoryLabel', () => {
    expect(getUICopy('salon').categoryLabel).toBe('service type');
  });

  it('returns appointment-specific confirm message', () => {
    expect(getUICopy('salon').orderConfirmMessage).toBe('Appointment confirmed!');
  });
});

describe('getUICopy — service', () => {
  it('returns "Select" as addToCartLabel', () => {
    expect(getUICopy('service').addToCartLabel).toBe('Select');
  });

  it('uses "service" as itemLabel', () => {
    expect(getUICopy('service').itemLabel).toBe('service');
  });
});

describe('getUICopy — cloud_kitchen', () => {
  it('returns "Add" as addToCartLabel', () => {
    expect(getUICopy('cloud_kitchen').addToCartLabel).toBe('Add');
  });

  it('uses packing-specific preparing message', () => {
    expect(getUICopy('cloud_kitchen').preparingMessage).toBe('Your order is being packed');
  });
});

describe('getUICopy — unknown/fallback', () => {
  it('falls back to "general" copy for an unknown store type', () => {
    // Cast to bypass TS type-safety to simulate runtime unknown value
    const copy = getUICopy('unknown_type' as StoreType);
    const generalCopy = getUICopy('general');
    expect(copy).toEqual(generalCopy);
  });

  it('general addToCartLabel is "Add"', () => {
    expect(getUICopy('general').addToCartLabel).toBe('Add');
  });
});
