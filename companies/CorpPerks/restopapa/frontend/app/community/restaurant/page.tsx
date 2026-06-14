'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlusIcon,
  PhotoIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import Breadcrumbs from '@/components/Breadcrumbs'

// Restaurant-specific community posts
const restaurantPosts = [
  {
    id: 1,
    user: { 
      name: 'Ocean View Diner', 
      avatar: '🍽️', 
      type: 'Restaurant',
      verified: true,
      location: 'Miami Beach, FL',
      followers: 1250
    },
    content: 'Looking to hire 2 experienced line cooks for our busy weekend shifts. We offer competitive pay ($18-22/hr), health benefits, and a great team environment. Experience with Mediterranean cuisine preferred. DM us if interested! #Hiring #LineCook #Miami',
    images: ['/api/placeholder/400/300'],
    time: '3 hours ago',
    likes: 47,
    comments: 12,
    shares: 8,
    isLiked: false,
    category: 'Hiring',
    tags: ['hiring', 'linecook', 'miami', 'benefits'],
    engagement: 'high'
  },
  {
    id: 2,
    user: { 
      name: 'Sunset Bistro', 
      avatar: '🌅', 
      type: 'Restaurant',
      verified: true,
      location: 'Los Angeles, CA',
      followers: 890
    },
    content: 'Just implemented a new POS system and it\'s been a game-changer! Our order accuracy is up 95% and service time reduced by 30%. For fellow restaurant owners considering an upgrade, happy to share our experience. What POS systems are you using? #RestaurantTech #POS #Efficiency',
    images: [],
    time: '6 hours ago',
    likes: 89,
    comments: 23,
    shares: 15,
    isLiked: true,
    category: 'Technology',
    tags: ['technology', 'pos', 'efficiency', 'restaurant-operations'],
    engagement: 'very-high'
  },
  {
    id: 3,
    user: { 
      name: 'Downtown Grill', 
      avatar: '🔥', 
      type: 'Restaurant',
      verified: true,
      location: 'Chicago, IL',
      followers: 2100
    },
    content: 'Celebrating our 5th anniversary this month! 🎉 Thank you to our amazing staff and loyal customers. We\'re offering 20% off all entrees this weekend. Also announcing our expansion - second location opening in Spring 2024! #Anniversary #Expansion #Celebration',
    images: ['/api/placeholder/400/250', '/api/placeholder/400/250'],
    time: '1 day ago',
    likes: 156,
    comments: 34,
    shares: 28,
    isLiked: false,
    category: 'Business News',
    tags: ['anniversary', 'expansion', 'celebration', 'milestone'],
    engagement: 'very-high'
  },
  {
    id: 4,
    user: { 
      name: 'Farm Table Restaurant', 
      avatar: '🌿', 
      type: 'Restaurant',
      verified: true,
      location: 'Portland, OR',
      followers: 567
    },
    content: 'Sustainability tip: We\'ve reduced food waste by 40% using these strategies: 1) Daily inventory tracking 2) Creative use of trim and scraps 3) Staff training on portion control 4) Partnerships with local farms for compost. What sustainability practices work for you? #Sustainability #FoodWaste #GreenRestaurant',
    images: [],
    time: '2 days ago',
    likes: 73,
    comments: 18,
    shares: 22,
    isLiked: true,
    category: 'Sustainability',
    tags: ['sustainability', 'foodwaste', 'green', 'tips'],
    engagement: 'high'
  },
  {
    id: 5,
    user: { 
      name: 'Coastal Seafood House', 
      avatar: '🐟', 
      type: 'Restaurant',
      verified: true,
      location: 'San Diego, CA',
      followers: 1800
    },
    content: 'Supply chain update: Found an amazing local fishery that delivers daily fresh catch. Quality is outstanding and supporting local business feels great! For restaurants in SoCal, I highly recommend Pacific Coast Fisheries. Their customer service is top-notch. #LocalSuppliers #FreshSeafood #SanDiego',
    images: ['/api/placeholder/400/200'],
    time: '3 days ago',
    likes: 92,
    comments: 15,
    shares: 11,
    isLiked: false,
    category: 'Suppliers',
    tags: ['suppliers', 'seafood', 'local', 'recommendation'],
    engagement: 'high'
  }
]

const restaurantTopics = [
  { name: '#StaffManagement', posts: 324, trend: 'up' },
  { name: '#MenuPlanning', posts: 198, trend: 'up' },
  { name: '#CustomerService', posts: 156, trend: 'stable' },
  { name: '#FoodCosts', posts: 143, trend: 'up' },
  { name: '#RestaurantMarketing', posts: 89, trend: 'down' },
  { name: '#KitchenEfficiency', posts: 76, trend: 'up' }
]

const categories = [
  { id: 'all', name: 'All Posts', icon: '📱', count: 234 },
  { id: 'hiring', name: 'Hiring & Jobs', icon: '💼', count: 67 },
  { id: 'technology', name: 'Technology', icon: '💻', count: 43 },
  { id: 'business-news', name: 'Business News', icon: '📈', count: 38 },
  { id: 'sustainability', name: 'Sustainability', icon: '🌱', count: 29 },
  { id: 'suppliers', name: 'Suppliers', icon: '📦', count: 25 },
  { id: 'marketing', name: 'Marketing', icon: '📢', count: 18 },
  { id: 'events', name: 'Events', icon: '🎉', count: 14 }
]

export default function RestaurantCommunity() {
  const router = useRouter()
  const [posts, setPosts] = useState(restaurantPosts)
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ))
  }

  const filteredPosts = posts.filter(post => {
    if (activeCategory === 'all') return true
    return post.category.toLowerCase().replace(/ /g, '-') === activeCategory
  })

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'very-high': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      default: return 'border-l-gray-300 bg-white'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Hiring': 'bg-blue-100 text-blue-800',
      'Technology': 'bg-purple-100 text-purple-800',
      'Business News': 'bg-green-100 text-green-800',
      'Sustainability': 'bg-emerald-100 text-emerald-800',
      'Suppliers': 'bg-orange-100 text-orange-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Events': 'bg-yellow-100 text-yellow-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Restaurant Community</h1>
                <p className="text-sm text-gray-600">Connect with fellow restaurant owners and managers</p>
              </div>
            </div>
            
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Share Update
            </button>
          </div>
          
          <Breadcrumbs 
            items={[
              { name: 'Dashboard', href: '/dashboard/restaurant' },
              { name: 'Community', href: '/community' },
              { name: 'Restaurant Community', current: true }
            ]}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Restaurant Network</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Active Restaurants</span>
                  <span className="text-gray-900 font-medium">3,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Posts Today</span>
                  <span className="text-gray-900 font-medium">89</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Jobs Posted</span>
                  <span className="text-green-600 font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Active Discussions</span>
                  <span className="text-blue-600 font-medium">67</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5" />
                Trending Topics
              </h3>
              <div className="space-y-2">
                {restaurantTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-blue-600 text-sm font-medium">{topic.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-xs">{topic.posts}</span>
                      <span className={`text-xs ${
                        topic.trend === 'up' ? 'text-green-500' : 
                        topic.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {topic.trend === 'up' ? '↗' : topic.trend === 'down' ? '↘' : '→'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Resources */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Featured Resources</h3>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900">Restaurant Management Guide</h4>
                  <p className="text-xs text-gray-600 mt-1">Best practices for running a successful restaurant</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900">Industry Report 2024</h4>
                  <p className="text-xs text-gray-600 mt-1">Latest trends and market insights</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters and Sort */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeCategory === 'all' ? 'All Posts' : categories.find(c => c.id === activeCategory)?.name}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredPosts.length} posts
                  </span>
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="engagement">Highest Engagement</option>
                </select>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className={`rounded-xl shadow-sm border-l-4 ${getEngagementColor(post.engagement)}`}>
                  {/* Post Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
                          {post.user.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{post.user.name}</h3>
                            {post.user.verified && (
                              <span className="text-blue-500 text-lg">✓</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              {post.user.location}
                            </span>
                            <span>•</span>
                            <span>{post.user.followers} followers</span>
                            <span>•</span>
                            <span>{post.time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                          {post.category}
                        </span>
                        {post.engagement === 'very-high' && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                            <FireIcon className="w-3 h-3" />
                            Hot
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-6 pb-4">
                    <p className="text-gray-900 leading-relaxed mb-4">{post.content}</p>
                    
                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                      <div className={`grid gap-3 mb-4 ${
                        post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                      }`}>
                        {post.images.map((image, index) => (
                          <div key={index} className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                            <PhotoIcon className="w-8 h-8 text-gray-500" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, index) => (
                          <span key={index} className="text-blue-600 text-sm hover:underline cursor-pointer">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-2 transition-colors ${
                            post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                          }`}
                        >
                          {post.isLiked ? (
                            <HeartSolidIcon className="w-5 h-5" />
                          ) : (
                            <HeartIcon className="w-5 h-5" />
                          )}
                          <span className="text-sm font-medium">{post.likes}</span>
                        </button>
                        
                        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                          <ChatBubbleLeftIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.comments}</span>
                        </button>
                        
                        <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors">
                          <ShareIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.shares}</span>
                        </button>
                      </div>
                      
                      <button className="text-gray-400 hover:text-gray-600 px-3 py-1 rounded">
                        <span className="text-lg">•••</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center">
              <button className="bg-white text-gray-700 px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                Load More Posts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}