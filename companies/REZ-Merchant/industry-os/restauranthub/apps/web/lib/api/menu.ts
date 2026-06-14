const _menu_raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE = _menu_raw.includes('/api/v1') ? _menu_raw : `${_menu_raw.replace(/\/$/, '')}/api/v1`;

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  image?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { menuItems: number };
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number;
  isAvailable: boolean;
  preparationTime?: number;
  calories?: number;
  allergens: string[];
  tags: string[];
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
}

export interface CreateMenuCategoryPayload {
  name: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateMenuCategoryPayload extends Partial<CreateMenuCategoryPayload> {}

export interface CreateMenuItemPayload {
  name: string;
  categoryId: string;
  description?: string;
  image?: string;
  basePrice: number;
  isAvailable?: boolean;
  preparationTime?: number;
  calories?: number;
  allergens?: string[];
  tags?: string[];
  displayOrder?: number;
}

export interface UpdateMenuItemPayload extends Partial<CreateMenuItemPayload> {}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Category API ─────────────────────────────────────────────────────────────

export const menuApi = {
  getCategories(): Promise<MenuCategory[]> {
    return apiFetch<MenuCategory[]>('/menu/categories');
  },

  createCategory(payload: CreateMenuCategoryPayload): Promise<MenuCategory> {
    return apiFetch<MenuCategory>('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCategory(id: string, payload: UpdateMenuCategoryPayload): Promise<MenuCategory> {
    return apiFetch<MenuCategory>(`/menu/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteCategory(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/menu/categories/${id}`, { method: 'DELETE' });
  },

  // ─── Item API ───────────────────────────────────────────────────────────────

  getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
    return apiFetch<MenuItem[]>(`/menu/items${qs}`);
  },

  getMenuItem(id: string): Promise<MenuItem> {
    return apiFetch<MenuItem>(`/menu/items/${id}`);
  },

  createMenuItem(payload: CreateMenuItemPayload): Promise<MenuItem> {
    return apiFetch<MenuItem>('/menu/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateMenuItem(id: string, payload: UpdateMenuItemPayload): Promise<MenuItem> {
    return apiFetch<MenuItem>(`/menu/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteMenuItem(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/menu/items/${id}`, { method: 'DELETE' });
  },

  toggleAvailability(id: string): Promise<{ id: string; name: string; isAvailable: boolean }> {
    return apiFetch<{ id: string; name: string; isAvailable: boolean }>(
      `/menu/items/${id}/toggle-availability`,
      { method: 'PATCH' },
    );
  },
};
