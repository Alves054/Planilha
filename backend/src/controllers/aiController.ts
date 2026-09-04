import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { buildTrainingContext } from '../services/ai/TrainingContextService.js';
import { OpenAIService, ChatMessageInput } from '../services/ai/OpenAIService.js';

export async function sendMessage(req: Request, res: Response) {
  try {
    const { message, conversationId, weekId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Mensagem do usuário é obrigatória.' });
    }

    const openAIService = new OpenAIService();
    if (!openAIService.isConfigured()) {
      return res.status(400).json({
        error: 'OpenAI API não configurada no backend. Defina OPENAI_API_KEY no arquivo backend/.env para ativar o Pace AI.'
      });
    }

    // Obter usuário padrão (garantindo isolamento por usuário)
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Paulo Henrique', email: 'paulo@pacetraining.com' }
      });
    }

    // 1. Obter ou criar a conversa
    let conversation = null;
    if (conversationId) {
      conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, userId: user.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    if (!conversation) {
      const titleSnippet = message.trim().slice(0, 30);
      conversation = await prisma.aIConversation.create({
        data: {
          userId: user.id,
          weekId: weekId || null,
          title: titleSnippet.length < message.trim().length ? `${titleSnippet}...` : titleSnippet
        },
        include: { messages: true }
      });
    }

    // 2. Montar o contexto estrito do treino do usuário (alucinação zero)
    const contextData = await buildTrainingContext(user.id, weekId || conversation.weekId, message);

    // 3. Salvar a mensagem do usuário
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message.trim()
      }
    });

    // 4. Formatar o histórico anterior para enviar a OpenAI
    const historyMessages: ChatMessageInput[] = (conversation.messages || []).map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    // 5. Chamar o serviço OpenAI no backend
    const aiResult = await openAIService.generateChatResponse(
      message.trim(),
      contextData.contextText,
      historyMessages
    );

    // 6. Salvar a resposta do assistente no banco de dados
    const assistantMsg = await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResult.responseText
      }
    });

    // Atualizar titulo da conversa se ainda for o padrao
    if (conversation.title === 'Nova Conversa') {
      const titleSnippet = message.trim().slice(0, 30);
      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { title: titleSnippet.length < message.trim().length ? `${titleSnippet}...` : titleSnippet }
      });
    }

    return res.json({
      success: true,
      conversationId: conversation.id,
      message: assistantMsg,
      modelUsed: aiResult.modelUsed,
      contextSummary: {
        weekTitle: contextData.weekTitle,
        plannedKm: contextData.plannedKm,
        calculatedKm: contextData.calculatedKm,
        sessionsCount: contextData.sessionsCount
      }
    });

  } catch (error: any) {
    console.error('Erro no controller de IA:', error);
    return res.status(500).json({
      error: error.message || 'Não foi possível consultar o Pace AI agora. Tente novamente mais tarde.'
    });
  }
}

export async function listConversations(req: Request, res: Response) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.json([]);

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return res.json(conversations);
  } catch (error) {
    console.error('Erro ao listar conversas da IA:', error);
    return res.status(500).json({ error: 'Erro ao carregar histórico de conversas.' });
  }
}

export async function getConversationDetails(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: String(id) },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        week: true
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada.' });
    }

    return res.json(conversation);
  } catch (error) {
    console.error('Erro ao carregar detalhes da conversa:', error);
    return res.status(500).json({ error: 'Erro ao carregar conversa.' });
  }
}

export async function createConversation(req: Request, res: Response) {
  try {
    const { weekId, title } = req.body;
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Paulo Henrique', email: 'paulo@pacetraining.com' }
      });
    }

    const conversation = await prisma.aIConversation.create({
      data: {
        userId: user.id,
        weekId: weekId || null,
        title: title || 'Nova Conversa'
      },
      include: { messages: true }
    });

    return res.status(201).json(conversation);
  } catch (error) {
    console.error('Erro ao criar nova conversa:', error);
    return res.status(500).json({ error: 'Erro ao criar conversa.' });
  }
}

export async function deleteConversation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.aIConversation.delete({
      where: { id: String(id) }
    });
    return res.json({ message: 'Conversa excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir conversa:', error);
    return res.status(500).json({ error: 'Erro ao excluir conversa.' });
  }
}
