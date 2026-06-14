'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePosts } from '@/contexts/PostsContext'
import { 
  ArrowLeftIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlusIcon,
  PhotoIcon,
  MapPinIcon,
  CalendarIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  FireIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import Breadcrumbs from '@/components/Breadcrumbs'


const trendingTopics = [
  { name: '#RestaurantWeek', posts: 245 },
  { name: '#SustainableDining', posts: 128 },
  { name: '#ChefLife', posts: 89 },
  { name: '#NewMenuItems', posts: 67 },
  { name: '#TeamBuilding', posts: 43 }
]

const categories = [
  { id: 'all', name: 'All Posts', icon: '📱' },
  { id: 'job-inquiry', name: 'Job Inquiries', icon: '💼' },
  { id: 'job-posting', name: 'Job Postings', icon: '🚀' },
  { id: 'vendor-review', name: 'Vendor Reviews', icon: '⭐' },
  { id: 'tips-advice', name: 'Tips & Advice', icon: '💡' },
  { id: 'achievement', name: 'Achievements', icon: '🏆' },
  { id: 'business-offer', name: 'Business Offers', icon: '🎯' }
]

export default function Community() {
  const router = useRouter()
  const { posts, addPost, updatePost, isLoading } = usePosts()
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPost, setNewPost] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tips & Advice')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [postType, setPostType] = useState('text')

  const handleLike = (postId: number) => {
    const post = posts.find(p => p.id === postId)
    if (post) {
      updatePost(postId, {
        isLiked: !post.isLiked,
        likes: post.isLiked ? post.likes - 1 : post.likes + 1
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).slice(0, 4 - selectedImages.length)
      setSelectedImages([...selectedImages, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

  const handleCreatePost = () => {
    if (!newPost.trim()) return
    
    const imageUrls = selectedImages.map((file, index) => URL.createObjectURL(file))
    
    const basePostData = {
      user: { 
        name: 'Current User', 
        avatar: '👤', 
        type: 'Restaurant',
        verified: false,
        location: 'Your Location'
      },
      content: newPost,
      images: imageUrls,
      time: 'Just now',
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      category: postType === 'job' ? 'Job Posting' : selectedCategory,
      tags: []
    }

    // For job posts, add job details structure
    const newPostData = postType === 'job' ? {
      ...basePostData,
      postType: 'job',
      jobDetails: {
        title: 'New Position',
        salary: '$50,000 - $60,000',
        type: 'Full-time',
        experience: '2+ years',
        location: 'Your Location',
        description: newPost
      }
    } : basePostData
    
    addPost(newPostData)
    setNewPost('')
    setSelectedImages([])
    setPostType('text')
    setShowCreatePost(false)
  }

  const filteredPosts = posts.filter(post => {
    if (activeCategory === 'all') return true
    return post.category.toLowerCase().replace(/ /g, '-') === activeCategory
  })

  const sortedPosts = filteredPosts.sort((a, b) => {
    if (sortBy === 'popular') return b.likes - a.likes
    if (sortBy === 'recent') return new Date(b.time).getTime() - new Date(a.time).getTime()
    return 0
  })

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'Restaurant': return 'text-blue-600 bg-blue-100'
      case 'Employee': return 'text-green-600 bg-green-100'
      case 'Vendor': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Community</h1>
            </div>
            
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Create Post
            </button>
          </div>
          
          <Breadcrumbs 
            items={[
              { name: 'Dashboard', href: '/dashboard/restaurant' },
              { name: 'Community', current: true }
            ]}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
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
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-blue-600 text-sm font-medium">{topic.name}</span>
                    <span className="text-gray-500 text-xs">{topic.posts} posts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Community Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Total Members</span>
                  <span className="text-gray-900 font-medium">12,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Posts Today</span>
                  <span className="text-gray-900 font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Active Now</span>
                  <span className="text-green-600 font-medium">1,234</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                  </select>
                  
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                    <FunnelIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Create Post Modal/Form */}
            {showCreatePost && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Post</h3>
                
                {/* Post Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPostType('text')}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        postType === 'text' 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      📝 Text Post
                    </button>
                    <button
                      onClick={() => setPostType('image')}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        postType === 'image' 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      📸 Image Post
                    </button>
                    <button
                      onClick={() => setPostType('job')}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        postType === 'job' 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      💼 Job Post
                    </button>
                  </div>
                </div>

                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder={
                    postType === 'job' 
                      ? "Describe the job opportunity, requirements, and benefits..." 
                      : "What's on your mind? Share with the community..."
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
                />

                {/* Image Upload Section */}
                {(postType === 'image' || postType === 'job') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Images {postType === 'job' && '(Optional)'}
                    </label>
                    
                    {/* Image Preview */}
                    {selectedImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
                    {selectedImages.length < 4 && (
                      <div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          <div className="text-center">
                            <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Click to upload images
                            </p>
                            <p className="text-xs text-gray-400">
                              Up to 4 images ({4 - selectedImages.length} remaining)
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Tips & Advice">Tips & Advice</option>
                    <option value="Job Inquiry">Job Inquiry</option>
                    <option value="Vendor Review">Vendor Review</option>
                    <option value="Achievement">Achievement</option>
                    <option value="Business Offer">Business Offer</option>
                    {postType === 'job' && <option value="Job Posting">Job Posting</option>}
                  </select>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <PhotoIcon className="w-5 h-5" />
                      <span>Photo</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <MapPinIcon className="w-5 h-5" />
                      <span>Location</span>
                    </button>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowCreatePost(false)
                        setSelectedImages([])
                        setPostType('text')
                        setNewPost('')
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreatePost}
                      disabled={!newPost.trim() || (postType === 'image' && selectedImages.length === 0)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading community posts...</p>
                  </div>
                </div>
              ) : sortedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
                  <p className="text-gray-500 mb-4">Be the first to share something with the community!</p>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Post
                  </button>
                </div>
              ) : (
                sortedPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm">
                  {/* Post Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                          {post.user.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
                            {post.user.verified && (
                              <span className="text-blue-500">✓</span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(post.user.type)}`}>
                              {post.user.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{post.time}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              {post.user.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          post.category === 'Job Inquiry' ? 'bg-blue-100 text-blue-800' :
                          post.category === 'Job Posting' ? 'bg-emerald-100 text-emerald-800' :
                          post.category === 'Vendor Review' ? 'bg-green-100 text-green-800' :
                          post.category === 'Tips & Advice' ? 'bg-yellow-100 text-yellow-800' :
                          post.category === 'Achievement' ? 'bg-purple-100 text-purple-800' :
                          post.category === 'Business Offer' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-6 pb-4">
                    <p className="text-gray-900 leading-relaxed mb-3">{post.content}</p>
                    
                    {/* Job Details Card */}
                    {post.postType === 'job' && post.jobDetails && (
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-semibold text-emerald-900 mb-1">{post.jobDetails.title}</h4>
                            <p className="text-emerald-700 text-sm mb-2">{post.jobDetails.location}</p>
                          </div>
                          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                            {post.jobDetails.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-emerald-600 text-sm font-medium">Salary: </span>
                            <span className="text-emerald-900 font-semibold">{post.jobDetails.salary}</span>
                          </div>
                          <div>
                            <span className="text-emerald-600 text-sm font-medium">Experience: </span>
                            <span className="text-emerald-900">{post.jobDetails.experience}</span>
                          </div>
                        </div>
                        <p className="text-emerald-800 text-sm mb-4">{post.jobDetails.description}</p>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => alert('Apply feature - would redirect to job application')}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                          >
                            Apply Now
                          </button>
                          <button 
                            onClick={() => alert('Job saved for later!')}
                            className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                          >
                            Save Job
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag, index) => (
                          <span key={index} className="text-blue-600 text-sm">#{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                      <div className={`grid gap-2 mb-4 ${
                        post.images.length === 1 ? 'grid-cols-1' :
                        post.images.length === 2 ? 'grid-cols-2' :
                        'grid-cols-2'
                      }`}>
                        {post.images.map((image, index) => (
                          <div key={index} className="bg-gray-200 rounded-lg aspect-video overflow-hidden">
                            {image.startsWith('blob:') || image.startsWith('/api/placeholder') ? (
                              image.startsWith('blob:') ? (
                                <img
                                  src={image}
                                  alt={`Post image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <PhotoIcon className="w-8 h-8 text-gray-500" />
                                </div>
                              )
                            ) : (
                              <img
                                src={image}
                                alt={`Post image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="px-6 py-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => handleLike(post.id)}
                          className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                        >
                          {post.isLiked ? (
                            <HeartSolidIcon className="w-5 h-5 text-red-500" />
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
                      
                      <button className="text-gray-400 hover:text-gray-600">
                        <span className="text-xl">•••</span>
                      </button>
                    </div>
                  </div>
                </div>
                ))
              )}
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