import { ParsedPdfResult, ParsedWorkoutSession } from '../pdf/pdfParserService.js';

/**
 * Envia a imagem para a API OpenAI Vision (GPT-4o) e extrai o conteúdo da planilha
 * como um texto estruturado, depois retorna um ParsedPdfResult compatível.
 */
export async function parseImageContent(
  imageBase64: string,
  mimeType: string,
  referenceStartDate: string = '2026-09-07'
): Promise<ParsedPdfResult> {
  const apiKey = process.env.OPENAI_API_KEY || '';

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      'OpenAI API não configurada. Defina OPENAI_API_KEY no backend/.env para importar imagens.'
    );
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const systemPrompt = `Você é um especialista em interpretar planilhas de treino de corrida.
Analise a imagem da planilha semanal de treino e extraia TODOS os treinos de cada dia da semana.
Também identifique o atleta ("Nome: ...") e o período/datas ("05/10 a 11/10" ou datas na coluna DATA).

Retorne SOMENTE um JSON válido com esta estrutura exata (sem markdown, sem código, apenas JSON puro):
{
  "title": "título da planilha (ex: PLANO DE TREINAMENTO 7 KM - SEMANA 3)",
  "athleteName": "nome do atleta se visível (ex: Hugo Henrique Martins)",
  "startDate": "YYYY-MM-DD (data da segunda-feira extraída da coluna DATA/PERÍODO ou use a data de referência)",
  "endDate": "YYYY-MM-DD (data do domingo correspondente)",
  "plannedVolumeKm": 20,
  "originalPdfVolume": "~ 18 – 22 km",
  "workouts": [
    {
      "dayOfWeek": "SEGUNDA",
      "period": "MANHA",
      "time": "06:30",
      "category": "LEVE",
      "name": "Rodagem leve (ritmo confortável)",
      "targetDistanceKm": 4.5,
      "targetPaceMin": "5:20",
      "targetPaceMax": "5:40",
      "repeatCount": 1,
      "notes": "RPE: 2-3 | Objetivo: Soltar as pernas e manter a base. Terreno plano. Sem forçar."
    }
  ]
}

REGRAS OBRIGATÓRIAS:
- dayOfWeek deve ser exatamente um destes: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO, DOMINGO (mapeie SEG->SEGUNDA, TER->TERCA, QUA->QUARTA, QUI->QUINTA, SEX->SEXTA, SÁB->SABADO, DOM->DOMINGO)
- period deve ser: MANHA, TARDE ou NOITE
- category deve ser: LEVE, REGENERATIVO, TIROS, FARTLEK, CONTROLADO, LONGAO, HALTERES, DESCANSO, ACADEMIA
- Se o dia for "Descanso completo" ou descanso, coloque category: "DESCANSO" e targetDistanceKm: 0
- Para academia/musculação/halteres, use category: "ACADEMIA" ou "HALTERES"
- Se tiver tiros ou repetições (ex: "4 x 400 m", "6 x 200 m", "4 x 100 m", "10x200m"), use category: "TIROS" e repeatCount: número de repetições (ex: 4, 6, 10)
- Faixa de volume (ex: "4,0 - 5,0" ou "6,0 - 7,0"): use o valor médio como targetDistanceKm em número (ex: 4.5, 6.5)
- Extraia paces no formato "MM:SS" (ex: "5:20", "5:40", "3:55", "4:00")
- Em notes, junte o RPE, Objetivo e Observações descritos na linha
- plannedVolumeKm deve ser o volume total estimado da semana em número
`;

  const userMessage = `Analise esta planilha semanal de treino e retorne o JSON estruturado conforme instruído. Data de início da semana sugerida: ${referenceStartDate}`;

  const requestBody = {
    model,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: 'high'
            }
          }
        ]
      }
    ],
    max_tokens: 3000,
    temperature: 0.1
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[IMAGE PARSER] Erro na API OpenAI (${response.status}):`, errorText);

    if (response.status === 401) {
      throw new Error('Chave da API OpenAI inválida. Verifique OPENAI_API_KEY no .env.');
    } else if (response.status === 429) {
      throw new Error('Limite da API OpenAI atingido. Tente novamente em instantes.');
    } else if (response.status === 400) {
      throw new Error('Imagem não suportada. Use PNG, JPG, JPEG ou WEBP com boa resolução.');
    } else {
      throw new Error(`Erro ao consultar OpenAI Vision (${response.status}). Tente novamente.`);
    }
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '';

  console.log('[IMAGE PARSER] Resposta da OpenAI Vision recebida.');

  // Extrair JSON da resposta (remove possíveis marcadores de código)
  let jsonStr = rawContent.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error('[IMAGE PARSER] Falha ao fazer parse do JSON:', jsonStr.slice(0, 500));
    throw new Error(
      'O modelo não retornou um JSON válido. Tente novamente ou use uma imagem mais nítida.'
    );
  }

  if (!parsed.workouts || !Array.isArray(parsed.workouts) || parsed.workouts.length === 0) {
    throw new Error(
      'Nenhum treino foi identificado na imagem. Use uma imagem nítida da planilha semanal.'
    );
  }

  // Normalizar e validar os treinos retornados
  const validDays = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
  const validPeriods = ['MANHA', 'TARDE', 'NOITE'];
  const validCategories = ['LEVE', 'REGENERATIVO', 'TIROS', 'FARTLEK', 'CONTROLADO', 'LONGAO', 'HALTERES', 'DESCANSO', 'ACADEMIA'];

  const workouts: ParsedWorkoutSession[] = parsed.workouts
    .filter((w: any) => validDays.includes(w.dayOfWeek))
    .map((w: any): ParsedWorkoutSession => ({
      dayOfWeek: w.dayOfWeek as any,
      period: validPeriods.includes(w.period) ? w.period : 'MANHA',
      time: w.time || '06:30',
      category: validCategories.includes(w.category) ? w.category : 'LEVE',
      name: w.name || `Treino ${w.dayOfWeek}`,
      targetDistanceKm: typeof w.targetDistanceKm === 'number' ? w.targetDistanceKm : undefined,
      estimatedDistanceKm: typeof w.estimatedDistanceKm === 'number' ? w.estimatedDistanceKm : (typeof w.targetDistanceKm === 'number' ? w.targetDistanceKm : undefined),
      targetPaceMin: w.targetPaceMin || undefined,
      targetPaceMax: w.targetPaceMax || undefined,
      repeatCount: typeof w.repeatCount === 'number' ? w.repeatCount : 1,
      notes: w.notes || undefined,
      steps: Array.isArray(w.steps) ? w.steps : undefined
    }));

  if (workouts.length === 0) {
    throw new Error('Nenhum treino válido pôde ser extraído da imagem. Verifique se a planilha contém os dias da semana.');
  }

  // Calcular datas de início e fim da semana
  const effectiveStartDate = parsed.startDate || referenceStartDate;
  const endDate = parsed.endDate || calculateEndDate(effectiveStartDate);
  const totalKm = parsed.plannedVolumeKm || workouts.reduce((sum, w) => sum + (w.targetDistanceKm || 0), 0);

  console.log(`[IMAGE PARSER] ${workouts.length} treinos extraídos com sucesso via OpenAI Vision.`);

  return {
    title: parsed.title || 'Planilha Importada via Imagem',
    athleteName: parsed.athleteName,
    startDate: effectiveStartDate,
    endDate,
    plannedVolumeKm: totalKm,
    originalPdfVolume: parsed.originalPdfVolume || `≈ ${Math.round(totalKm)} km`,
    workouts
  };
}

function calculateEndDate(startDateStr: string): string {
  try {
    const parts = startDateStr.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + 6);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch (e) {
    return '2026-09-13';
  }
}
