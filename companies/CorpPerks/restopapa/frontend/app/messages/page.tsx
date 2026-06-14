'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

// Mock conversations data
const conversationsData = [
  {
    id: 1,
    name: 'Ocean View Diner',
    avatar: '🍽️',
    lastMessage: 'Thank you for your interest in the Head Chef position. We would like to schedule an interview.',
    timestamp: '2m ago',
    unread: 3,
    online: true,
    type: 'restaurant'
  },
  {
    id: 2,
    name: 'Fresh Farm Supplies',
    avatar: '🚜',
    lastMessage: 'Your order has been confirmed and will be delivered tomorrow morning.',
    timestamp: '1h ago',
    unread: 1,
    online: false,
    type: 'vendor'
  },
  {
    id: 3,
    name: 'Sarah Johnson',
    avatar: '👩‍🍳',
    lastMessage: 'Great tips on kitchen management! Thanks for sharing.',
    timestamp: '3h ago',
    unread: 0,
    online: true,
    type: 'employee'
  },
  {
    id: 4,
    name: 'Downtown Grill',
    avatar: '🔥',
    lastMessage: 'We received your application and will review it shortly.',
    timestamp: '1d ago',
    unread: 0,
    online: false,
    type: 'restaurant'
  },
  {
    id: 5,
    name: 'Mike Chen',
    avatar: '👨‍🍳',
    lastMessage: 'Would love to connect and discuss our experiences in fine dining.',
    timestamp: '2d ago',
    unread: 0,
    online: false,
    type: 'employee'
  }
]

// Mock messages for selected conversation
const messagesData = [
  {
    id: 1,
    senderId: 1,
    senderName: 'Ocean View Diner',
    content: 'Hello! Thank you for applying for the Head Chef position at Ocean View Diner.',
    timestamp: '10:30 AM',
    type: 'text',
    status: 'read'
  },
  {
    id: 2,
    senderId: 'me',
    senderName: 'You',
    content: 'Thank you for considering my application. I\'m very excited about this opportunity.',
    timestamp: '10:35 AM',
    type: 'text',
    status: 'read'
  },
  {
    id: 3,
    senderId: 1,
    senderName: 'Ocean View Diner',
    content: 'We were impressed by your experience and would like to schedule an interview. Are you available this Friday at 2 PM?',
    timestamp: '10:40 AM',
    type: 'text',
    status: 'read'
  },
  {
    id: 4,
    senderId: 'me',
    senderName: 'You',
    content: 'Yes, I\'m available this Friday at 2 PM. Should I bring any additional documents?',
    timestamp: '10:45 AM',
    type: 'text',
    status: 'read'
  },
  {
    id: 5,
    senderId: 1,
    senderName: 'Ocean View Diner',
    content: 'Please bring your portfolio and any certifications you have. Looking forward to meeting you!',
    timestamp: '11:00 AM',
    type: 'text',
    status: 'delivered'
  }
]

export default function Messages() {
  const router = useRouter()
  const [conversations, setConversations] = useState(conversationsData)
  const [selectedConversation, setSelectedConversation] = useState(conversationsData[0])
  const [messages, setMessages] = useState(messagesData)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: messages.length + 1,
      senderId: 'me',
      senderName: 'You',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      type: 'text',
      status: 'sent'
    }

    setMessages([...messages, message])
    setNewMessage('')

    // Update last message in conversation
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: newMessage, timestamp: 'now' }
          : conv
      )
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'restaurant': return 'text-blue-600'
      case 'vendor': return 'text-green-600'
      case 'employee': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'restaurant': return 'Restaurant'
      case 'vendor': return 'Vendor'
      case 'employee': return 'Employee'
      default: return ''
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                selectedConversation.id === conversation.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                    {conversation.avatar}
                  </div>
                  {conversation.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{conversation.name}</h3>
                    <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unread > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${getTypeColor(conversation.type)}`}>
                      {getTypeBadge(conversation.type)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {selectedConversation.avatar}
                </div>
                {selectedConversation.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div>
                <h2 className="font-medium text-gray-900">{selectedConversation.name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedConversation.online ? 'Online' : 'Last seen 2 hours ago'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full">
                <PhoneIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full">
                <VideoCameraIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full">
                <InformationCircleIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === 'me'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className={`flex items-center justify-between mt-1 ${
                  message.senderId === 'me' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  <span className="text-xs">{message.timestamp}</span>
                  {message.senderId === 'me' && (
                    <div className="ml-2">
                      {message.status === 'sent' && (
                        <CheckIcon className="w-3 h-3" />
                      )}
                      {message.status === 'delivered' && (
                        <div className="flex">
                          <CheckIcon className="w-3 h-3" />
                          <CheckIcon className="w-3 h-3 -ml-1" />
                        </div>
                      )}
                      {message.status === 'read' && (
                        <div className="flex text-blue-200">
                          <CheckIcon className="w-3 h-3" />
                          <CheckIcon className="w-3 h-3 -ml-1" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end gap-2">
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full">
              <PaperClipIcon className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <textarea
                rows={1}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ maxHeight: '120px' }}
              />
            </div>
            
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full">
              <FaceSmileIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}