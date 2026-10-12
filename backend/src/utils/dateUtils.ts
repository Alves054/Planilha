/**
 * Utilitários de data e hora no fuso horário oficial de Brasília (America/Sao_Paulo)
 */

/**
 * Retorna a data atual no fuso de Brasília como string YYYY-MM-DD
 */
export function getBrasiliaDateString(date: Date = new Date()): string {
  // Converte para fuso horário de Brasília
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date); // formato YYYY-MM-DD
}

/**
 * Retorna o dia da semana atual no fuso de Brasília (0=Domingo, 1=Segunda, etc.)
 */
export function getBrasiliaDayOfWeek(date: Date = new Date()): number {
  const dateStr = getBrasiliaDateString(date);
  const [y, m, d] = dateStr.split('-').map(Number);
  // Usa UTC ao meio-dia para evitar deslocamento de horário de verão
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return utcDate.getUTCDay();
}

/**
 * Retorna a data da Segunda-feira da semana atual de Brasília como YYYY-MM-DD
 */
export function getCurrentWeekMonday(referenceDate: Date = new Date()): string {
  const todayStr = getBrasiliaDateString(referenceDate);
  const [y, m, d] = todayStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const day = utcDate.getUTCDay(); // 0 é domingo, 1 é segunda
  
  // Se hoje for domingo (0), a semana de treino planejada/em curso é a que começa amanhã, segunda-feira (+1 dia)
  // Se for de segunda a sábado (1 a 6), a segunda-feira da semana é (1 - day)
  const diffToMonday = day === 0 ? 1 : 1 - day;
  
  const monday = new Date(utcDate);
  monday.setUTCDate(utcDate.getUTCDate() + diffToMonday);
  
  return monday.toISOString().split('T')[0];
}

/**
 * Calcula a data de Domingo a partir da Segunda-feira (adiciona 6 dias)
 */
export function getWeekSunday(mondayStr: string): string {
  const [y, m, d] = mondayStr.split('-').map(Number);
  const monday = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday.toISOString().split('T')[0];
}

/**
 * Retorna os 7 dias da semana (Segunda a Domingo) com suas respectivas datas YYYY-MM-DD
 */
export function getWeekDaysConfig(mondayStr: string) {
  const dayNames = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
  const [y, m, d] = mondayStr.split('-').map(Number);
  const monday = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  return dayNames.map((dayName, idx) => {
    const cur = new Date(monday);
    cur.setUTCDate(monday.getUTCDate() + idx);
    return {
      date: cur.toISOString().split('T')[0],
      dayOfWeek: dayName,
      isRestDay: dayName === 'DOMINGO'
    };
  });
}
