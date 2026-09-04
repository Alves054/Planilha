import React, { useState, useEffect } from 'react';
import { Week, WeekMetrics, AIConversationItem, AIMessageItem } from '../types/workout';
import { ConversationSidebar } from '../components/ai/ConversationSidebar';
import { ChatWindow } from '../components/ai/ChatWindow';
import {
  listAiConversations,
  getAiConversation,
  createAiConversation,
  deleteAiConversation,
  sendAiMessage
} from '../services/api';

interface PaceAIProps {
  week: Week | null;
  metrics: WeekMetrics | null;
}

export const PaceAI: React.FC<PaceAIProps> = ({ week, metrics }) => {
  const [conversations, setConversations] = useState<AIConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadConversations = async () => {
    try {
      const data = await listAiConversations();
      setConversations(data);
      if (data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    }
  };

  const loadActiveMessages = async (convId: string) => {
    try {
      const details = await getAiConversation(convId);
      setMessages(details.messages || []);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadActiveMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const handleNewConversation = async () => {
    try {
      const newConv = await createAiConversation(week?.id, 'Nova Conversa');
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (confirm('Deseja excluir este histórico de conversa?')) {
      try {
        await deleteAiConversation(id);
        const updated = conversations.filter((c) => c.id !== id);
        setConversations(updated);
        if (activeConversationId === id) {
          setActiveConversationId(updated[0]?.id || null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);

    // Optimistic user message update
    const tempUserMsg: AIMessageItem = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId || 'temp',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await sendAiMessage({
        message: text,
        conversationId: activeConversationId || undefined,
        weekId: week?.id
      });

      if (result.conversationId && result.conversationId !== activeConversationId) {
        setActiveConversationId(result.conversationId);
      }

      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, result.message]);
      await loadConversations();
    } catch (err: any) {
      const errorText = err.response?.data?.error || err.message || 'Não foi possível consultar o Pace AI no momento.';
      const tempErrorMsg: AIMessageItem = {
        id: `err-${Date.now()}`,
        conversationId: activeConversationId || 'temp',
        role: 'assistant',
        content: `⚠️ **Aviso:** ${errorText}`,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-5rem)] overflow-hidden bg-zinc-950">
      
      {/* Sidebar de Conversas */}
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Janela de Chat Principal */}
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        week={week}
        metrics={metrics}
      />

    </div>
  );
};
