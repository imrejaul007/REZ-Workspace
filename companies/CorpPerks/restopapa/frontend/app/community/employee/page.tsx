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
  AcademicCapIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  ClockIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import Breadcrumbs from '@/components/Breadcrumbs'

// Employee-specific community posts
const employeePosts = [
  {
    id: 1,
    user: { 
      name: 'Maria Rodriguez', 
      avatar: '👩‍🍳', 
      type: 'Head Chef',
      verified: true,
      location: 'Miami Beach, FL',
      experience: '8 years',
      rating: 4.9
    },
    content: 'Just completed my ServSafe certification renewal! 🎓 Always important to stay up-to-date with food safety standards. The new guidelines on temperature monitoring are really comprehensive. Anyone else taking certification courses this month? #FoodSafety #ServSafe #ProfessionalDevelopment',
    images: ['/api/placeholder/400/300'],
    time: '4 hours ago',
    likes: 73,
    comments: 15,
    shares: 12,
    isLiked: true,
    category: 'Professional Development',
    tags: ['certification', 'food-safety', 'servsafe', 'professional-development'],
    skillLevel: 'expert'
  },
  {
    id: 2,
    user: { 
      name: 'James Wilson', 
      avatar: '👨‍🍳', 
      type: 'Sous Chef',
      verified: true,
      location: 'New York, NY',
      experience: '5 years',
      rating: 4.7
    },
    content: 'Knife skills tip for fellow chefs: Practice your julienne cuts with carrots for 15 minutes daily. It improved my speed by 40% in just two weeks! Start slow, focus on consistency, then build speed. The muscle memory will develop naturally. What daily practice routines work best for you? #KnifeSkills #ChefTips #Practice',
    images: [],
    time: '8 hours ago',
    likes: 124,
    comments: 34,
    shares: 28,
    isLiked: false,
    category: 'Skills & Tips',
    tags: ['knife-skills', 'chef-tips', 'practice', 'technique'],
    skillLevel: 'intermediate'
  },
  {
    id: 3,
    user: { 
      name: 'Sarah Chen', 
      avatar: '👩‍🍳', 
      type: 'Pastry Chef',
      verified: true,
      location: 'San Francisco, CA',
      experience: '6 years',
      rating: 4.8
    },
    content: 'Sharing my latest creation: Lavender honey macarons with white chocolate ganache! 💜 Took 3 attempts to get the flavor balance right. The key was using culinary lavender (not craft lavender) and letting the ganache set at room temp for 2 hours. Recipe in comments! #Pastry #Macarons #Recipe',
    images: ['/api/placeholder/400/400', '/api/placeholder/400/400'],
    time: '1 day ago',
    likes: 189,
    comments: 67,
    shares: 45,
    isLiked: true,
    category: 'Recipe Share',
    tags: ['pastry', 'macarons', 'recipe', 'lavender'],
    skillLevel: 'expert'
  },
  {
    id: 4,
    user: { 
      name: 'Mike Thompson', 
      avatar: '👨‍💼', 
      type: 'Restaurant Manager',
      verified: false,
      location: 'Chicago, IL',
      experience: '7 years',
      rating: 4.5
    },
    content: 'Career advice for those looking to move from server to management: 1) Learn the POS system inside out 2) Understand food costs and margins 3) Practice conflict resolution 4) Take hospitality courses 5) Show initiative in problem-solving. Happy to mentor anyone interested! #CareerGrowth #RestaurantManagement #Mentorship',
    images: [],
    time: '2 days ago',
    likes: 96,
    comments: 42,
    shares: 31,
    isLiked: false,
    category: 'Career Advice',
    tags: ['career-growth', 'management', 'mentorship', 'advice'],
    skillLevel: 'senior'
  },
  {
    id: 5,
    user: { 
      name: 'Lisa Garcia', 
      avatar: '👩‍🍳', 
      type: 'Line Cook',
      verified: false,
      location: 'Austin, TX',
      experience: '2 years',
      rating: 4.3
    },
    content: 'First week at my new job at Local Harvest! The team is amazing and I\'m learning so much about farm-to-table cooking. Shoutout to Chef David for being such a patient teacher. Any advice for a newer cook working with seasonal ingredients? #NewJob #FarmToTable #Learning #LineLife',
    images: ['/api/placeholder/400/250'],
    time: '3 days ago',
    likes: 58,
    comments: 23,
    shares: 8,
    isLiked: true,
    category: 'Work Experience',
    tags: ['new-job', 'farm-to-table', 'learning', 'seasonal'],
    skillLevel: 'beginner'
  }
]

const employeeTopics = [
  { name: '#ChefLife', posts: 567, trend: 'up' },
  { name: '#CulinaryTips', posts: 234, trend: 'up' },
  { name: '#JobSearch', posts: 189, trend: 'stable' },
  { name: '#RecipeShare', posts: 156, trend: 'up' },
  { name: '#KitchenStories', posts: 134, trend: 'up' },
  { name: '#ProfessionalDevelopment', posts: 89, trend: 'up' }
]

const categories = [
  { id: 'all', name: 'All Posts', icon: '📱', count: 456 },
  { id: 'skills-tips', name: 'Skills & Tips', icon: '💡', count: 123 },
  { id: 'recipe-share', name: 'Recipe Share', icon: '👨‍🍳', count: 89 },
  { id: 'career-advice', name: 'Career Advice', icon: '📈', count: 67 },
  { id: 'work-experience', name: 'Work Experience', icon: '💼', count: 54 },
  { id: 'professional-development', name: 'Learning', icon: '🎓', count: 43 },
  { id: 'job-opportunities', name: 'Job Opportunities', icon: '🔍', count: 38 },
  { id: 'industry-news', name: 'Industry News', icon: '📰', count: 25 }
]

const skillLevels = [
  { id: 'all', name: 'All Levels', color: 'text-gray-600' },
  { id: 'beginner', name: 'Beginner', color: 'text-green-600' },
  { id: 'intermediate', name: 'Intermediate', color: 'text-yellow-600' },
  { id: 'advanced', name: 'Advanced', color: 'text-orange-600' },
  { id: 'expert', name: 'Expert', color: 'text-red-600' },
  { id: 'senior', name: 'Senior', color: 'text-purple-600' }
]

export default function EmployeeCommunity() {
  const router = useRouter()
  const [posts, setPosts] = useState(employeePosts)
  const [activeCategory, setActiveCategory] = useState('all')
  const [skillFilter, setSkillFilter] = useState('all')
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
    const categoryMatch = activeCategory === 'all' || post.category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-') === activeCategory
    const skillMatch = skillFilter === 'all' || post.skillLevel === skillFilter
    return categoryMatch && skillMatch
  })

  const getSkillLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800', 
      'advanced': 'bg-orange-100 text-orange-800',
      'expert': 'bg-red-100 text-red-800',
      'senior': 'bg-purple-100 text-purple-800'
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Skills & Tips': 'bg-blue-100 text-blue-800',
      'Recipe Share': 'bg-orange-100 text-orange-800',
      'Career Advice': 'bg-green-100 text-green-800',
      'Work Experience': 'bg-purple-100 text-purple-800',
      'Professional Development': 'bg-indigo-100 text-indigo-800',
      'Job Opportunities': 'bg-cyan-100 text-cyan-800',
      'Industry News': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      index < Math.floor(rating) ? (
        <StarSolidIcon key={index} className="w-3 h-3 text-yellow-400" />
      ) : (
        <StarIcon key={index} className="w-3 h-3 text-gray-300" />
      )
    ))
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
                <h1 className="text-2xl font-bold text-gray-900">Employee Community</h1>
                <p className="text-sm text-gray-600">Share knowledge, learn skills, and grow your culinary career</p>
              </div>
            </div>
            
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Share Experience
            </button>
          </div>
          
          <Breadcrumbs 
            items={[
              { name: 'Dashboard', href: '/dashboard/employee' },
              { name: 'Community', href: '/community' },
              { name: 'Employee Community', current: true }
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
              <h3 className="font-semibold text-gray-900 mb-3">Community Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Active Members</span>
                  <span className="text-gray-900 font-medium">8,567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Tips Shared Today</span>
                  <span className="text-gray-900 font-medium">34</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Recipes Posted</span>
                  <span className="text-green-600 font-medium">127</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Career Discussions</span>
                  <span className="text-blue-600 font-medium">89</span>
                </div>
              </div>
            </div>

            {/* Skill Level Filter */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Skill Level</h3>
              <div className="space-y-2">
                {skillLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setSkillFilter(level.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      skillFilter === level.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-medium ${level.color}`}>{level.name}</span>
                  </button>
                ))}
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
                {employeeTopics.map((topic, index) => (
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

            {/* Learning Resources */}
            <div className="bg-gradient-to-br from-green-50 to-blue-100 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Learning Hub</h3>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900">Culinary Fundamentals</h4>
                  <p className="text-xs text-gray-600 mt-1">Master the basics with video tutorials</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900">Career Advancement</h4>
                  <p className="text-xs text-gray-600 mt-1">Tips from industry professionals</p>
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
                  {skillFilter !== 'all' && (
                    <span className={`px-2 py-1 rounded-full text-xs ${getSkillLevelColor(skillFilter)}`}>
                      {skillLevels.find(l => l.id === skillFilter)?.name}
                    </span>
                  )}
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm">
                  {/* Post Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-2xl">
                          {post.user.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{post.user.name}</h3>
                            {post.user.verified && (
                              <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
                            )}
                            <span className="text-sm text-gray-500">• {post.user.type}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mb-1">
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              {post.user.location}
                            </span>
                            <span>•</span>
                            <span>{post.user.experience} exp</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {renderStars(post.user.rating)}
                              <span className="ml-1">{post.user.rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <ClockIcon className="w-3 h-3" />
                            <span>{post.time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                          {post.category}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(post.skillLevel)}`}>
                          {post.skillLevel}
                        </span>
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
                          <div key={index} className="bg-gray-200 rounded-lg aspect-square flex items-center justify-center">
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
                        
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Helpful
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