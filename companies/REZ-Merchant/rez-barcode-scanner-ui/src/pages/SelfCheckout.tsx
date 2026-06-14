import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product, CartItem, Scan, BarcodeResult } from '../types';
import { formatBarcodeDisplay, parseBarcodeValue, generateScanId } from '../utils/formats';
import QuickAdd from '../components/QuickAdd';

interface SelfCheckoutProps {
  className?: string;
  style?: React.CSSProperties;
}

const TAX_RATE = 0.0825; // 8.25% tax rate

const SelfCheckout: React.FC<SelfCheckoutProps> = ({ className = '', style }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [lastScan, setLastScan] = useState<BarcodeResult | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastBarcodeRef = useRef<string>('');
  const scannerContainerId = 'self-checkout-scanner';

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + tax;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Mock product lookup - replace with actual API
  const lookupProduct = useCallback(async (barcode: string): Promise<Product | null> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock products database
    const mockProducts: Record<string, Product> = {
      '5901234123457': {
        id: '1',
        barcode: '5901234123457',
        name: 'Organic Whole Milk 1L',
        price: 4.99,
        quantity: 50,
        sku: 'MILK-ORG-1L',
        category: 'Dairy',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      '4006381333931': {
        id: '2',
        barcode: '4006381333931',
        name: 'Sourdough Bread Loaf',
        price: 5.49,
        quantity: 12,
        sku: 'BREAD-SOUR-500',
        category: 'Bakery',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      '0012345678905': {
        id: '3',
        barcode: '0012345678905',
        name: 'Free Range Eggs (12 pack)',
        price: 6.99,
        quantity: 3,
        sku: 'EGGS-FR-12',
        category: 'Eggs',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      '8901234567890': {
        id: '4',
        barcode: '8901234567890',
        name: 'Organic Bananas (bunch)',
        price: 2.99,
        quantity: 100,
        sku: 'FRUIT-BAN-ORG',
        category: 'Produce',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    return mockProducts[barcode] || null;
  }, []);

  // Handle successful scan
  const handleScan = useCallback(
    async (decodedText: string) => {
      const now = Date.now();
      const parsedValue = parseBarcodeValue(decodedText);

      // Debounce duplicate scans
      if (
        parsedValue === lastBarcodeRef.current &&
        now - lastScanTimeRef.current < 1500
      ) {
        return;
      }

      lastBarcodeRef.current = parsedValue;
      lastScanTimeRef.current = now;

      const scanResult: BarcodeResult = {
        value: parsedValue,
        format: 'ean_13',
        timestamp: new Date(),
      };
      setLastScan(scanResult);

      // Record scan
      const scanRecord: Scan = {
        id: generateScanId(),
        barcode: parsedValue,
        timestamp: new Date(),
        success: false,
      };

      try {
        const product = await lookupProduct(parsedValue);

        if (product) {
          scanRecord.success = true;
          scanRecord.product = product;
          setScannedProduct(product);

          // Check if already in cart
          const existingItem = cartItems.find((item) => item.product.id === product.id);
          if (existingItem) {
            // Increment quantity
            setCartItems((items) =>
              items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.price }
                  : item
              )
            );
          } else {
            // Add new item
            setCartItems((items) => [
              ...items,
              { product, quantity: 1, subtotal: product.price },
            ]);
          }

          // Vibrate feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(100);
          }
        } else {
          // Product not found
          setError(`Product not found: ${parsedValue}`);
          setTimeout(() => setError(null), 3000);
        }
      } catch (err) {
        setError('Failed to lookup product');
        setTimeout(() => setError(null), 3000);
      }

      setScans((prev) => [scanRecord, ...prev.slice(0, 49)]);
    },
    [lookupProduct, cartItems]
  );

  // Start scanner
  const startScanner = useCallback(async () => {
    if (isScanning) return;

    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }

      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        },
        handleScan,
        () => {} // Ignore parse errors
      );

      setIsScanning(true);
      setError(null);
    } catch (err) {
      setError('Failed to start camera. Please allow camera access.');
      console.error('Scanner error:', err);
    }
  }, [isScanning, handleScan]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setIsScanning(false);
      lastBarcodeRef.current = '';
    } catch (err) {
      console.warn('Error stopping scanner:', err);
      setIsScanning(false);
    }
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      setCartItems((items) => items.filter((item) => item.product.id !== productId));
    } else {
      setCartItems((items) =>
        items.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.price }
            : item
        )
      );
    }
  }, []);

  // Remove item from cart
  const removeItem = useCallback((productId: string) => {
    setCartItems((items) => items.filter((item) => item.product.id !== productId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setScans([]);
    setLastScan(null);
    setScannedProduct(null);
  }, []);

  // Process payment
  const processPayment = useCallback(async () => {
    if (cartItems.length === 0) return;

    setPaymentProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate receipt
      const receiptText = `
SELF CHECKOUT RECEIPT
---------------------
Date: ${new Date().toLocaleString()}

${cartItems.map((item) => `
${item.product.name}
  ${item.quantity} x $${item.product.price.toFixed(2)}  $${item.subtotal.toFixed(2)}
`).join('')}

---------------------
Subtotal:    $${subtotal.toFixed(2)}
Tax (8.25%): $${tax.toFixed(2)}
---------------------
TOTAL:       $${total.toFixed(2)}

Items scanned: ${scans.length}
Thank you for shopping with us!
      `.trim();

      setReceipt(receiptText);
      setCheckoutComplete(true);

      // Vibrate for success
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  }, [cartItems, subtotal, tax, total, scans.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // New transaction
  const newTransaction = useCallback(() => {
    clearCart();
    setCheckoutComplete(false);
    setReceipt(null);
  }, [clearCart]);

  // Print receipt
  const printReceipt = useCallback(() => {
    if (!receipt) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre>${receipt}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  }, [receipt]);

  // Show receipt screen
  if (checkoutComplete && receipt) {
    return (
      <div className={`self-checkout ${className}`} style={{ ...styles.container, ...style }}>
        <div style={styles.receiptContainer}>
          <div style={styles.successIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4CAF50"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 style={{ ...styles.title, color: '#4CAF50' }}>Payment Successful!</h2>
          <div style={styles.receiptBox}>
            <pre style={styles.receiptText}>{receipt}</pre>
          </div>
          <div style={styles.receiptActions}>
            <button onClick={printReceipt} style={styles.printButton}>
              Print Receipt
            </button>
            <button onClick={newTransaction} style={styles.newTransactionButton}>
              New Transaction
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`self-checkout ${className}`} style={{ ...styles.container, ...style }}>
      {/* Quick Add Modal */}
      {showQuickAdd && scannedProduct && (
        <QuickAdd
          product={scannedProduct}
          onAdd={(quantity) => {
            updateQuantity(scannedProduct.id, (cartItems.find(i => i.product.id === scannedProduct.id)?.quantity || 0) + quantity);
            setShowQuickAdd(false);
            setScannedProduct(null);
          }}
          onClose={() => {
            setShowQuickAdd(false);
            setScannedProduct(null);
          }}
        />
      )}

      {/* Error toast */}
      {error && (
        <div style={styles.errorToast}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div style={styles.mainContent}>
        {/* Left panel - Scanner */}
        <div style={styles.scannerPanel}>
          <h2 style={styles.panelTitle}>Scan Items</h2>

          <div style={styles.scannerContainer}>
            <div id={scannerContainerId} style={styles.scanner} />

            {/* Scanner overlay */}
            {isScanning && (
              <div style={styles.scannerOverlay}>
                <div style={styles.viewfinder}>
                  <div style={styles.cornerTL} />
                  <div style={styles.cornerTR} />
                  <div style={styles.cornerBL} />
                  <div style={styles.cornerBR} />
                </div>
              </div>
            )}

            {/* Start/Stop button */}
            <button
              onClick={isScanning ? stopScanner : startScanner}
              style={{
                ...styles.scanButton,
                backgroundColor: isScanning ? '#f44336' : '#4CAF50',
              }}
            >
              {isScanning ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  Stop Scanning
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Start Scanning
                </>
              )}
            </button>
          </div>

          {/* Last scan info */}
          {lastScan && (
            <div style={styles.lastScan}>
              <span style={styles.lastScanLabel}>Last scanned:</span>
              <span style={styles.lastScanValue}>{formatBarcodeDisplay(lastScan.value)}</span>
            </div>
          )}
        </div>

        {/* Right panel - Cart */}
        <div style={styles.cartPanel}>
          <div style={styles.cartHeader}>
            <h2 style={styles.panelTitle}>
              Cart
              {itemCount > 0 && <span style={styles.itemCount}>({itemCount})</span>}
            </h2>
            {cartItems.length > 0 && (
              <button onClick={clearCart} style={styles.clearButton}>
                Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div style={styles.cartItems}>
            {cartItems.length === 0 ? (
              <div style={styles.emptyCart}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#bdbdbd"
                  strokeWidth="2"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <p>Scan items to add to cart</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.product.id} style={styles.cartItem}>
                  <div style={styles.cartItemInfo}>
                    <span style={styles.cartItemName}>{item.product.name}</span>
                    <span style={styles.cartItemPrice}>
                      ${item.product.price.toFixed(2)} each
                    </span>
                  </div>
                  <div style={styles.cartItemQuantity}>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      style={styles.qtyButton}
                    >
                      -
                    </button>
                    <span style={styles.qtyValue}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      style={styles.qtyButton}
                    >
                      +
                    </button>
                  </div>
                  <div style={styles.cartItemSubtotal}>
                    ${item.subtotal.toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    style={styles.removeButton}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div style={styles.totals}>
            <div style={styles.totalRow}>
              <span>Subtotal ({itemCount} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={styles.totalRow}>
              <span>Tax (8.25%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Pay button */}
          <button
            onClick={processPayment}
            disabled={cartItems.length === 0 || paymentProcessing}
            style={{
              ...styles.payButton,
              opacity: cartItems.length === 0 ? 0.5 : 1,
              cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {paymentProcessing ? (
              <>
                <div style={styles.spinner} />
                Processing...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Pay ${total.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  scannerPanel: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  panelTitle: {
    margin: '0 0 20px',
    fontSize: '20px',
    fontWeight: 600,
    color: '#212121',
  },
  scannerContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  scanner: {
    width: '100%',
    height: '100%',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  viewfinder: {
    width: '200px',
    height: '200px',
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '30px',
    height: '30px',
    borderTop: '4px solid #4CAF50',
    borderLeft: '4px solid #4CAF50',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '30px',
    height: '30px',
    borderTop: '4px solid #4CAF50',
    borderRight: '4px solid #4CAF50',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '30px',
    height: '30px',
    borderBottom: '4px solid #4CAF50',
    borderLeft: '4px solid #4CAF50',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '30px',
    height: '30px',
    borderBottom: '4px solid #4CAF50',
    borderRight: '4px solid #4CAF50',
  },
  scanButton: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  lastScan: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastScanLabel: {
    fontSize: '14px',
    color: '#757575',
  },
  lastScanValue: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'monospace',
    color: '#212121',
  },
  cartPanel: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  itemCount: {
    marginLeft: '8px',
    fontSize: '16px',
    fontWeight: 400,
    color: '#9e9e9e',
  },
  clearButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#757575',
    cursor: 'pointer',
  },
  cartItems: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '20px',
    maxHeight: '400px',
  },
  emptyCart: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#9e9e9e',
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  cartItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  cartItemName: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#212121',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cartItemPrice: {
    fontSize: '12px',
    color: '#9e9e9e',
  },
  cartItemQuantity: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyButton: {
    width: '28px',
    height: '28px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    minWidth: '24px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },
  cartItemSubtotal: {
    minWidth: '60px',
    textAlign: 'right',
    fontSize: '14px',
    fontWeight: 600,
    color: '#212121',
  },
  removeButton: {
    width: '28px',
    height: '28px',
    border: 'none',
    backgroundColor: '#ffebee',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f44336',
  },
  totals: {
    padding: '16px 0',
    borderTop: '2px solid #f0f0f0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#616161',
  },
  grandTotal: {
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #e0e0e0',
    fontSize: '18px',
    fontWeight: 700,
    color: '#212121',
  },
  payButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorToast: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
  },
  receiptContainer: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '40px 20px',
    textAlign: 'center',
  },
  successIcon: {
    marginBottom: '20px',
  },
  receiptBox: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    margin: '20px 0',
    textAlign: 'left',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  receiptText: {
    margin: 0,
    fontSize: '12px',
    fontFamily: 'monospace',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  receiptActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  printButton: {
    padding: '12px 24px',
    backgroundColor: '#fff',
    border: '2px solid #4CAF50',
    color: '#4CAF50',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  newTransactionButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default SelfCheckout;
