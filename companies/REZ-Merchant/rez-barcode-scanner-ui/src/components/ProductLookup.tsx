import React, { useState, useCallback } from 'react';
import { Product } from '../types';
import { formatBarcodeDisplay } from '../utils/formats';

export interface ProductLookupProps {
  barcode: string;
  onProduct: (product: Product) => void;
  onNotFound: () => void;
  onError?: (error: Error) => void;
  onLoading?: (loading: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface ProductLookupState {
  loading: boolean;
  product: Product | null;
  error: Error | null;
  notFound: boolean;
}

const ProductLookup: React.FC<ProductLookupProps> = ({
  barcode,
  onProduct,
  onNotFound,
  onError,
  onLoading,
  className = '',
  style,
}) => {
  const [state, setState] = useState<ProductLookupState>({
    loading: false,
    product: null,
    error: null,
    notFound: false,
  });

  // Mock API call - replace with actual API
  const lookupProduct = useCallback(
    async (barcodeValue: string) => {
      if (!barcodeValue) return;

      setState({ loading: true, product: null, error: null, notFound: false });
      onLoading?.(true);

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock product data - replace with actual API call
        const mockProducts: Record<string, Product> = {
          '5901234123457': {
            id: '1',
            barcode: '5901234123457',
            name: 'Organic Whole Milk 1L',
            description: 'Fresh organic whole milk from grass-fed cows',
            price: 4.99,
            cost: 2.50,
            quantity: 50,
            sku: 'MILK-ORG-1L',
            category: 'Dairy',
            lowStockThreshold: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          '4006381333931': {
            id: '2',
            barcode: '4006381333931',
            name: 'Sourdough Bread Loaf',
            description: 'Artisan sourdough bread, freshly baked daily',
            price: 5.49,
            cost: 1.80,
            quantity: 12,
            sku: 'BREAD-SOUR-500',
            category: 'Bakery',
            lowStockThreshold: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          '0012345678905': {
            id: '3',
            barcode: '0012345678905',
            name: 'Free Range Eggs (12 pack)',
            description: 'Farm fresh free range eggs',
            price: 6.99,
            cost: 3.00,
            quantity: 3,
            sku: 'EGGS-FR-12',
            category: 'Eggs',
            lowStockThreshold: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };

        const product = mockProducts[barcodeValue];

        if (product) {
          setState({ loading: false, product, error: null, notFound: false });
          onProduct(product);
        } else {
          setState({ loading: false, product: null, error: null, notFound: true });
          onNotFound();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to lookup product');
        setState({ loading: false, product: null, error, notFound: false });
        onError?.(error);
      } finally {
        onLoading?.(false);
      }
    },
    [onProduct, onNotFound, onError, onLoading]
  );

  // Trigger lookup when barcode changes
  React.useEffect(() => {
    if (barcode) {
      lookupProduct(barcode);
    }
  }, [barcode, lookupProduct]);

  const isLowStock = state.product && state.product.quantity <= (state.product.lowStockThreshold || 5);
  const isOutOfStock = state.product && state.product.quantity === 0;

  return (
    <div className={`product-lookup ${className}`} style={style}>
      {/* Loading state */}
      {state.loading && (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e0e0e0',
              borderTopColor: '#4CAF50',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ margin: 0, color: '#666' }}>Looking up product...</p>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#999' }}>
            Barcode: {formatBarcodeDisplay(barcode)}
          </p>
        </div>
      )}

      {/* Product found */}
      {state.product && !state.loading && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            {/* Product image */}
            <div
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {state.product.imageUrl ? (
                <img
                  src={state.product.imageUrl}
                  alt={state.product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                />
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#bdbdbd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              )}
            </div>

            {/* Product info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  margin: '0 0 4px',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#212121',
                }}
              >
                {state.product.name}
              </h3>
              {state.product.sku && (
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#757575' }}>
                  SKU: {state.product.sku}
                </p>
              )}
              <p style={{ margin: 0, fontSize: '13px', color: '#757575' }}>
                Barcode: {formatBarcodeDisplay(state.product.barcode)}
              </p>
            </div>
          </div>

          {/* Description */}
          {state.product.description && (
            <p
              style={{
                margin: '0 0 16px',
                fontSize: '14px',
                color: '#616161',
                lineHeight: 1.5,
              }}
            >
              {state.product.description}
            </p>
          )}

          {/* Details grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            {/* Price */}
            <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9e9e9e' }}>Price</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#4CAF50' }}>
                ${state.product.price.toFixed(2)}
              </p>
            </div>

            {/* Stock */}
            <div
              style={{
                padding: '12px',
                backgroundColor: isOutOfStock ? '#ffebee' : isLowStock ? '#fff8e1' : '#f1f8e9',
                borderRadius: '8px',
              }}
            >
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9e9e9e' }}>In Stock</p>
              <p
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: isOutOfStock ? '#d32f2f' : isLowStock ? '#f57c00' : '#388e3c',
                }}
              >
                {state.product.quantity}
                {isOutOfStock && ' (OUT)'}
                {isLowStock && !isOutOfStock && ' (LOW)'}
              </p>
            </div>

            {/* Category */}
            {state.product.category && (
              <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9e9e9e' }}>Category</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#424242' }}>
                  {state.product.category}
                </p>
              </div>
            )}

            {/* Cost */}
            {state.product.cost && (
              <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9e9e9e' }}>Cost</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#424242' }}>
                  ${state.product.cost.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Margin indicator */}
          {state.product.cost && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
                marginBottom: '16px',
              }}
            >
              <p style={{ margin: 0, fontSize: '13px', color: '#616161' }}>
                <strong>Margin:</strong>{' '}
                {((state.product.price - state.product.cost) / state.product.price * 100).toFixed(1)}%
                {' '}(${(state.product.price - state.product.cost).toFixed(2)})
              </p>
            </div>
          )}
        </div>
      )}

      {/* Not found state */}
      {state.notFound && !state.loading && (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            backgroundColor: '#fff3e0',
            border: '1px solid #ffb74d',
            borderRadius: '12px',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f57c00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: '12px' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h4 style={{ margin: '0 0 8px', color: '#e65100' }}>Product Not Found</h4>
          <p style={{ margin: '0 0 12px', color: '#bf360c' }}>
            Barcode: {formatBarcodeDisplay(barcode)}
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#6d4c41' }}>
            This product is not in the database. You can add it manually.
          </p>
        </div>
      )}

      {/* Error state */}
      {state.error && !state.loading && (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            backgroundColor: '#ffebee',
            border: '1px solid #ef5350',
            borderRadius: '12px',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d32f2f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: '12px' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h4 style={{ margin: '0 0 8px', color: '#c62828' }}>Lookup Failed</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#b71c1c' }}>
            {state.error.message}
          </p>
        </div>
      )}

      {/* CSS animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ProductLookup;
