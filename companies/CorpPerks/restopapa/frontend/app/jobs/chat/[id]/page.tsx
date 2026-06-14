'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  PhotoIcon,
  FaceSmileIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: 'employee' | 'restaurant'
  message: string
  timestamp: string
  type: 'text' | 'image' | 'document'
  attachments?: {
    name: string
    url: string
    type: string
    size: number
  }[]
  isRead: boolean
}

interface Application {
  id: string
  jobId: string
  jobTitle: string
  restaurantName: string
  restaurantLogo: string
  employeeName: string
  employeeAvatar: string
  status: 'applied' | 'viewed' | 'in-review' | 'interview' | 'offered' | 'rejected'
  appliedDate: string
  lastActivity: string
  jobDetails: {
    location: string
    salary: string
    type: string
  }
}

// Mock data - would come from API
const mockApplication: Application = {
  id: '1',
  jobId: '1',
  jobTitle: 'Head Chef',
  restaurantName: 'The French Bistro',
  restaurantLogo: '/restaurant-logos/french-bistro.jpg',
  employeeName: 'John Smith',
  employeeAvatar: '/avatars/john-smith.jpg',
  status: 'interview',
  appliedDate: '2024-03-10',
  lastActivity: '2024-03-16 10:30 AM',
  jobDetails: {
    location: 'Manhattan, NY',
    salary: '$85k-120k/year',
    type: 'Full-time'
  }
}

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'restaurant-1',
    senderName: 'Marie Laurent',
    senderRole: 'restaurant',
    message: 'Hello John! Thank you for applying to our Head Chef position. I\'ve reviewed your application and I\'m very impressed with your experience.',
    timestamp: '2024-03-15T09:00:00Z',
    type: 'text',
    isRead: true
  },
  {
    id: '2',
    senderId: 'employee-1',
    senderName: 'John Smith',
    senderRole: 'employee',
    message: 'Thank you for reaching out! I\'m very excited about this opportunity. I\'ve been following The French Bistro for years and would love to contribute to your team.',
    timestamp: '2024-03-15T09:15:00Z',
    type: 'text',
    isRead: true
  },
  {
    id: '3',
    senderId: 'restaurant-1',
    senderName: 'Marie Laurent',
    senderRole: 'restaurant',
    message: 'That\'s wonderful to hear! I\'d like to schedule an interview with you. Are you available this Friday at 2 PM for an in-person interview at our restaurant?',
    timestamp: '2024-03-15T09:30:00Z',
    type: 'text',
    isRead: true
  },
  {
    id: '4',
    senderId: 'employee-1',
    senderName: 'John Smith',
    senderRole: 'employee',
    message: 'Friday at 2 PM works perfectly for me! Should I bring anything specific besides my portfolio?',
    timestamp: '2024-03-15T10:45:00Z',
    type: 'text',
    isRead: true
  },
  {
    id: '5',
    senderId: 'restaurant-1',
    senderName: 'Marie Laurent',
    senderRole: 'restaurant',
    message: 'Perfect! Please bring your portfolio and any certifications you have. We\'ll also do a brief cooking demonstration, so please come prepared. Looking forward to meeting you!',
    timestamp: '2024-03-15T11:00:00Z',
    type: 'text',
    isRead: true
  },
  {
    id: '6',
    senderId: 'employee-1',
    senderName: 'John Smith',
    senderRole: 'employee',
    message: 'Sounds great! I\'ll prepare something special for the demonstration. See you Friday at 2 PM. Thank you for this opportunity!',
    timestamp: '2024-03-15T11:15:00Z',
    type: 'text',
    isRead: false
  }
]

export default function JobChatPage() {
  const router = useRouter()
  const params = useParams()
  const [application] = useState<Application>(mockApplication)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showApplicationDetails, setShowApplicationDetails] = useState(false)
  const [currentUser] = useState('employee-1') // This would come from auth context
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser,
      senderName: currentUser === 'employee-1' ? 'John Smith' : 'Marie Laurent',
      senderRole: currentUser === 'employee-1' ? 'employee' : 'restaurant',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: false
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    
    // Simulate typing indicator for response
    if (currentUser === 'employee-1') {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        // You could add auto-responses here for demo
      }, 2000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5

    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'viewed':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'in-review':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'interview':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'offered':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <ClockIcon className="w-4 h-4" />
      case 'viewed':
        return <CheckIcon className="w-4 h-4" />
      case 'in-review':
        return <DocumentTextIcon className="w-4 h-4" />
      case 'interview':
        return <CalendarIcon className="w-4 h-4" />
      case 'offered':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'rejected':
        return <XMarkIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
            <div>
              <h1 className="font-semibold text-gray-900">
                {currentUser === 'employee-1' ? application.restaurantName : application.employeeName}
              </h1>
              <p className="text-sm text-gray-600">{application.jobTitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <PhoneIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <VideoCameraIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowApplicationDetails(!showApplicationDetails)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <InformationCircleIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          {/* Application Status Bar */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(application.status)}`}>
                  {getStatusIcon(application.status)}
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
                </div>
                <span className="text-sm text-gray-600">
                  Applied {new Date(application.appliedDate).toLocaleDateString()}
                </span>
              </div>
              
              <button
                onClick={() => router.push(`/jobs/${application.jobId}`)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Job Details →
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-xs lg:max-w-md ${message.senderId === currentUser ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className={`rounded-lg p-3 ${
                    message.senderId === currentUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-white shadow-sm border border-gray-200'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                      message.senderId === currentUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.senderId === currentUser && (
                        <CheckIcon className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-xs">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t px-6 py-4">
            <div className="flex items-end gap-3">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx"
                onChange={() => {
                  // Handle file upload
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  <FaceSmileIcon className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className={`p-2 rounded-lg ${
                  newMessage.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Application Details Sidebar */}
        {showApplicationDetails && (
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Application Details</h3>
              <button
                onClick={() => setShowApplicationDetails(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Job Info */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Job Information</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Position</p>
                  <p className="text-sm text-gray-600">{application.jobTitle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Company</p>
                  <p className="text-sm text-gray-600">{application.restaurantName}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    {application.jobDetails.location}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    {application.jobDetails.salary}
                  </div>
                </div>
              </div>
            </div>

            {/* Application Status */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Application Status</h4>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${getStatusColor(application.status)}`}>
                {getStatusIcon(application.status)}
                {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <p>Applied: {new Date(application.appliedDate).toLocaleDateString()}</p>
                <p>Last activity: {application.lastActivity}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/jobs/${application.jobId}`)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm"
              >
                View Job Details
              </button>
              <button
                onClick={() => router.push('/jobs/dashboard')}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 text-sm"
              >
                Back to Dashboard
              </button>
            </div>

            {/* Interview Schedule (if applicable) */}
            {application.status === 'interview' && (
              <div className="mt-6 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-700">Interview Scheduled</span>
                </div>
                <p className="text-sm text-orange-600">Friday, March 18 at 2:00 PM</p>
                <p className="text-sm text-orange-600">In-person at The French Bistro</p>
                <button className="mt-2 text-xs text-orange-600 hover:text-orange-700 underline">
                  Add to Calendar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}