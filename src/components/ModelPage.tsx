import { useMemo, useState } from 'react';
import { models, computeStats, sortStats, getPostsForModel, withMeta, getDateRange } from '../lib/dataUtils';
import { exportCurrentView, exportDailyHistory } from '../lib/exportUtils';
import { useElementHeight } from '../lib/useElementHeight';
import type { SortKey, SortDir, DatePreset, PostWithMeta } from '../lib/types';
import SubredditTable from './SubredditTable';
import ExportMenu from './ExportMenu';
import AvatarLink from './AvatarLink';
import DateRangePicker from './DateRangePicker';
import { AccountDropdown } from './Filters';

interface Props {
  modelName: string;
  hiddenSubreddits: string[];
  onHideSubreddit: (subreddit: string) => void;
  onNavigateToModel: (modelName: string) => void;
  onBack: () => void;
}

export default function ModelPage({ modelName, hiddenSubreddits, onHideSubreddit, onNavigateToModel, onBack }: Props) {
  const model = models.find(m => m.name === modelName);
  const [sortKey, setSortKey] = useState<SortKey>('avgUpvotes');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(100);

  // Per-model filters — independent of whatever filters happen to be active
  // on the main dashboard table. Accounts default to "all of this model's
  // accounts"; period defaults to all time.
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(() => model?.accounts ?? []);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const [headerRef, headerHeight] = useElementHeight<HTMLDivElement>();

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'subreddit' ? 'asc' : 'desc');
    }
    setPage(0);
  };

  const [dateFrom, dateTo] = useMemo(
    () => getDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo],
  );

  const allModelPosts = useMemo(() => getPostsForModel(modelName), [modelName]);

  // Posts respecting this page's own account + period filters.
  const filteredPosts = useMemo(() => {
    return allModelPosts.filter(p => {
      if (selectedAccounts.length === 0) return false;
      if (!selectedAccounts.includes(p.account)) return false;
      if (dateFrom && new Date(p.created_utc * 1000) < dateFrom) return false;
      if (dateTo && new Date(p.created_utc * 1000) > dateTo) return false;
      return true;
    });
  }, [allModelPosts, selectedAccounts, dateFrom, dateTo]);

  const visiblePosts = useMemo(() => {
    if (hiddenSubreddits.length === 0) return filteredPosts;
    const hiddenSet = new Set(hiddenSubreddits);
    return filteredPosts.filter(p => !hiddenSet.has(p.subreddit));
  }, [filteredPosts, hiddenSubreddits]);

  const visiblePostsWithMeta: PostWithMeta[] = useMemo(() => withMeta(visiblePosts), [visiblePosts]);

  const postsBySubreddit = useMemo(() => {
    const map = new Map<string, PostWithMeta[]>();
    for (const p of visiblePostsWithMeta) {
      const arr = map.get(p.subreddit);
      if (arr) arr.push(p);
      else map.set(p.subreddit, [p]);
    }
    return map;
  }, [visiblePostsWithMeta]);

  const getChartPosts = (subreddit: string) => postsBySubreddit.get(subreddit) ?? [];

  const stats = useMemo(() => {
    const raw = computeStats(visiblePosts, '');
    return sortStats(raw, sortKey, sortDir);
  }, [visiblePosts, sortKey, sortDir]);

  const totalPosts = filteredPosts.length;
  const totalSubreddits = stats.length;
  const avgUpvotesOverall = totalPosts > 0
    ? Math.round((filteredPosts.reduce((s, p) => s + p.score, 0) / totalPosts) * 10) / 10
    : 0;

  const handleExportCurrentView = () => exportCurrentView(stats);
  const handleExportDailyHistory = () => exportDailyHistory(visiblePosts);

  if (!model) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
        Модель «{modelName}» не найдена.
        <div style={{ marginTop: 16 }}>
          <button
            onClick={onBack}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)' }}
          >
            ← Назад к таблице
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div ref={headerRef} style={{ position: 'sticky', top: 0, zIndex: 60, background: '#fff' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            title="Назад к таблице"
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 7,
              padding: '7px 12px',
              cursor: 'pointer',
              color: '#374151',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-sans)',
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
            Назад
          </button>

          <AvatarLink src={model.avatar} size={48} alt={model.name} fallbackLetter={model.name[0]} />

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{model.name}</div>
              {model.team && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  background: model.team === 'velvet' ? '#f0fdf4' : '#eff6ff',
                  color: model.team === 'velvet' ? '#16a34a' : '#2563eb',
                  borderRadius: 4,
                  padding: '2px 7px',
                }}>
                  {model.team}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3, fontFamily: 'var(--font-mono)', display: 'flex', flexWrap: 'wrap', gap: '2px 6px' }}>
              {model.accounts.map((acc, i) => (
                <span key={acc}>
                  <a
                    href={`https://reddit.com/user/${acc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Открыть профиль на Reddit"
                    style={{ color: '#9ca3af', textDecoration: 'none' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseOut={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    @{acc}
                  </a>
                  {i < model.accounts.length - 1 && ' · '}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{totalPosts}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>постов всего</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{totalSubreddits}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>сабреддитов</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{avgUpvotesOverall}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>средние апвоуты</div>
              </div>
            </div>
            <ExportMenu onExportCurrentView={handleExportCurrentView} onExportDailyHistory={handleExportDailyHistory} />
          </div>
        </div>

        {/* Per-model filters: accounts + period, independent from the main dashboard's filters */}
        <div style={{ padding: '14px 28px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <AccountDropdown
            selectedModels={[modelName]}
            selectedAccounts={selectedAccounts}
            onAccountsChange={setSelectedAccounts}
          />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, letterSpacing: '0.02em' }}>Период</div>
            <DateRangePicker
              preset={datePreset}
              customFrom={customFrom}
              customTo={customTo}
              onPresetChange={setDatePreset}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
            />
          </div>
        </div>
      </div>

      <div style={{ margin: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'clip', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <SubredditTable
          stats={stats}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          onHideSubreddit={onHideSubreddit}
          onNavigateToModel={onNavigateToModel}
          modelName={modelName}
          getChartPosts={getChartPosts}
          stickyOffset={headerHeight}
        />
      </div>
    </div>
  );
}
