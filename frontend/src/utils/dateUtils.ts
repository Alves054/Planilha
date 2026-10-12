export function getCurrentWeekMonday(referenceDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const dateStr = formatter.format(referenceDate);
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const day = utcDate.getUTCDay(); // 0 é domingo, 1 é segunda
  
  const diffToMonday = day === 0 ? 1 : 1 - day;
  const monday = new Date(utcDate);
  monday.setUTCDate(utcDate.getUTCDate() + diffToMonday);
  
  return monday.toISOString().split('T')[0];
}
