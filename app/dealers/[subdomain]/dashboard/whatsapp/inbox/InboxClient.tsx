'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { ArrowLeft, Search } from 'lucide-react';

interface Contact {
  id: string;
  phoneNumber: string;
  name: string | null;
}

interface Conversation {
  id: string;
  contactId: string;
  lastMessageAt: Date;
  lastMessagePreview: string | null;
  unreadCount: number;
  totalMessages: number;
  contact: Contact;
}

interface Message {
  id: string;
  dealerId: string;
  contactId: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: number;
  templateName?: string;
}


export default function InboxClient({
  subdomain,
  dealerId,
}: {
  subdomain: string;
  dealerId: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Polling for new messages - ADDED THIS
useEffect(() => {
  if (!selectedContact) return;
  
  loadMessages(selectedContact.id);
  
  // Poll every 5 seconds for new messages
  const interval = setInterval(() => {
    loadMessages(selectedContact.id);
  }, 5000);
  
  return () => clearInterval(interval);
}, [selectedContact?.id]);

// Auto-scroll to bottom when messages change
useEffect(() => {
  scrollToBottom();
}, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dealers/${subdomain}/whatsapp/conversations`);
      const data = await response.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (contactId: string) => {
    if (loadingMessages) return;
    try {
      setLoadingMessages(true);
      const response = await fetch(
        `/api/dealers/${subdomain}/whatsapp/conversations/${contactId}`
      );
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        setSelectedContact(data.contact);
        
        // Update conversation unread count to 0
        setConversations((prev) =>
          prev.map((conv) =>
            conv.contactId === contactId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleBackToList = () => {
    setSelectedContact(null);
    setMessages([]);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContact || sending) return;
  
    setSending(true);
    try {
      const response = await fetch(`/api/dealers/${subdomain}/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedContact.phoneNumber,
          message: messageInput.trim(),
        }),
      });
  
      if (response.ok) {
        setMessageInput('');
        // Reload messages to show the sent message
        await loadMessages(selectedContact.id);
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Send error:', error);
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Conversation List - Left Panel */}
      <div
        className={clsx(
          'w-full md:w-96 bg-white border-r border-gray-200 flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'md:translate-x-0', // Always visible on desktop
          selectedContact ? '-translate-x-full md:translate-x-0' : 'translate-x-0' // Slide left on mobile when chat selected
        )}
      >
        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008069]"
            />
            <Search className="w-5 h-5 text-gray-500 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Send a message to start chatting</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadMessages(conv.contactId)}
                className={clsx(
                  'w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition border-b border-gray-100',
                  selectedContact?.id === conv.contactId && 'bg-gray-100'
                )}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-white">
                    {(conv.contact.name || conv.contact.phoneNumber)[0].toUpperCase()}
                  </span>
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {conv.contact.name || conv.contact.phoneNumber}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), {
                        addSuffix: false,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessagePreview || 'No messages'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 bg-[#25D366] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat View - Right Panel */}
      <div
        className={clsx(
          'absolute md:relative inset-0 md:inset-auto',
          'w-full md:flex-1 flex flex-col bg-[#efeae2]',
          'transition-transform duration-300 ease-in-out',
          'md:translate-x-0', // Always visible on desktop
          selectedContact ? 'translate-x-0' : 'translate-x-full md:translate-x-0' // Slide in from right on mobile
        )}
      >
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3 border-b border-gray-200 flex-shrink-0">
              {/* Back Button - Only on Mobile */}
              <button
                onClick={handleBackToList}
                className="md:hidden text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-base font-semibold text-white">
                  {(selectedContact.name || selectedContact.phoneNumber)[0].toUpperCase()}
                </span>
              </div>

              {/* Contact Info */}
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">
                  {selectedContact.name || selectedContact.phoneNumber}
                </h2>
                <p className="text-xs text-gray-600">{selectedContact.phoneNumber}</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={clsx(
                      'flex',
                      message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-md px-4 py-2 rounded-lg shadow',
                        message.direction === 'outbound' ? 'bg-[#d9fdd3]' : 'bg-white'
                      )}
                    >
                      {/* Template Name if applicable */}
                      {message.templateName && (
                        <div className="text-xs text-gray-500 mb-1 italic">
                          Template: {message.templateName}
                        </div>
                      )}

                      {/* Message Content */}
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {message.content}
                      </p>

                      {/* Timestamp & Status */}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.direction === 'outbound' && (
                          <span className="text-xs text-gray-500">
                            {message.status === 'read' && '✓✓'}
                            {message.status === 'delivered' && '✓✓'}
                            {message.status === 'sent' && '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
<div className="bg-f0f2f5 px-4 py-3 border-t border-gray-200">
  <div className="flex items-center gap-2">
    <input
      type="text"
      placeholder="Type a message..."
      value={messageInput}
      onChange={(e) => setMessageInput(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      }}
      className="flex-1 px-4 py-2 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#008069] text-gray-900 placeholder:text-gray-500"
    />

<button
  onClick={handleSendMessage}
  disabled={!messageInput.trim() || sending}
  className="bg-[#008069] text-white p-2 rounded-full hover:bg-[#007a5e] transition disabled:opacity-60 disabled:cursor-not-allowed"
>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
</button>

              </div>
            </div>
          </>
        ) : (
          /* Empty State - Desktop Only */
          <div className="hidden md:flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg
                className="w-24 h-24 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg font-semibold mb-2">Select a conversation</p>
              <p className="text-sm">Choose a contact to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
