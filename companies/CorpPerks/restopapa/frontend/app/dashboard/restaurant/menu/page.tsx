'use client'

import React, { useState } from 'react'
import { 
  Plus, 
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Upload,
  Download,
  Grid,
  List,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Utensils,
  Tag,
  DollarSign,
  Package
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  category: string
  price: number
  originalPrice?: number
  image: string
  ingredients: string[]
  allergens: string[]
  isVegan: boolean
  isGlutenFree: boolean
  isSpicy: boolean
  preparationTime: number
  calories?: number
  status: 'available' | 'unavailable' | 'out_of_stock'
  popularity: number
  rating: number
  reviews: number
}

const RestaurantMenu = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Mock menu data
  const mockMenuItems: MenuItem[] = [
    {
      id: 'item-1',
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice cooked with tender chicken, saffron, and exotic spices',
      category: 'Main Course',
      price: 350,
      originalPrice: 400,
      image: '/api/placeholder/300/200',
      ingredients: ['Basmati Rice', 'Chicken', 'Saffron', 'Onions', 'Yogurt'],
      allergens: ['Dairy'],
      isVegan: false,
      isGlutenFree: true,
      isSpicy: true,
      preparationTime: 45,
      calories: 650,
      status: 'available',
      popularity: 95,
      rating: 4.7,
      reviews: 234
    },
    {
      id: 'item-2',
      name: 'Paneer Tikka',
      description: 'Marinated cottage cheese cubes grilled to perfection with bell peppers',
      category: 'Appetizer',
      price: 280,
      image: '/api/placeholder/300/200',
      ingredients: ['Paneer', 'Bell Peppers', 'Yogurt', 'Spices'],
      allergens: ['Dairy'],
      isVegan: false,
      isGlutenFree: true,
      isSpicy: false,
      preparationTime: 25,
      calories: 320,
      status: 'available',
      popularity: 88,
      rating: 4.5,
      reviews: 156
    },
    {
      id: 'item-3',
      name: 'Dal Makhani',
      description: 'Rich and creamy black lentil curry slow-cooked with butter and cream',
      category: 'Main Course',
      price: 220,
      image: '/api/placeholder/300/200',
      ingredients: ['Black Lentils', 'Butter', 'Cream', 'Tomatoes', 'Spices'],
      allergens: ['Dairy'],
      isVegan: false,
      isGlutenFree: true,
      isSpicy: false,
      preparationTime: 30,
      calories: 450,
      status: 'out_of_stock',
      popularity: 82,
      rating: 4.6,
      reviews: 189
    },
    {
      id: 'item-4',
      name: 'Masala Dosa',
      description: 'Crispy fermented rice crepe filled with spiced potato curry',
      category: 'South Indian',
      price: 180,
      image: '/api/placeholder/300/200',
      ingredients: ['Rice', 'Lentils', 'Potatoes', 'Onions', 'Spices'],
      allergens: [],
      isVegan: true,
      isGlutenFree: true,
      isSpicy: true,
      preparationTime: 20,
      calories: 380,
      status: 'available',
      popularity: 75,
      rating: 4.3,
      reviews: 98
    }
  ]

  const categories = ['all', ...Array.from(new Set(mockMenuItems.map(item => item.category)))]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'unavailable': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />
      case 'unavailable': return <Clock className="h-4 w-4" />
      case 'out_of_stock': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredItems = mockMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleItemAction = (action: string, itemId: string) => {
    logger.info(`${action} item:`, itemId)
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredItems.map((item) => (
        <div key={item.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
          <div className="relative">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2">
              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                {getStatusIcon(item.status)}
                <span className="ml-1">{item.status.replace('_', ' ')}</span>
              </span>
            </div>
            {item.originalPrice && item.originalPrice > item.price && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                {Math.round((1 - item.price / item.originalPrice) * 100)}% OFF
              </div>
            )}
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{item.rating} ({item.reviews})</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
            
            <div className="flex items-center space-x-2 mb-3">
              {item.isVegan && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  🌱 Vegan
                </span>
              )}
              {item.isGlutenFree && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  GF
                </span>
              )}
              {item.isSpicy && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  🌶️ Spicy
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                {item.originalPrice && item.originalPrice > item.price && (
                  <span className="text-sm text-gray-500 line-through">₹{item.originalPrice}</span>
                )}
              </div>
              <span className="text-sm text-gray-500">{item.preparationTime} min</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleItemAction('edit', item.id)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleItemAction('duplicate', item.id)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Duplicate Item"
              >
                <Package className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => handleItemAction('delete', item.id)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Delete Item"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img className="h-12 w-12 rounded-lg object-cover" src={item.image} alt={item.name} />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.preparationTime} min</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">₹{item.price}</div>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <div className="text-xs text-gray-500 line-through">₹{item.originalPrice}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span className="ml-1">{item.status.replace('_', ' ')}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">{item.rating} ({item.reviews})</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleItemAction('view', item.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleItemAction('edit', item.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleItemAction('delete', item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
              <p className="text-gray-600">Manage your restaurant menu items and categories</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Import Menu
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export Menu
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Utensils className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{mockMenuItems.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{mockMenuItems.filter(item => item.status === 'available').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{mockMenuItems.filter(item => item.status === 'out_of_stock').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{(mockMenuItems.reduce((sum, item) => sum + item.rating, 0) / mockMenuItems.length).toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        {viewMode === 'grid' ? renderGridView() : renderListView()}
      </div>
    </div>
  )
}

export default RestaurantMenu