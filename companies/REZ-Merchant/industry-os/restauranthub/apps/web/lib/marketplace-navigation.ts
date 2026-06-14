import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Navigate to marketplace with tag-based search
 * @param router Next.js router instance
 * @param tag The tag to search for
 * @param tab Optional marketplace tab to navigate to
 */
export function navigateToMarketplaceWithTag(
  router: AppRouterInstance,
  tag: string,
  tab?: 'vendors' | 'products' | 'restaurants' | 'subscriptions'
) {
  // Clean the tag (remove # if present)
  const cleanTag = tag.replace(/^#/, '');
  
  // Create URL with search parameters
  const searchParams = new URLSearchParams({
    search: cleanTag,
    ...(tab && { tab })
  });
  
  // Navigate to marketplace with search parameters
  router.push(`/marketplace?${searchParams.toString()}`);
}

/**
 * Get marketplace categories that match common community tags
 */
export const tagToMarketplaceMapping = {
  // Food & Ingredients
  'ingredients': { tab: 'products', category: 'ingredients' },
  'organic': { tab: 'products', category: 'ingredients' },
  'spices': { tab: 'products', category: 'ingredients' },
  'dairy': { tab: 'products', category: 'ingredients' },
  'meat': { tab: 'products', category: 'ingredients' },
  'seafood': { tab: 'products', category: 'ingredients' },
  'vegetables': { tab: 'products', category: 'ingredients' },
  'fruits': { tab: 'products', category: 'ingredients' },
  
  // Equipment
  'equipment': { tab: 'products', category: 'equipment' },
  'kitchen': { tab: 'products', category: 'equipment' },
  'appliances': { tab: 'products', category: 'equipment' },
  'cookware': { tab: 'products', category: 'equipment' },
  'tools': { tab: 'products', category: 'equipment' },
  
  // Services
  'cleaning': { tab: 'vendors', category: 'cleaning-maintenance' },
  'maintenance': { tab: 'vendors', category: 'cleaning-maintenance' },
  'marketing': { tab: 'vendors', category: 'business-services' },
  'accounting': { tab: 'vendors', category: 'business-services' },
  'delivery': { tab: 'vendors', category: 'delivery-logistics' },
  'logistics': { tab: 'vendors', category: 'delivery-logistics' },
  'pos': { tab: 'vendors', category: 'technology' },
  'software': { tab: 'vendors', category: 'technology' },
  'technology': { tab: 'vendors', category: 'technology' },
  
  // Real Estate
  'location': { tab: 'restaurants', category: null },
  'property': { tab: 'restaurants', category: null },
  'lease': { tab: 'restaurants', category: null },
  'rent': { tab: 'restaurants', category: null },
  'space': { tab: 'restaurants', category: null },
  
  // Subscriptions
  'subscription': { tab: 'subscriptions', category: null },
  'monthly': { tab: 'subscriptions', category: null },
  'weekly': { tab: 'subscriptions', category: null },
  'recurring': { tab: 'subscriptions', category: null }
} as const;

/**
 * Enhanced navigation that uses tag mapping for better targeting
 */
export function navigateToMarketplaceWithSmartTag(
  router: AppRouterInstance,
  tag: string
) {
  const cleanTag = tag.toLowerCase().replace(/^#/, '');
  const mapping = tagToMarketplaceMapping[cleanTag as keyof typeof tagToMarketplaceMapping];
  
  if (mapping) {
    const searchParams = new URLSearchParams({
      search: cleanTag,
      tab: mapping.tab,
      ...(mapping.category && { category: mapping.category })
    });
    
    router.push(`/marketplace?${searchParams.toString()}`);
  } else {
    // Default to general search across all tabs
    navigateToMarketplaceWithTag(router, tag);
  }
}