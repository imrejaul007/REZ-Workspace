'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  BookOpenIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface FAQItem {
  id: number
  question: string
  answer: string
  category: string
  helpful: number
  notHelpful: number
}

interface HelpCategory {
  id: string
  name: string
  icon: any
  description: string
  articleCount: number
}

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: BookOpenIcon,
    description: 'Learn the basics of using Resturistan platform',
    articleCount: 12
  },
  {
    id: 'restaurants',
    name: 'For Restaurants',
    icon: DocumentTextIcon,
    description: 'Restaurant management, orders, and staff coordination',
    articleCount: 18
  },
  {
    id: 'employees',
    name: 'For Employees',
    icon: QuestionMarkCircleIcon,
    description: 'Job applications, profiles, and career management',
    articleCount: 15
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    icon: DocumentTextIcon,
    description: 'Supplier orders, inventory, and vendor management',
    articleCount: 10
  },
  {
    id: 'billing',
    name: 'Billing & Payments',
    icon: DocumentTextIcon,
    description: 'Payment methods, invoices, and subscription management',
    articleCount: 8
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    icon: ExclamationCircleIcon,
    description: 'Common issues and technical support',
    articleCount: 14
  }
]

const faqItems: FAQItem[] = [
  {
    id: 1,
    question: 'How do I create a restaurant account?',
    answer: 'To create a restaurant account, click "Sign Up" and select "Restaurant Owner" as your user type. You\'ll need to provide your business license, contact information, and restaurant details. The verification process typically takes 24-48 hours.',
    category: 'getting-started',
    helpful: 45,
    notHelpful: 3
  },
  {
    id: 2,
    question: 'How do I post a job opening?',
    answer: 'Navigate to your restaurant dashboard and click "Post Job" in the Jobs section. Fill out the job details including position, requirements, salary range, and benefits. Your job will be visible to qualified candidates immediately after posting.',
    category: 'restaurants',
    helpful: 38,
    notHelpful: 2
  },
  {
    id: 3,
    question: 'How do I apply for jobs?',
    answer: 'Browse available jobs in the Jobs section, click on positions that interest you, and click "Apply Now". You\'ll need a complete profile with your resume, experience, and certifications to apply.',
    category: 'employees',
    helpful: 52,
    notHelpful: 1
  },
  {
    id: 4,
    question: 'How do I track my order?',
    answer: 'You can track your order by going to the Orders section in your account or clicking the tracking link in your order confirmation email. You\'ll see real-time updates on your order status and estimated delivery time.',
    category: 'marketplace',
    helpful: 67,
    notHelpful: 4
  },
  {
    id: 5,
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, PayPal, Apple Pay, Google Pay, and bank transfers for business accounts.',
    category: 'billing',
    helpful: 41,
    notHelpful: 2
  },
  {
    id: 6,
    question: 'I\'m having trouble logging in. What should I do?',
    answer: 'First, try resetting your password using the "Forgot Password" link. Make sure you\'re using the correct email address. If you\'re still having issues, clear your browser cache or try a different browser. Contact support if the problem persists.',
    category: 'troubleshooting',
    helpful: 29,
    notHelpful: 5
  }
]

export default function HelpCenter() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<Set<number>>(new Set())

  const filteredFAQs = faqItems.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (faqId: number) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId)
  }

  const giveFeedback = (faqId: number, helpful: boolean) => {
    setFeedbackGiven(prev => new Set([...prev, faqId]))
    // In a real app, this would send feedback to the server
    logger.info(`FAQ ${faqId} marked as ${helpful ? 'helpful' : 'not helpful'}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <QuestionMarkCircleIcon className="w-12 h-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions, browse help articles, or contact our support team
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Contact */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-12">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Need immediate help?</h2>
            <p className="text-blue-100 mb-6">Our support team is here to assist you</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-white mx-auto mb-2" />
                <div className="font-semibold">Live Chat</div>
                <div className="text-sm text-blue-100">Average response: 2 min</div>
              </button>
              
              <button className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors">
                <PhoneIcon className="w-8 h-8 text-white mx-auto mb-2" />
                <div className="font-semibold">Call Support</div>
                <div className="text-sm text-blue-100">(555) 123-HELP</div>
              </button>
              
              <button 
                onClick={() => router.push('/support')}
                className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors"
              >
                <EnvelopeIcon className="w-8 h-8 text-white mx-auto mb-2" />
                <div className="font-semibold">Submit Ticket</div>
                <div className="text-sm text-blue-100">Response within 4 hours</div>
              </button>
            </div>
          </div>
        </div>

        {/* Help Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Browse Help Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`text-left p-6 rounded-lg border-2 hover:shadow-md transition-all ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${
                    selectedCategory === category.id ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <DocumentTextIcon className="w-4 h-4 mr-1" />
                    {category.articleCount} articles
                  </div>
                </button>
              )
            })}
          </div>
          
          {selectedCategory !== 'all' && (
            <div className="text-center mt-6">
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View all categories
              </button>
            </div>
          )}
        </div>

        {/* Frequently Asked Questions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {expandedFAQ === faq.id ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedFAQ === faq.id && (
                    <div className="px-6 pb-4">
                      <div className="border-t pt-4">
                        <p className="text-gray-600 mb-4">{faq.answer}</p>
                        
                        {/* Helpful feedback */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <StarIcon className="w-4 h-4 mr-1" />
                            {faq.helpful} people found this helpful
                          </div>
                          
                          {!feedbackGiven.has(faq.id) && (
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">Was this helpful?</span>
                              <button
                                onClick={() => giveFeedback(faq.id, true)}
                                className="text-sm text-green-600 hover:text-green-700 font-medium"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => giveFeedback(faq.id, false)}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                              >
                                No
                              </button>
                            </div>
                          )}
                          
                          {feedbackGiven.has(faq.id) && (
                            <div className="text-sm text-green-600 font-medium">
                              Thanks for your feedback!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <QuestionMarkCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search terms or browse different categories
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <VideoCameraIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Video Tutorials</h3>
              <p className="text-gray-600 mb-4">
                Watch step-by-step video guides to learn how to use all platform features
              </p>
              <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
                Watch Tutorials
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <BookOpenIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">User Guides</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive documentation and best practices for restaurant management
              </p>
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                Browse Guides
              </button>
            </div>
          </div>
        </div>

        {/* Contact Support CTA */}
        <div className="mt-12 bg-gray-100 rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h3>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our support team is ready to assist you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/support')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Contact Support
            </button>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-white font-medium">
              Schedule a Call
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}