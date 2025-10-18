import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { MessageCircle, Send, Users } from 'lucide-react'
import io from 'socket.io-client'

const Chat = () => {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedChat, setSelectedChat] = useState(null)

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://smart-campus-backend-w37b.onrender.com'
    const newSocket = io(API_BASE_URL)
    setSocket(newSocket)

    newSocket.on('receive-message', (message) => {
      setMessages(prev => [...prev, message])
    })

    return () => newSocket.close()
  }, [])

  const sendMessage = () => {
    if (newMessage.trim() && socket && selectedChat) {
      const messageData = {
        content: newMessage,
        senderId: user.id,
        receiverId: selectedChat.id,
        roomId: `${Math.min(user.id, selectedChat.id)}-${Math.max(user.id, selectedChat.id)}`,
        timestamp: new Date()
      }

      socket.emit('send-message', messageData)
      setMessages(prev => [...prev, { ...messageData, sender: user }])
      setNewMessage('')
    }
  }

  // Mock chat contacts for demo
  const mockContacts = [
    { id: '1', firstName: 'John', lastName: 'Doe', role: 'FACULTY' },
    { id: '2', firstName: 'Jane', lastName: 'Smith', role: 'STUDENT' },
    { id: '3', firstName: 'Admin', lastName: 'User', role: 'ADMIN' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat & Collaboration</h1>
        <p className="text-gray-600">Connect with faculty and fellow students</p>
      </div>

      <div className="bg-white rounded-lg shadow h-96 flex">
        {/* Chat List */}
        <div className="w-1/3 border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Contacts
            </h3>
          </div>
          <div className="overflow-y-auto">
            {mockContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedChat(contact)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedChat?.id === contact.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {contact.firstName[0]}{contact.lastName[0]}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{contact.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedChat.firstName} {selectedChat.lastName}
                </h3>
                <p className="text-sm text-gray-500">{selectedChat.role}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.senderId === user.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.senderId === user.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a contact to start chatting</p>
                <p className="text-sm">Choose someone from your contacts to begin a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat