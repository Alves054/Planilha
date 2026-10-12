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

Retorne SOMENTE um JSON válido com esta estrutura exata (sem markdown, sem código, apenas JSON puro):
{
  "title": "título da planilha",
  "plannedVolumeKm": 90,
  "originalPdfVolume": "≈ 90 km",
  "workouts": [
    {
      "dayOfWeek": "SEGUNDA",
      "period": "MANHA",
      "time": "06:30",
      "category": "LEVE",
      "name": "10 km Leve",
      "targetDistanceKm": 10,
      "targetPaceMin": "4:40",
      "targetPaceMax": "5:10",
      "repeatCount": 1,
      "notes": "observações opcionais"
    }
  ]
}

REGRAS OBRIGATÓRIAS:
- dayOfWeek deve ser exatamente um destes: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO, DOMINGO
- period deve ser: MANHA, TARDE ou NOITE
- category deve ser: LEVE, REGENERATIVO, TIROS, FARTLEK, CONTROLADO, LONGAO, HALTERES, DESCANSO, ACADEMIA
- Se o dia é descanso, coloque category: "DESCANSO" e targetDistanceKm: 0
- Para academia/musculação, use category: "ACADEMIA" ou "HALTERES"
- Se tiver tiros (ex: 10x200m), use category: "TIROS"
- Converta TODOS os dias que aparecerem na planilha
- Se houver SEGUNDA, TERÇA, QUARTA, etc. em português, converta para SEGUNDA, TERCA, QUARTA, etc.
- Extraia paces no formato "MM:SS" (ex: "4:40", "5:10")
- plannedVolumeKm deve ser o volume total da semana em número
`;

  const userMessage = `Analise esta planilha semanal de treino e retorne o JSON estruturado conforme instruído. Data de início da semana: ${referenceStartDate}`;

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
      notes: w.notes || undefined
    }));

  if (workouts.length === 0) {
    throw new Error('Nenhum treino válido pôde ser extraído da imagem. Verifique se a planilha contém os dias da semana.');
  }

  // Calcular datas de início e fim da semana
  const endDate = calculateEndDate(referenceStartDate);
  const totalKm = parsed.plannedVolumeKm || workouts.reduce((sum, w) => sum + (w.targetDistanceKm || 0), 0);

  console.log(`[IMAGE PARSER] ${workouts.length} treinos extraídos com sucesso via OpenAI Vision.`);

  return {
    title: parsed.title || 'Planilha Importada via Imagem',
    startDate: referenceStartDate,
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
