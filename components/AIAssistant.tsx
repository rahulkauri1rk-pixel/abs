
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Trash2, Download, Minimize2, Maximize2, Lightbulb, MapPin, ExternalLink, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { useSite } from '../contexts/SiteContext';

const SUGGESTED_QUESTIONS = [
  "Where is your office located?",
  "Find property registration offices nearby",
  "Show me banks near me for valuation",
  "How much does a property valuation cost?",
  "What documents are needed?"
];

const AIAssistant: React.FC = () => {
  const { config } = useSite();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('abs_chat_history');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse chat history", e);
        }
      }
    }
    return [{
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm the AI Assistant for Aaditya Building Solution. I can help answer questions about property surveys, valuations, and find relevant locations for you. How can I assist you today?"
    }];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    localStorage.setItem('abs_chat_history', JSON.stringify(messages));
  }, [messages]);

  const processMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Filter history: remove errors and the initial welcome message to ensure valid chat structure
      // Also ensure we don't send excessive history (limit to last 10 messages for context window efficiency)
      const recentMessages = messages.filter(m => !m.isError && m.id !== 'welcome').slice(-10);
      
      const history = recentMessages.map(m => ({
          role: m.role,
          text: m.text
      }));

      // Call the server-side API route
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history,
          message: messageText
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server Error: ${response.status}`);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text || "I didn't get a response. Please try again.",
        groundingChunks: data.groundingChunks
      }]);

    } catch (error: any) {
      console.error('Error fetching AI response:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Connection Issue: ${error.message || "Please check your internet connection."}`,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    processMessage(input);
  };

  const handleChipClick = (question: string) => {
    processMessage(question);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      const initialMessage: ChatMessage = {
        id: 'welcome',
        role: 'model',
        text: "Hello! I'm the AI Assistant for Aaditya Building Solution. I can help answer questions about property surveys, valuations, and find relevant locations for you. How can I assist you today?"
      };
      setMessages([initialMessage]);
    }
  };

  const handleExportChat = () => {
    const chatText = messages
      .map(msg => `[${msg.role === 'model' ? 'AI Assistant' : 'User'}]: ${msg.text}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abs-chat-history-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!config.features.enableAI) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(false)}
        className={`fixed bottom-6 right-6 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white p-4 rounded-full shadow-glow z-40 transition-all duration-300 hover:scale-110 flex items-center justify-center gap-2 group ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        aria-label="Open AI Assistant"
      >
        <MessageSquare size={26} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap pl-0 group-hover:pl-2 font-medium">
          Ask AI Expert
        </span>
      </button>

      <div
        className={`fixed bottom-0 right-0 md:bottom-24 md:right-8 w-full md:w-[400px] bg-white dark:bg-slate-900 shadow-2xl rounded-t-2xl md:rounded-3xl flex flex-col z-50 transition-all duration-300 transform border border-slate-200 dark:border-slate-700 ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'
        } ${isMinimized ? 'h-[70px] md:h-[70px]' : 'h-[80vh] md:h-[600px]'}`}
      >
        <div 
          className="bg-gradient-to-r from-primary to-primary-dark text-white p-4 rounded-t-2xl md:rounded-t-3xl flex justify-between items-center cursor-pointer"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold font-heading text-base">Aaditya</h3>
              {!isMinimized && (
                <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                  Online
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {!isMinimized && (
              <>
                <button
                  onClick={handleExportChat}
                  title="Export Chat"
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={handleClearChat}
                  title="Clear Chat"
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <div className="w-px h-5 bg-white/20 mx-1"></div>
              </>
            )}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors md:block hidden"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 dark:bg-slate-950 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-3 ${
                    msg.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-200'
                        : 'bg-gradient-to-br from-primary-light to-primary text-white'
                    }`}
                  >
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="max-w-[85%] flex flex-col gap-2">
                    <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-none'
                            : msg.isError
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-bl-none'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                        }`}
                    >
                        {msg.isError && <AlertCircle size={14} className="inline mr-2 mb-0.5" />}
                        {msg.text}
                    </div>
                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                        <div className="flex flex-col gap-2 mt-1">
                            {msg.groundingChunks.map((chunk: any, i: number) => {
                                if (chunk.maps?.uri && chunk.maps?.title) {
                                    return (
                                        <a 
                                            key={i} 
                                            href={chunk.maps.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm group"
                                        >
                                            <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-md text-red-600 dark:text-red-400">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{chunk.maps.title}</div>
                                                <div className="text-[10px] text-slate-500 truncate">View on Google Maps</div>
                                            </div>
                                            <ExternalLink size={12} className="text-slate-400 group-hover:text-primary" />
                                        </a>
                                    )
                                }
                                if (chunk.web?.uri && chunk.web?.title) {
                                    return (
                                        <a 
                                            key={i} 
                                            href={chunk.web.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm group"
                                        >
                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md text-primary">
                                                <ExternalLink size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{chunk.web.title}</div>
                                                <div className="text-[10px] text-slate-500 truncate">Source</div>
                                            </div>
                                        </a>
                                    )
                                }
                                return null;
                            })}
                        </div>
                    )}
                  </div>
                </div>
              )))}
              {isLoading && (
                <div className="flex items-end gap-3">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Bot size={16} />
                   </div>
                   <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                      </div>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {!isLoading && messages.length < 5 && (
              <div className="px-5 pb-2 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-1 mb-2">
                   <Lightbulb size={12} className="text-amber-500" />
                   <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Suggested Questions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(question)}
                      className="text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary transition-colors shadow-sm whitespace-nowrap"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about locations, valuations..."
                  className="w-full pl-5 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary/30 rounded-full focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm dark:text-white transition-all shadow-inner"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-md hover:shadow-lg hover:scale-105"
                >
                  <Send size={16} className={isLoading ? "opacity-0" : "opacity-100"} />
                  {isLoading && <Loader2 size={16} className="absolute top-2 left-2 animate-spin" />}
                </button>
              </form>
              <div className="text-[10px] text-center mt-3 text-slate-400 dark:text-slate-500 font-medium">
                AI can make mistakes. Please verify important info.
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AIAssistant;
