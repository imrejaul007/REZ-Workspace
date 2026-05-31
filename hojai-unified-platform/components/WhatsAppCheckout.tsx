/**
 * WhatsApp Checkout Component
 *
 * Drop-in React component for WhatsApp-based checkout flow
 */

'use client';

import React, { useState, useEffect } from 'react';

// Types
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Cart {
  cartId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
}

interface WhatsAppCheckoutProps {
  apiUrl: string;
  tenantId: string;
  customer: Customer;
  initialItems?: CartItem[];
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export default function WhatsAppCheckout({
  apiUrl,
  tenantId,
  customer,
  initialItems = [],
  onSuccess,
  onError
}: WhatsAppCheckoutProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'cart' | 'address' | 'payment' | 'success'>('cart');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  // Create cart on mount
  useEffect(() => {
    if (initialItems.length > 0) {
      createCart(initialItems);
    }
  }, []);

  async function createCart(items: CartItem[]) {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId
        },
        body: JSON.stringify({
          sessionId: `whatsapp_${customer.id}`,
          customer,
          items
        })
      });

      const data = await response.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (error) {
      onError?.('Failed to create cart');
    } finally {
      setLoading(false);
    }
  }

  async function addItem(item: CartItem) {
    if (!cart) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/cart/${cart.cartId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      const data = await response.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (error) {
      onError?.('Failed to add item');
    } finally {
      setLoading(false);
    }
  }

  async function checkout() {
    if (!cart) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/cart/${cart.cartId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress,
          paymentMethod
        })
      });
      const data = await response.json();
      if (data.success) {
        setOrderId(data.data.orderId);
        setStep('success');

        // Get payment link if UPI
        if (paymentMethod === 'upi') {
          const payResponse = await fetch(`${apiUrl}/api/orders/${data.data.orderId}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerPhone: customer.phone })
          });
          const payData = await payResponse.json();
          if (payData.success) {
            setPaymentLink(payData.data.paymentLink);
          }
        }

        onSuccess?.(data.data.orderId);
      }
    } catch (error) {
      onError?.('Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  // Render
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.channel}>💬 WhatsApp Checkout</span>
      </div>

      {/* Steps */}
      {step === 'cart' && (
        <CartStep
          cart={cart}
          onAddItem={addItem}
          onProceed={() => setStep('address')}
        />
      )}

      {step === 'address' && (
        <AddressStep
          address={deliveryAddress}
          onChange={setDeliveryAddress}
          onBack={() => setStep('cart')}
          onProceed={() => setStep('payment')}
        />
      )}

      {step === 'payment' && (
        <PaymentStep
          cart={cart}
          method={paymentMethod}
          onChange={setPaymentMethod}
          onBack={() => setStep('address')}
          onPay={checkout}
        />
      )}

      {step === 'success' && (
        <SuccessStep
          orderId={orderId}
          paymentLink={paymentLink}
          paymentMethod={paymentMethod}
          onClose={() => {
            setCart(null);
            setStep('cart');
          }}
        />
      )}
    </div>
  );
}

// ============ STEPS ============

function CartStep({ cart, onAddItem, onProceed }: {
  cart: Cart | null;
  onAddItem: (item: CartItem) => void;
  onProceed: () => void;
}) {
  return (
    <div style={styles.step}>
      <h3 style={styles.stepTitle}>🛒 Your Cart</h3>

      {cart?.items.length === 0 ? (
        <div style={styles.empty}>Cart is empty</div>
      ) : (
        <div style={styles.itemList}>
          {cart?.items.map((item, idx) => (
            <div key={idx} style={styles.item}>
              <span>{item.name}</span>
              <span>x{item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {cart && (
        <div style={styles.total}>
          <span>Subtotal:</span>
          <span>₹{cart.subtotal}</span>
        </div>
      )}

      {cart && cart.items.length > 0 && (
        <button style={styles.primaryButton} onClick={onProceed}>
          Continue to Delivery
        </button>
      )}
    </div>
  );
}

function AddressStep({ address, onChange, onBack, onProceed }: {
  address: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onProceed: () => void;
}) {
  return (
    <div style={styles.step}>
      <h3 style={styles.stepTitle}>📍 Delivery Address</h3>

      <textarea
        style={styles.textarea}
        placeholder="Enter your delivery address..."
        value={address}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />

      <div style={styles.buttonRow}>
        <button style={styles.secondaryButton} onClick={onBack}>
          Back
        </button>
        <button
          style={styles.primaryButton}
          onClick={onProceed}
          disabled={!address.trim()}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}

function PaymentStep({ cart, method, onChange, onBack, onPay }: {
  cart: Cart | null;
  method: 'upi' | 'cod';
  onChange: (v: 'upi' | 'cod') => void;
  onBack: () => void;
  onPay: () => void;
}) {
  return (
    <div style={styles.step}>
      <h3 style={styles.stepTitle}>💳 Payment</h3>

      <div style={styles.summary}>
        <div>Subtotal: ₹{cart?.subtotal}</div>
        <div style={styles.grandTotal}>Total: ₹{cart?.total}</div>
      </div>

      <div style={styles.paymentOptions}>
        <label style={styles.paymentOption}>
          <input
            type="radio"
            name="payment"
            checked={method === 'upi'}
            onChange={() => onChange('upi')}
          />
          <span>📱 UPI / Payment Link</span>
        </label>
        <label style={styles.paymentOption}>
          <input
            type="radio"
            name="payment"
            checked={method === 'cod'}
            onChange={() => onChange('cod')}
          />
          <span>💵 Cash on Delivery</span>
        </label>
      </div>

      <div style={styles.buttonRow}>
        <button style={styles.secondaryButton} onClick={onBack}>
          Back
        </button>
        <button style={styles.successButton} onClick={onPay}>
          {method === 'upi' ? 'Get Payment Link' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}

function SuccessStep({ orderId, paymentLink, paymentMethod, onClose }: {
  orderId: string | null;
  paymentLink: string | null;
  paymentMethod: string;
  onClose: () => void;
}) {
  return (
    <div style={styles.step}>
      <div style={styles.successIcon}>✅</div>
      <h3 style={styles.stepTitle}>Order Placed!</h3>
      <p style={styles.orderId}>Order: {orderId}</p>

      {paymentMethod === 'upi' && paymentLink && (
        <a href={paymentLink} style={styles.paymentLinkButton}>
          💰 Pay Now
        </a>
      )}

      {paymentMethod === 'cod' && (
        <p style={styles.codMessage}>
          Pay ₹ on delivery
        </p>
      )}

      <button style={styles.secondaryButton} onClick={onClose}>
        Done
      </button>
    </div>
  );
}

// ============ STYLES ============

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    padding: 16,
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: '#fff',
    minHeight: '100vh'
  },
  header: {
    padding: 16,
    backgroundColor: '#25d366',
    color: 'white',
    borderRadius: 12,
    marginBottom: 16
  },
  channel: {
    fontWeight: 'bold',
    fontSize: 16
  },
  loading: {
    textAlign: 'center',
    padding: 40,
    color: '#888'
  },
  step: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12
  },
  stepTitle: {
    marginTop: 0,
    marginBottom: 16
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: '#888'
  },
  itemList: {
    marginBottom: 16
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #eee'
  },
  total: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16
  },
  primaryButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#25d366',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  successButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: '#eee',
    color: '#333',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer'
  },
  buttonRow: {
    display: 'flex',
    gap: 12
  },
  textarea: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #ddd',
    marginBottom: 16,
    fontSize: 14,
    fontFamily: 'inherit'
  },
  summary: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16
  },
  grandTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8
  },
  paymentOptions: {
    marginBottom: 16
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    cursor: 'pointer'
  },
  successIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16
  },
  orderId: {
    fontFamily: 'monospace',
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 4
  },
  paymentLinkButton: {
    display: 'block',
    padding: 14,
    backgroundColor: '#4caf50',
    color: 'white',
    textDecoration: 'none',
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 16
  },
  codMessage: {
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    marginBottom: 16
  }
};
