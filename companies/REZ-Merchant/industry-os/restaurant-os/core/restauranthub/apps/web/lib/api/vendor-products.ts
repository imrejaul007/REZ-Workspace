const _vp_raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE = _vp_raw.includes('/api/v1') ? _vp_raw : `${_vp_raw.replace(/\/$/, '')}/api/v1`;

export interface VendorProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  minOrderQty: number;
  maxOrderQty?: number;
  unit: string;
  tags: string[];
  discount?: number;
  status: 'active' | 'inactive' | 'pending';
  views: number;
  orders: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorStats {
  productCount: number;
  totalViews: number;
  pendingOrders: number;
  revenue: number;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  unit: string;
  stockQuantity: number;
  minOrderQty: number;
  maxOrderQty?: number;
  inStock?: boolean;
  tags?: string[];
  discount?: number;
  status?: 'active' | 'inactive' | 'pending';
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...getAuthHeaders(),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const vendorProductsApi = {
  listProducts(): Promise<VendorProduct[]> {
    return apiFetch<VendorProduct[]>('/vendor/products');
  },

  createProduct(payload: CreateProductPayload): Promise<VendorProduct> {
    return apiFetch<VendorProduct>('/vendor/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateProduct(id: string, payload: UpdateProductPayload): Promise<VendorProduct> {
    return apiFetch<VendorProduct>(`/vendor/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteProduct(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/vendor/products/${id}`, {
      method: 'DELETE',
    });
  },

  getStats(): Promise<VendorStats> {
    return apiFetch<VendorStats>('/vendor/stats');
  },
};
