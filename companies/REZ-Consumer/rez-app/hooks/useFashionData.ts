// @ts-nocheck
/**
 * Custom Hook for FashionPage Data
 * Handles all API calls, loading states, and error handling for the Fashion page
 */

import { useState, useEffect, useCallback } from 'react';
import storesApi from '@/services/storesApi';
import productsApi from '@/services/productsApi';
import categoriesApi from '@/services/categoriesApi';
import { logger } from '@/utils/logger';

// PERF-N7: Pre-compile the "is this a fashion product" detection.
// Original implementation ran 4 categoryName.includes() + 13 per-tag
// .includes() calls per product. For 100 products × ~10 tags each that's
// ~17k string scans on every fetch. A single compiled regex collapses
// all 17 substring checks into one PC-cached trie scan per call.
const FASHION_CATEGORY_NAME_RE = /fashion|clothing|apparel|beauty/i;
const FASHION_TAG_RE = /fashion|clothing|apparel|beauty|jacket|jeans|dress|shirt|shoe|sneaker|sunglasses|handbag|blazer/i;

export interface FashionStore {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  category;

  // Backend sends address separately from location (GeoJSON)
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };

  // GeoJSON location from backend
  location?: {
    type?: string;
    coordinates?: [number, number];
    // Legacy fields for compatibility
    address?: string;
    city?: string;
    state?: string;
  };

  ratings?: {
    average: number;
    count: number;
  };

  // Offers may not be present in all stores
  offers?: {
    cashback?: number;
    isPartner?: boolean;
    partnerLevel?: string;
  };

  // OperationalInfo may not be present
  operationalInfo?: {
    deliveryTime?: string;
    minimumOrder?: number;
  };

  isFeatured?: boolean;
  isActive?: boolean;

  deliveryCategories?: {
    fastDelivery?: boolean;
    premium?: boolean;
    budgetFriendly?: boolean;
  };

  // Additional fields from backend
  description?: string;
  shortDescription?: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  contact?: {
    phone?: string;
    email?: string;
  };
  businessHours?;
  subcategory?: string;
  subcategorySlug?: string;
}

export interface FashionProduct {
  // ID fields - API can return either 'id' or '_id'
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  title?: string; // API returns both 'name' and 'title'
  description?: string;
  brand?: string;
  type?: string; // API returns 'product' type
  
  // Image fields - API can return either 'image' (string) or 'images' (array)
  image?: string;
  images?: string[];
  
  // Price fields - API returns 'price' object with current/original
  price?: {
    current: number;
    original: number;
    currency: string;
    discount?: number;
  };
  
  // Fallback to 'pricing' for compatibility with some endpoints
  pricing?: {
    basePrice?: number;
    salePrice?: number;
    original?: number;
    selling?: number;
    discount?: number;
  };
  
  // Rating fields - API returns 'rating' (singular) with value and count
  rating?: {
    value: string | number;
    count: number;
  };
  
  // Fallback to 'ratings' for compatibility
  ratings?: {
    average: number;
    count: number;
  };
  
  // Additional API fields
  availabilityStatus?: string; // 'in_stock', 'out_of_stock', etc.
  isRecommended?: boolean;
  tags?: string[];
  
  cashback?: {
    percentage: number;
  };
  
  store?;
  category?;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface FashionCategory {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  image?: string;
  parent?;
  metadata?: {
    color?: string;
    tags?: string[];
    featured?: boolean;
  };
}

interface UseFashionDataResult {
  // Data
  featuredStores: FashionStore[];
  fashionStores: FashionStore[];
  featuredProducts: FashionProduct[];
  categories: FashionCategory[];
  
  // Loading states
  isLoadingStores: boolean;
  isLoadingProducts: boolean;
  isLoadingCategories: boolean;
  isLoading: boolean;
  
  // Error states
  storesError: Error | null;
  productsError: Error | null;
  categoriesError: Error | null;
  hasError: boolean;
  
  // Actions
  refetchStores: () => Promise<void>;
  refetchProducts: () => Promise<void>;
  refetchCategories: () => Promise<void>;
  refetchAll: () => Promise<void>;
}

export const useFashionData = (): UseFashionDataResult => {
  // Data states
  const [featuredStores, setFeaturedStores] = useState<FashionStore[]>([]);
  const [fashionStores, setFashionStores] = useState<FashionStore[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FashionProduct[]>([]);
  const [categories, setCategories] = useState<FashionCategory[]>([]);

  // Loading states
  const [isLoadingFeaturedStores, setIsLoadingFeaturedStores] = useState(true);
  const [isLoadingFashionStores, setIsLoadingFashionStores] = useState(true);
  const isLoadingStores = isLoadingFeaturedStores || isLoadingFashionStores;
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Error states
  const [storesError, setStoresError] = useState<Error | null>(null);
  const [productsError, setProductsError] = useState<Error | null>(null);
  const [categoriesError, setCategoriesError] = useState<Error | null>(null);

  // Fetch Featured Stores (FASHION ONLY)
  const fetchFeaturedStores = useCallback(async () => {
    try {
      setIsLoadingFeaturedStores(true);
      setStoresError(null);

      const response: unknown = await storesApi.getFeaturedStores(10);
      
      if (response.success && response.data) {
        // STRICT: Only show fashion stores
        const fashionStoresData = Array.isArray(response.data) 
          ? response.data.filter((store) => {
              const categoryName = store.category?.name?.toLowerCase() || '';
              const storeTags = store.tags || [];
              
              const isFashion = categoryName.includes('fashion') || 
                     categoryName.includes('clothing') || 
                     categoryName.includes('apparel') ||
                     categoryName.includes('beauty') ||
                     storeTags.some((tag: string) => {
                       const tagLower = tag.toLowerCase();
                       return tagLower.includes('fashion') || 
                              tagLower.includes('clothing') ||
                              tagLower.includes('apparel');
                     });
              
              if (isFashion) {
                logger.debug('✅ Fashion Store:', store.name);
              }
              
              return isFashion;
            })
          : [];
        
        logger.debug(`📦 Found ${fashionStoresData.length} fashion stores`);
        setFeaturedStores(fashionStoresData);
      }
    } catch (error) {
      logger.error('[FASHION DATA] Error fetching featured stores:', error);
      setStoresError(error as Error);
    } finally {
      setIsLoadingFeaturedStores(false);
    }
  }, []);

  // Fetch Fashion Stores (FASHION ONLY)
  const fetchFashionStores = useCallback(async () => {
    try {
      setIsLoadingFashionStores(true);
      setStoresError(null);

      const response: unknown = await storesApi.getStores({
        limit: 20,
        sort: 'rating'
      });
      
      if (response.success && response.data) {
        const storesData = response.data.stores || [];
        
        // STRICT: Only show fashion-related stores
        const fashionStoresData = storesData.filter((store) => {
          const categoryName = store.category?.name?.toLowerCase() || '';
          const tags = store.tags || [];
          
          const isFashion = categoryName.includes('fashion') || 
                 categoryName.includes('clothing') || 
                 categoryName.includes('apparel') ||
                 categoryName.includes('beauty') ||
                 tags.some((tag: string) => {
                   const tagLower = tag.toLowerCase();
                   return tagLower.includes('fashion') || 
                          tagLower.includes('clothing') ||
                          tagLower.includes('apparel');
                 });
          
          return isFashion;
        });
        
        logger.debug(`📦 Found ${fashionStoresData.length} fashion brands`);
        setFashionStores(fashionStoresData);
      }
    } catch (error) {
      logger.error('[FASHION DATA] Error fetching fashion stores:', error);
      setStoresError(error as Error);
    } finally {
      setIsLoadingFashionStores(false);
    }
  }, []);

  // Fetch Featured Products (FASHION ONLY)
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError(null);

      logger.debug('🔍 [FASHION DATA] Fetching featured products...');
      const response: unknown = await productsApi.getFeaturedProducts(20);
      
      logger.debug('📡 [FASHION DATA] API Response:', response);
      
      if (response.success && response.data) {
        logger.debug(`📦 [FASHION DATA] Total products received: ${response.data.length}`);
        
        // Log first product to see structure
        if (response.data.length > 0) {
          logger.debug('🔍 [FASHION DATA] Sample product:', {
            name: response.data[0].name,
            category: response.data[0].category,
            tags: response.data[0].tags,
          });
        }
        
        // STRICT: Only show fashion products
        // WARNING: This ID is environment-specific (MongoDB ObjectId) and will differ between
        // development, staging, and production databases. It should come from config or API instead.
        const FASHION_CATEGORY_ID = '68ecdb9f55f086b04de299ef';
        
        const fashionProductsData = Array.isArray(response.data)
          ? response.data.filter((product) => {
              // Handle both category object and category ID string
              let categoryId = '';
              let categoryName = '';

              if (typeof product.category === 'string') {
                categoryId = product.category;
              } else if (product.category && typeof product.category === 'object') {
                categoryId = product.category._id || product.category.id || '';
                categoryName = product.category.name?.toLowerCase() || '';
              }

              const productTags: string[] = product.tags || [];

              // PERF-N7: Collapsed 17 substring scans into 2 regex tests.
              // Per-product devLog removed from the hot path (the summary
              // log after the filter still shows total matches).
              const isFashion =
                categoryId === FASHION_CATEGORY_ID ||
                FASHION_CATEGORY_NAME_RE.test(categoryName) ||
                productTags.some((tag) => FASHION_TAG_RE.test(tag));

              return isFashion;
            })
          : [];
        
        logger.debug(`📦 [FASHION DATA] Found ${fashionProductsData.length} fashion products out of ${response.data.length} total`);
        setFeaturedProducts(fashionProductsData.slice(0, 10));
      } else {
        logger.debug('⚠️ [FASHION DATA] No products data in response');
      }
    } catch (error) {
      logger.error('❌ [FASHION DATA] Error fetching featured products:', error);
      setProductsError(error as Error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Fetch Fashion Categories AND Subcategories (FASHION ONLY)
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      setCategoriesError(null);

      logger.debug('🔍 [FASHION DATA] Fetching all categories...');
      const response: unknown = await categoriesApi.getCategories();
      
      if (response.success && response.data) {
        logger.debug(`📦 [FASHION DATA] Received ${response.data.length} total categories`);
        
        // First, find the main Fashion & Beauty category
        const mainFashionCategory = Array.isArray(response.data)
          ? response.data.find((cat) => cat.slug === 'fashion-beauty')
          : null;
        
        logger.debug('🎨 [FASHION DATA] Main fashion category:', mainFashionCategory?.name, mainFashionCategory?._id);
        
        if (!mainFashionCategory) {
          logger.debug('⚠️ [FASHION DATA] Fashion & Beauty category not found!');
          setCategories([]);
          return;
        }
        
        // STRICT FILTERING: Only show fashion subcategories
        const fashionCategories = Array.isArray(response.data)
          ? response.data.filter((category) => {
              // Skip the main fashion category itself
              if (category.slug === 'fashion-beauty' || category._id === mainFashionCategory._id) {
                return false;
              }
              
              const slug = category.slug?.toLowerCase() || '';
              const name = category.name?.toLowerCase() || '';
              const parentId = category.parent?._id || category.parent;
              const categoryId = category._id?.toString() || category.id?.toString();
              const mainFashionId = mainFashionCategory._id?.toString() || mainFashionCategory.id?.toString();
              
              // STRICT: Only show direct subcategories of Fashion & Beauty
              const isSubcategory = parentId?.toString() === mainFashionId || 
                                   categoryId === mainFashionId;
              
              // Fashion-specific slug patterns
              const isFashionSubcategory = [
                'mens-fashion',
                'womens-fashion', 
                'kids-fashion',
                'footwear',
                'accessories',
                'beauty-cosmetics',
                'men',
                'women',
                'kids',
                'children'
              ].some(pattern => slug.includes(pattern));
              
              // Fashion-related keywords in name
              const fashionKeywords = [
                'men', 'women', 'kid', 'child', 'footwear', 'shoe', 'accessory', 
                'beauty', 'cosmetic', 'fashion', 'clothing', 'apparel', 'wear'
              ];
              const hasFashionKeyword = fashionKeywords.some(keyword => 
                name.includes(keyword) || slug.includes(keyword)
              );
              
              // Check tags for fashion-related keywords
              const tags = category.metadata?.tags || category.tags || [];
              const hasFashionTag = tags.some((tag: string) => {
                const lowerTag = tag.toLowerCase();
                return fashionKeywords.some(keyword => lowerTag.includes(keyword));
              });
              
              // STRICT: Must be a subcategory AND have fashion-related content
              const isFashion = isSubcategory && (hasFashionKeyword || hasFashionTag || isFashionSubcategory);
              
              // EXCLUDE non-fashion categories explicitly
              const nonFashionKeywords = [
                'fruit', 'gift', 'grocery', 'meat', 'restaurant', 'food', 'dining',
                'electronic', 'tech', 'gadget', 'organic', 'medicine', 'pharmacy',
                'fleet', 'car', 'vehicle', 'rental'
              ];
              const isNonFashion = nonFashionKeywords.some(keyword => 
                name.includes(keyword) || slug.includes(keyword)
              );
              
              if (isNonFashion) {
                logger.debug(`   ❌ Excluding non-fashion category: ${category.name} (${slug})`);
                return false;
              }
              
              if (isFashion) {
                logger.debug(`   ✅ Fashion Subcategory: ${category.name} (${slug})`);
              }
              
              return isFashion; // Only show fashion subcategories
            })
          : [];
        
        logger.debug(`📦 [FASHION DATA] Found ${fashionCategories.length} fashion subcategories`);
        
        // Show up to 8 subcategories
        setCategories(fashionCategories.slice(0, 8));
      } else {
        logger.debug('⚠️ [FASHION DATA] No categories data in response');
        setCategories([]);
      }
    } catch (error) {
      logger.error('❌ [FASHION DATA] Error fetching categories:', error);
      setCategoriesError(error as Error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Refetch actions
  const refetchStores = useCallback(async () => {
    await Promise.all([
      fetchFeaturedStores(),
      fetchFashionStores()
    ]);
  }, [fetchFeaturedStores, fetchFashionStores]);

  const refetchProducts = useCallback(async () => {
    await fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  const refetchCategories = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchStores(),
      refetchProducts(),
      refetchCategories()
    ]);
  }, [refetchStores, refetchProducts, refetchCategories]);

  // Initial data fetch
  useEffect(() => {
    fetchFeaturedStores();
    fetchFashionStores();
    fetchFeaturedProducts();
    fetchCategories();
  }, [fetchFeaturedStores, fetchFashionStores, fetchFeaturedProducts, fetchCategories]);

  return {
    // Data
    featuredStores,
    fashionStores,
    featuredProducts,
    categories,
    
    // Loading states
    isLoadingStores,
    isLoadingProducts,
    isLoadingCategories,
    isLoading: isLoadingStores || isLoadingProducts || isLoadingCategories,
    
    // Error states
    storesError,
    productsError,
    categoriesError,
    hasError: !!(storesError || productsError || categoriesError),
    
    // Actions
    refetchStores,
    refetchProducts,
    refetchCategories,
    refetchAll,
  };
};

export default useFashionData;

