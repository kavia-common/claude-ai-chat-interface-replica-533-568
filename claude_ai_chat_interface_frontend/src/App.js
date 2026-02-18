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

// PUBLIC_INTERFACE
/**
 * Main App component - Claude.ai chat interface replica
 * Implements a pixel-perfect clone with sidebar, chat area, and message handling
 */
function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState('Claude 3.5 Sonnet');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chats, setChats] = useState([
    { id: 1, title: 'New conversation', timestamp: 'Today', messages: [] },
  ]);
  const [currentChatId, setCurrentChatId] = useState(1);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

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
   * Handles sending a new message
   * Simulates streaming assistant response
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);

    // Simulate thinking
    const thinkingMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      isThinking: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, thinkingMessage]);

    // Simulate streaming response
    setTimeout(() => {
      const responses = [
        "I'm Claude, an AI assistant created by Anthropic. I'm here to help you with a wide range of tasks, from answering questions to helping with analysis, writing, math, coding, and much more.\n\nI aim to be helpful, harmless, and honest in my interactions. How can I assist you today?",
        "That's a great question! Let me break this down for you:\n\n1. **First point**: This is an important consideration\n2. **Second point**: Here's another key aspect\n3. **Third point**: Finally, this completes the picture\n\nWould you like me to elaborate on any of these points?",
        "Here's a simple example:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('World'));\n```\n\nThis code demonstrates a basic function in JavaScript that takes a name parameter and returns a greeting string."
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isThinking);
        return [...filtered, {
          id: Date.now() + 2,
          role: 'assistant',
          content: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      });
      setIsStreaming(false);
    }, 2000);
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
   * Starts a new chat conversation
   */
  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New conversation',
      timestamp: 'Today',
      messages: []
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

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
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-claude-success"
            />
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 px-3 py-2">Today</div>
            {chats.filter(chat => chat.timestamp === 'Today').map(chat => (
              <button
                key={chat.id}
                onClick={() => {
                  setCurrentChatId(chat.id);
                  setMessages(chat.messages);
                }}
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
                        <span className="text-xs text-gray-500">{message.timestamp}</span>
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
                              <button className="p-1.5 hover:bg-gray-100 rounded transition" title="Copy">
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
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isStreaming}
                className={`absolute right-2 bottom-2 p-2 rounded-lg transition ${
                  inputValue.trim() && !isStreaming
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
