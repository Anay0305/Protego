import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { aiAPI } from '../../services/api';

// Simple markdown renderer for chat messages
function renderMarkdown(text: string): JSX.Element {
  // Split by lines to handle lists and paragraphs
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const processInlineMarkdown = (line: string): JSX.Element => {
    // Process bold (**text** or __text__)
    // Process italic (*text* or _text_)
    const parts: (string | JSX.Element)[] = [];
    let remaining = line;
    let keyIndex = 0;

    // Bold: **text**
    while (remaining.includes('**')) {
      const startIdx = remaining.indexOf('**');
      if (startIdx > 0) {
        parts.push(remaining.substring(0, startIdx));
      }
      const endIdx = remaining.indexOf('**', startIdx + 2);
      if (endIdx === -1) {
        parts.push(remaining.substring(startIdx));
        remaining = '';
        break;
      }
      parts.push(<strong key={`b-${keyIndex++}`}>{remaining.substring(startIdx + 2, endIdx)}</strong>);
      remaining = remaining.substring(endIdx + 2);
    }
    if (remaining) parts.push(remaining);

    return <>{parts}</>;
  };

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      elements.push(
        <ListTag key={`list-${elements.length}`} className={listType === 'ul' ? 'list-disc ml-4 space-y-1' : 'list-decimal ml-4 space-y-1'}>
          {listItems.map((item, i) => (
            <li key={i}>{processInlineMarkdown(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Numbered list (1. item)
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(numberedMatch[2]);
      return;
    }

    // Bullet list (- item or * item)
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(bulletMatch[1]);
      return;
    }

    // Not a list item, flush any pending list
    flushList();

    // Empty line
    if (!trimmed) {
      elements.push(<br key={`br-${idx}`} />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="mb-1">
        {processInlineMarkdown(trimmed)}
      </p>
    );
  });

  // Flush any remaining list
  flushList();

  return <div className="space-y-1">{elements}</div>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
  floating?: boolean; // Show as floating button/modal
}

export default function AIChatAssistant({
  isOpen: controlledOpen,
  onClose,
  floating = true
}: AIChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(controlledOpen ?? false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI Safety Assistant. I can help you with safety tips, explain how Protego works, or answer any questions about staying safe. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (controlledOpen !== undefined) {
      setIsOpen(controlledOpen);
    }
  }, [controlledOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (!newState && onClose) {
      onClose();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await aiAPI.chat(userMessage.content, history);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(response.data.timestamp),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Safety Tips', message: 'Give me some safety tips for walking alone' },
    { label: 'How Alerts Work', message: 'How do emergency alerts work in Protego?' },
    { label: 'Voice Commands', message: 'What voice commands can I use?' },
  ];

  // Floating button + modal
  if (floating) {
    return (
      <>
        {/* Floating Button */}
        <button
          onClick={handleToggle}
          className={`fixed bottom-24 right-4 z-40 p-4 rounded-full shadow-lg transition-all duration-300 ${
            isOpen
              ? 'bg-gray-600 rotate-90'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="relative">
              <MessageCircle className="w-6 h-6 text-white" />
              <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
            </div>
          )}
        </button>

        {/* Chat Modal */}
        {isOpen && (
          <div className="fixed bottom-40 right-4 z-50 w-[calc(100%-2rem)] max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Safety Assistant</h3>
                  <p className="text-xs text-purple-200">Powered by AI</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`p-2 rounded-full shrink-0 ${
                      message.role === 'user'
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                    }`}
                  >
                    <div className="text-sm">
                      {message.role === 'assistant'
                        ? renderMarkdown(message.content)
                        : <p className="whitespace-pre-wrap">{message.content}</p>
                      }
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-white">
                <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(action.message)}
                      className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about safety..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-indigo-700 transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Embedded version (non-floating)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Safety Assistant</h3>
            <p className="text-xs text-purple-200">Ask me anything about safety</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`p-2 rounded-full shrink-0 ${
                message.role === 'user'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-purple-100 text-purple-600'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
              }`}
            >
              <div className="text-sm">
                {message.role === 'assistant'
                  ? renderMarkdown(message.content)
                  : <p className="whitespace-pre-wrap">{message.content}</p>
                }
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
