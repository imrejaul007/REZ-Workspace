'use client'

import { useState, useEffect } from 'react'
import { usePosts } from '@/contexts/PostsContext'
import { useToast } from '@/components/ui/Toast'
import { apiService } from '@/lib/apiService'
import { 
  HomeIcon,
  BriefcaseIcon,
  ShoppingCartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
  PlusIcon,
  PhotoIcon,
  LinkIcon,
  MapPinIcon,
  CalendarIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

const navigationItems = [
  { name: 'Home', icon: HomeIcon, id: 'home' },
  { name: 'Jobs', icon: BriefcaseIcon, id: 'jobs' },
  { name: 'Marketplace', icon: ShoppingCartIcon, id: 'marketplace' },
  { name: 'Profile', icon: UserIcon, id: 'profile' },
  { name: 'Find Employees', icon: MagnifyingGlassIcon, id: 'hiring' },
  { name: 'Employees', icon: UserCircleIcon, id: 'employees' },
]

const communityPosts = [
  {
    id: 1,
    user: { name: 'Ocean View Diner', avatar: '🍽️', type: 'Restaurant' },
    content: 'Just launched our new weekend brunch menu! Looking for experienced brunch cooks to join our team.',
    time: '2 hours ago',
    likes: 24,
    comments: 8,
    shares: 3,
    isLiked: false,
    category: 'Job Inquiry'
  },
  {
    id: 2,
    user: { name: 'Chef Maria Santos', avatar: '👩‍🍳', type: 'Employee' },
    content: 'Sharing my experience working with Fresh Farm Supplies - excellent quality and reliable delivery!',
    time: '4 hours ago',
    likes: 18,
    comments: 12,
    shares: 6,
    isLiked: true,
    category: 'Vendor Review'
  }
]

export default function RestaurantDashboard() {
  const router = useRouter()
  const { addPost, isLoading } = usePosts()
  const { showToast } = useToast()
  const [activeSection, setActiveSection] = useState('home')
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [newPost, setNewPost] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      router.push('/auth/login')
    }
  }

  const toggleLike = (postId: number) => {
    const newLikedPosts = new Set(likedPosts)
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId)
    } else {
      newLikedPosts.add(postId)
    }
    setLikedPosts(newLikedPosts)
  }

  const handleCreatePost = async () => {
    if (!newPost.trim()) return
    if (isPosting) return
    
    setIsPosting(true)
    
    try {
      const result = await addPost({
        user: { 
          name: 'Tasty Bites Restaurant', 
          avatar: '🍴', 
          type: 'Restaurant',
          verified: true,
          location: 'Your Location'
        },
        content: newPost,
        images: [],
        time: 'Just now',
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        category: 'Update',
        tags: []
      })
      
      if (result.success) {
        setNewPost('')
        showToast({
          type: 'success',
          title: 'Post Created!',
          message: 'Your post has been shared with the community'
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Post Failed',
        message: 'Failed to create post'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const renderHome = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Good Evening, Tasty Bites! 🌟</h1>
              <p className="text-white/80 text-lg">Ready to manage your restaurant operations today?</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-sm">
                🏪
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Jobs</p>
              <p className="text-3xl font-bold text-gray-900">12</p>
              <p className="text-green-600 text-sm">+3 this week</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BriefcaseIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">New Orders</p>
              <p className="text-3xl font-bold text-gray-900">28</p>
              <p className="text-green-600 text-sm">+15% today</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <ShoppingCartIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Team Members</p>
              <p className="text-3xl font-bold text-gray-900">25</p>
              <p className="text-blue-600 text-sm">3 online now</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹2.4L</p>
              <p className="text-green-600 text-sm">+8% this month</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Create Post - Left Column */}
        <div className="lg:col-span-2">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share with Community</h3>
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🏪</span>
              </div>
              <textarea 
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="flex-1 bg-gray-50/70 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="What's happening in your restaurant? Share updates, job openings, or ask for advice..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <PhotoIcon className="w-5 h-5" />
                  <span className="hidden sm:block">Photo</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all">
                  <BriefcaseIcon className="w-5 h-5" />
                  <span className="hidden sm:block">Job</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
                  <MapPinIcon className="w-5 h-5" />
                  <span className="hidden sm:block">Location</span>
                </button>
              </div>
              <button 
                onClick={handleCreatePost}
                disabled={!newPost.trim() || isPosting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {isPosting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <span>Post</span>
                    <PlusIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Community Posts Feed */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Community Feed</h3>
            {communityPosts.map((post) => (
              <div key={post.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Post Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center text-xl shadow-md">
                        {post.user.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{post.user.name}</h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                          <span>{post.time}</span>
                          <span>•</span>
                          <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            {post.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-6">
                  <p className="text-gray-800 leading-relaxed mb-4">{post.content}</p>
                </div>

                {/* Post Actions */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-6">
                      <button 
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all ${
                          likedPosts.has(post.id) || post.isLiked 
                            ? 'text-red-500 bg-red-50' 
                            : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        {likedPosts.has(post.id) || post.isLiked ? (
                          <HeartSolidIcon className="w-5 h-5" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                        <span className="font-medium">{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-2 px-3 py-2 rounded-xl text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-all">
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        <span className="font-medium">{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-2 px-3 py-2 rounded-xl text-gray-500 hover:text-green-500 hover:bg-green-50 transition-all">
                        <ShareIcon className="w-5 h-5" />
                        <span className="font-medium">{post.shares}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/jobs/create')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-blue-50 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center transition-colors">
                  <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Post a Job</p>
                  <p className="text-sm text-gray-500">Find new team members</p>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/marketplace')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-green-50 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center transition-colors">
                  <ShoppingCartIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Browse Marketplace</p>
                  <p className="text-sm text-gray-500">Order supplies & equipment</p>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/dashboard/restaurant/community')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-purple-50 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center transition-colors">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Join Community</p>
                  <p className="text-sm text-gray-500">Connect with other restaurants</p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">New employee application</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <ShoppingCartIcon className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">Order delivered successfully</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <HeartIcon className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">Your post got 15 likes</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'home': return renderHome()
      case 'jobs': return <div className="text-center py-8 text-gray-600">Jobs section coming soon...</div>
      case 'marketplace': return <div className="text-center py-8 text-gray-600">Marketplace section coming soon...</div>
      case 'profile': return <div className="text-center py-8 text-gray-600">Profile section coming soon...</div>
      case 'hiring': return <div className="text-center py-8 text-gray-600">Employee search coming soon...</div>
      case 'employees': return <div className="text-center py-8 text-gray-600">Employee management coming soon...</div>
      default: return renderHome()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Top Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">🍽️</span>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    RestaurantHub
                  </div>
                  <div className="text-xs text-gray-500 -mt-1">Restaurant Dashboard</div>
                </div>
              </div>
              
              {/* Modern Navigation Tabs */}
              <nav className="hidden lg:flex space-x-2">
                {navigationItems.slice(0, 6).map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'marketplace') {
                          router.push('/marketplace')
                        } else {
                          setActiveSection(item.id)
                        }
                      }}
                      className={`relative flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-105' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 hover:shadow-md backdrop-blur-sm'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-white' : ''}`} />
                      <span className="hidden xl:block">{item.name}</span>
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Quick Actions */}
              <div className="hidden md:flex items-center space-x-2">
                <button 
                  onClick={() => router.push('/notifications')}
                  className="relative p-2.5 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <BellIcon className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></span>
                </button>
                
                <button
                  onClick={() => router.push('/messages')}
                  className="relative p-2.5 rounded-xl text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200 group"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => router.push('/dashboard/restaurant/settings')}
                  className="relative p-2.5 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 group"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-semibold text-gray-900">Tasty Bites</div>
                    <div className="text-xs text-gray-500">Restaurant Owner</div>
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200">
                      <span className="text-white font-bold text-lg">🏪</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Mobile Navigation */}
      <div className="lg:hidden bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="flex overflow-x-auto py-3 px-4 space-x-2 scrollbar-hide">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'marketplace') {
                    router.push('/marketplace')
                  } else {
                    setActiveSection(item.id)
                  }
                }}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-600 bg-white/60 hover:bg-white/80'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content with Modern Styling */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}