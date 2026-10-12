import { ParsedPdfResult, ParsedWorkoutSession } from './pdfParserService.js';

/**
 * Extrai texto de um Buffer de PDF usando pdf-parse.
 * Retorna o texto bruto do PDF para posterior interpretação.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    return data?.text || '';
  } catch (err: any) {
    console.error('[PDF EXTRACT] Erro ao extrair texto do PDF:', err.message);
    throw new Error('Não foi possível ler o conteúdo do PDF. O arquivo pode estar protegido ou corrompido.');
  }
}

/**
 * Usa OpenAI (GPT-4o) para interpretar o texto bruto do PDF
 * e retornar uma estrutura de treinos semanal.
 */
export async function parsePdfWithAI(
  rawText: string,
  referenceStartDate: string = '2026-09-07'
): Promise<ParsedPdfResult> {
  const apiKey = process.env.OPENAI_API_KEY || '';

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      'OpenAI API não configurada. Configure OPENAI_API_KEY no backend/.env para leitura inteligente de PDF.'
    );
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const systemPrompt = `Você é um especialista em interpretar planilhas de treino de corrida brasileiras.
Analise o texto extraído de uma planilha semanal de treino e retorne SOMENTE um JSON válido, sem markdown.
Identifique também o atleta ("Nome: ...") e o período/datas ("05/10 a 11/10" ou datas na tabela).

ESTRUTURA DO JSON (obrigatória):
{
  "title": "título da planilha (ex: PLANO DE TREINAMENTO 7 KM - SEMANA 3 ou Semana - Paulo Henrique)",
  "athleteName": "nome do atleta se informado (ex: Hugo Henrique Martins)",
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
      "notes": "RPE: 2-3 | Soltar as pernas e manter a base. Terreno plano. Sem forçar."
    }
  ]
}

REGRAS OBRIGATÓRIAS:
- dayOfWeek: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO, DOMINGO (mapeie SEG->SEGUNDA, TER->TERCA, QUA->QUARTA, QUI->QUINTA, SEX->SEXTA, SÁB->SABADO, DOM->DOMINGO)
- period: MANHA, TARDE ou NOITE (use MANHA quando tiver apenas "1 período por dia")
- category:
  * LEVE → corrida fácil, rodagem leve, regenerativa, ritmo confortável
  * REGENERATIVO → regenerativo, recuperação ativa
  * TIROS → tiros, repetições (ex: 4×400m, 6×200m, 4×100m, 10×200m), séries
  * FARTLEK → fartlek, variações de ritmo
  * CONTROLADO → ritmo controlado, tempo run
  * LONGAO → longo, longão, 18km+ confortável
  * HALTERES → musculação, halteres
  * ACADEMIA → academia, exercícios de força, cadeira extensora, agachamento, leg press
  * DESCANSO → descanso, descanso completo, recuperação, rest
- Se for descanso completo, category: "DESCANSO" e targetDistanceKm: 0
- Se o volume for uma faixa (ex: "4,0 - 5,0" ou "6,0 - 7,0"), use a média como targetDistanceKm em número (ex: 4.5, 6.5)
- Extraia repetições em repeatCount (ex: "4 x 400 m" -> repeatCount: 4; "6 x 200 m" -> repeatCount: 6)
- Extraia paces no formato "MM:SS" (ex: "5:20", "5:40", "3:55", "4:00")

INTERPRETAÇÃO DE FORMATOS COMUNS:
- "SEG / SEGUNDA-FEIRA" → dayOfWeek: "SEGUNDA"
- "TER / TERÇA-FEIRA" → dayOfWeek: "TERCA"
- "QUA / QUARTA-FEIRA" → dayOfWeek: "QUARTA"
- "QUI / QUINTA-FEIRA" → dayOfWeek: "QUINTA"
- "SEX / SEXTA-FEIRA" → dayOfWeek: "SEXTA"
- "SÁB / SÁBADO" → dayOfWeek: "SABADO"
- "DOM / DOMINGO" → dayOfWeek: "DOMINGO"

- "5 km (+ 20 min)" → targetDistanceKm: 5 (os 20 min são de academia, não adicionar)
- "9 km (+ tiros)" → targetDistanceKm: 9
- "10 × 200m" ou "15 × 400m" → repeatCount: 10 ou 15, category: "TIROS"
- "ACADEMIA" no treino → category: "ACADEMIA"
- Pace "Leve/Regenerativo: 5:10–5:40" → targetPaceMin: "5:10", targetPaceMax: "5:40"
- Pace "Moderado: 4:40–5:10" → targetPaceMin: "4:40", targetPaceMax: "5:10"
- Pace "Ritmo controlado: 3:50–4:10" → targetPaceMin: "3:50", targetPaceMax: "4:10"
- Fartlek forte: 4:00–4:20, fraco: 5:10–5:40

EXTRAIA UM TREINO POR DIA (quando for 1 período por dia).
Se houver "2º PERÍODO" com conteúdo real (não "—"), crie um segundo treino para o mesmo dia com period: "TARDE".

Retorne APENAS o JSON, sem explicações.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Data de início da semana: ${referenceStartDate}\n\nTexto extraído do PDF:\n\n${rawText.slice(0, 8000)}`
        }
      ],
      max_tokens: 3000,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[PDF AI PARSER] Erro na OpenAI (${response.status}):`, errorText.slice(0, 300));

    if (response.status === 401) throw new Error('Chave OpenAI inválida. Verifique OPENAI_API_KEY.');
    if (response.status === 429) throw new Error('Limite da API OpenAI atingido. Tente novamente.');
    throw new Error(`Erro ao consultar OpenAI para interpretar o PDF (${response.status}).`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '';

  let jsonStr = rawContent.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error('[PDF AI PARSER] JSON inválido recebido:', jsonStr.slice(0, 500));
    throw new Error('O modelo não retornou JSON válido. Tente novamente ou verifique o PDF.');
  }

  if (!parsed.workouts || !Array.isArray(parsed.workouts) || parsed.workouts.length === 0) {
    throw new Error('Nenhum treino foi identificado no PDF. Verifique se o PDF contém uma planilha semanal.');
  }

  return normalizeAndBuildResult(parsed, referenceStartDate);
}

function normalizeAndBuildResult(parsed: any, referenceStartDate: string): ParsedPdfResult {
  const validDays = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
  const validPeriods = ['MANHA', 'TARDE', 'NOITE'];
  const validCategories = [
    'LEVE', 'REGENERATIVO', 'TIROS', 'FARTLEK', 'CONTROLADO',
    'LONGAO', 'HALTERES', 'DESCANSO', 'ACADEMIA'
  ];

  const workouts: ParsedWorkoutSession[] = parsed.workouts
    .filter((w: any) => validDays.includes(w.dayOfWeek))
    .map((w: any): ParsedWorkoutSession => ({
      dayOfWeek: w.dayOfWeek,
      period: validPeriods.includes(w.period) ? w.period : 'MANHA',
      time: w.time || '06:30',
      category: validCategories.includes(w.category) ? w.category : 'LEVE',
      name: w.name || `Treino ${w.dayOfWeek}`,
      targetDistanceKm: typeof w.targetDistanceKm === 'number' ? w.targetDistanceKm : undefined,
      estimatedDistanceKm: typeof w.estimatedDistanceKm === 'number'
        ? w.estimatedDistanceKm
        : (typeof w.targetDistanceKm === 'number' ? w.targetDistanceKm : undefined),
      targetPaceMin: w.targetPaceMin || undefined,
      targetPaceMax: w.targetPaceMax || undefined,
      repeatCount: typeof w.repeatCount === 'number' ? w.repeatCount : 1,
      notes: w.notes || undefined,
      steps: Array.isArray(w.steps) ? w.steps : undefined
    }));

  if (workouts.length === 0) {
    throw new Error('Nenhum treino válido encontrado no PDF após normalização.');
  }

  // Calcular data final (7 dias)
  const effectiveStartDate = parsed.startDate || referenceStartDate;
  const endDate = parsed.endDate || calculateEndDate(effectiveStartDate);
  const totalKm = typeof parsed.plannedVolumeKm === 'number'
    ? parsed.plannedVolumeKm
    : workouts.reduce((sum, w) => sum + (w.targetDistanceKm || 0), 0);

  console.log(`[PDF AI PARSER] ${workouts.length} treinos extraídos com sucesso.`);

  return {
    title: parsed.title || 'Planilha Importada via PDF',
    athleteName: parsed.athleteName,
    startDate: effectiveStartDate,
    endDate,
    plannedVolumeKm: totalKm,
    originalPdfVolume: parsed.originalPdfVolume || `~${Math.round(totalKm)} km`,
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
  } catch {
    return '2026-09-13';
  }
}
