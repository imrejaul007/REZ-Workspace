'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  TagIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'

interface Product {
  id: number
  name: string
  description: string
  category: string
  subcategory: string
  price: number
  unit: string
  stock: number
  minOrderQty: number
  images: string[]
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued'
  featured: boolean
  createdDate: string
  lastUpdated: string
  sku: string
  tags: string[]
  nutrition?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  certifications: string[]
  shelfLife: string
  storageTemp: string
  origin: string
  brand: string
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Organic Roma Tomatoes',
    description: 'Premium quality organic Roma tomatoes, perfect for sauces and cooking. Grown locally without pesticides.',
    category: 'Produce',
    subcategory: 'Vegetables',
    price: 4.99,
    unit: 'lb',
    stock: 500,
    minOrderQty: 10,
    images: ['/api/placeholder/400/300'],
    status: 'active',
    featured: true,
    createdDate: '2024-01-15',
    lastUpdated: '2024-03-20',
    sku: 'ORG-TOM-001',
    tags: ['organic', 'local', 'fresh', 'italian-cuisine'],
    nutrition: {
      calories: 18,
      protein: 0.9,
      carbs: 3.9,
      fat: 0.2
    },
    certifications: ['USDA Organic', 'Non-GMO'],
    shelfLife: '7-10 days',
    storageTemp: '50-55°F',
    origin: 'Florida, USA',
    brand: 'Fresh Farm Supplies'
  },
  {
    id: 2,
    name: 'Premium Aged Parmesan',
    description: '24-month aged Parmigiano-Reggiano imported directly from Italy. Perfect for fine dining establishments.',
    category: 'Dairy',
    subcategory: 'Cheese',
    price: 28.99,
    unit: 'lb',
    stock: 50,
    minOrderQty: 2,
    images: ['/api/placeholder/400/300'],
    status: 'active',
    featured: true,
    createdDate: '2024-02-01',
    lastUpdated: '2024-03-18',
    sku: 'PARM-001',
    tags: ['premium', 'imported', 'aged', 'italian'],
    nutrition: {
      calories: 110,
      protein: 10,
      carbs: 1,
      fat: 7
    },
    certifications: ['DOP Certified', 'Imported'],
    shelfLife: '6 months',
    storageTemp: '35-40°F',
    origin: 'Emilia-Romagna, Italy',
    brand: 'Artisan Imports'
  },
  {
    id: 3,
    name: 'Wild Caught Atlantic Salmon',
    description: 'Fresh wild-caught Atlantic salmon fillets, sustainably sourced. Perfect for high-end restaurants.',
    category: 'Seafood',
    subcategory: 'Fish',
    price: 24.99,
    unit: 'lb',
    stock: 25,
    minOrderQty: 5,
    images: ['/api/placeholder/400/300'],
    status: 'active',
    featured: false,
    createdDate: '2024-03-01',
    lastUpdated: '2024-03-22',
    sku: 'SALM-WC-001',
    tags: ['wild-caught', 'sustainable', 'fresh', 'premium'],
    nutrition: {
      calories: 206,
      protein: 22,
      carbs: 0,
      fat: 12
    },
    certifications: ['MSC Certified', 'Sustainable'],
    shelfLife: '3-4 days',
    storageTemp: '32-38°F',
    origin: 'North Atlantic',
    brand: 'Ocean Fresh'
  },
  {
    id: 4,
    name: 'Truffle Oil',
    description: 'Authentic white truffle oil made with real truffle extract. A must-have for gourmet dishes.',
    category: 'Pantry',
    subcategory: 'Oils & Vinegars',
    price: 45.99,
    unit: '250ml bottle',
    stock: 0,
    minOrderQty: 6,
    images: ['/api/placeholder/400/300'],
    status: 'out_of_stock',
    featured: true,
    createdDate: '2024-01-20',
    lastUpdated: '2024-03-15',
    sku: 'TRUF-OIL-001',
    tags: ['truffle', 'gourmet', 'premium', 'luxury'],
    certifications: ['Artisan Made'],
    shelfLife: '18 months',
    storageTemp: 'Room temperature',
    origin: 'Umbria, Italy',
    brand: 'Gourmet Essentials'
  },
  {
    id: 5,
    name: 'Grass-Fed Beef Tenderloin',
    description: 'Premium grass-fed beef tenderloin, dry-aged for 21 days. Exceptional quality for fine dining.',
    category: 'Meat',
    subcategory: 'Beef',
    price: 39.99,
    unit: 'lb',
    stock: 15,
    minOrderQty: 3,
    images: ['/api/placeholder/400/300'],
    status: 'active',
    featured: false,
    createdDate: '2024-02-15',
    lastUpdated: '2024-03-21',
    sku: 'BEEF-TEND-001',
    tags: ['grass-fed', 'dry-aged', 'premium', 'local'],
    nutrition: {
      calories: 250,
      protein: 26,
      carbs: 0,
      fat: 17
    },
    certifications: ['Grass-Fed', 'Hormone-Free'],
    shelfLife: '5-7 days',
    storageTemp: '32-36°F',
    origin: 'Colorado, USA',
    brand: 'Ranch Premium'
  }
]

export default function VendorProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductDetails, setShowProductDetails] = useState(false)

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      case 'discontinued': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />
      case 'inactive': return <ClockIcon className="w-4 h-4" />
      case 'out_of_stock': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'discontinued': return <ArchiveBoxIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  const getStockStatus = (stock: number, minOrderQty: number) => {
    if (stock === 0) return { status: 'out', color: 'text-red-600' }
    if (stock < minOrderQty * 2) return { status: 'low', color: 'text-yellow-600' }
    return { status: 'good', color: 'text-green-600' }
  }

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const bulkUpdateStatus = (newStatus: Product['status']) => {
    setProducts(prev => prev.map(product =>
      selectedProducts.includes(product.id) 
        ? { ...product, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] }
        : product
    ))
    setSelectedProducts([])
  }

  const deleteSelectedProducts = () => {
    setProducts(prev => prev.filter(product => !selectedProducts.includes(product.id)))
    setSelectedProducts([])
  }

  const getProductStats = () => {
    return {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      lowStock: products.filter(p => {
        const stockStatus = getStockStatus(p.stock, p.minOrderQty)
        return stockStatus.status === 'low' || stockStatus.status === 'out'
      }).length,
      featured: products.filter(p => p.featured).length
    }
  }

  const stats = getProductStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-1">Manage your product catalog and inventory</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Product
              </button>
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TagIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-gray-900">{stats.featured}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Produce">Produce</option>
                <option value="Meat">Meat</option>
                <option value="Seafood">Seafood</option>
                <option value="Dairy">Dairy</option>
                <option value="Pantry">Pantry</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-blue-800 font-medium">
                {selectedProducts.length} product(s) selected
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => bulkUpdateStatus('active')}
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  Activate
                </button>
                <button
                  onClick={() => bulkUpdateStatus('inactive')}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Deactivate
                </button>
                <button
                  onClick={deleteSelectedProducts}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock, product.minOrderQty)
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  {product.featured && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Featured
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category} • {product.subcategory}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {getStatusIcon(product.status)}
                      <span className="ml-1 capitalize">{product.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      ${product.price}
                      <span className="text-sm font-normal text-gray-600">/{product.unit}</span>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${stockStatus.color}`}>
                        {product.stock} in stock
                      </p>
                      <p className="text-xs text-gray-500">Min order: {product.minOrderQty}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {product.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{product.tags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-gray-500">
                      Updated {new Date(product.lastUpdated).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setShowProductDetails(true)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first product'
              }
            </p>
            <button
              onClick={() => setShowAddProduct(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Product
            </button>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
                <button
                  onClick={() => setShowProductDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Product Details</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">SKU:</span> {selectedProduct.sku}</p>
                      <p><span className="font-medium">Category:</span> {selectedProduct.category} • {selectedProduct.subcategory}</p>
                      <p><span className="font-medium">Price:</span> ${selectedProduct.price}/{selectedProduct.unit}</p>
                      <p><span className="font-medium">Stock:</span> {selectedProduct.stock} units</p>
                      <p><span className="font-medium">Min Order:</span> {selectedProduct.minOrderQty} {selectedProduct.unit}</p>
                      <p><span className="font-medium">Brand:</span> {selectedProduct.brand}</p>
                      <p><span className="font-medium">Origin:</span> {selectedProduct.origin}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Storage & Shelf Life</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Shelf Life:</span> {selectedProduct.shelfLife}</p>
                      <p><span className="font-medium">Storage Temp:</span> {selectedProduct.storageTemp}</p>
                    </div>
                  </div>

                  {selectedProduct.nutrition && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Nutrition (per 100g)</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>Calories: {selectedProduct.nutrition.calories}</p>
                        <p>Protein: {selectedProduct.nutrition.protein}g</p>
                        <p>Carbs: {selectedProduct.nutrition.carbs}g</p>
                        <p>Fat: {selectedProduct.nutrition.fat}g</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{selectedProduct.description}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <h3 className="font-medium text-gray-900 w-full mb-2">Certifications</h3>
                {selectedProduct.certifications.map((cert, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}