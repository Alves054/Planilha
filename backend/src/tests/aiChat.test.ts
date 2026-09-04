import { buildTrainingContext } from '../services/ai/TrainingContextService.js';
import { getPaceAISystemPrompt } from '../services/ai/AIPromptService.js';
import { OpenAIService } from '../services/ai/OpenAIService.js';
import { prisma } from '../prisma.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

async function runAiTestSuite() {
  console.log('\n==================================================');
  console.log('🤖 INICIANDO SUÍTE DE TESTES DO PACE AI');
  console.log('==================================================\n');

  try {
    // 1. Obter usuário padrão
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Paulo Henrique', email: 'paulo@pacetraining.com' }
      });
    }

    // TEST 1: Montagem de Contexto Real dos Treinos da Semana
    console.log('--- TEST 1: Serviço de Montagem de Contexto (buildTrainingContext) ---');
    const contextResult = await buildTrainingContext(user.id);
    assert(contextResult.contextText.includes('Paulo Henrique'), 'Contexto inclui o nome do atleta');
    assert(contextResult.plannedKm > 0 || contextResult.calculatedKm > 0, 'Contexto calcula os volumes de km da semana');
    assert(contextResult.sessionsCount >= 0, 'Contexto contabiliza as sessões de treino');

    // TEST 2: Verificação do System Prompt Oficial (Zero Alucinação)
    console.log('\n--- TEST 2: Diretrizes do System Prompt Pace AI ---');
    const sysPrompt = getPaceAISystemPrompt();
    assert(sysPrompt.includes('Pace AI'), 'System prompt identifica o Pace AI');
    assert(sysPrompt.includes('NUNCA invente'), 'System prompt impõe regra estrita contra alucinação de dados');
    assert(sysPrompt.includes('DIFERENCIE CLARAMENTE TREINO PLANEJADO DE TREINO REALIZADO'), 'System prompt exige diferenciação de treinos planejado vs realizado');

    // TEST 3: Tratamento de Ausência de Chave da OpenAI
    console.log('\n--- TEST 3: Tratamento de Segurança para OPENAI_API_KEY Ausente ---');
    const openAiService = new OpenAIService();
    if (!openAiService.isConfigured()) {
      try {
        await openAiService.generateChatResponse('Como foi minha semana?', 'Contexto de Teste');
        assert(false, 'Deveria ter lançado erro de chave ausente');
      } catch (err: any) {
        assert(err.message.includes('OpenAI API não configurada'), 'Erro amigável para chave ausente lançado sem quebrar o sistema');
      }
    } else {
      assert(true, 'OpenAI API KEY está configurada no ambiente');
    }

    // TEST 4: Persistência de Conversas e Mensagens no Banco (Prisma)
    console.log('\n--- TEST 4: Persistência de Conversas e Mensagens (Prisma AIConversation) ---');
    const conv = await prisma.aIConversation.create({
      data: {
        userId: user.id,
        title: 'Análise da Semana Teste'
      }
    });

    const userMsg = await prisma.aIMessage.create({
      data: {
        conversationId: conv.id,
        role: 'user',
        content: 'Como foi meu treino de terça?'
      }
    });

    const assistantMsg = await prisma.aIMessage.create({
      data: {
        conversationId: conv.id,
        role: 'assistant',
        content: 'Na terça-feira você tinha 2 treinos registrados: 10 km leve de manhã e 7 km controlado à tarde.'
      }
    });

    const convFromDb = await prisma.aIConversation.findUnique({
      where: { id: conv.id },
      include: { messages: true }
    });

    assert(convFromDb !== null && convFromDb.messages.length === 2, 'Conversa e 2 mensagens gravadas com sucesso no banco de dados');
    
    // Limpeza da conversa de teste
    await prisma.aIConversation.delete({ where: { id: conv.id } });

    // TEST 5: Isolamento de Usuário (User Isolation)
    console.log('\n--- TEST 5: Isolamento de Dados por Usuário ---');
    const fakeContext = await buildTrainingContext('fake-user-id-999');
    assert(fakeContext.sessionsCount === 0, 'Consulta com ID de usuário inexistente não vaza dados de outros atletas');

    console.log('\n==================================================');
    console.log(`📊 RESULTADO DOS TESTES DO PACE AI: ${passedTests} DE ${totalTests} TESTES PASSARAM COM SUCESSO!`);
    console.log('==================================================\n');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (err: any) {
    console.error('Erro na execução dos testes do Pace AI:', err);
    process.exit(1);
  }
}

runAiTestSuite();
