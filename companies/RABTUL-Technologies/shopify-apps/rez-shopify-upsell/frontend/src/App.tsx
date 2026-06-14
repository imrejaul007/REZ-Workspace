import React, { useState, useEffect } from 'react';

interface Config {
  enabled: boolean;
  position: string;
  discountPercentage: number;
  discountCode: string;
  products: Product[];
  settings: Settings;
  stats: Stats;
}

interface Product {
  productId: string;
  variantId: string;
  title: string;
  price: number;
  image?: string;
}

interface Settings {
  showOnMobile: boolean;
  autoTrigger: boolean;
  delaySeconds: number;
  primaryColor: string;
}

interface Stats {
  totalOffers: number;
  totalClicks: number;
  totalAccepted: number;
  totalDeclined: number;
  totalRevenue: number;
}

const App: React.FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [discountCode, setDiscountCode] = useState('');
  const [position, setPosition] = useState('checkout');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const shop = (window as any).SHOP;
  const appUrl = (window as any).APP_URL;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load config
      const configRes = await fetch(`${appUrl}/api/upsell/config?shop=${shop}`);
      const configData = await configRes.json();
      setConfig(configData);
      setDiscountPercentage(configData.discountPercentage || 10);
      setDiscountCode(configData.discountCode || '');
      setPosition(configData.position || 'checkout');
      setSelectedProducts(configData.products?.map((p: Product) => p.productId) || []);

      // Load products
      const productsRes = await fetch(`${appUrl}/api/products?shop=${shop}`);
      const productsData = await productsRes.json();
      setProducts(productsData.products || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const selected = products.filter(p => selectedProducts.includes(p.productId));

      const response = await fetch(`${appUrl}/api/upsell/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          products: selected.map(p => ({
            productId: p.productId,
            variantId: p.variantId,
            title: p.title,
            price: p.price,
            image: p.image,
          })),
          discountPercentage,
          discountCode,
          position,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Configuration saved successfully!');
        loadData();
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ReZ Upsell</h1>
                <p className="text-sm text-gray-500">{shop}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${config?.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {config?.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Card */}
            {config?.stats && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{config.stats.totalOffers}</p>
                    <p className="text-sm text-gray-500">Offers Shown</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{config.stats.totalAccepted}</p>
                    <p className="text-sm text-gray-500">Conversions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {config.stats.totalOffers > 0 ? ((config.stats.totalAccepted / config.stats.totalOffers) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">₹{config.stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Revenue</p>
                  </div>
                </div>
              </div>
            )}

            {/* Upsell Settings */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upsell Settings</h2>

              {/* Position */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="checkout">Checkout Page</option>
                  <option value="cart">Cart Page</option>
                  <option value="thank_you">Thank You Page</option>
                </select>
              </div>

              {/* Discount */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
                  <input
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="UPSELL10"
                  />
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upsell Products ({selectedProducts.length} selected)
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.productId}
                    onClick={() => toggleProduct(product.productId)}
                    className={`flex items-center gap-4 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedProducts.includes(product.productId)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedProducts.includes(product.productId)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedProducts.includes(product.productId) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-gray-400">📦</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.title}</p>
                      <p className="text-sm text-gray-500">₹{product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                <div className="text-xs text-gray-500 mb-2 text-center">Customer View</div>
                <div className="space-y-2">
                  <div className="bg-white rounded-lg shadow-sm p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">⚡ Special Offer</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-12 h-12 bg-gray-200 rounded" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Sample Product</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-600">₹{900}</span>
                          <span className="text-xs text-gray-400 line-through">₹{1000}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-1 rounded">-{discountPercentage}%</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Add this to your order!</p>
                    <button className="w-full mt-2 py-2 bg-blue-600 text-white text-sm rounded-lg">
                      Add to Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
