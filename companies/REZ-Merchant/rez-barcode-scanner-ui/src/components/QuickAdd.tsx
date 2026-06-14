import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Product } from '../types';
import { formatBarcodeDisplay } from '../utils/formats';

export interface QuickAddProps {
  product: Product;
  onAdd: (quantity: number) => void;
  onClose: () => void;
  maxQuantity?: number;
  className?: string;
  style?: React.CSSProperties;
}

const QuickAdd: React.FC<QuickAddProps> = ({
  product,
  onAdd,
  onClose,
  maxQuantity = 99,
  className = '',
  style,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate totals
  const subtotal = product.price * quantity;
  const totalStock = product.quantity;
  const effectiveMax = Math.min(maxQuantity, totalStock);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !isAdding) {
        handleAdd();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        incrementQuantity();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        decrementQuantity();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isAdding, quantity]);

  // Focus trap - click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const incrementQuantity = useCallback(() => {
    setQuantity((q) => Math.min(q + 1, effectiveMax));
  }, [effectiveMax]);

  const decrementQuantity = useCallback(() => {
    setQuantity((q) => Math.max(q - 1, 1));
  }, []);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= effectiveMax) {
      setQuantity(value);
    }
  }, [effectiveMax]);

  const handleAdd = useCallback(async () => {
    if (isAdding || quantity < 1) return;

    setIsAdding(true);
    try {
      await onAdd(quantity);
    } finally {
      setIsAdding(false);
    }
  }, [isAdding, quantity, onAdd]);

  const isLowStock = product.quantity <= (product.lowStockThreshold || 5);
  const isOutOfStock = product.quantity === 0;
  const wouldExceedStock = quantity > totalStock;

  return (
    <div
      className={`quick-add ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        ...style,
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#212121' }}>
            Quick Add
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: '#f5f5f5',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#757575"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Product info */}
        <div style={{ padding: '20px' }}>
          {/* Product header */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            {/* Product image */}
            <div
              style={{
                width: '72px',
                height: '72px',
                backgroundColor: '#f5f5f5',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px',
                  }}
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

            {/* Product details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  margin: '0 0 4px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#212121',
                  lineHeight: 1.3,
                }}
              >
                {product.name}
              </h4>
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: '14px',
                  color: '#4CAF50',
                  fontWeight: 600,
                }}
              >
                ${product.price.toFixed(2)}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9e9e9e' }}>
                SKU: {product.sku || 'N/A'}
              </p>
            </div>
          </div>

          {/* Stock warning */}
          {isOutOfStock ? (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#ffebee',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, color: '#d32f2f', fontWeight: 500 }}>
                Out of Stock
              </p>
            </div>
          ) : isLowStock ? (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#fff8e1',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, color: '#f57c00', fontWeight: 500 }}>
                Only {product.quantity} left in stock
              </p>
            </div>
          ) : null}

          {/* Quantity selector */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#424242',
              }}
            >
              Quantity
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px',
                backgroundColor: '#fafafa',
                borderRadius: '12px',
                border: wouldExceedStock ? '2px solid #d32f2f' : '2px solid transparent',
              }}
            >
              {/* Decrement button */}
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1 || isOutOfStock}
                style={{
                  width: '44px',
                  height: '44px',
                  border: 'none',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '10px',
                  cursor: quantity <= 1 || isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: quantity <= 1 || isOutOfStock ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#424242"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              {/* Quantity input */}
              <input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                disabled={isOutOfStock}
                min={1}
                max={effectiveMax}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#212121',
                  outline: 'none',
                }}
              />

              {/* Increment button */}
              <button
                onClick={incrementQuantity}
                disabled={quantity >= effectiveMax || isOutOfStock}
                style={{
                  width: '44px',
                  height: '44px',
                  border: 'none',
                  backgroundColor: '#4CAF50',
                  borderRadius: '10px',
                  cursor: quantity >= effectiveMax || isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: quantity >= effectiveMax || isOutOfStock ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            {/* Quick quantity buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {[1, 2, 5, 10].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(Math.min(q, effectiveMax))}
                  disabled={q > effectiveMax || isOutOfStock}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: quantity === Math.min(q, effectiveMax) ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                    backgroundColor: quantity === Math.min(q, effectiveMax) ? '#e8f5e9' : '#fff',
                    borderRadius: '8px',
                    cursor: q > effectiveMax || isOutOfStock ? 'not-allowed' : 'pointer',
                    opacity: q > effectiveMax || isOutOfStock ? 0.5 : 1,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#424242',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Stock info */}
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#9e9e9e', textAlign: 'center' }}>
              {totalStock} available
            </p>
          </div>

          {/* Total */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '12px',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#616161' }}>Subtotal</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#212121' }}>
              ${subtotal.toFixed(2)}
            </span>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={isAdding || isOutOfStock || wouldExceedStock}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: isOutOfStock ? '#bdbdbd' : '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isAdding || isOutOfStock || wouldExceedStock ? 'not-allowed' : 'pointer',
              opacity: isAdding ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isAdding ? (
              <>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Adding...
              </>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Add to Cart
              </>
            )}
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#fafafa',
            borderTop: '1px solid #e0e0e0',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '12px', color: '#9e9e9e' }}>
            Press <kbd style={kbdStyle}>Enter</kbd> to add,{' '}
            <kbd style={kbdStyle}>Esc</kbd> to close
          </p>
        </div>
      </div>

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

const kbdStyle: React.CSSProperties = {
  padding: '2px 6px',
  backgroundColor: '#e0e0e0',
  borderRadius: '4px',
  fontSize: '11px',
  fontFamily: 'monospace',
};

export default QuickAdd;
