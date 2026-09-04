import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Sparkles, Calendar, Gauge, Dumbbell } from 'lucide-react';
import { AIMessageItem, Week, WeekMetrics } from '../../types/workout';
import { MessageBubble } from './MessageBubble';
import { QuickQuestions } from './QuickQuestions';

interface ChatWindowProps {
  messages: AIMessageItem[];
  isLoading: boolean;
  onSendMessage: (messageText: string) => void;
  week: Week | null;
  metrics: WeekMetrics | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  onSendMessage,
  week,
  metrics
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      
      {/* Context Banner */}
      {week && metrics && (
        <div className="p-4 bg-zinc-900/70 border-b border-zinc-850 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>Pace AI</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  GPT-4o
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Assistente especializado nos seus treinos</p>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-zinc-300">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{week.startDate} → {week.endDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Planejado: <strong className="text-white">{week.originalPdfVolume || `${week.plannedVolumeKm} km`}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
              <span>Sessões: <strong className="text-white">{metrics.totalWorkoutsCount}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Messages Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-xl">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Olá, Paulo! Sou o Pace AI.</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Posso analisar os treinos da sua semana, comparar seu volume planejado com o realizado, verificar paces e responder perguntas sobre seu treinamento.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-zinc-400 my-2 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-850 w-fit">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span>Analisando plano e treinos no banco de dados...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer Area: Quick Questions + Input Form */}
      <div className="p-4 border-t border-zinc-850 bg-zinc-950/90 space-y-2">
        <QuickQuestions
          disabled={isLoading}
          onSelectQuestion={(q) => {
            setInputText(q);
          }}
        />

        <div className="relative flex items-end gap-2 bg-zinc-900 border border-zinc-700 focus-within:border-blue-500 rounded-2xl p-2 transition-all">
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta sobre seus treinos... (Enter para enviar, Shift+Enter para pular linha)"
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none px-2 py-1.5 max-h-28 overflow-y-auto"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-blue-600 shadow-md flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
