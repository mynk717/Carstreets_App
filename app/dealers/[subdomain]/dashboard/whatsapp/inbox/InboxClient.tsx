'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

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

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

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
      const response = await fetch(
        `/api/dealers/${subdomain}/whatsapp/conversations`
      );
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
            conv.contactId === contactId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
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
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.5 3.5L6 10l-2.5-2.5L2 9l4 4 8-8z" />
          </svg>
        );
      case 'delivered':
        return (
          <div className="flex -space-x-1">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.5 3.5L6 10l-2.5-2.5L2 9l4 4 8-8z" />
            </svg>
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.5 3.5L6 10l-2.5-2.5L2 9l4 4 8-8z" />
            </svg>
          </div>
        );
      case 'read':
        return (
          <div className="flex -space-x-1">
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.5 3.5L6 10l-2.5-2.5L2 9l4 4 8-8z" />
            </svg>
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.5 3.5L6 10l-2.5-2.5L2 9l4 4 8-8z" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-500" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7 4h2v5H7V4zm0 6h2v2H7v-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Conversation List - Left Sidebar */}
      <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008069]"
            />
            <svg
              className="w-5 h-5 text-gray-500 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">
                Send a message to start chatting
              </p>
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
      <div className="flex-1 flex flex-col bg-[#efeae2]">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-base font-semibold text-white">
                  {(selectedContact.name || selectedContact.phoneNumber)[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">
                  {selectedContact.name || selectedContact.phoneNumber}
                </h2>
                <p className="text-xs text-gray-600">
                  {selectedContact.phoneNumber}
                </p>
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
                      message.direction === 'outbound'
                        ? 'justify-end'
                        : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-md px-4 py-2 rounded-lg shadow',
                        message.direction === 'outbound'
                          ? 'bg-[#d9fdd3]'
                          : 'bg-white'
                      )}
                    >
                      {/* Template Name (if applicable) */}
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
                          <span className="ml-1">
                            {getStatusIcon(message.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input (Placeholder) */}
            <div className="bg-[#f0f2f5] px-4 py-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message (template-only for now)"
                  disabled
                  className="flex-1 px-4 py-2 bg-white rounded-full focus:outline-none cursor-not-allowed opacity-60"
                />
                <button
                  disabled
                  className="bg-[#008069] text-white p-2 rounded-full hover:bg-[#007a5e] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Free-form messaging coming soon. Use templates for now.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg
                className="w-24 h-24 mx-auto mb-4 text-gray-300"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.67-.32-3.83-.88l-.27-.15-2.83.48.48-2.83-.15-.27C4.82 14.67 4.5 13.38 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z" />
              </svg>
              <p className="text-lg font-semibold mb-2">
                Select a conversation
              </p>
              <p className="text-sm">
                Choose a contact to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
