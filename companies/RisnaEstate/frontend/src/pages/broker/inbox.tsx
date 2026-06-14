/**
 * Broker Portal - WhatsApp Inbox
 */
import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'

const MESSAGES = [
  { id: '1', from: 'customer', text: 'Hi, I am interested in the Marina Heights property. Is it still available?', time: '10:30 AM', read: false },
  { id: '2', from: 'me', text: 'Yes, it is available. Would you like to schedule a site visit?', time: '10:32 AM' },
  { id: '3', from: 'customer', text: 'Yes, this weekend if possible', time: '10:35 AM', read: true },
]

const CONTACTS = [
  { id: '1', name: 'Rajesh Sharma', lastMessage: 'Yes, this weekend if possible', time: '10:35 AM', unread: 0 },
  { id: '2', name: 'Priya Patel', lastMessage: 'Can you send more photos?', time: '9:15 AM', unread: 2 },
  { id: '3', name: 'Amit Kumar', lastMessage: 'Thank you for the brochure', time: 'Yesterday', unread: 0 },
]

export default function BrokerInbox() {
  const [contacts] = useState(CONTACTS)
  const [activeContact, setActiveContact] = useState('1')
  const [message, setMessage] = useState('')
  const [messages] = useState(MESSAGES)

  const sendMessage = () => {
    if (!message.trim()) return
    setMessage('')
    // API call to send message
  }

  return (
    <PortalLayout portal="broker">
      <div className="flex h-[calc(100vh-200px] bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Contacts List */}
        <div className="w-80 border-r">
          <div className="p-4 border-b">
            <h2 className="font-semibold">WhatsApp Inbox</h2>
          </div>
          <div className="overflow-y-auto h-full">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setActiveContact(contact.id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 border-b ${
                  activeContact === contact.id ? 'bg-green-50' : ''
                }`}
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-semibold text-gray-600">{contact.name.charAt(0)}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium truncate">{contact.name}</p>
                    <span className="text-xs text-gray-400">{contact.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                </div>
                {contact.unread > 0 && (
                  <div className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                    {contact.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="font-semibold">R</span>
            </div>
            <div>
              <p className="font-medium">Rajesh Sharma</p>
              <p className="text-xs text-green-500">online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                  msg.from === 'me' ? 'bg-green-500 text-white rounded-br-sm' : 'bg-white rounded-bl-sm'
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    msg.from === 'me' ? 'text-green-100' : 'text-gray-400'
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-3">
            <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600">
              📎
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 border rounded-full px-4 py-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600">
              📤
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
