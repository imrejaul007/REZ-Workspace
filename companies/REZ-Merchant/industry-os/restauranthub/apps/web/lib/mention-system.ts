import { mockVendors, mockProducts, allMarketplaceData } from '@/data/marketplace-data';

export interface MentionItem {
  id: string;
  name: string;
  type: 'vendor' | 'product' | 'service';
  category?: string;
  rating?: number;
  price?: number;
  unit?: string;
  description?: string;
  avatar?: string;
  verified?: boolean;
}

export interface MentionMatch {
  type: 'vendor' | 'product' | 'service';
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
  originalText: string;
}

/**
 * Get all mentionable items from marketplace
 */
export function getAllMentionableItems(): MentionItem[] {
  const items: MentionItem[] = [];
  
  try {
    // Add vendors
    if (allMarketplaceData?.vendors) {
      allMarketplaceData.vendors.forEach(vendor => {
        if (vendor?.id && (vendor as unknown)?.name) {
          items.push({
            id: vendor.id,
            name: (vendor as unknown).name,
            type: 'vendor',
            category: vendor.category || 'general',
            rating: vendor.rating || 0,
            description: vendor.description || '',
            avatar: vendor.logo || '',
            verified: (vendor as unknown).certifications ? (vendor as unknown).certifications.length > 0 : false
          });
        }
      });
    }
    
    // Add products
    if (allMarketplaceData?.products) {
      allMarketplaceData.products.forEach(product => {
        if (product?.id && product?.name) {
          items.push({
            id: product.id,
            name: product.name,
            type: 'product',
            category: product.category || 'general',
            price: product.price || 0,
            unit: (product as unknown).unit || 'unit',
            description: product.description || '',
            avatar: product.images?.[0] || '',
            verified: (product as unknown).inStock || false
          });
        }
      });
    }
  } catch (error) {
    console.error('Error getting mentionable items:', error);
  }
  
  return items;
}

/**
 * Search mentionable items by query
 */
export function searchMentionableItems(query: string, limit: number = 10): MentionItem[] {
  if (!query || query.length < 1) return [];
  
  const allItems = getAllMentionableItems();
  const searchTerm = query?.toLowerCase()?.trim() || '';
  
  if (!searchTerm) return [];
  
  // Prioritize exact matches, then partial matches
  const exactMatches = allItems.filter(item => 
    item?.name?.toLowerCase()?.startsWith(searchTerm)
  );
  
  const partialMatches = allItems.filter(item => 
    !item?.name?.toLowerCase()?.startsWith(searchTerm) && 
    item?.name?.toLowerCase()?.includes(searchTerm)
  );
  
  const categoryMatches = allItems.filter(item => 
    !item?.name?.toLowerCase()?.includes(searchTerm) && 
    item?.category?.toLowerCase()?.includes(searchTerm)
  );
  
  return [...exactMatches, ...partialMatches, ...categoryMatches]
    .slice(0, limit);
}

/**
 * Detect mentions in text content
 * Supports: @VendorName, #ProductName, $ServiceName
 */
export function detectMentions(content: string): MentionMatch[] {
  if (!content || typeof content !== 'string') return [];
  
  const mentions: MentionMatch[] = [];
  const allItems = getAllMentionableItems();
  
  // Create a map for quick lookup
  const itemMap = new Map<string, MentionItem>();
  allItems.forEach(item => {
    if (item?.name) {
      itemMap.set(item.name.toLowerCase(), item);
    }
  });
  
  // Pattern for @VendorName, #ProductName, $ServiceName
  const mentionPattern = /[@#$]([A-Za-z0-9\s\-&'.()]+?)(?=\s|$|[^\w\s\-&'.()])/g;
  
  let match;
  while ((match = mentionPattern.exec(content)) !== null) {
    const fullMatch = match[0]; // @VendorName
    const nameOnly = match[1].trim(); // VendorName
    const startIndex = match.index;
    const endIndex = match.index + fullMatch.length;
    const mentionType = fullMatch[0]; // @, #, or $
    
    // Find the item in our data
    const item = itemMap.get(nameOnly?.toLowerCase() || '');
    if (item && nameOnly) {
      // Determine mention type based on symbol and item type
      let type: 'vendor' | 'product' | 'service' = 'vendor';
      if (mentionType === '#') type = 'product';
      if (mentionType === '$') type = 'service';
      
      mentions.push({
        type,
        id: item.id,
        name: item.name,
        startIndex,
        endIndex,
        originalText: fullMatch
      });
    }
  }
  
  return mentions;
}

/**
 * Replace mentions in content with clickable elements for rendering
 */
export function processMentionsForDisplay(content: string): {
  processedContent: string;
  mentions: MentionMatch[];
} {
  const mentions = detectMentions(content);
  let processedContent = content;
  
  // Process mentions in reverse order to maintain correct indices
  mentions.reverse().forEach(mention => {
    const replacement = `<mention data-type="${mention.type}" data-id="${mention.id}" data-name="${mention.name}">${mention.originalText}</mention>`;
    processedContent = 
      processedContent.slice(0, mention.startIndex) + 
      replacement + 
      processedContent.slice(mention.endIndex);
  });
  
  return {
    processedContent,
    mentions: mentions.reverse() // Restore original order
  };
}

/**
 * Get mention item by ID and type
 */
export function getMentionItemById(id: string, type: 'vendor' | 'product' | 'service'): MentionItem | null {
  const allItems = getAllMentionableItems();
  return allItems.find(item => item.id === id && item.type === type) || null;
}

/**
 * Generate marketplace URL for mention
 */
export function getMentionMarketplaceUrl(mention: MentionMatch): string {
  const { type, id, name } = mention;
  
  switch (type) {
    case 'vendor':
      return `/marketplace?tab=vendors&search=${encodeURIComponent(name)}`;
    case 'product':
      return `/marketplace?tab=products&search=${encodeURIComponent(name)}`;
    case 'service':
      return `/marketplace?tab=vendors&search=${encodeURIComponent(name)}&category=services`;
    default:
      return `/marketplace?search=${encodeURIComponent(name)}`;
  }
}

/**
 * Validate mentions in content before posting
 */
export function validateMentions(content: string): {
  isValid: boolean;
  invalidMentions: string[];
  validMentions: MentionMatch[];
} {
  const mentions = detectMentions(content);
  const allItems = getAllMentionableItems();
  const itemNames = new Set(allItems.map(item => item?.name?.toLowerCase()).filter(Boolean));
  
  const validMentions = mentions.filter(mention => 
    mention?.name && itemNames.has(mention.name.toLowerCase())
  );
  
  const invalidMentions = mentions
    .filter(mention => !mention?.name || !itemNames.has(mention.name.toLowerCase()))
    .map(mention => mention.originalText);
  
  return {
    isValid: invalidMentions.length === 0,
    invalidMentions,
    validMentions
  };
}

/**
 * Extract plain text mentions for tags (backward compatibility)
 */
export function extractMentionsAsTags(content: string): string[] {
  const mentions = detectMentions(content);
  return mentions
    .filter(mention => mention?.name)
    .map(mention => mention.name.toLowerCase().replace(/\s+/g, '-'));
}