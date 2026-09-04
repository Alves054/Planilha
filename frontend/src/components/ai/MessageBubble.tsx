import React from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import { AIMessageItem } from '../../types/workout';

interface MessageBubbleProps {
  message: AIMessageItem;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`flex gap-3 my-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1 shadow-md shadow-blue-500/10">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Content */}
      <div className={`group relative max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-600/20'
          : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none shadow-md'
      }`}>
        
        {/* Header inside AI Bubble */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-zinc-800/80">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              PACE AI
            </span>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 transition-opacity p-0.5"
              title="Copiar resposta"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Message Text with simple linebreaks / formatting */}
        <div className="whitespace-pre-wrap font-sans">
          {message.content}
        </div>

        {/* Timestamp */}
        <div className={`text-[10px] mt-1 text-right font-mono ${isUser ? 'text-blue-200/80' : 'text-zinc-500'}`}>
          {formatTimestamp(message.createdAt)}
        </div>

      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 flex-shrink-0 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}

    </div>
  );
};
