import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Send, Bot, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import LoadingSpinner from '../components/LoadingSpinner';

function SourceCard({ source, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-sm"
      >
        <span className="flex items-center gap-2 text-gray-700">
          <FileText className="h-3.5 w-3.5 text-primary-400" />
          <span className="font-medium">[{index + 1}] {source.documentName || 'Unknown'}</span>
          <span className="text-gray-400">· Chunk {source.chunkIndex}</span>
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && source.preview && (
        <div className="px-3 py-2 text-xs text-gray-600 bg-white border-t">
          {source.preview}...
        </div>
      )}
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary-600' : 'bg-gray-200'
      }`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-gray-600" />}
      </div>
      <div className={`max-w-[75%] ${
        isUser ? 'bg-primary-600 text-white rounded-2xl rounded-tr-md px-4 py-3' : 'bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3'
      }`}>
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <>
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {message.sources?.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sources</p>
                {message.sources.map((src, i) => <SourceCard key={i} source={src} index={i} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello ${user?.name}! I'm your AI assistant for **${user?.organization?.name}**'s knowledge base. Ask me anything about your organization's documents.` }
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = { role: 'user', content: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const { data } = await api.post('/chat', { query: query.trim() });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      toast.error('Failed to get response');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-72px)] flex flex-col">
      <div className="card mb-4 py-4">
        <div className="flex items-center gap-3">
          <Bot className="h-7 w-7 text-primary-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{user?.organization?.name} AI Assistant</h1>
            <p className="text-sm text-gray-500">Answers grounded in your organization's documents</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="h-4 w-4 text-gray-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1.5 items-center py-1">
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="input-field flex-1"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !query.trim()} className="btn-primary px-5 flex items-center gap-2">
          {loading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
          Send
        </button>
      </form>
    </div>
  );
}
