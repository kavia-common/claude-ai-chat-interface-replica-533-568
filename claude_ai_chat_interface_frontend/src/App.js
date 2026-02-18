import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Menu,
  X,
  Plus,
  Search,
  ChevronDown,
  Send,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  MessageSquare,
  Settings,
  HelpCircle,
  User,
  Bot
} from 'lucide-react';
import {
  getAllChats,
  createChat,
  getMessages,
  sendMessageStream,
  deleteChat,
  updateChat,
} from './services/api';

// PUBLIC_INTERFACE
/**
 * Main App component - Claude.ai chat interface replica
 * Implements a pixel-perfect clone with sidebar, chat area, and message handling
 * Integrated with Express backend for real chat functionality and SSE streaming
 */
function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState('Claude 3.5 Sonnet');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const streamControllerRef = useRef(null);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    }
  }, [currentChatId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // PUBLIC_INTERFACE
  /**
   * Loads all chats from the backend
   */
  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedChats = await getAllChats();
      setChats(fetchedChats);
      
      // If no current chat, select the first one or create new
      if (!currentChatId && fetchedChats.length > 0) {
        setCurrentChatId(fetchedChats[0].id);
      } else if (fetchedChats.length === 0) {
        // Create initial chat if none exist
        await handleNewChat();
      }
    } catch (err) {
      setError('Failed to load chats: ' + err.message);
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Loads messages for a specific chat
   */
  const loadMessages = async (chatId) => {
    try {
      const fetchedMessages = await getMessages(chatId);
      setMessages(fetchedMessages);
    } catch (err) {
      setError('Failed to load messages: ' + err.message);
      console.error('Error loading messages:', err);
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Handles sending a new message with SSE streaming
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming || !currentChatId) return;

    const messageContent = inputValue;
    setInputValue('');
    setIsStreaming(true);
    setError(null);

    // Create temporary assistant message for streaming
    const tempAssistantId = `temp-${Date.now()}`;

    try {
      streamControllerRef.current = sendMessageStream(
        currentChatId,
        messageContent,
        {
          onUserMessage: (userMsg) => {
            // Add confirmed user message
            setMessages((prev) => [
              ...prev,
              {
                id: userMsg.id,
                role: 'user',
                content: userMsg.content,
                timestamp: userMsg.timestamp,
              },
            ]);
          },
          onThinking: () => {
            // Add thinking indicator
            setMessages((prev) => [
              ...prev,
              {
                id: tempAssistantId,
                role: 'assistant',
                content: '',
                isThinking: true,
                timestamp: new Date().toISOString(),
              },
            ]);
          },
          onContent: (chunk) => {
            // Update assistant message with streaming content
            setMessages((prev) => {
              const filtered = prev.filter(
                (msg) => msg.id !== tempAssistantId || !msg.isThinking
              );
              const existing = filtered.find((msg) => msg.id === tempAssistantId);

              if (existing) {
                return filtered.map((msg) =>
                  msg.id === tempAssistantId
                    ? { ...msg, content: msg.content + chunk.content }
                    : msg
                );
              } else {
                return [
                  ...filtered,
                  {
                    id: tempAssistantId,
                    role: 'assistant',
                    content: chunk.content,
                    timestamp: new Date().toISOString(),
                  },
                ];
              }
            });
          },
          onComplete: (completeMsg) => {
            // Replace temporary message with final one
            setMessages((prev) => {
              const filtered = prev.filter((msg) => msg.id !== tempAssistantId);
              return [
                ...filtered,
                {
                  id: completeMsg.id,
                  role: 'assistant',
                  content: completeMsg.content,
                  timestamp: completeMsg.timestamp,
                },
              ];
            });
            setIsStreaming(false);
            
            // Update chat list to reflect new message
            loadChats();
          },
          onError: (errorData) => {
            setError('Failed to send message: ' + errorData.message);
            setMessages((prev) => prev.filter((msg) => msg.id !== tempAssistantId));
            setIsStreaming(false);
          },
        }
      );
    } catch (err) {
      setError('Failed to send message: ' + err.message);
      console.error('Error sending message:', err);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempAssistantId));
      setIsStreaming(false);
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Handles copying code block content to clipboard
   */
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  // PUBLIC_INTERFACE
  /**
   * Handles copying message content to clipboard
   */
  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  // PUBLIC_INTERFACE
  /**
   * Starts a new chat conversation
   */
  const handleNewChat = async () => {
    try {
      const newChat = await createChat('New conversation');
      setChats((prev) => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setMessages([]);
    } catch (err) {
      setError('Failed to create new chat: ' + err.message);
      console.error('Error creating chat:', err);
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Switches to a different chat
   */
  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  // PUBLIC_INTERFACE
  /**
   * Deletes a chat
   */
  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChat(chatId);
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      
      // If deleted current chat, switch to another
      if (chatId === currentChatId) {
        const remainingChats = chats.filter((chat) => chat.id !== chatId);
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id);
        } else {
          await handleNewChat();
        }
      }
    } catch (err) {
      setError('Failed to delete chat: ' + err.message);
      console.error('Error deleting chat:', err);
    }
  };

  // Group chats by date
  const groupChatsByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    chats.forEach((chat) => {
      const chatDate = new Date(chat.createdAt);
      const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

      if (chatDay.getTime() === today.getTime()) {
        groups.Today.push(chat);
      } else if (chatDay.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(chat);
      } else if (chatDay >= lastWeek) {
        groups['Previous 7 Days'].push(chat);
      } else {
        groups.Older.push(chat);
      }
    });

    return groups;
  };

  // Filter chats by search query
  const filteredChats = searchQuery
    ? chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  const chatGroups = groupChatsByDate();

  // Custom code block renderer
  const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');
    
    if (inline) {
      return <code className="bg-gray-100 text-claude-error px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
    }

    return (
      <div className="relative my-4 rounded-lg bg-gray-900 text-gray-100">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <span className="text-xs text-gray-400">{match ? match[1] : 'code'}</span>
          <button
            onClick={() => handleCopyCode(code)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition"
          >
            <Copy size={14} />
            Copy code
          </button>
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  };

  if (loading && chats.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Bot size={48} className="text-claude-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            <Plus size={18} />
            New chat
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-claude-success"
            />
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery ? (
            <div className="p-2">
              {filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm ${
                      currentChatId === chat.id ? 'bg-gray-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-gray-500 flex-shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 py-4">No chats found</p>
              )}
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(chatGroups).map(
                ([groupName, groupChats]) =>
                  groupChats.length > 0 && (
                    <div key={groupName} className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 px-3 py-2">
                        {groupName}
                      </div>
                      {groupChats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => handleSelectChat(chat.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm ${
                            currentChatId === chat.id ? 'bg-gray-200' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-gray-500 flex-shrink-0" />
                            <span className="truncate">{chat.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-200">
          <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm">
            <User size={18} className="text-gray-600" />
            <span className="flex-1 text-left">Account</span>
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm">
            <Settings size={18} className="text-gray-600" />
            <span className="flex-1 text-left">Settings</span>
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm">
            <HelpCircle size={18} className="text-gray-600" />
            <span className="flex-1 text-left">Help</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 border-b border-gray-200 flex items-center px-4 gap-3 bg-white">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Model Selector */}
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition">
            <span className="text-sm font-medium">{selectedModel}</span>
            <ChevronDown size={16} />
          </button>

          {/* Error Display */}
          {error && (
            <div className="ml-auto text-sm text-claude-error">
              {error}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // Empty State
            <div className="h-full flex flex-col items-center justify-center px-4 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-claude-primary/10 to-gray-50 rounded-2xl flex items-center justify-center mb-6">
                <Bot size={32} className="text-claude-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-gray-800">
                How can I help you today?
              </h2>
              <p className="text-gray-600 mb-8">
                I'm Claude, an AI assistant. I can help with writing, analysis, math, coding, and much more.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                {[
                  'Help me write an email',
                  'Explain quantum computing',
                  'Debug my code',
                  'Plan a trip itinerary'
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(prompt)}
                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left text-sm transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((message) => (
                <div key={message.id} className="mb-8">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-claude-primary text-white' 
                        : 'bg-claude-success text-white'
                    }`}>
                      {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">
                          {message.role === 'user' ? 'You' : 'Claude'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>

                      {message.isThinking ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      ) : (
                        <>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code: CodeBlock
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>

                          {/* Message Actions */}
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mt-4">
                              <button 
                                className="p-1.5 hover:bg-gray-100 rounded transition" 
                                title="Copy"
                                onClick={() => handleCopyMessage(message.content)}
                              >
                                <Copy size={16} className="text-gray-600" />
                              </button>
                              <button className="p-1.5 hover:bg-gray-100 rounded transition" title="Good response">
                                <ThumbsUp size={16} className="text-gray-600" />
                              </button>
                              <button className="p-1.5 hover:bg-gray-100 rounded transition" title="Bad response">
                                <ThumbsDown size={16} className="text-gray-600" />
                              </button>
                              <button className="p-1.5 hover:bg-gray-100 rounded transition" title="Regenerate">
                                <RotateCcw size={16} className="text-gray-600" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="relative bg-white border border-gray-300 rounded-2xl shadow-sm focus-within:border-claude-success focus-within:ring-2 focus-within:ring-claude-success/20 transition">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message Claude..."
                className="w-full px-4 py-3 pr-12 resize-none focus:outline-none rounded-2xl"
                rows={1}
                style={{ maxHeight: '200px' }}
                disabled={!currentChatId}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isStreaming || !currentChatId}
                className={`absolute right-2 bottom-2 p-2 rounded-lg transition ${
                  inputValue.trim() && !isStreaming && currentChatId
                    ? 'bg-claude-success text-white hover:bg-claude-success/90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-xs text-gray-500 text-center mt-3">
              Claude can make mistakes. Please double-check responses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
