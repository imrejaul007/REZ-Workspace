import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product, InventoryAdjustment, Scan, InventoryScanMode, BarcodeResult } from '../types';
import { formatBarcodeDisplay, parseBarcodeValue, generateScanId } from '../utils/formats';

interface InventoryScanProps {
  className?: string;
  style?: React.CSSProperties;
}

const InventoryScan: React.FC<InventoryScanProps> = ({ className = '', style }) => {
  const [scanMode, setScanMode] = useState<InventoryScanMode>({
    mode: 'add',
    defaultQuantity: 1,
    requireConfirmation: true,
  });
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [lastScan, setLastScan] = useState<BarcodeResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastBarcodeRef = useRef<string>('');
  const scannerContainerId = 'inventory-scanner';

  // Mock product database
  const mockProducts: Product[] = [
    {
      id: '1',
      barcode: '5901234123457',
      name: 'Organic Whole Milk 1L',
      price: 4.99,
      quantity: 50,
      sku: 'MILK-ORG-1L',
      category: 'Dairy',
      lowStockThreshold: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      barcode: '4006381333931',
      name: 'Sourdough Bread Loaf',
      price: 5.49,
      quantity: 12,
      sku: 'BREAD-SOUR-500',
      category: 'Bakery',
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      barcode: '0012345678905',
      name: 'Free Range Eggs (12 pack)',
      price: 6.99,
      quantity: 3,
      sku: 'EGGS-FR-12',
      category: 'Eggs',
      lowStockThreshold: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      barcode: '8901234567890',
      name: 'Organic Bananas (bunch)',
      price: 2.99,
      quantity: 100,
      sku: 'FRUIT-BAN-ORG',
      category: 'Produce',
      lowStockThreshold: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '5',
      barcode: '1234567890123',
      name: 'Greek Yogurt Plain 500g',
      price: 5.99,
      quantity: 0,
      sku: 'YOGURT-GRK-500',
      category: 'Dairy',
      lowStockThreshold: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Initialize products map
  useEffect(() => {
    const productMap = new Map<string, Product>();
    mockProducts.forEach((p) => productMap.set(p.barcode, p));
    setProducts(productMap);
  }, []);

  // Handle scan
  const handleScan = useCallback(
    async (decodedText: string) => {
      const now = Date.now();
      const parsedValue = parseBarcodeValue(decodedText);

      // Debounce
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

      const scanRecord: Scan = {
        id: generateScanId(),
        barcode: parsedValue,
        timestamp: new Date(),
        success: false,
        action: 'adjust',
      };

      const product = products.get(parsedValue);

      if (product) {
        scanRecord.success = true;
        scanRecord.product = product;
        setSelectedProduct(product);
        setAdjustQuantity(scanMode.defaultQuantity);

        if (scanMode.requireConfirmation) {
          setShowAdjustModal(true);
        } else {
          applyAdjustment(product, scanMode.defaultQuantity);
        }
      } else {
        setError(`Product not found: ${parsedValue}`);
        setTimeout(() => setError(null), 3000);
      }

      setScans((prev) => [scanRecord, ...prev.slice(0, 99)]);

      // Vibrate
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    },
    [products, scanMode]
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
            Html5QrcodeSupportedFormats.UPC_13,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        },
        handleScan,
        () => {}
      );

      setIsScanning(true);
      setError(null);
    } catch (err) {
      setError('Failed to start camera');
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
      setIsScanning(false);
    }
  }, []);

  // Apply adjustment
  const applyAdjustment = useCallback(
    (product: Product, quantity: number) => {
      const previousQuantity = product.quantity;
      let newQuantity: number;

      switch (scanMode.mode) {
        case 'add':
          newQuantity = previousQuantity + quantity;
          break;
        case 'remove':
          newQuantity = Math.max(0, previousQuantity - quantity);
          break;
        case 'set':
          newQuantity = quantity;
          break;
        case 'count':
          newQuantity = quantity;
          break;
        default:
          newQuantity = previousQuantity;
      }

      const adjustment: InventoryAdjustment = {
        productId: product.id,
        barcode: product.barcode,
        previousQuantity,
        newQuantity,
        reason: scanMode.mode,
        timestamp: new Date(),
      };

      setAdjustments((prev) => [adjustment, ...prev.slice(0, 99)]);

      // Update product in local state
      setProducts((prev) => {
        const updated = new Map(prev);
        updated.set(product.barcode, {
          ...product,
          quantity: newQuantity,
          updatedAt: new Date(),
        });
        return updated;
      });

      // Vibrate for success
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }

      setShowAdjustModal(false);
      setSelectedProduct(null);
    },
    [scanMode.mode]
  );

  // Undo last adjustment
  const undoLastAdjustment = useCallback(() => {
    if (adjustments.length === 0) return;

    const lastAdjustment = adjustments[0];

    setProducts((prev) => {
      const updated = new Map(prev);
      const product = updated.get(lastAdjustment.barcode);
      if (product) {
        updated.set(lastAdjustment.barcode, {
          ...product,
          quantity: lastAdjustment.previousQuantity,
          updatedAt: new Date(),
        });
      }
      return updated;
    });

    setAdjustments((prev) => prev.slice(1));
  }, [adjustments]);

  // Clear all adjustments
  const clearAdjustments = useCallback(() => {
    setAdjustments([]);
    setScans([]);
  }, []);

  // Export adjustments
  const exportAdjustments = useCallback(() => {
    const csv = [
      'Barcode,Product,Previous Qty,New Qty,Change,Mode,Time',
      ...adjustments.map((adj) => {
        const product = products.get(adj.barcode);
        const change = adj.newQuantity - adj.previousQuantity;
        return `"${adj.barcode}","${product?.name || 'Unknown'}",${adj.previousQuantity},${adj.newQuantity},${change >= 0 ? '+' : ''}${change},${adj.reason},"${adj.timestamp.toISOString()}"`;
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-adjustments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [adjustments, products]);

  // Filter products
  const filteredProducts = Array.from(products.values()).filter((p) => {
    if (lowStockOnly && p.quantity > (p.lowStockThreshold || 5)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.barcode.includes(query) ||
        p.sku?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Cleanup
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const isLowStock = (product: Product) =>
    product.quantity <= (product.lowStockThreshold || 5);

  return (
    <div className={`inventory-scan ${className}`} style={{ ...styles.container, ...style }}>
      {/* Adjust Modal */}
      {showAdjustModal && selectedProduct && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Adjust Inventory</h3>

            <div style={styles.productInfo}>
              <p style={styles.productName}>{selectedProduct.name}</p>
              <p style={styles.productBarcode}>
                {formatBarcodeDisplay(selectedProduct.barcode)}
              </p>
              <p style={styles.currentStock}>
                Current Stock: <strong>{selectedProduct.quantity}</strong>
              </p>
            </div>

            <div style={styles.modeButtons}>
              {(['add', 'remove', 'set', 'count'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    setScanMode((prev) => ({ ...prev, mode, requireConfirmation: true }))
                  }
                  style={{
                    ...styles.modeButton,
                    backgroundColor: scanMode.mode === mode ? '#4CAF50' : '#f5f5f5',
                    color: scanMode.mode === mode ? '#fff' : '#616161',
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            <div style={styles.quantitySection}>
              <label style={styles.label}>Quantity</label>
              <div style={styles.quantityControls}>
                <button
                  onClick={() => setAdjustQuantity((q) => Math.max(0, q - 1))}
                  style={styles.qtyButton}
                >
                  -
                </button>
                <input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  style={styles.qtyInput}
                  min={0}
                />
                <button
                  onClick={() => setAdjustQuantity((q) => q + 1)}
                  style={styles.qtyButton}
                >
                  +
                </button>
              </div>
            </div>

            <div style={styles.preview}>
              <span>New quantity:</span>
              <span style={styles.previewValue}>
                {scanMode.mode === 'add'
                  ? selectedProduct.quantity + adjustQuantity
                  : scanMode.mode === 'remove'
                  ? Math.max(0, selectedProduct.quantity - adjustQuantity)
                  : adjustQuantity}
              </span>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedProduct(null);
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => applyAdjustment(selectedProduct, adjustQuantity)}
                style={styles.confirmButton}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div style={styles.errorToast}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>Inventory Scanner</h1>
        <div style={styles.modeIndicator}>
          Mode: <strong>{scanMode.mode.toUpperCase()}</strong>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Scanner panel */}
        <div style={styles.scannerPanel}>
          <div style={styles.scannerContainer}>
            <div id={scannerContainerId} style={styles.scanner} />

            <button
              onClick={isScanning ? stopScanner : startScanner}
              style={{
                ...styles.scanButton,
                backgroundColor: isScanning ? '#f44336' : '#4CAF50',
              }}
            >
              {isScanning ? 'Stop' : 'Start'} Scanner
            </button>
          </div>

          {/* Mode selector */}
          <div style={styles.modeSelector}>
            <label style={styles.label}>Adjustment Mode</label>
            <div style={styles.modeButtons}>
              {(['add', 'remove', 'set', 'count'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setScanMode((prev) => ({ ...prev, mode }))}
                  style={{
                    ...styles.modeButton,
                    backgroundColor: scanMode.mode === mode ? '#4CAF50' : '#f5f5f5',
                    color: scanMode.mode === mode ? '#fff' : '#616161',
                  }}
                >
                  {mode === 'add' && '+'}
                  {mode === 'remove' && '-'}
                  {mode === 'set' && '='}
                  {mode === 'count' && '#'}
                  <span style={{ marginLeft: '4px' }}>{mode}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div style={styles.stats}>
            <div style={styles.stat}>
              <span style={styles.statValue}>{adjustments.length}</span>
              <span style={styles.statLabel}>Adjustments</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{scans.length}</span>
              <span style={styles.statLabel}>Scans</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>
                {Array.from(products.values()).filter((p) => p.quantity <= (p.lowStockThreshold || 5)).length}
              </span>
              <span style={styles.statLabel}>Low Stock</span>
            </div>
          </div>
        </div>

        {/* Product list panel */}
        <div style={styles.listPanel}>
          {/* Filters */}
          <div style={styles.filters}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              <span style={{ marginLeft: '8px' }}>Low stock only</span>
            </label>
          </div>

          {/* Product list */}
          <div style={styles.productList}>
            {filteredProducts.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No products found</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    ...styles.productItem,
                    ...(lastScan?.value === product.barcode ? styles.productItemHighlight : {}),
                  }}
                  onClick={() => {
                    setSelectedProduct(product);
                    setAdjustQuantity(scanMode.defaultQuantity);
                    setShowAdjustModal(true);
                  }}
                >
                  <div style={styles.productDetails}>
                    <span style={styles.productName}>{product.name}</span>
                    <span style={styles.productSku}>{product.sku}</span>
                  </div>
                  <div
                    style={{
                      ...styles.stockBadge,
                      backgroundColor: product.quantity === 0
                        ? '#ffebee'
                        : isLowStock(product)
                        ? '#fff8e1'
                        : '#e8f5e9',
                      color: product.quantity === 0
                        ? '#d32f2f'
                        : isLowStock(product)
                        ? '#f57c00'
                        : '#388e3c',
                    }}
                  >
                    {product.quantity}
                    {product.quantity === 0 && ' OUT'}
                    {isLowStock(product) && product.quantity > 0 && ' LOW'}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              onClick={undoLastAdjustment}
              disabled={adjustments.length === 0}
              style={{
                ...styles.actionButton,
                opacity: adjustments.length === 0 ? 0.5 : 1,
              }}
            >
              Undo Last
            </button>
            <button onClick={exportAdjustments} style={styles.actionButton}>
              Export CSV
            </button>
            <button
              onClick={clearAdjustments}
              style={{ ...styles.actionButton, backgroundColor: '#f44336', color: '#fff' }}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Recent adjustments */}
        <div style={styles.historyPanel}>
          <h3 style={styles.panelTitle}>Recent Adjustments</h3>
          {adjustments.length === 0 ? (
            <p style={styles.emptyText}>No adjustments yet</p>
          ) : (
            <div style={styles.adjustmentList}>
              {adjustments.slice(0, 10).map((adj, index) => {
                const product = products.get(adj.barcode);
                const change = adj.newQuantity - adj.previousQuantity;
                return (
                  <div key={`${adj.barcode}-${index}`} style={styles.adjustmentItem}>
                    <div style={styles.adjInfo}>
                      <span style={styles.adjProduct}>{product?.name || adj.barcode}</span>
                      <span style={styles.adjBarcode}>{formatBarcodeDisplay(adj.barcode)}</span>
                    </div>
                    <div style={styles.adjChange}>
                      <span style={{ color: change >= 0 ? '#4CAF50' : '#f44336' }}>
                        {change >= 0 ? '+' : ''}{change}
                      </span>
                      <span style={styles.adjQty}>
                        {adj.previousQuantity} → {adj.newQuantity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
  header: {
    padding: '20px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: '#212121',
  },
  modeIndicator: {
    fontSize: '14px',
    color: '#616161',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr 300px',
    gap: '24px',
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  scannerPanel: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  scannerContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  scanner: {
    width: '100%',
    height: '100%',
  },
  scanButton: {
    position: 'absolute',
    bottom: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  modeSelector: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#616161',
    marginBottom: '8px',
  },
  modeButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  modeButton: {
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
  },
  stat: {
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 700,
    color: '#212121',
  },
  statLabel: {
    fontSize: '11px',
    color: '#9e9e9e',
  },
  listPanel: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  filters: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  searchInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#616161',
    cursor: 'pointer',
  },
  productList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '500px',
  },
  productItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  productItemHighlight: {
    backgroundColor: '#e8f5e9',
  },
  productDetails: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#212121',
  },
  productSku: {
    fontSize: '12px',
    color: '#9e9e9e',
  },
  productBarcode: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#757575',
  },
  stockBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
  },
  currentStock: {
    fontSize: '14px',
    color: '#616161',
    margin: '8px 0 0',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#9e9e9e',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0',
  },
  actionButton: {
    flex: 1,
    padding: '10px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  historyPanel: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  panelTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#212121',
  },
  emptyText: {
    fontSize: '14px',
    color: '#9e9e9e',
    textAlign: 'center',
  },
  adjustmentList: {
    maxHeight: '500px',
    overflowY: 'auto',
  },
  adjustmentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  adjInfo: {
    flex: 1,
  },
  adjProduct: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#212121',
  },
  adjBarcode: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#9e9e9e',
  },
  adjChange: {
    textAlign: 'right',
  },
  adjQty: {
    display: 'block',
    fontSize: '11px',
    color: '#9e9e9e',
  },
  modal: {
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
  },
  modalContent: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
  },
  modalTitle: {
    margin: '0 0 20px',
    fontSize: '18px',
    fontWeight: 600,
    color: '#212121',
  },
  productInfo: {
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  quantitySection: {
    marginBottom: '20px',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  qtyButton: {
    width: '44px',
    height: '44px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    borderRadius: '8px',
    fontSize: '20px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  qtyInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 600,
    textAlign: 'center',
    outline: 'none',
  },
  preview: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#2e7d32',
  },
  previewValue: {
    fontWeight: 700,
    fontSize: '16px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  confirmButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
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
};

export default InventoryScan;
