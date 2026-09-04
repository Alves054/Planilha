import { getPaceAISystemPrompt } from './AIPromptService.js';

export interface ChatMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private maxTokens: number;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.maxTokens = parseInt(process.env.AI_MAX_CONTEXT_LENGTH || '1000', 10);
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getModel(): string {
    return this.model;
  }

  async generateChatResponse(
    userMessage: string,
    trainingContextText: string,
    historyMessages: ChatMessageInput[] = []
  ): Promise<{ responseText: string; modelUsed: string; tokensUsed?: number }> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API não configurada no backend. Defina OPENAI_API_KEY no arquivo backend/.env para ativar o Pace AI.');
    }

    const systemPrompt = getPaceAISystemPrompt();

    // Injeta o contexto do treino diretamente na mensagem de sistema
    const fullSystemMessage = `${systemPrompt}\n\n=== DADOS REAIS DO ATLETA (FONTE DA VERDADE) ===\n${trainingContextText}`;

    // Monta o historico de mensagens filtrando tamanho maximo
    const formattedMessages: ChatMessageInput[] = [
      { role: 'system', content: fullSystemMessage },
      ...historyMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          temperature: 0.3, // Baixa temperatura para manter alta fidelidade aos dados reais
          max_tokens: this.maxTokens
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na API OpenAI (${response.status}):`, errorText);

        if (response.status === 401) {
          throw new Error('Chave da API OpenAI inválida ou não autorizada. Verifique a chave OPENAI_API_KEY no .env.');
        } else if (response.status === 429) {
          throw new Error('Limite de uso ou cota da API da OpenAI atingido. Tente novamente mais tarde.');
        } else if (response.status === 404) {
          throw new Error(`Modelo configurado (${this.model}) não encontrado ou indisponível. Altere OPENAI_MODEL no .env.`);
        } else {
          throw new Error(`Não foi possível consultar o Pace AI agora (${response.status}). Tente novamente.`);
        }
      }

      const data = await response.json();
      const choice = data.choices && data.choices[0];
      const responseText = choice?.message?.content || 'Desculpe, não consegui processar sua resposta no momento.';
      const tokensUsed = data.usage?.total_tokens;

      return {
        responseText,
        modelUsed: this.model,
        tokensUsed
      };
    } catch (err: any) {
      console.error('Erro no OpenAIService:', err);
      throw new Error(err.message || 'Não foi possível consultar o Pace AI agora.');
    }
  }
}
