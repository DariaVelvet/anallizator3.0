import { useState, useMemo } from 'react';
import { filterPosts, computeStats, sortStats, getDateRange } from './lib/dataUtils';
import { loadHiddenSubreddits, saveHiddenSubreddits } from './lib/hiddenSubreddits';
import { exportCurrentView, exportDailyHistory } from './lib/exportUtils';
import { useElementHeight } from './lib/useElementHeight';
import type { SortKey, SortDir, DatePreset } from './lib/types';
import Filters from './components/Filters';
import SubredditTable from './components/SubredditTable';
import ExportMenu from './components/ExportMenu';
import HiddenSubredditsPanel from './components/HiddenSubredditsPanel';
import ModelPage from './components/ModelPage';
import CompareTool from './components/CompareTool';

export default function App() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('avgUpvotes');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [hiddenSubreddits, setHiddenSubreddits] = useState<string[]>(() => loadHiddenSubreddits());
  const [viewingModel, setViewingModel] = useState<string | null>(null);
  const [showCompareTool, setShowCompareTool] = useState(false);
  const [stickyRef, stickyHeight] = useElementHeight<HTMLDivElement>();

  const hideSubreddit = (subreddit: string) => {
    setHiddenSubreddits(prev => {
      if (prev.includes(subreddit)) return prev;
      const next = [...prev, subreddit];
      saveHiddenSubreddits(next);
      return next;
    });
  };

  const restoreSubreddit = (subreddit: string) => {
    setHiddenSubreddits(prev => {
      const next = prev.filter(s => s !== subreddit);
      saveHiddenSubreddits(next);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
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

  const filteredPosts = useMemo(
    () => filterPosts(selectedModels, selectedAccounts, dateFrom, dateTo, hiddenSubreddits),
    [selectedModels, selectedAccounts, dateFrom, dateTo, hiddenSubreddits],
  );

  const sortedStats = useMemo(() => {
    const stats = computeStats(filteredPosts, search);
    return sortStats(stats, sortKey, sortDir);
  }, [filteredPosts, search, sortKey, sortDir]);

  const handleExportCurrentView = () => exportCurrentView(sortedStats);
  const handleExportDailyHistory = () => exportDailyHistory(filteredPosts);

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {viewingModel ? (
        <ModelPage
          modelName={viewingModel}
          hiddenSubreddits={hiddenSubreddits}
          onHideSubreddit={hideSubreddit}
          onNavigateToModel={setViewingModel}
          onBack={() => setViewingModel(null)}
        />
      ) : (
        <>
          {/* Sticky stack: top bar + filters + legend all stay pinned while scrolling */}
          <div ref={stickyRef} style={{ position: 'sticky', top: 0, zIndex: 60, background: '#f3f4f6' }}>
            {/* Header */}
            <div style={{
              background: '#fff',
              borderBottom: '1px solid #e5e7eb',
              padding: '0 28px',
              display: 'flex',
              alignItems: 'center',
              height: 56,
            }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                Model stat
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
                  {sortedStats.length} subreddits
                </span>
                <button
                  onClick={() => setShowCompareTool(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 7,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseOut={e => (e.currentTarget.style.background = '#fff')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3 3v18h18" /><path d="M18 17V9M13 17V5M8 17v-3" />
                  </svg>
                  Сравнить
                </button>
                <HiddenSubredditsPanel hidden={hiddenSubreddits} onRestore={restoreSubreddit} />
                <ExportMenu onExportCurrentView={handleExportCurrentView} onExportDailyHistory={handleExportDailyHistory} />
              </div>
            </div>

            {/* Filter bar */}
            <div style={{ padding: '20px 28px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
              <Filters
                selectedModels={selectedModels}
                selectedAccounts={selectedAccounts}
                datePreset={datePreset}
                customFrom={customFrom}
                customTo={customTo}
                search={search}
                onModelsChange={v => { setSelectedModels(v); setPage(0); }}
                onAccountsChange={v => { setSelectedAccounts(v); setPage(0); }}
                onDatePresetChange={v => { setDatePreset(v); setPage(0); }}
                onCustomFromChange={v => { setCustomFrom(v); setPage(0); }}
                onCustomToChange={v => { setCustomTo(v); setPage(0); }}
                onSearchChange={v => { setSearch(v); setPage(0); }}
              />
            </div>

            {/* Legend */}
            <div style={{ padding: '10px 28px', background: '#fff', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#86efac' }} />
                <span style={{ fontSize: 11, color: '#6b7280' }}>200+ avg upvotes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#93c5fd' }} />
                <span style={{ fontSize: 11, color: '#6b7280' }}>50–200 avg upvotes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#fca5a5' }} />
                <span style={{ fontSize: 11, color: '#6b7280' }}>&lt;25 avg upvotes</span>
              </div>
            </div>
          </div>

          {/* Table card */}
          <div style={{ margin: '0 20px 24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'clip', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <SubredditTable
              stats={sortedStats}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              onHideSubreddit={hideSubreddit}
              onNavigateToModel={setViewingModel}
              stickyOffset={stickyHeight}
            />
          </div>
        </>
      )}

      {showCompareTool && <CompareTool onClose={() => setShowCompareTool(false)} />}
    </div>
  );
}
