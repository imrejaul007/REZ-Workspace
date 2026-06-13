import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

export interface Product {
  id: string;
  sku: string;
  gtin?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: string;
  category: string;
  subcategory?: string;
  tags: string[];
  pricing: ProductPricing;
  inventory: ProductInventory;
  media: ProductMedia;
  attributes: Record<string, string | number | boolean>;
  variants?: ProductVariant[];
  status: ProductStatus;
  visibility: 'hidden' | 'catalog' | 'search' | 'everywhere';
  metadata: ProductMetadata;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'draft' | 'active' | 'discontinued' | 'archived';

export interface ProductPricing {
  basePrice: number;
  currency: string;
  costPrice?: number;
  msrp?: number;
  wholesalePrice?: number;
  specialPrice?: PriceTier[];
  compareAtPrice?: number;
}

export interface PriceTier {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  discount?: number;
}

export interface ProductInventory {
  trackInventory: boolean;
  quantity: number;
  lowStockThreshold: number;
  outOfStockThreshold: number;
  backorderAllowed: boolean;
  preorderAllowed: boolean;
  preorderReleaseDate?: string;
  warehouseLocations: WarehouseStock[];
}

export interface WarehouseStock {
  warehouseId: string;
  location: string;
  quantity: number;
  reserved: number;
  available: number;
}

export interface ProductMedia {
  images: ProductImage[];
  videos?: ProductVideo[];
  documents?: ProductDocument[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  isPrimary: boolean;
  width?: number;
  height?: number;
}

export interface ProductVideo {
  id: string;
  url: string;
  thumbnail?: string;
  title: string;
  duration?: number;
}

export interface ProductDocument {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  price?: number;
  compareAtPrice?: number;
  quantity?: number;
  imageUrl?: string;
  attributes: Record<string, string>;
}

export interface ProductMetadata {
  weight?: number;
  weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
  dimensions?: ProductDimensions;
  warranty?: string;
  returnPolicy?: string;
  countryOfOrigin?: string;
  certifications?: string[];
  ecoRating?: number;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  categories: FacetBucket[];
  brands: FacetBucket[];
  priceRanges: FacetBucket[];
  tags: FacetBucket[];
}

export interface FacetBucket {
  key: string;
  label: string;
  count: number;
}

export const createProductSchema = {
  type: 'object',
  required: ['sku', 'name', 'slug', 'brand', 'category', 'pricing'],
  properties: {
    sku: { type: 'string', minLength: 3, maxLength: 50 },
    gtin: { type: 'string', pattern: '^[0-9]{8,14}$' },
    name: { type: 'string', minLength: 1, maxLength: 500 },
    slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
    description: { type: 'string' },
    shortDescription: { type: 'string', maxLength: 500 },
    brand: { type: 'string' },
    category: { type: 'string' },
    subcategory: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    pricing: {
      type: 'object',
      required: ['basePrice', 'currency'],
      properties: {
        basePrice: { type: 'number', minimum: 0 },
        currency: { type: 'string' },
        costPrice: { type: 'number', minimum: 0 },
        msrp: { type: 'number', minimum: 0 },
        wholesalePrice: { type: 'number', minimum: 0 },
        compareAtPrice: { type: 'number', minimum: 0 },
        specialPrice: { type: 'array' },
      },
    },
    inventory: {
      type: 'object',
      properties: {
        trackInventory: { type: 'boolean' },
        quantity: { type: 'number', minimum: 0 },
        lowStockThreshold: { type: 'number' },
        outOfStockThreshold: { type: 'number' },
        backorderAllowed: { type: 'boolean' },
        preorderAllowed: { type: 'boolean' },
      },
    },
    visibility: { type: 'string', enum: ['hidden', 'catalog', 'search', 'everywhere'] },
  },
  additionalProperties: true,
};

export const validateCreateProduct = ajv.compile(createProductSchema);
export const validateUpdateProduct = ajv.compile({
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 500 },
    slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
    description: { type: 'string' },
    shortDescription: { type: 'string', maxLength: 500 },
    tags: { type: 'array', items: { type: 'string' } },
    pricing: { type: 'object' },
    inventory: { type: 'object' },
    status: { type: 'string', enum: ['draft', 'active', 'discontinued', 'archived'] },
    visibility: { type: 'string', enum: ['hidden', 'catalog', 'search', 'everywhere'] },
    attributes: { type: 'object' },
    metadata: { type: 'object' },
  },
  additionalProperties: false,
});
