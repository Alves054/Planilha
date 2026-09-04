import React from 'react';
import { Plus, MessageSquare, Trash2, Calendar } from 'lucide-react';
import { AIConversationItem } from '../../types/workout';

interface ConversationSidebarProps {
  conversations: AIConversationItem[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}) => {
  return (
    <div className="w-full md:w-64 bg-zinc-950 border-r border-zinc-850 flex flex-col h-full">
      
      {/* New Conversation Button */}
      <div className="p-3">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Conversa</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          Histórico de Análises
        </div>

        {conversations.length > 0 ? (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                  isActive
                    ? 'bg-zinc-900 border border-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <span className="truncate">{conv.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  title="Excluir Conversa"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-xs text-zinc-500 font-sans">
            Nenhuma conversa salva ainda.
          </div>
        )}
      </div>

    </div>
  );
};
