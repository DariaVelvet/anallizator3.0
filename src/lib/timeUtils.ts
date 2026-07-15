const kyivFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Kiev',
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatKyivTime(utc: number): string {
  const date = new Date(utc * 1000);
  const parts = kyivFormatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${get('day')}.${get('month')}.${get('year')}, ${get('hour')}:${get('minute')}`;
}

export function toInputDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function fromInputDate(str: string): Date {
  return new Date(str + 'T00:00:00');
}
