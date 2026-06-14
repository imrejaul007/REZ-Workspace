'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  UserGroupIcon,
  VideoCameraIcon,
  PhoneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  CheckIcon,
  ExclamationCircleIcon,
  BellIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid'

interface Contact {
  id: string
  name: string
  avatar: string
  role: 'employee' | 'vendor' | 'customer' | 'support'
  status: 'online' | 'offline' | 'away'
  lastSeen: string
  unreadCount: number
  lastMessage?: {
    text: string
    timestamp: string
    sender: 'me' | 'them'
  }
}

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
  type: 'text' | 'image' | 'file' | 'voice'
  status: 'sent' | 'delivered' | 'read'
  fileUrl?: string
  fileName?: string
  replyTo?: string
}

interface Conversation {
  id: string
  contactId: string
  messages: Message[]
  isTyping: boolean
  isPinned: boolean
}

interface Group {
  id: string
  name: string
  avatar: string
  members: string[]
  description: string
  createdBy: string
  createdAt: string
  unreadCount: number
  lastMessage?: {
    text: string
    timestamp: string
    sender: string
  }
}

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Rajesh Kumar (Chef)',
    avatar: 'https://via.placeholder.com/40',
    role: 'employee',
    status: 'online',
    lastSeen: 'now',
    unreadCount: 2,
    lastMessage: {
      text: 'The inventory for tomorrow is ready',
      timestamp: '2024-01-15T10:30:00Z',
      sender: 'them'
    }
  },
  {
    id: '2',
    name: 'Mandi Fresh Suppliers',
    avatar: 'https://via.placeholder.com/40',
    role: 'vendor',
    status: 'offline',
    lastSeen: '2 hours ago',
    unreadCount: 0,
    lastMessage: {
      text: 'Your order has been dispatched',
      timestamp: '2024-01-15T08:15:00Z',
      sender: 'them'
    }
  },
  {
    id: '3',
    name: 'Customer Support',
    avatar: 'https://via.placeholder.com/40',
    role: 'support',
    status: 'online',
    lastSeen: 'now',
    unreadCount: 1,
    lastMessage: {
      text: 'How can we help you today?',
      timestamp: '2024-01-15T09:45:00Z',
      sender: 'them'
    }
  }
]

const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Kitchen Staff',
    avatar: 'https://via.placeholder.com/40',
    members: ['1', '4', '5'],
    description: 'Kitchen team coordination',
    createdBy: 'me',
    createdAt: '2024-01-10',
    unreadCount: 3,
    lastMessage: {
      text: 'Shift schedule updated',
      timestamp: '2024-01-15T11:00:00Z',
      sender: 'Rajesh Kumar'
    }
  },
  {
    id: '2',
    name: 'Suppliers Group',
    avatar: 'https://via.placeholder.com/40',
    members: ['2', '6', '7'],
    description: 'Vendor communication',
    createdBy: 'me',
    createdAt: '2024-01-08',
    unreadCount: 0,
    lastMessage: {
      text: 'Weekly inventory requirements shared',
      timestamp: '2024-01-15T07:30:00Z',
      sender: 'me'
    }
  }
]

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    text: 'Good morning! The inventory for tomorrow is ready. Should I proceed with the prep work?',
    timestamp: '2024-01-15T10:30:00Z',
    type: 'text',
    status: 'read'
  },
  {
    id: '2',
    senderId: 'me',
    text: 'Yes, please proceed. Also, make sure we have enough ingredients for the weekend special menu.',
    timestamp: '2024-01-15T10:32:00Z',
    type: 'text',
    status: 'delivered'
  },
  {
    id: '3',
    senderId: '1',
    text: 'Understood. I\'ll check the weekend special requirements and update you.',
    timestamp: '2024-01-15T10:35:00Z',
    type: 'text',
    status: 'read'
  }
]

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState('chats')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(mockContacts[0])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      contactId: '1',
      messages: mockMessages,
      isTyping: false,
      isPinned: false
    }
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversations])

  const currentConversation = conversations.find(c => 
    selectedContact ? c.contactId === selectedContact.id : false
  )

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGroups = mockGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = () => {
    if (!message.trim() || !selectedContact) return

    // In a real app, this would send the message to the backend
    setMessage('')
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 3600)

    if (diffInHours < 1) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const renderContactList = () => (
    <div className="space-y-2">
      {filteredContacts.map((contact) => (
        <div
          key={contact.id}
          onClick={() => {
            setSelectedContact(contact)
            setSelectedGroup(null)
          }}
          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
            selectedContact?.id === contact.id ? 'bg-blue-50 border border-blue-200' : ''
          }`}
        >
          <div className="relative">
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              contact.status === 'online' ? 'bg-green-400' :
              contact.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {contact.name}
              </p>
              {contact.lastMessage && (
                <p className="text-xs text-gray-500">
                  {formatTime(contact.lastMessage.timestamp)}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              {contact.lastMessage && (
                <p className="text-sm text-gray-500 truncate">
                  {contact.lastMessage.sender === 'me' ? 'You: ' : ''}
                  {contact.lastMessage.text}
                </p>
              )}
              {contact.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {contact.unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center mt-1">
              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                contact.role === 'employee' ? 'bg-green-100 text-green-800' :
                contact.role === 'vendor' ? 'bg-blue-100 text-blue-800' :
                contact.role === 'customer' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {contact.role}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderGroupList = () => (
    <div className="space-y-2">
      {filteredGroups.map((group) => (
        <div
          key={group.id}
          onClick={() => {
            setSelectedGroup(group)
            setSelectedContact(null)
          }}
          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
            selectedGroup?.id === group.id ? 'bg-blue-50 border border-blue-200' : ''
          }`}
        >
          <div className="relative">
            <img
              src={group.avatar}
              alt={group.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {group.members.length}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {group.name}
              </p>
              {group.lastMessage && (
                <p className="text-xs text-gray-500">
                  {formatTime(group.lastMessage.timestamp)}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              {group.lastMessage && (
                <p className="text-sm text-gray-500 truncate">
                  {group.lastMessage.sender === 'me' ? 'You: ' : `${group.lastMessage.sender}: `}
                  {group.lastMessage.text}
                </p>
              )}
              {group.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {group.unreadCount}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-1">{group.members.length} members</p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderChatHeader = () => {
    const chatTarget = selectedContact || selectedGroup
    if (!chatTarget) return null

    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img
            src={chatTarget.avatar}
            alt={chatTarget.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{chatTarget.name}</h3>
            {selectedContact && (
              <p className="text-sm text-gray-500">
                {selectedContact.status === 'online' ? 'Active now' : `Last seen ${selectedContact.lastSeen}`}
              </p>
            )}
            {selectedGroup && (
              <p className="text-sm text-gray-500">{selectedGroup.members.length} members</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  const renderMessages = () => {
    if (!currentConversation) return null

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentConversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.senderId === 'me' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <div className={`flex items-center justify-between mt-1 ${
                msg.senderId === 'me' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                <span className="text-xs">{formatTime(msg.timestamp)}</span>
                {msg.senderId === 'me' && (
                  <div className="ml-2">
                    {msg.status === 'sent' && <CheckIcon className="h-3 w-3" />}
                    {msg.status === 'delivered' && <CheckIconSolid className="h-3 w-3" />}
                    {msg.status === 'read' && (
                      <div className="flex">
                        <CheckIconSolid className="h-3 w-3" />
                        <CheckIconSolid className="h-3 w-3 -ml-1" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {currentConversation.isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    )
  }

  const renderMessageInput = () => (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
          <PaperClipIcon className="h-5 w-5" />
        </button>
        
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
          <FaceSmileIcon className="h-5 w-5" />
        </button>
        
        <button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">Communicate with your team, vendors, and customers</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-200px)]">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Search and New Chat */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('chats')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'chats' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'groups' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Groups
              </button>
            </div>

            {/* Contact/Group List */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'chats' ? renderContactList() : renderGroupList()}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedContact || selectedGroup ? (
              <>
                {renderChatHeader()}
                {renderMessages()}
                {renderMessageInput()}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a conversation from the sidebar to start messaging.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}