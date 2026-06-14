'use client'

import React, { useState } from 'react'
import { 
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FireIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  MapPinIcon,
  TagIcon,
  PhotoIcon,
  LinkIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { 
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid'

interface CommunityPost {
  id: string
  author: {
    name: string
    avatar: string
    type: 'restaurant' | 'employee' | 'vendor' | 'admin'
    verified: boolean
    trustScore?: number
    location: string
  }
  content: string
  images?: string[]
  category: 'hiring' | 'supplier-review' | 'business-tips' | 'networking' | 'question' | 'announcement'
  tags: string[]
  timestamp: string
  likes: number
  comments: number
  shares: number
  isLiked: boolean
  isBookmarked: boolean
  isPinned?: boolean
  isSponsored?: boolean
}

interface Comment {
  id: string
  postId: string
  author: {
    name: string
    avatar: string
    type: 'restaurant' | 'employee' | 'vendor'
    verified: boolean
  }
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
  replies?: Comment[]
}

interface ForumTopic {
  id: string
  title: string
  description: string
  category: string
  posts: number
  followers: number
  lastActivity: string
  isFollowing: boolean
}

const mockPosts: CommunityPost[] = [
  {
    id: '1',
    author: {
      name: 'Spice Garden Restaurant',
      avatar: 'https://via.placeholder.com/50',
      type: 'restaurant',
      verified: true,
      trustScore: 4.8,
      location: 'Mumbai, Maharashtra'
    },
    content: 'Looking for recommendations for reliable vegetable suppliers in Mumbai area. We need fresh produce delivered 3x per week. Quality is our priority! Anyone working with good suppliers?',
    category: 'supplier-review',
    tags: ['suppliers', 'vegetables', 'mumbai', 'fresh-produce'],
    timestamp: '2 hours ago',
    likes: 24,
    comments: 12,
    shares: 3,
    isLiked: false,
    isBookmarked: true,
    isPinned: false
  },
  {
    id: '2',
    author: {
      name: 'Chef Ramesh Kumar',
      avatar: 'https://via.placeholder.com/50',
      type: 'employee',
      verified: true,
      location: 'Delhi, NCR'
    },
    content: 'Just completed food safety certification! Sharing my experience - the online course was comprehensive and the practical session really helped. Highly recommend for all kitchen staff.',
    images: ['https://via.placeholder.com/400x200'],
    category: 'business-tips',
    tags: ['food-safety', 'certification', 'training', 'kitchen-staff'],
    timestamp: '4 hours ago',
    likes: 45,
    comments: 18,
    shares: 7,
    isLiked: true,
    isBookmarked: false
  },
  {
    id: '3',
    author: {
      name: 'Fresh Farm Supplies',
      avatar: 'https://via.placeholder.com/50',
      type: 'vendor',
      verified: true,
      trustScore: 4.9,
      location: 'Pan India'
    },
    content: '🎉 Special offer for RestaurantHub community! 15% off on all organic vegetables this week. Free delivery for orders above ₹5000. Use code: FRESH15',
    category: 'announcement',
    tags: ['special-offer', 'organic', 'vegetables', 'discount'],
    timestamp: '6 hours ago',
    likes: 67,
    comments: 25,
    shares: 32,
    isLiked: false,
    isBookmarked: false,
    isSponsored: true
  },
  {
    id: '4',
    author: {
      name: 'Cafe Delight',
      avatar: 'https://via.placeholder.com/50',
      type: 'restaurant',
      verified: true,
      trustScore: 4.6,
      location: 'Bangalore, Karnataka'
    },
    content: 'Urgently hiring experienced barista for our new outlet in Koramangala. Must have 2+ years experience with espresso machines. Competitive salary + benefits. DM for details.',
    category: 'hiring',
    tags: ['hiring', 'barista', 'bangalore', 'urgent', 'koramangala'],
    timestamp: '1 day ago',
    likes: 15,
    comments: 8,
    shares: 12,
    isLiked: false,
    isBookmarked: true
  }
]

const mockComments: Comment[] = [
  {
    id: '1',
    postId: '1',
    author: {
      name: 'Green Valley Suppliers',
      avatar: 'https://via.placeholder.com/40',
      type: 'vendor',
      verified: true
    },
    content: 'We supply to 50+ restaurants in Mumbai. Fresh produce with same-day delivery. Would love to connect!',
    timestamp: '1 hour ago',
    likes: 5,
    isLiked: false
  },
  {
    id: '2',
    postId: '1',
    author: {
      name: 'Taste of India',
      avatar: 'https://via.placeholder.com/40',
      type: 'restaurant',
      verified: true
    },
    content: 'I\'ve been working with Organic Farm Direct for 2 years. Great quality and reliable delivery. Highly recommend!',
    timestamp: '30 minutes ago',
    likes: 8,
    isLiked: true
  }
]

const mockTopics: ForumTopic[] = [
  {
    id: '1',
    title: 'Hiring & Recruitment',
    description: 'Find and share tips about hiring restaurant staff',
    category: 'HR',
    posts: 234,
    followers: 1520,
    lastActivity: '2 minutes ago',
    isFollowing: true
  },
  {
    id: '2',
    title: 'Supplier Reviews',
    description: 'Share experiences with vendors and suppliers',
    category: 'Business',
    posts: 456,
    followers: 2180,
    lastActivity: '15 minutes ago',
    isFollowing: false
  },
  {
    id: '3',
    title: 'Business Growth Tips',
    description: 'Strategies and tips for growing your restaurant business',
    category: 'Growth',
    posts: 189,
    followers: 980,
    lastActivity: '1 hour ago',
    isFollowing: true
  },
  {
    id: '4',
    title: 'Equipment & Technology',
    description: 'Discuss kitchen equipment, POS systems, and technology',
    category: 'Technology',
    posts: 312,
    followers: 1450,
    lastActivity: '3 hours ago',
    isFollowing: false
  }
]

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('feed')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [commentContent, setCommentContent] = useState('')

  const categories = [
    { id: 'all', name: 'All Posts', icon: TagIcon },
    { id: 'hiring', name: 'Hiring', icon: UserGroupIcon },
    { id: 'supplier-review', name: 'Supplier Reviews', icon: StarIcon },
    { id: 'business-tips', name: 'Business Tips', icon: FireIcon },
    { id: 'networking', name: 'Networking', icon: ChatBubbleLeftRightIcon },
    { id: 'announcement', name: 'Announcements', icon: ExclamationTriangleIcon }
  ]

  const filteredPosts = mockPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const handleLikePost = (postId: string) => {
    // Handle like functionality
    logger.info('Liked post:', postId)
  }

  const handleBookmarkPost = (postId: string) => {
    // Handle bookmark functionality
    logger.info('Bookmarked post:', postId)
  }

  const handleSharePost = (postId: string) => {
    // Handle share functionality
    logger.info('Shared post:', postId)
  }

  const renderVerificationBadge = (author: CommunityPost['author']) => (
    <div className="flex items-center space-x-1">
      {author.verified && <CheckBadgeIcon className="h-4 w-4 text-blue-500" />}
      {author.trustScore && (
        <div className="flex items-center space-x-1">
          <StarSolidIcon className="h-3 w-3 text-yellow-400" />
          <span className="text-xs text-gray-600">{author.trustScore}</span>
        </div>
      )}
    </div>
  )

  const renderPost = (post: CommunityPost) => (
    <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
              {renderVerificationBadge(post.author)}
              {post.isSponsored && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Sponsored
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                post.author.type === 'restaurant' ? 'bg-green-100 text-green-800' :
                post.author.type === 'employee' ? 'bg-blue-100 text-blue-800' :
                post.author.type === 'vendor' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {post.author.type}
              </span>
              <span>•</span>
              <span>{post.author.location}</span>
              <span>•</span>
              <span>{post.timestamp}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {post.isPinned && (
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              Pinned
            </span>
          )}
          <button className="p-1 hover:bg-gray-100 rounded-full">
            <EllipsisHorizontalIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-900 mb-3">{post.content}</p>
        
        {post.images && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {post.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt="Post content"
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Category Badge */}
        <span className={`inline-flex px-3 py-1 text-xs rounded-full ${
          post.category === 'hiring' ? 'bg-green-100 text-green-800' :
          post.category === 'supplier-review' ? 'bg-blue-100 text-blue-800' :
          post.category === 'business-tips' ? 'bg-purple-100 text-purple-800' :
          post.category === 'networking' ? 'bg-yellow-100 text-yellow-800' :
          post.category === 'announcement' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {post.category.replace('-', ' ')}
        </span>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleLikePost(post.id)}
            className={`flex items-center space-x-1 ${
              post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            {post.isLiked ? (
              <HeartSolidIcon className="h-5 w-5" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
            <span className="text-sm">{post.likes}</span>
          </button>

          <button
            onClick={() => setSelectedPost(post)}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            <span className="text-sm">{post.comments}</span>
          </button>

          <button
            onClick={() => handleSharePost(post.id)}
            className="flex items-center space-x-1 text-gray-500 hover:text-green-500"
          >
            <ShareIcon className="h-5 w-5" />
            <span className="text-sm">{post.shares}</span>
          </button>
        </div>

        <button
          onClick={() => handleBookmarkPost(post.id)}
          className={`${
            post.isBookmarked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
          }`}
        >
          {post.isBookmarked ? (
            <BookmarkSolidIcon className="h-5 w-5" />
          ) : (
            <BookmarkIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  )

  const renderNewPostModal = () => {
    if (!showNewPost) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
              <button
                onClick={() => setShowNewPost(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="question">Question</option>
                  <option value="hiring">Hiring</option>
                  <option value="supplier-review">Supplier Review</option>
                  <option value="business-tips">Business Tips</option>
                  <option value="networking">Networking</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's on your mind?
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Share your thoughts, ask questions, or offer insights..."
                />
              </div>

              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
                  <PhotoIcon className="h-5 w-5" />
                  <span>Add Photos</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
                  <LinkIcon className="h-5 w-5" />
                  <span>Add Link</span>
                </button>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowNewPost(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle post creation
                    setShowNewPost(false)
                    setNewPostContent('')
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCommentsModal = () => {
    if (!selectedPost) return null

    const postComments = mockComments.filter(comment => comment.postId === selectedPost.id)

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Comments</h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Original Post Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <img
                  src={selectedPost.author.avatar}
                  alt={selectedPost.author.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium text-gray-900">{selectedPost.author.name}</span>
                {renderVerificationBadge(selectedPost.author)}
              </div>
              <p className="text-gray-700 text-sm">{selectedPost.content.slice(0, 150)}...</p>
            </div>

            {/* Comments */}
            <div className="space-y-4 mb-6">
              {postComments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">{comment.author.name}</span>
                        {comment.author.verified && <CheckBadgeIcon className="h-3 w-3 text-blue-500" />}
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-3 mt-2">
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500">
                        <HeartIcon className="h-3 w-3" />
                        <span>{comment.likes}</span>
                      </button>
                      <button className="text-xs text-gray-500 hover:text-blue-500">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="border-t pt-4">
              <div className="flex space-x-3">
                <img
                  src="https://via.placeholder.com/40"
                  alt="Your avatar"
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Write a comment..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                      <FaceSmileIcon className="h-4 w-4" />
                      <span className="text-sm">Add emoji</span>
                    </button>
                    <button
                      onClick={() => {
                        // Handle comment submission
                        setCommentContent('')
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Community & Networking</h1>
        <p className="text-gray-600 mt-2">Connect, share insights, and grow together with the restaurant community</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('feed')}
            className={`pb-2 px-1 ${activeTab === 'feed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Community Feed
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`pb-2 px-1 ${activeTab === 'topics' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Forum Topics
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`pb-2 px-1 ${activeTab === 'trending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Trending
          </button>
        </div>
      </div>

      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <button
                onClick={() => setShowNewPost(true)}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5" />
                <span>New Post</span>
              </button>
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-left ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <category.icon className="h-4 w-4" />
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {filteredPosts.length > 0 ? (
                filteredPosts.map(renderPost)
              ) : (
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or category filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTopics.map((topic) => (
            <div key={topic.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{topic.description}</p>
                </div>
                <button
                  className={`px-3 py-1 text-xs rounded-full ${
                    topic.isFollowing
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {topic.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span>{topic.posts} posts</span>
                <span>•</span>
                <span>{topic.followers} followers</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Last activity: {topic.lastActivity}</span>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Topic →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'trending' && (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="text-center">
            <FireIcon className="mx-auto h-12 w-12 text-orange-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Trending Topics</h3>
            <p className="mt-1 text-sm text-gray-500">
              Discover what's popular in the restaurant community right now.
            </p>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">#DigitalMenus</h4>
                <p className="text-sm text-gray-600 mt-1">142 posts this week</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">#StaffShortage</h4>
                <p className="text-sm text-gray-600 mt-1">89 posts this week</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">#SustainablePackaging</h4>
                <p className="text-sm text-gray-600 mt-1">67 posts this week</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">#DeliveryPartners</h4>
                <p className="text-sm text-gray-600 mt-1">54 posts this week</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {renderNewPostModal()}
      {renderCommentsModal()}
    </div>
  )
}