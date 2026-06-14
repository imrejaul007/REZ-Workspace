'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import InventoryManagement from '@/components/inventory/inventory-management';
import { useAuth } from '@/lib/auth/auth-provider';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<unknown[]>([]);
  const [movements, setMovements] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restaurantId = user?.restaurant?.id;

  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const [batchRes, movRes] = await Promise.all([
        apiFetch<unknown[]>(`/inventory/batches?restaurantId=${encodeURIComponent(restaurantId)}`),
        apiFetch<unknown[]>(`/inventory/movements?restaurantId=${encodeURIComponent(restaurantId)}&limit=50`),
      ]);

      // Normalise batches into the shape InventoryManagement expects
      const normalisedItems = (batchRes ?? []).map((batch) => ({
        id: batch.id,
        productId: batch.productId,
        name: batch.product?.name ?? 'Unknown',
        description: '',
        category: batch.product?.category?.name ?? 'Uncategorised',
        brand: '',
        sku: batch.product?.sku ?? '',
        barcode: '',
        images: [],
        pricing: {
          cost: batch.costPrice ?? batch.product?.costPrice ?? 0,
          sellingPrice: batch.product?.price ?? 0,
          margin: 0,
          currency: 'INR',
        },
        stock: {
          current: batch.quantity ?? 0,
          reserved: 0,
          available: batch.quantity ?? 0,
          unit: batch.product?.unit ?? 'units',
          location: '',
          minThreshold: batch.product?.minStock ?? 0,
          maxCapacity: batch.product?.maxStock ?? null,
        },
        supplier: batch.supplier
          ? { id: batch.supplier.id, name: batch.supplier.companyName ?? '', contact: '' }
          : null,
        status: (batch.quantity ?? 0) > 0 ? 'active' : 'out_of_stock',
        quality: {
          grade: '',
          expiryDate: batch.expiryDate ?? null,
          batchNumber: batch.batchNumber ?? '',
          certifications: [],
        },
        analytics: { demand: 'medium', velocity: 0, turnoverRate: 0, profitability: 'medium' },
        lastUpdated: batch.updatedAt,
        createdAt: batch.createdAt,
      }));

      const normalisedMovements = (movRes ?? []).map((m) => ({
        id: m.id,
        itemId: m.productId,
        type: (m.type ?? '').toLowerCase() as 'in' | 'out' | 'adjustment' | 'transfer',
        quantity: m.quantity,
        reason: m.reason ?? '',
        reference: m.referenceId ?? '',
        performedBy: m.createdBy ?? '',
        timestamp: m.createdAt,
        notes: '',
      }));

      setItems(normalisedItems);
      setMovements(normalisedMovements);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateItem = (updatedItem) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === updatedItem.id
          ? { ...updatedItem, lastUpdated: new Date().toISOString() }
          : item,
      ),
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleStockMovement = (movement) => {
    const newMovement = { ...movement, id: Date.now().toString(), timestamp: new Date().toISOString() };
    setMovements((prev) => [newMovement, ...prev]);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== movement.itemId) return item;
        let newStock = item.stock.current;
        if (movement.type === 'in') newStock += movement.quantity;
        else if (movement.type === 'out') newStock = Math.max(0, newStock - movement.quantity);
        else if (movement.type === 'adjustment') newStock = Math.max(0, newStock + movement.quantity);
        return {
          ...item,
          stock: { ...item.stock, current: newStock, available: newStock - item.stock.reserved },
          status: newStock === 0 ? 'out_of_stock' : 'active',
          lastUpdated: new Date().toISOString(),
        };
      }),
    );
  };

  const handleReorder = (itemId: string, quantity: number) => {
    console.log(`Reorder request: item ${itemId}, qty ${quantity}`);
  };

  if (!restaurantId && !loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-64 text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">No restaurant linked</p>
          <p className="text-muted-foreground text-sm">
            Your account is not associated with a restaurant. Contact support if this is unexpected.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-64 text-center space-y-3">
          <p className="text-lg font-semibold text-destructive">Failed to load inventory</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <InventoryManagement
        items={items}
        movements={movements}
        userRole={(user?.role as unknown) || 'restaurant'}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onStockMovement={handleStockMovement}
        onReorder={handleReorder}
      />
    </DashboardLayout>
  );
}
