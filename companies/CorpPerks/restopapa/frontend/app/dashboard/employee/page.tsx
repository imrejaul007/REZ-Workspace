'use client'

import { useState } from 'react'
import { 
  HomeIcon,
  BriefcaseIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  HeartIcon,
  ShareIcon,
  PlusIcon,
  PhotoIcon,
  MapPinIcon,
  BellIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

const navigationItems = [
  { name: 'Home', icon: HomeIcon, id: 'home' },
  { name: 'Jobs', icon: BriefcaseIcon, id: 'jobs' },
  { name: 'Profile', icon: UserIcon, id: 'profile' },
  { name: 'Community', icon: ChatBubbleLeftRightIcon, id: 'community' },
  { name: 'Learning', icon: AcademicCapIcon, id: 'learning' },
]

const communityPosts = [
  {
    id: 1,
    user: { name: 'Tasty Bites Restaurant', avatar: '🏪', type: 'Restaurant' },
    content: 'We\'re hiring! Looking for experienced chefs to join our kitchen team. Great working environment and competitive salary. DM us if interested!',
    time: '3 hours ago',
    likes: 45,
    comments: 12,
    shares: 8,
    isLiked: false,
    category: 'Job Posting'
  },
  {
    id: 2,
    user: { name: 'Chef Ravi Kumar', avatar: '👨‍🍳', type: 'Employee' },
    content: 'Just completed my food safety certification! Excited to implement what I learned in my next role. Always learning and growing in this industry.',
    time: '6 hours ago',
    likes: 23,
    comments: 8,
    shares: 4,
    isLiked: true,
    category: 'Achievement'
  },
  {
    id: 3,
    user: { name: 'Mumbai Culinary Institute', avatar: '🎓', type: 'Institution' },
    content: 'New batch of Advanced Pastry Making course starting next month! Perfect for chefs looking to expand their skills. Early bird discount available.',
    time: '1 day ago',
    likes: 67,
    comments: 25,
    shares: 18,
    isLiked: false,
    category: 'Learning'
  }
]

const jobApplications = [
  {
    id: 1,
    jobTitle: 'Senior Chef',
    company: 'Tasty Bites Restaurant',
    location: 'Mumbai',
    salary: '₹25k-35k',
    appliedDate: '2024-01-20',
    status: 'Under Review',
    statusColor: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 2,
    jobTitle: 'Sous Chef',
    company: 'Spice Garden',
    location: 'Delhi',
    salary: '₹22k-30k',
    appliedDate: '2024-01-18',
    status: 'Interview Scheduled',
    statusColor: 'bg-blue-100 text-blue-800'
  },
  {
    id: 3,
    jobTitle: 'Kitchen Manager',
    company: 'Ocean Grill',
    location: 'Bangalore',
    salary: '₹30k-45k',
    appliedDate: '2024-01-15',
    status: 'Rejected',
    statusColor: 'bg-red-100 text-red-800'
  }
]

const availableJobs = [
  {
    id: 1,
    title: 'Head Chef',
    company: 'Fine Dine Restaurant',
    location: 'Mumbai',
    salary: '₹35k-50k',
    type: 'Full-time',
    posted: '2 days ago',
    description: 'Leading kitchen operations for premium dining experience',
    requirements: ['5+ years experience', 'Leadership skills', 'Fine dining expertise']
  },
  {
    id: 2,
    title: 'Pastry Chef',
    company: 'Sweet Treats Bakery',
    location: 'Bangalore',
    salary: '₹20k-28k',
    type: 'Full-time',
    posted: '1 day ago',
    description: 'Create delicious pastries and desserts for our bakery',
    requirements: ['Pastry certification', 'Creative skills', '2+ years experience']
  },
  {
    id: 3,
    title: 'Line Cook',
    company: 'Quick Bites Café',
    location: 'Pune',
    salary: '₹15k-22k',
    type: 'Part-time',
    posted: '5 hours ago',
    description: 'Fast-paced environment, perfect for gaining experience',
    requirements: ['Basic cooking skills', 'Quick learner', 'Team player']
  }
]

const learningCourses = [
  {
    id: 1,
    title: 'Advanced Culinary Techniques',
    provider: 'Culinary Institute of India',
    duration: '3 months',
    price: '₹15,000',
    rating: 4.8,
    students: 245,
    image: '📚'
  },
  {
    id: 2,
    title: 'Food Safety & Hygiene Certification',
    provider: 'FSSAI Approved Center',
    duration: '1 week',
    price: '₹2,500',
    rating: 4.9,
    students: 1205,
    image: '🛡️'
  },
  {
    id: 3,
    title: 'Restaurant Management Basics',
    provider: 'Hospitality Training Academy',
    duration: '2 months',
    price: '₹8,000',
    rating: 4.6,
    students: 456,
    image: '📊'
  }
]

export default function EmployeeDashboard() {
  const [activeSection, setActiveSection] = useState('home')
  const [likedPosts, setLikedPosts] = useState(new Set())

  const toggleLike = (postId: number) => {
    const newLikedPosts = new Set(likedPosts)
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId)
    } else {
      newLikedPosts.add(postId)
    }
    setLikedPosts(newLikedPosts)
  }

  const renderHome = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Create Post */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
            👩‍🍳
          </div>
          <input 
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-500 cursor-pointer"
            placeholder="Share your experience, ask questions..."
            readOnly
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex space-x-4 text-gray-500">
            <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2">
              <PhotoIcon className="w-5 h-5" />
              <span>Photo</span>
            </button>
            <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2">
              <AcademicCapIcon className="w-5 h-5" />
              <span>Achievement</span>
            </button>
            <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2">
              <MapPinIcon className="w-5 h-5" />
              <span>Location</span>
            </button>
          </div>
          <button className="btn-primary">Post</button>
        </div>
      </div>

      {/* Community Posts */}
      {communityPosts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-sm border">
          {/* Post Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                  {post.user.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{post.time}</span>
                    <span>•</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {post.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="p-4">
            <p className="text-gray-900 mb-3">{post.content}</p>
          </div>

          {/* Post Actions */}
          <div className="px-4 py-2 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex space-x-6">
                <button 
                  onClick={() => toggleLike(post.id)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-red-500"
                >
                  {likedPosts.has(post.id) || post.isLiked ? (
                    <HeartSolidIcon className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5" />
                  )}
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                  <ShareIcon className="w-5 h-5" />
                  <span>{post.shares}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderJobs = () => (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Applications */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">My Applications</h3>
            <div className="space-y-3">
              {jobApplications.map((application) => (
                <div key={application.id} className="p-3 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 text-sm">{application.jobTitle}</h4>
                  <p className="text-xs text-gray-600 mb-2">{application.company} • {application.location}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded-full ${application.statusColor}`}>
                      {application.status}
                    </span>
                    <span className="text-xs text-gray-500">{application.appliedDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Available Jobs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Available Jobs</h2>
              <div className="flex space-x-2">
                <input 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Search jobs..."
                />
                <button className="btn-primary">Search</button>
              </div>
            </div>
            <div className="flex space-x-4 mb-4">
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Locations</option>
                <option>Mumbai</option>
                <option>Delhi</option>
                <option>Bangalore</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Positions</option>
                <option>Chef</option>
                <option>Manager</option>
                <option>Waiter</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {availableJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span>🏪 {job.company}</span>
                      <span>📍 {job.location}</span>
                      <span>💰 {job.salary}</span>
                      <span>📅 {job.type}</span>
                    </div>
                    <p className="text-gray-600 mb-3">{job.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.requirements.map((req, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {req}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">Posted {job.posted}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn border border-gray-300 text-gray-700 hover:bg-gray-50">
                      Save
                    </button>
                    <button className="btn-primary">Apply Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="h-32 bg-gradient-to-r from-green-500 to-green-600 rounded-t-lg"></div>
        <div className="p-6 -mt-16">
          <div className="flex items-end space-x-4">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white flex items-center justify-center text-3xl">
              👩‍🍳
            </div>
            <div className="flex-1 mt-16">
              <h1 className="text-2xl font-bold text-gray-900">Jane Smith</h1>
              <p className="text-gray-600">Senior Chef • Mumbai, Maharashtra</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>⭐ 4.8 rating</span>
                <span>💼 3 years experience</span>
                <span>✅ Verified</span>
              </div>
            </div>
            <button className="btn-primary">Edit Profile</button>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span>jane.smith@email.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span>+91-9876543210</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location:</span>
              <span>Mumbai, Maharashtra</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date of Birth:</span>
              <span>May 15, 1995</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Languages:</span>
              <span>Hindi, English, Marathi</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Professional Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Current Position:</span>
              <span>Senior Chef</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Experience:</span>
              <span>3 years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Specialization:</span>
              <span>Indian Cuisine</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Education:</span>
              <span>Hotel Management Diploma</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Certifications:</span>
              <span>Food Safety, Customer Service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Achievements */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {['Cooking', 'Team Leadership', 'Menu Planning', 'Food Presentation', 'Kitchen Management', 'Customer Service'].map((skill, index) => (
              <span key={index} className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm">Food Safety Certification</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm">Employee of the Month</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm">Advanced Culinary Course</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLearning = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold mb-4">Learn & Grow</h2>
        <p className="text-gray-600 mb-4">Enhance your skills with professional courses and certifications</p>
        <div className="flex space-x-4">
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>All Categories</option>
            <option>Cooking Techniques</option>
            <option>Food Safety</option>
            <option>Management</option>
            <option>Customer Service</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>All Durations</option>
            <option>1 week</option>
            <option>1 month</option>
            <option>3 months</option>
          </select>
          <input 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Search courses..."
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {learningCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl">
              {course.image}
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-sm text-gray-600 mb-3">by {course.provider}</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>📅 {course.duration}</span>
                <div className="flex items-center">
                  <span className="text-yellow-500">⭐</span>
                  <span className="ml-1">{course.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-blue-600">{course.price}</span>
                <span className="text-sm text-gray-500">{course.students} students</span>
              </div>
              <button className="w-full btn-primary">Enroll Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'home': return renderHome()
      case 'jobs': return renderJobs()
      case 'profile': return renderProfile()
      case 'community': return renderHome()
      case 'learning': return renderLearning()
      default: return renderHome()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-bold text-green-600">RestaurantHub</div>
              
              {/* Navigation Tabs */}
              <nav className="hidden md:flex space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === item.id 
                          ? 'bg-green-100 text-green-600' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      {item.name}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative">
                <BellIcon className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  👩‍🍳
                </div>
                <span className="hidden md:block text-sm font-medium">Jane Smith</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto py-2 px-4 space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === item.id 
                    ? 'bg-green-100 text-green-600' 
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4 mr-1" />
                {item.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="py-6">
        {renderContent()}
      </main>
    </div>
  )
}