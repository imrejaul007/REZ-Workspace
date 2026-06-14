'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useOptionalAuth } from '@/lib/auth/auth-provider';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat,
  Store,
  Users,
  Briefcase,
  ShoppingCart,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  Package,
  CreditCard,
  Shield,
  HeartHandshake,
  BarChart3,
  Zap,
  MapPin,
  DollarSign,
  MessageCircle,
  Heart,
  Eye,
  ThumbsUp,
  User,
  Sparkles,
  Play,
  Globe,
  Verified,
  TrendingDown,
  Coffee,
  Utensils,
  Building2,
  Target,
  Calendar
} from 'lucide-react';

// Enhanced types with better visual data
interface FeaturedVendor {
  id: string;
  name: string;
  image: string;
  rating: number;
  category: string;
  location: string;
  verified: boolean;
  products: number;
  description: string;
  bgColor: string;
  featured: boolean;
}

interface JobHighlight {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  type: 'full-time' | 'part-time' | 'contract';
  posted: string;
  urgent: boolean;
  requirements: string[];
  companyColor: string;
}

interface FeedPost {
  id: string;
  type: 'job' | 'vendor' | 'news' | 'community' | 'marketplace' | 'training';
  author: {
    name: string;
    role: string;
    avatar: string;
    verified: boolean;
  };
  content: {
    title: string;
    description: string;
    image?: string;
    cta?: string;
    ctaLink?: string;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  timeAgo: string;
  isPromoted?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon;
  href: string;
  gradient: string;
  description: string;
  badge?: string;
}

// Modern mock data with better visual appeal
const mockFeaturedVendors: FeaturedVendor[] = [
  {
    id: '1',
    name: 'Premium Spice Co.',
    image: '/api/placeholder/300/200',
    rating: 4.9,
    category: 'Premium Spices',
    location: 'Mumbai, Maharashtra',
    verified: true,
    products: 150,
    description: 'Authentic spices sourced directly from organic farms across India',
    bgColor: 'from-orange-400 to-red-500',
    featured: true
  },
  {
    id: '2',
    name: 'Fresh Farm Produce',
    image: '/api/placeholder/300/200',
    rating: 4.8,
    category: 'Fresh Vegetables',
    location: 'Punjab, India',
    verified: true,
    products: 200,
    description: 'Farm-to-table fresh vegetables delivered within 24 hours',
    bgColor: 'from-green-400 to-emerald-500',
    featured: true
  },
  {
    id: '3',
    name: 'Ocean Catch Seafood',
    image: '/api/placeholder/300/200',
    rating: 4.7,
    category: 'Premium Seafood',
    location: 'Kerala, India',
    verified: true,
    products: 80,
    description: 'Fresh seafood from coastal waters, sustainably sourced',
    bgColor: 'from-blue-400 to-cyan-500',
    featured: false
  }
];

const mockJobHighlights: JobHighlight[] = [
  {
    id: '1',
    title: 'Executive Chef',
    company: 'Luxury Resort Group',
    logo: '/api/placeholder/50/50',
    location: 'Goa, India',
    salary: '₹12-18 LPA',
    type: 'full-time',
    posted: '2 hours ago',
    urgent: true,
    requirements: ['5+ years experience', 'Multi-cuisine expertise', 'Team leadership'],
    companyColor: 'from-purple-500 to-indigo-600'
  },
  {
    id: '2',
    title: 'Restaurant Manager',
    company: 'Urban Dining Chain',
    logo: '/api/placeholder/50/50',
    location: 'Bangalore, Karnataka',
    salary: '₹8-12 LPA',
    type: 'full-time',
    posted: '5 hours ago',
    urgent: false,
    requirements: ['Operations management', 'P&L responsibility', 'Customer service'],
    companyColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: '3',
    title: 'Pastry Chef',
    company: 'Artisan Bakery',
    logo: '/api/placeholder/50/50',
    location: 'Delhi NCR',
    salary: '₹6-9 LPA',
    type: 'full-time',
    posted: '1 day ago',
    urgent: false,
    requirements: ['Pastry expertise', 'Creative skills', 'French techniques'],
    companyColor: 'from-pink-500 to-rose-600'
  }
];

// LinkedIn-style feed data
const mockFeedPosts: FeedPost[] = [
  {
    id: '1',
    type: 'job',
    author: {
      name: 'Luxury Resort Group',
      role: 'Hospitality Company',
      avatar: '/api/placeholder/40/40',
      verified: true
    },
    content: {
      title: 'Now Hiring: Executive Chef for Luxury Resort',
      description: 'Join our award-winning culinary team in Goa. We\'re looking for an experienced chef to lead our kitchen operations.',
      image: '/api/placeholder/400/250',
      cta: 'Apply Now',
      ctaLink: '/jobs/executive-chef-goa'
    },
    engagement: { likes: 42, comments: 8, shares: 3 },
    timeAgo: '2 hours ago',
    isPromoted: true
  },
  {
    id: '2',
    type: 'vendor',
    author: {
      name: 'Premium Spice Co.',
      role: 'Spice Supplier',
      avatar: '/api/placeholder/40/40',
      verified: true
    },
    content: {
      title: 'New Organic Spice Collection Available',
      description: 'Discover our latest range of organic spices sourced directly from farms across India. Perfect for authentic flavors.',
      image: '/api/placeholder/400/250',
      cta: 'View Products',
      ctaLink: '/marketplace/premium-spices'
    },
    engagement: { likes: 67, comments: 12, shares: 15 },
    timeAgo: '4 hours ago'
  },
  {
    id: '3',
    type: 'community',
    author: {
      name: 'Chef Ramesh Kumar',
      role: 'Executive Chef at Taj Hotels',
      avatar: '/api/placeholder/40/40',
      verified: false
    },
    content: {
      title: 'Tips for Managing Food Costs During Peak Season',
      description: 'After 15 years in the industry, here are my top strategies for maintaining profitability during busy periods...',
      cta: 'Read More',
      ctaLink: '/community/food-cost-management'
    },
    engagement: { likes: 234, comments: 45, shares: 28 },
    timeAgo: '6 hours ago'
  },
  {
    id: '4',
    type: 'marketplace',
    author: {
      name: 'Fresh Farm Produce',
      role: 'Vegetable Supplier',
      avatar: '/api/placeholder/40/40',
      verified: true
    },
    content: {
      title: 'Farm-Fresh Vegetables - Same Day Delivery',
      description: 'Get the freshest vegetables delivered to your restaurant within 24 hours. Special rates for bulk orders.',
      image: '/api/placeholder/400/250',
      cta: 'Order Now',
      ctaLink: '/marketplace/fresh-vegetables'
    },
    engagement: { likes: 89, comments: 19, shares: 7 },
    timeAgo: '8 hours ago'
  },
  {
    id: '5',
    type: 'training',
    author: {
      name: 'RestoPapa Academy',
      role: 'Training Provider',
      avatar: '/api/placeholder/40/40',
      verified: true
    },
    content: {
      title: 'Free Webinar: Digital Marketing for Restaurants',
      description: 'Learn how to boost your restaurant\'s online presence and attract more customers. Join our expert-led session.',
      cta: 'Register Free',
      ctaLink: '/training/digital-marketing-webinar'
    },
    engagement: { likes: 156, comments: 23, shares: 45 },
    timeAgo: '12 hours ago'
  }
];

// Quick actions for LinkedIn-style navigation
const quickActions: QuickAction[] = [
  {
    id: '1',
    label: 'Find Suppliers',
    icon: Package,
    href: '/marketplace',
    gradient: 'from-blue-500 to-blue-600',
    description: 'Browse 10,000+ suppliers',
    badge: 'Popular'
  },
  {
    id: '2',
    label: 'Post a Job',
    icon: Briefcase,
    href: '/jobs/create',
    gradient: 'from-emerald-500 to-emerald-600',
    description: 'Hire the best talent'
  },
  {
    id: '3',
    label: 'Join Community',
    icon: Users,
    href: '/community',
    gradient: 'from-purple-500 to-purple-600',
    description: 'Connect with peers',
    badge: 'New'
  },
  {
    id: '4',
    label: 'View Analytics',
    icon: BarChart3,
    href: '/analytics',
    gradient: 'from-orange-500 to-orange-600',
    description: 'Track your growth'
  },
  {
    id: '5',
    label: 'Get Training',
    icon: Award,
    href: '/training',
    gradient: 'from-pink-500 to-pink-600',
    description: 'Skill up your team'
  },
  {
    id: '6',
    label: 'Get Support',
    icon: HeartHandshake,
    href: '/support',
    gradient: 'from-indigo-500 to-indigo-600',
    description: '24/7 assistance'
  }
];

export default function HomePage() {
  const { user, isAuthenticated } = useOptionalAuth();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mockFeaturedVendors.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const filteredPosts = activeFilter === 'all'
    ? mockFeedPosts
    : mockFeedPosts.filter(post => post.type === activeFilter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job': return Briefcase;
      case 'vendor': return Package;
      case 'community': return MessageCircle;
      case 'marketplace': return ShoppingCart;
      case 'training': return Award;
      default: return Globe;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'job': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'vendor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'community': return 'bg-green-100 text-green-800 border-green-200';
      case 'marketplace': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'training': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="relative">
        {/* LinkedIn-style Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
              <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
            </div>
          </div>

          <div className="relative z-10 container mx-auto px-4 py-16 lg:py-20">
            <div className="max-w-6xl mx-auto">
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="text-center mb-8">
                  <Badge className="mb-4 px-4 py-2 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Welcome to RestoPapa
                  </Badge>

                  <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                    <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      Run Your Restaurant,
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-orange-300 to-amber-200 bg-clip-text text-transparent">
                      Your Way.
                    </span>
                  </h1>

                  <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
                    Hire smarter, source better, grow faster — the all-in-one platform built for restaurant operators.
                  </p>
                </div>

                {/* Quick Action Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.id} href={action.href}>
                        <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                          <CardContent className="p-4 text-center">
                            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${action.gradient} mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="font-semibold text-sm mb-1">{action.label}</h3>
                            <p className="text-xs text-slate-300">{action.description}</p>
                            {action.badge && (
                              <Badge className="mt-2 text-xs bg-yellow-500/20 text-yellow-200 border-yellow-500/30">
                                {action.badge}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden">
            <svg className="relative block w-full h-16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="fill-slate-50"></path>
            </svg>
          </div>
        </section>

        {/* LinkedIn-style Main Content Layout */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Sidebar - Quick Stats & Navigation */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Platform Stats */}
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">Platform Stats</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Active Restaurants', value: '10,000+', icon: Store, color: 'text-blue-600' },
                        { label: 'Suppliers', value: '5,000+', icon: Package, color: 'text-emerald-600' },
                        { label: 'Jobs Posted', value: '50,000+', icon: Briefcase, color: 'text-purple-600' },
                        { label: 'Community Members', value: '25,000+', icon: Users, color: 'text-orange-600' }
                      ].map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                          <div key={index} className="flex items-center space-x-3">
                            <Icon className={`h-5 w-5 ${stat.color}`} />
                            <div>
                              <div className="font-bold text-slate-800">{stat.value}</div>
                              <div className="text-sm text-slate-600">{stat.label}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Trending Topics */}
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">Trending Topics</h3>
                    <div className="space-y-3">
                      {[
                        '#FoodCostManagement',
                        '#HiringChallenges',
                        '#SustainableDining',
                        '#DigitalMarketing',
                        '#MenuOptimization'
                      ].map((topic, index) => (
                        <div key={index} className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm font-medium">
                          {topic}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-6">
              <div className="space-y-6">
                {/* Feed Filter */}
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'all', label: 'All Posts', icon: Globe },
                        { key: 'job', label: 'Jobs', icon: Briefcase },
                        { key: 'vendor', label: 'Suppliers', icon: Package },
                        { key: 'community', label: 'Community', icon: MessageCircle },
                        { key: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
                        { key: 'training', label: 'Training', icon: Award }
                      ].map((filter) => {
                        const Icon = filter.icon;
                        return (
                          <Button
                            key={filter.key}
                            size="sm"
                            variant={activeFilter === filter.key ? "default" : "outline"}
                            onClick={() => setActiveFilter(filter.key)}
                            className="flex items-center space-x-2"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{filter.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Feed Posts */}
                {filteredPosts.map((post) => {
                  const TypeIcon = getTypeIcon(post.type);
                  return (
                    <Card key={post.id} className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6">
                        {/* Post Header */}
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-slate-800">{post.author.name}</h4>
                              {post.author.verified && (
                                <Verified className="h-4 w-4 text-blue-500" />
                              )}
                              {post.isPromoted && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                  Promoted
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{post.author.role}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={`text-xs ${getTypeBadgeColor(post.type)}`}>
                                <TypeIcon className="h-3 w-3 mr-1" />
                                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                              </Badge>
                              <span className="text-xs text-slate-500">{post.timeAgo}</span>
                            </div>
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="mb-4">
                          <h3 className="font-bold text-lg text-slate-800 mb-2">{post.content.title}</h3>
                          <p className="text-slate-700 mb-3">{post.content.description}</p>

                          {post.content.image && (
                            <div className="rounded-lg overflow-hidden mb-3">
                              <div className="w-full h-48 bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center">
                                <span className="text-slate-500">Image Placeholder</span>
                              </div>
                            </div>
                          )}

                          {post.content.cta && (
                            <Link href={post.content.ctaLink || '#'}>
                              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                                {post.content.cta}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>

                        {/* Post Engagement */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="flex items-center space-x-6 text-sm text-slate-600">
                            <div className="flex items-center space-x-1 hover:text-blue-600 cursor-pointer">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{post.engagement.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1 hover:text-blue-600 cursor-pointer">
                              <MessageCircle className="h-4 w-4" />
                              <span>{post.engagement.comments}</span>
                            </div>
                            <div className="flex items-center space-x-1 hover:text-blue-600 cursor-pointer">
                              <ArrowRight className="h-4 w-4" />
                              <span>{post.engagement.shares}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right Sidebar - Featured Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Featured Vendors */}
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-slate-800">Featured Suppliers</h3>
                      <Link href="/marketplace">
                        <Button size="sm" variant="outline">View All</Button>
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {mockFeaturedVendors.slice(0, 3).map((vendor) => (
                        <div key={vendor.id} className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${vendor.bgColor} flex items-center justify-center`}>
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-slate-800">{vendor.name}</h4>
                            <p className="text-xs text-slate-600">{vendor.category}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-slate-600">{vendor.rating}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Jobs */}
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-slate-800">Recent Jobs</h3>
                      <Link href="/jobs">
                        <Button size="sm" variant="outline">View All</Button>
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {mockJobHighlights.slice(0, 3).map((job) => (
                        <div key={job.id} className="border-l-4 border-blue-500 pl-3">
                          <h4 className="font-semibold text-sm text-slate-800">{job.title}</h4>
                          <p className="text-xs text-slate-600">{job.company}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-600">{job.location}</span>
                          </div>
                          <div className="text-xs text-green-600 font-medium">{job.salary}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="bg-slate-900 text-white mt-16">
          <div className="container mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                    <ChefHat className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold">RestoPapa</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Run your restaurant, your way. Hire smarter, source better, and grow faster with the all-in-one platform for hospitality operators.
                </p>
                <div className="flex space-x-4">
                  <div className="flex space-x-4 mt-4">
                    <Link href="/auth/signup">
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        Join Now
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-lg">Discover</h4>
                <ul className="space-y-3 text-slate-400">
                  <li><Link href="/marketplace" className="hover:text-white transition-colors">Suppliers</Link></li>
                  <li><Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link></li>
                  <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                  <li><Link href="/training" className="hover:text-white transition-colors">Training</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-lg">Platform</h4>
                <ul className="space-y-3 text-slate-400">
                  <li><Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
                  <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
                  <li><Link href="/docs" className="hover:text-white transition-colors">API Docs</Link></li>
                  <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-lg">Company</h4>
                <ul className="space-y-3 text-slate-400">
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800 text-center text-slate-400">
              <p>© 2025 RestoPapa. All rights reserved. Built with ❤️ for the hospitality industry.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}