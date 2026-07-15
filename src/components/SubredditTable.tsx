import { useState } from 'react';
import type { PostWithMeta, SubredditStats, SortKey, SortDir } from '../lib/types';
import TopPostsCell from './TopPostsCell';
import UpvoteIcon from './UpvoteIcon';
import ModelsModal from './ModelsModal';
import SubredditChartModal from './SubredditChartModal';
import RecommendModal from './RecommendModal';

interface Props {
  stats: SubredditStats[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
  onHideSubreddit: (subreddit: string) => void;
  onNavigateToModel: (modelName: string) => void;
  /** When set, this table is scoped to a single model's page: clicking a
   *  subreddit name opens the upvotes-over-time chart for that model instead
   *  of the cross-model breakdown modal, and the recommend/ban modal
   *  defaults to this model. */
  modelName?: string;
  /** Required when `modelName` is set — returns every post (with metadata)
   *  this model made in the given subreddit, for the scatter chart. */
  getChartPosts?: (subreddit: string) => PostWithMeta[];
  /** Pixel offset for the sticky column header, to stack correctly below
   *  whatever sticky page header sits above the table. */
  stickyOffset?: number;
}

const PER_PAGE_OPTIONS = [100, 250, 500, 1000];

// Highlight tiers are based on the subreddit's *absolute* average upvotes,
// not its rank among currently visible rows.
const GREEN_MIN = 200;
const BLUE_MIN = 50;
const RED_MAX = 25;

type Tier = 'green' | 'blue' | 'red' | null;

function getTier(avgUpvotes: number): Tier {
  if (avgUpvotes >= GREEN_MIN) return 'green';
  if (avgUpvotes >= BLUE_MIN) return 'blue';
  if (avgUpvotes < RED_MAX) return 'red';
  return null;
}

const TIER_ROW_BG: Record<'green' | 'blue' | 'red', string> = {
  green: '#f0fdf4',
  blue: '#eff6ff',
  red: '#fef2f2',
};
const TIER_ROW_HOVER: Record<'green' | 'blue' | 'red', string> = {
  green: '#dcfce7',
  blue: '#dbeafe',
  red: '#fee2e2',
};
const TIER_TEXT: Record<'green' | 'blue' | 'red', string> = {
  green: '#16a34a',
  blue: '#2563eb',
  red: '#dc2626',
};
const TIER_BADGE_BG: Record<'green' | 'blue' | 'red', string> = {
  green: '#dcfce7',
  blue: '#dbeafe',
  red: '#fee2e2',
};

const COLUMNS: { key: SortKey; label: string; align?: 'right'; hint?: string; upvoteIcon?: boolean }[] = [
  { key: 'subreddit', label: 'Subreddit' },
  { key: 'totalPosts', label: 'Posts', align: 'right' },
  { key: 'avgUpvotes', label: 'Avg', align: 'right', upvoteIcon: true },
  { key: 'maxUpvotes', label: 'Max', align: 'right', upvoteIcon: true },
  { key: 'avgComments', label: 'Avg 💬', align: 'right' },
  { key: 'maxComments', label: 'Max 💬', align: 'right' },
  { key: 'successFormula', label: 'Score', align: 'right', hint: 'avg(upvotes + 10×comments)' },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#d1d5db'} strokeWidth="2.5" style={{ flexShrink: 0 }}>
      {active && dir === 'asc'
        ? <path d="M12 19V5M5 12l7-7 7 7" />
        : active && dir === 'desc'
        ? <path d="M12 5v14M5 12l7 7 7-7" />
        : <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />}
    </svg>
  );
}

function ExternalLinkIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" />
    </svg>
  );
}

function SubredditNameCell({
  subreddit,
  tierColor,
  onHide,
  onOpenModels,
  onOpenRecommend,
  openLabel,
}: {
  subreddit: string;
  tierColor: string;
  onHide: (subreddit: string) => void;
  onOpenModels: (subreddit: string) => void;
  onOpenRecommend: (subreddit: string) => void;
  openLabel: string;
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <button
        onClick={() => onOpenModels(subreddit)}
        title={openLabel}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: tierColor,
          fontSize: 13,
          fontWeight: 500,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontFamily: 'var(--font-sans)',
        }}
        onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
        onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
      >
        <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12 }}>r/</span>
        {subreddit}
      </button>

      <a
        href={`https://reddit.com/r/${subreddit}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Перейти на сабреддит"
        style={{
          display: 'inline-flex',
          padding: 2,
          lineHeight: 0,
          color: '#9ca3af',
          opacity: 0.55,
          transition: 'opacity 0.12s, color 0.12s',
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#2563eb'; }}
        onMouseOut={e => { e.currentTarget.style.opacity = '0.55'; e.currentTarget.style.color = '#9ca3af'; }}
      >
        <ExternalLinkIcon size={11} />
      </a>

      <button
        onClick={() => onHide(subreddit)}
        title="Скрыть сабреддит"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          lineHeight: 0,
          opacity: 0.22,
          color: '#9ca3af',
          transition: 'opacity 0.12s, color 0.12s',
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#dc2626'; }}
        onMouseOut={e => { e.currentTarget.style.opacity = '0.22'; e.currentTarget.style.color = '#9ca3af'; }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
        </svg>
      </button>

      <button
        onClick={() => onOpenRecommend(subreddit)}
        title="Рекомендовать или запретить сабреддит для модели"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          lineHeight: 0,
          opacity: 0.3,
          color: '#9ca3af',
          transition: 'opacity 0.12s, color 0.12s',
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#2563eb'; }}
        onMouseOut={e => { e.currentTarget.style.opacity = '0.3'; e.currentTarget.style.color = '#9ca3af'; }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
        </svg>
      </button>
    </div>
  );
}

export default function SubredditTable({
  stats, sortKey, sortDir, onSort, page, perPage, onPageChange, onPerPageChange, onHideSubreddit, onNavigateToModel,
  modelName, getChartPosts, stickyOffset = 0,
}: Props) {
  const total = stats.length;
  const totalPages = Math.ceil(total / perPage);
  const paginated = stats.slice(page * perPage, (page + 1) * perPage);
  const [modelModalSubreddit, setModelModalSubreddit] = useState<string | null>(null);
  const [chartSubreddit, setChartSubreddit] = useState<string | null>(null);
  const [recommendSubreddit, setRecommendSubreddit] = useState<string | null>(null);

  const handleOpenSubredditName = modelName ? setChartSubreddit : setModelModalSubreddit;
  const openLabel = modelName ? 'Показать график апвоутов по времени' : 'Показать модели, постящие в этот сабреддит';


  const getRowStyle = (tier: Tier): React.CSSProperties => {
    if (!tier) return {};
    return { background: TIER_ROW_BG[tier] };
  };

  const getRowHover = (tier: Tier) => (tier ? TIER_ROW_HOVER[tier] : '#f9fafb');

  return (
    <div>
      <div style={{ overflowX: 'auto', overflowY: 'clip' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  title={col.hint}
                  style={{
                    /* position: 'sticky',
                    top: stickyOffset, */
                    zIndex: 2,
                    background: '#f9fafb',
                    padding: '10px 16px',
                    textAlign: col.align === 'right' ? 'right' : 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    color: sortKey === col.key ? '#2563eb' : '#6b7280',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    borderBottom: '2px solid ' + (sortKey === col.key ? '#2563eb' : '#e5e7eb'),
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                    {col.label}
                    {col.upvoteIcon && <UpvoteIcon size={10} />}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </div>
                </th>
              ))}
              <th style={{
                /* position: 'sticky',
                top: stickyOffset, */
                zIndex: 2,
                background: '#f9fafb',
                padding: '10px 16px',
                textAlign: 'left',
                fontSize: 11,
                fontWeight: 600,
                color: '#6b7280',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                borderBottom: '2px solid #e5e7eb',
              }}>
                Top Posts
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                  No subreddits found
                </td>
              </tr>
            )}
            {paginated.map((row) => {
              const tier = getTier(row.avgUpvotes);
              return (
                <tr
                  key={row.subreddit}
                  style={{
                    ...getRowStyle(tier),
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background 0.1s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = getRowHover(tier))}
                  onMouseOut={e => (e.currentTarget.style.background = String(getRowStyle(tier).background ?? ''))}
                >
                  <td style={{ padding: '9px 16px', whiteSpace: 'nowrap' }}>
                    <SubredditNameCell
                      subreddit={row.subreddit}
                      tierColor={tier ? TIER_TEXT[tier] : '#111827'}
                      onHide={onHideSubreddit}
                      onOpenModels={handleOpenSubredditName}
                      onOpenRecommend={setRecommendSubreddit}
                      openLabel={openLabel}
                    />
                  </td>
                  <td style={{ padding: '9px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6b7280' }}>
                    {row.totalPosts}
                  </td>
                  <td style={{ padding: '9px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, color: '#111827', fontWeight: 500 }}>
                    {row.avgUpvotes}
                  </td>
                  <td style={{ padding: '9px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6b7280' }}>
                    {row.maxUpvotes}
                  </td>
                  <td style={{ padding: '9px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, color: '#111827', fontWeight: 500 }}>
                    {row.avgComments}
                  </td>
                  <td style={{ padding: '9px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6b7280' }}>
                    {row.maxComments}
                  </td>
                  <td style={{ padding: '9px 16px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      background: tier ? TIER_BADGE_BG[tier] : '#eff6ff',
                      color: tier ? TIER_TEXT[tier] : '#2563eb',
                      borderRadius: 5,
                      padding: '2px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {row.successFormula}
                    </span>
                  </td>
                  <td style={{ padding: '9px 16px' }}>
                    <TopPostsCell posts={row.topPosts} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid #f0f1f3',
        flexWrap: 'wrap',
        gap: 10,
        background: '#fafafa',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#9ca3af', fontSize: 11 }}>Rows per page:</span>
          {PER_PAGE_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => { onPerPageChange(n); onPageChange(0); }}
              style={{
                background: perPage === n ? '#eff6ff' : 'none',
                border: '1px solid ' + (perPage === n ? '#bfdbfe' : '#e5e7eb'),
                borderRadius: 4,
                color: perPage === n ? '#2563eb' : '#6b7280',
                padding: '3px 9px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontWeight: perPage === n ? 600 : 400,
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            {total === 0 ? '0' : `${page * perPage + 1}–${Math.min((page + 1) * perPage, total)}`} of {total}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 5,
                color: page === 0 ? '#d1d5db' : '#374151',
                padding: '5px 12px',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
              }}
            >
              ← Prev
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 5,
                color: page >= totalPages - 1 ? '#d1d5db' : '#374151',
                padding: '5px 12px',
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {modelModalSubreddit && (
        <ModelsModal
          subreddit={modelModalSubreddit}
          onClose={() => setModelModalSubreddit(null)}
          onNavigateToModel={onNavigateToModel}
        />
      )}

      {chartSubreddit && modelName && (
        <SubredditChartModal
          subreddit={chartSubreddit}
          modelName={modelName}
          posts={getChartPosts ? getChartPosts(chartSubreddit) : []}
          onClose={() => setChartSubreddit(null)}
        />
      )}

      {recommendSubreddit && (
        <RecommendModal
          subreddit={recommendSubreddit}
          defaultModelName={modelName}
          onClose={() => setRecommendSubreddit(null)}
        />
      )}
    </div>
  );
}
