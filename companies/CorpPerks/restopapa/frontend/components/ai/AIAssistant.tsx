'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, X, Send, Bot, User, 
  Sparkles, Mic, Paperclip, MoreVertical,
  ThumbsUp, ThumbsDown, RefreshCw
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
  suggestions?: string[]
  rating?: 'good' | 'bad'
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for RestaurantHub. How can I help you today?',
      timestamp: new Date(),
      suggestions: [
        'How do I post a job?',
        'View marketplace products',
        'Check my orders',
        'Account settings'
      ]
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(input),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const getAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase()
    
    if (lowerQuestion.includes('job') || lowerQuestion.includes('post')) {
      return 'To post a job, go to your Dashboard → Jobs → Create New Job. Fill in the job details including position, salary range, and requirements. Your job will be visible to all registered employees immediately after posting.'
    } else if (lowerQuestion.includes('order') || lowerQuestion.includes('marketplace')) {
      return 'You can browse the marketplace for restaurant supplies, equipment, and services. Simply go to Marketplace, browse or search for products, add them to your cart, and proceed to checkout. We offer credit facilities for verified restaurants.'
    } else if (lowerQuestion.includes('payment') || lowerQuestion.includes('credit')) {
      return 'RestaurantHub offers a credit facility of up to ₹5 lakhs for verified restaurants. You can use this credit for marketplace purchases and pay later within 30 days. To apply for credit, go to Settings → Financial → Apply for Credit.'
    } else if (lowerQuestion.includes('employee') || lowerQuestion.includes('staff')) {
      return 'You can manage your staff through the Employee Management section. Track attendance, schedule shifts, process payroll, and view performance metrics. Employees can also apply for jobs posted by other restaurants through our platform.'
    } else {
      return 'I\'d be happy to help you with that! Could you provide more details about what you\'re looking for? You can ask me about jobs, marketplace, orders, payments, staff management, or any other features of RestaurantHub.'
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    handleSend()
  }

  const handleRating = (messageId: string, rating: 'good' | 'bad') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ))
  }

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-2xl flex items-center justify-center text-white"
          >
            <MessageSquare className="w-6 h-6" />
            <motion.div
              className="absolute top-0 right-0 w-3 h-3 bg-success-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <motion.div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-success-400 rounded-full border-2 border-primary-600"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-xs opacity-90">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${message.role === 'user' 
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`
                      inline-block p-3 rounded-2xl max-w-[80%]
                      ${message.role === 'user'
                        ? 'bg-primary-500 text-white rounded-tr-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                      }
                    `}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    
                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {/* Rating for assistant messages */}
                    {message.role === 'assistant' && !message.suggestions && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleRating(message.id, 'good')}
                          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            message.rating === 'good' ? 'text-success-500' : 'text-gray-400'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRating(message.id, 'bad')}
                          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            message.rating === 'bad' ? 'text-danger-500' : 'text-gray-400'
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((suggestion, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm p-3">
                    <motion.div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.1
                          }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
                />
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                  <Mic className="w-5 h-5" />
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                <Sparkles className="w-3 h-3" />
                <span>Powered by AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}