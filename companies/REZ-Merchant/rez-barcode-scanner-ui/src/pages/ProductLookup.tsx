import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product, Scan, BarcodeResult } from '../types';
import { formatBarcodeDisplay, formatDisplayNames, parseBarcodeValue, generateScanId } from '../utils/formats';
import ProductLookupComponent from '../components/ProductLookup';

interface ProductLookupPageProps {
  className?: string;
  style?: React.CSSProperties;
}

const ProductLookupPage: React.FC<ProductLookupPageProps> = ({ className = '', style }) => {
  const [barcode, setBarcode] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [scanHistory, setScanHistory] = useState<Scan[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastBarcodeRef = useRef<string>('');
  const scannerContainerId = 'product-lookup-scanner';

  // Mock product database
  const mockProducts: Record<string, Product> = {
    '5901234123457': {
      id: '1',
      barcode: '5901234123457',
      name: 'Organic Whole Milk 1L',
      description: 'Fresh organic whole milk from grass-fed cows. Rich in calcium and vitamin D.',
      price: 4.99,
      cost: 2.50,
      quantity: 50,
      sku: 'MILK-ORG-1L',
      category: 'Dairy',
      imageUrl: 'https://via.placeholder.com/150?text=Milk',
      lowStockThreshold: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    '4006381333931': {
      id: '2',
      barcode: '4006381333931',
      name: 'Sourdough Bread Loaf',
      description: 'Artisan sourdough bread, freshly baked daily. Made with natural fermentation.',
      price: 5.49,
      cost: 1.80,
      quantity: 12,
      sku: 'BREAD-SOUR-500',
      category: 'Bakery',
      imageUrl: 'https://via.placeholder.com/150?text=Bread',
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    '0012345678905': {
      id: '3',
      barcode: '0012345678905',
      name: 'Free Range Eggs (12 pack)',
      description: 'Farm fresh free range eggs from happy hens.',
      price: 6.99,
      cost: 3.00,
      quantity: 3,
      sku: 'EGGS-FR-12',
      category: 'Eggs',
      imageUrl: 'https://via.placeholder.com/150?text=Eggs',
      lowStockThreshold: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    '8901234567890': {
      id: '4',
      barcode: '8901234567890',
      name: 'Organic Bananas (bunch)',
      description: 'Sweet and nutritious organic bananas.',
      price: 2.99,
      cost: 1.20,
      quantity: 100,
      sku: 'FRUIT-BAN-ORG',
      category: 'Produce',
      imageUrl: 'https://via.placeholder.com/150?text=Bananas',
      lowStockThreshold: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  // Lookup product
  const lookupProduct = useCallback(async (barcodeValue: string) => {
    if (!barcodeValue) return;

    setLoading(true);
    setNotFound(false);
    setError(null);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const foundProduct = mockProducts[barcodeValue];

      if (foundProduct) {
        setProduct(foundProduct);

        // Add to recent searches
        setRecentSearches((prev) => {
          const filtered = prev.filter((b) => b !== barcodeValue);
          return [barcodeValue, ...filtered].slice(0, 5);
        });

        // Add to scan history
        const scan: Scan = {
          id: generateScanId(),
          barcode: barcodeValue,
          product: foundProduct,
          timestamp: new Date(),
          success: true,
          action: 'lookup',
        };
        setScanHistory((prev) => [scan, ...prev.slice(0, 49)]);
      } else {
        setProduct(null);
        setNotFound(true);

        const scan: Scan = {
          id: generateScanId(),
          barcode: barcodeValue,
          timestamp: new Date(),
          success: false,
          action: 'lookup',
        };
        setScanHistory((prev) => [scan, ...prev.slice(0, 49)]);
      }

      // Vibrate on lookup
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (err) {
      setError('Failed to lookup product');
    } finally {
      setLoading(false);
    }
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

      setBarcode(parsedValue);
      await lookupProduct(parsedValue);
    },
    [lookupProduct]
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
        () => {}
      );

      setIsScanning(true);
      setShowScanner(true);
    } catch (err) {
      setError('Failed to start camera');
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
      setShowScanner(false);
      lastBarcodeRef.current = '';
    } catch (err) {
      setIsScanning(false);
    }
  }, []);

  // Toggle scanner
  const toggleScanner = useCallback(async () => {
    if (isScanning) {
      await stopScanner();
    } else {
      await startScanner();
    }
  }, [isScanning, startScanner, stopScanner]);

  // Handle manual input
  const handleManualSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (manualBarcode.trim()) {
        setBarcode(manualBarcode.trim());
        lookupProduct(manualBarcode.trim());
      }
    },
    [manualBarcode, lookupProduct]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setBarcode('');
    setProduct(null);
    setNotFound(false);
    setError(null);
  }, []);

  // Rescan from history
  const rescan = useCallback(
    (barcodeValue: string) => {
      setBarcode(barcodeValue);
      lookupProduct(barcodeValue);
    },
    [lookupProduct]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const isLowStock = product && product.quantity <= (product.lowStockThreshold || 5);

  return (
    <div className={`product-lookup-page ${className}`} style={{ ...styles.container, ...style }}>
      <div style={styles.mainContent}>
        {/* Left panel - Search */}
        <div style={styles.searchPanel}>
          <h1 style={styles.title}>Product Lookup</h1>

          {/* Tab switcher */}
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab('scan')}
              style={{
                ...styles.tab,
                ...(activeTab === 'scan' ? styles.tabActive : {}),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Scan
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              style={{
                ...styles.tab,
                ...(activeTab === 'manual' ? styles.tabActive : {}),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Manual
            </button>
          </div>

          {/* Scanner section */}
          {activeTab === 'scan' && (
            <div style={styles.scannerSection}>
              <div style={styles.scannerContainer}>
                <div id={scannerContainerId} style={styles.scanner} />

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
              </div>

              <button
                onClick={toggleScanner}
                style={{
                  ...styles.scanButton,
                  backgroundColor: isScanning ? '#f44336' : '#4CAF50',
                }}
              >
                {isScanning ? 'Stop Scanner' : 'Start Scanner'}
              </button>

              <p style={styles.hint}>
                {isScanning
                  ? 'Point camera at barcode'
                  : 'Tap to start scanning'}
              </p>
            </div>
          )}

          {/* Manual input section */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} style={styles.manualSection}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Enter Barcode</label>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter or scan barcode..."
                  style={styles.input}
                  autoFocus
                />
              </div>
              <button type="submit" style={styles.searchButton} disabled={!manualBarcode.trim()}>
                Search
              </button>
            </form>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div style={styles.recentSection}>
              <h3 style={styles.sectionTitle}>Recent Searches</h3>
              <div style={styles.recentList}>
                {recentSearches.map((b) => (
                  <button
                    key={b}
                    onClick={() => rescan(b)}
                    style={styles.recentItem}
                  >
                    <span style={styles.recentBarcode}>
                      {formatBarcodeDisplay(b)}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Results */}
        <div style={styles.resultsPanel}>
          {/* Current barcode */}
          {barcode && (
            <div style={styles.currentBarcode}>
              <span style={styles.barcodeLabel}>Looking up:</span>
              <span style={styles.barcodeValue}>{formatBarcodeDisplay(barcode)}</span>
              <button onClick={clearSearch} style={styles.clearButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <p>Looking up product...</p>
            </div>
          )}

          {/* Product found */}
          {product && !loading && (
            <div style={styles.productCard}>
              <div style={styles.productHeader}>
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={styles.productImage}
                  />
                )}
                <div style={styles.productInfo}>
                  <h2 style={styles.productName}>{product.name}</h2>
                  <p style={styles.productSku}>SKU: {product.sku}</p>
                  <p style={styles.productBarcode}>
                    {formatBarcodeDisplay(product.barcode)}
                  </p>
                </div>
              </div>

              {product.description && (
                <p style={styles.productDescription}>{product.description}</p>
              )}

              <div style={styles.detailsGrid}>
                <div style={styles.detailCard}>
                  <span style={styles.detailLabel}>Price</span>
                  <span style={styles.detailValue}>${product.price.toFixed(2)}</span>
                </div>
                <div style={styles.detailCard}>
                  <span style={styles.detailLabel}>Cost</span>
                  <span style={styles.detailValue}>${product.cost?.toFixed(2) || 'N/A'}</span>
                </div>
                <div
                  style={{
                    ...styles.detailCard,
                    backgroundColor:
                      product.quantity === 0
                        ? '#ffebee'
                        : isLowStock
                        ? '#fff8e1'
                        : '#e8f5e9',
                  }}
                >
                  <span style={styles.detailLabel}>Stock</span>
                  <span
                    style={{
                      ...styles.detailValue,
                      color:
                        product.quantity === 0
                          ? '#d32f2f'
                          : isLowStock
                          ? '#f57c00'
                          : '#388e3c',
                    }}
                  >
                    {product.quantity}
                    {product.quantity === 0 && ' (OUT)'}
                    {isLowStock && product.quantity > 0 && ' (LOW)'}
                  </span>
                </div>
                <div style={styles.detailCard}>
                  <span style={styles.detailLabel}>Category</span>
                  <span style={styles.detailValue}>{product.category || 'Uncategorized'}</span>
                </div>
              </div>

              {/* Margin calculation */}
              {product.cost && (
                <div style={styles.marginSection}>
                  <span>Margin: </span>
                  <strong>
                    {((product.price - product.cost) / product.price * 100).toFixed(1)}%
                  </strong>
                  <span style={styles.marginProfit}>
                    (${(product.price - product.cost).toFixed(2)} profit)
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div style={styles.actionButtons}>
                <button style={styles.editButton}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Product
                </button>
                <button style={styles.adjustButton}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  Adjust Stock
                </button>
              </div>
            </div>
          )}

          {/* Not found state */}
          {notFound && !loading && (
            <div style={styles.notFoundState}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f57c00"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3 style={styles.notFoundTitle}>Product Not Found</h3>
              <p style={styles.notFoundBarcode}>
                Barcode: {formatBarcodeDisplay(barcode)}
              </p>
              <p style={styles.notFoundText}>
                This product is not in the database.
              </p>
              <div style={styles.notFoundActions}>
                <button style={styles.addProductButton}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add New Product
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!barcode && !loading && (
            <div style={styles.emptyState}>
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#bdbdbd"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              <h3 style={styles.emptyTitle}>Scan or Search</h3>
              <p style={styles.emptyText}>
                Use the camera to scan a barcode or enter a barcode number manually.
              </p>
            </div>
          )}

          {/* Scan history */}
          {scanHistory.length > 0 && (
            <div style={styles.historySection}>
              <h3 style={styles.sectionTitle}>Scan History</h3>
              <div style={styles.historyList}>
                {scanHistory.slice(0, 5).map((scan) => (
                  <div
                    key={scan.id}
                    style={{
                      ...styles.historyItem,
                      backgroundColor: scan.success ? '#e8f5e9' : '#ffebee',
                    }}
                  >
                    <div style={styles.historyInfo}>
                      <span style={styles.historyBarcode}>
                        {formatBarcodeDisplay(scan.barcode)}
                      </span>
                      {scan.product && (
                        <span style={styles.historyName}>{scan.product.name}</span>
                      )}
                    </div>
                    <button
                      onClick={() => rescan(scan.barcode)}
                      style={styles.rescanButton}
                    >
                      Rescan
                    </button>
                  </div>
                ))}
              </div>
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
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  searchPanel: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    height: 'fit-content',
  },
  title: {
    margin: '0 0 20px',
    fontSize: '24px',
    fontWeight: 600,
    color: '#212121',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#616161',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  tabActive: {
    backgroundColor: '#4CAF50',
    color: '#fff',
  },
  scannerSection: {
    marginBottom: '20px',
  },
  scannerContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '16px',
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
    width: '100%',
    padding: '14px',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  hint: {
    margin: '12px 0 0',
    textAlign: 'center',
    fontSize: '13px',
    color: '#9e9e9e',
  },
  manualSection: {
    marginBottom: '20px',
  },
  inputGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#616161',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'monospace',
    outline: 'none',
    boxSizing: 'border-box',
  },
  searchButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  recentSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e0e0e0',
  },
  sectionTitle: {
    margin: '0 0 12px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#616161',
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#fafafa',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  recentBarcode: {
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#212121',
  },
  resultsPanel: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    minHeight: '600px',
  },
  currentBarcode: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  barcodeLabel: {
    fontSize: '13px',
    color: '#757575',
  },
  barcodeValue: {
    flex: 1,
    fontSize: '16px',
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#212121',
  },
  clearButton: {
    width: '28px',
    height: '28px',
    border: 'none',
    backgroundColor: '#e0e0e0',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e0e0e0',
    borderTopColor: '#4CAF50',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  productCard: {
    padding: '20px',
    backgroundColor: '#fafafa',
    borderRadius: '12px',
  },
  productHeader: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  productImage: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    margin: '0 0 8px',
    fontSize: '20px',
    fontWeight: 600,
    color: '#212121',
  },
  productSku: {
    margin: '0 0 4px',
    fontSize: '13px',
    color: '#757575',
  },
  productBarcode: {
    margin: 0,
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#9e9e9e',
  },
  productDescription: {
    margin: '0 0 20px',
    fontSize: '14px',
    color: '#616161',
    lineHeight: 1.6,
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  detailCard: {
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    textAlign: 'center',
  },
  detailLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#9e9e9e',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#212121',
  },
  marginSection: {
    padding: '12px 16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#616161',
    marginBottom: '20px',
  },
  marginProfit: {
    marginLeft: '8px',
    color: '#4CAF50',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
  },
  editButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  adjustButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#4CAF50',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  notFoundState: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  notFoundTitle: {
    margin: '16px 0 8px',
    fontSize: '20px',
    fontWeight: 600,
    color: '#f57c00',
  },
  notFoundBarcode: {
    margin: '0 0 8px',
    fontSize: '16px',
    fontFamily: 'monospace',
    color: '#757575',
  },
  notFoundText: {
    margin: '0 0 20px',
    fontSize: '14px',
    color: '#9e9e9e',
  },
  notFoundActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  addProductButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  emptyState: {
    padding: '80px 20px',
    textAlign: 'center',
  },
  emptyTitle: {
    margin: '20px 0 8px',
    fontSize: '18px',
    fontWeight: 600,
    color: '#757575',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: '#9e9e9e',
  },
  historySection: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e0e0e0',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    borderRadius: '8px',
  },
  historyInfo: {
    flex: 1,
  },
  historyBarcode: {
    display: 'block',
    fontSize: '14px',
    fontFamily: 'monospace',
    fontWeight: 500,
    color: '#212121',
  },
  historyName: {
    display: 'block',
    fontSize: '12px',
    color: '#757575',
    marginTop: '2px',
  },
  rescanButton: {
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default ProductLookupPage;
