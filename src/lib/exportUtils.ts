import * as XLSX from 'xlsx';
import type { Post, SubredditStats } from './types';

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/["\n,;]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(row.map(csvEscape).join(','));
  return lines.join('\r\n');
}

function downloadCsv(filename: string, csv: string): void {
  // Prepend BOM so Excel picks up UTF-8 correctly.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Exports exactly what's currently shown in the table (respecting all active
 * filters/sort) as a real .xlsx workbook — same columns/order as on screen,
 * with the subreddit column as a real clickable hyperlink to Reddit, model
 * *names* instead of avatars in the last column, and column widths matching
 * the on-screen table's spacing.
 */
export function exportCurrentView(stats: SubredditStats[]): void {
  const headers = ['Subreddit', 'Posts', 'Avg Upvotes', 'Max Upvotes', 'Avg Comments', 'Max Comments', 'Score', 'Top Posts (models)'];
  const rows = stats.map(s => [
    `r/${s.subreddit}`,
    s.totalPosts,
    s.avgUpvotes,
    s.maxUpvotes,
    s.avgComments,
    s.maxComments,
    s.successFormula,
    s.topPosts.map(p => p.modelName).join(', '),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Real, clickable hyperlinks on each subreddit cell — not just plain text.
  stats.forEach((s, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: 0 });
    const cell = ws[cellRef];
    if (cell) {
      cell.l = { Target: `https://reddit.com/r/${s.subreddit}`, Tooltip: `Открыть r/${s.subreddit} на Reddit` };
    }
  });

  // Column widths mirroring the on-screen table's proportions, so columns
  // aren't cramped together the way a default-width spreadsheet would be.
  ws['!cols'] = [
    { wch: 24 }, // Subreddit
    { wch: 8 },  // Posts
    { wch: 12 }, // Avg Upvotes
    { wch: 12 }, // Max Upvotes
    { wch: 13 }, // Avg Comments
    { wch: 13 }, // Max Comments
    { wch: 10 }, // Score
    { wch: 46 }, // Top Posts (models)
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Subreddits');
  XLSX.writeFile(wb, `subreddit-stats-${dateStamp()}.xlsx`);
}

/** Exports posting activity grouped by calendar day (UTC) for the currently filtered posts. */
export function exportDailyHistory(filteredPosts: Post[]): void {
  const byDay = new Map<string, { count: number; upvotes: number; comments: number }>();

  for (const post of filteredPosts) {
    const day = new Date(post.created_utc * 1000).toISOString().slice(0, 10);
    const entry = byDay.get(day);
    if (entry) {
      entry.count += 1;
      entry.upvotes += post.score;
      entry.comments += post.comments;
    } else {
      byDay.set(day, { count: 1, upvotes: post.score, comments: post.comments });
    }
  }

  const days = Array.from(byDay.keys()).sort();
  const headers = ['Date', 'Posts', 'Total Upvotes', 'Total Comments', 'Avg Upvotes', 'Avg Comments'];
  const rows = days.map(day => {
    const e = byDay.get(day)!;
    return [
      day,
      e.count,
      e.upvotes,
      e.comments,
      Math.round((e.upvotes / e.count) * 10) / 10,
      Math.round((e.comments / e.count) * 10) / 10,
    ];
  });

  downloadCsv(`posting-history-by-day-${dateStamp()}.csv`, toCsv(headers, rows));
}
