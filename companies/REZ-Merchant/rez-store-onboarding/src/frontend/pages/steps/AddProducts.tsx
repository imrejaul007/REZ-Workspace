import React, { useState, useRef, useCallback } from 'react';
import { Package, Upload, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';

interface Product {
  name: string;
  sku: string;
  category: string;
  price: number;
  taxRate: number;
  unit: string;
  stockQuantity: number;
}

interface AddProductsProps {
  storeId: string;
  initialData?: { products?: Product[] };
  onSubmit: (data: { products: Product[] }) => void;
  onSkip?: () => void;
  isLoading?: boolean;
  onImportProducts?: (products: Partial<Product>[]) => Promise<{ imported: number; errors: string[] }>;
}

export const AddProducts: React.FC<AddProductsProps> = ({
  storeId,
  initialData,
  onSubmit,
  onSkip,
  isLoading = false,
  onImportProducts,
}) => {
  const [products, setProducts] = useState<Product[]>(initialData?.products || []);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: '',
    price: 0,
    taxRate: 18,
    unit: 'piece',
    stockQuantity: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Electronics',
    'Groceries',
    'Clothing',
    'Home & Kitchen',
    'Books',
    'Sports',
    'Beauty',
    'Toys',
    'Furniture',
    'Other',
  ];

  const units = ['piece', 'kg', 'g', 'litre', 'ml', 'dozen', 'pack', 'box', 'meter', 'set'];

  const validateProduct = (product: Partial<Product>): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!product.name?.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!product.sku?.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (!product.category?.trim()) {
      newErrors.category = 'Category is required';
    }
    if (product.price === undefined || product.price < 0) {
      newErrors.price = 'Valid price is required';
    }
    if (product.taxRate === undefined || product.taxRate < 0 || product.taxRate > 100) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }

    return newErrors;
  };

  const handleAddProduct = () => {
    const validationErrors = validateProduct(newProduct);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setProducts(prev => [...prev, newProduct as Product]);
    setNewProduct({
      name: '',
      sku: '',
      category: '',
      price: 0,
      taxRate: 18,
      unit: 'piece',
      stockQuantity: 0,
    });
    setErrors({});
    setShowAddForm(false);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      // In production, parse the file (CSV/Excel) here
      // For now, simulate import
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate parsed products from file
      const simulatedProducts: Product[] = [
        { name: 'Sample Product 1', sku: 'SKU001', category: 'Electronics', price: 999, taxRate: 18, unit: 'piece', stockQuantity: 10 },
        { name: 'Sample Product 2', sku: 'SKU002', category: 'Groceries', price: 199, taxRate: 5, unit: 'kg', stockQuantity: 50 },
      ];

      if (onImportProducts) {
        const result = await onImportProducts(simulatedProducts);
        setImportResult(result);
      } else {
        setProducts(prev => [...prev, ...simulatedProducts]);
        setImportResult({ imported: simulatedProducts.length, errors: [] });
      }
    } catch (error) {
      setImportResult({ imported: 0, errors: ['Failed to import file. Please check the format.'] });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = () => {
    onSubmit({ products });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Add Products</h2>
        <p className="text-gray-600 mt-2">
          Import products from a file or add them manually
        </p>
      </div>

      {/* Import Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Products
        </h3>

        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isImporting ? 'Importing...' : 'Choose File'}
          </button>
          <span className="text-sm text-gray-500">
            Supports CSV, Excel (.xlsx, .xls)
          </span>
        </div>

        {importResult && (
          <div className={`mt-4 p-4 rounded-lg ${importResult.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center gap-2">
              {importResult.errors.length > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <span className="font-medium">
                {importResult.imported} products imported
              </span>
            </div>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                {importResult.errors.slice(0, 5).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li>...and {importResult.errors.length - 5} more errors</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Manual Add Section */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Manual Entry ({products.length} products)
        </h3>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">New Product</h4>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setErrors({});
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newProduct.name}
                onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newProduct.sku}
                onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g., PRD-001"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.sku ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.sku && <p className="mt-1 text-sm text-red-500">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={newProduct.category}
                onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={newProduct.price}
                onChange={e => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <select
                value={newProduct.taxRate}
                onChange={e => setNewProduct(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={newProduct.unit}
                onChange={e => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                value={newProduct.stockQuantity}
                onChange={e => setNewProduct(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setErrors({});
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddProduct}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Product
            </button>
          </div>
        </div>
      )}

      {/* Product List */}
      {products.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Stock</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{product.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">Rs. {product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{product.stockQuantity} {product.unit}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No products added yet</p>
          <p className="text-sm">Import a file or add products manually</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t mt-8">
        <button
          type="button"
          onClick={onSkip}
          className="text-gray-600 hover:text-gray-800 font-medium"
          disabled={isLoading}
        >
          Skip for now
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : products.length > 0 ? (
            `Continue (${products.length} products)`
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
};

export default AddProducts;
