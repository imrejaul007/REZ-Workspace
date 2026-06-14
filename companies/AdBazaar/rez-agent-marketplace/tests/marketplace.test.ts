import { describe, it, expect, beforeEach } from 'vitest';
import {
  agents,
  categories,
  getAgentById,
  getAgentsByCategory,
  getCategoryBySlug,
  searchAgents,
  getFeaturedAgents,
  getTopRatedAgents,
  getFreeAgents,
} from '../src/data/agents';

describe('Agent Data', () => {
  it('should have agents defined', () => {
    expect(agents).toBeDefined();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
  });

  it('should have categories defined', () => {
    expect(categories).toBeDefined();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it('each agent should have required fields', () => {
    agents.forEach(agent => {
      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.category).toBeDefined();
      expect(agent.description).toBeDefined();
      expect(agent.icon).toBeDefined();
      expect(agent.capabilities).toBeDefined();
      expect(Array.isArray(agent.capabilities)).toBe(true);
      expect(agent.price).toBeGreaterThanOrEqual(0);
      expect(agent.rating).toBeGreaterThanOrEqual(0);
      expect(agent.rating).toBeLessThanOrEqual(5);
      expect(agent.installCount).toBeGreaterThanOrEqual(0);
      expect(agent.features).toBeDefined();
      expect(agent.pricingPlans).toBeDefined();
      expect(agent.integrations).toBeDefined();
    });
  });

  it('each pricing plan should have required fields', () => {
    agents.forEach(agent => {
      agent.pricingPlans.forEach(plan => {
        expect(plan.id).toBeDefined();
        expect(plan.name).toBeDefined();
        expect(plan.price).toBeGreaterThanOrEqual(0);
        expect(plan.period).toMatch(/^(month|year|one-time)$/);
        expect(plan.features).toBeDefined();
        expect(Array.isArray(plan.features)).toBe(true);
      });
    });
  });
});

describe('getAgentById', () => {
  it('should return agent when found', () => {
    const agent = getAgentById('restaurant-optimizer');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('restaurant-optimizer');
  });

  it('should return undefined when not found', () => {
    const agent = getAgentById('non-existent-agent');
    expect(agent).toBeUndefined();
  });
});

describe('getAgentsByCategory', () => {
  it('should return agents for valid category', () => {
    const restaurantAgents = getAgentsByCategory('restaurant-food');
    expect(Array.isArray(restaurantAgents)).toBe(true);
    expect(restaurantAgents.length).toBeGreaterThan(0);
    restaurantAgents.forEach(agent => {
      expect(agent.categorySlug).toBe('restaurant-food');
    });
  });

  it('should return empty array for non-existent category', () => {
    const agents = getAgentsByCategory('non-existent');
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBe(0);
  });
});

describe('getCategoryBySlug', () => {
  it('should return category when found', () => {
    const category = getCategoryBySlug('restaurant-food');
    expect(category).toBeDefined();
    expect(category?.slug).toBe('restaurant-food');
  });

  it('should return undefined when not found', () => {
    const category = getCategoryBySlug('non-existent');
    expect(category).toBeUndefined();
  });
});

describe('searchAgents', () => {
  it('should find agents by name', () => {
    const results = searchAgents('Restaurant');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should find agents by capability', () => {
    const results = searchAgents('inventory');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return empty for no matches', () => {
    const results = searchAgents('xyzabc123');
    expect(results.length).toBe(0);
  });

  it('should be case insensitive', () => {
    const results1 = searchAgents('RESTAURANT');
    const results2 = searchAgents('restaurant');
    expect(results1.length).toBe(results2.length);
  });
});

describe('getFeaturedAgents', () => {
  it('should return agents sorted by install count', () => {
    const featured = getFeaturedAgents();
    expect(featured.length).toBeLessThanOrEqual(6);
    for (let i = 0; i < featured.length - 1; i++) {
      expect(featured[i].installCount).toBeGreaterThanOrEqual(featured[i + 1].installCount);
    }
  });
});

describe('getTopRatedAgents', () => {
  it('should return agents sorted by rating', () => {
    const topRated = getTopRatedAgents();
    expect(topRated.length).toBeLessThanOrEqual(6);
    for (let i = 0; i < topRated.length - 1; i++) {
      expect(topRated[i].rating).toBeGreaterThanOrEqual(topRated[i + 1].rating);
    }
  });
});

describe('getFreeAgents', () => {
  it('should only return agents with price 0', () => {
    const freeAgents = getFreeAgents();
    freeAgents.forEach(agent => {
      expect(agent.price).toBe(0);
    });
  });
});

describe('Categories', () => {
  it('each category should have required fields', () => {
    categories.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.name).toBeDefined();
      expect(category.slug).toBeDefined();
      expect(category.icon).toBeDefined();
      expect(category.description).toBeDefined();
      expect(category.agentCount).toBeGreaterThan(0);
    });
  });

  it('category slugs should be unique', () => {
    const slugs = categories.map(c => c.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });
});
