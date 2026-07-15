import { useMemo, useState } from 'react';
import { allSubredditNames, allAccountNames, compareSubreddits, compareAccounts } from '../lib/dataUtils';

interface Props {
  onClose: () => void;
}

type Mode = 'subreddit' | 'account';
type Metric = 'avgUpvotes' | 'totalPosts' | 'avgComments' | 'successFormula' | 'maxUpvotes';

const METRIC_LABELS: Record<Metric, string> = {
  avgUpvotes: 'Средние апвоуты',
  totalPosts: 'Постов всего',
  avgComments: 'Средние комментарии',
  successFormula: 'Score',
  maxUpvotes: 'Макс. апвоуты',
};

const PALETTE = ['#2563eb', '#16a34a', '#db2777', '#d97706', '#7c3aed', '#0891b2', '#dc2626', '#4b5563'];

function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}

export default function CompareTool({ onClose }: Props) {
  const [mode, setMode] = useState<Mode>('subreddit');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [metric, setMetric] = useState<Metric>('avgUpvotes');

  const allNames = useMemo(() => (mode === 'subreddit' ? allSubredditNames() : allAccountNames()), [mode]);
  const visibleNames = useMemo(
    () => allNames.filter(n => n.toLowerCase().includes(search.toLowerCase())).slice(0, 200),
    [allNames, search],
  );

  const results = useMemo(() => {
    if (selected.length === 0) return [];
    return mode === 'subreddit' ? compareSubreddits(selected) : compareAccounts(selected);
  }, [mode, selected]);

  const maxMetricValue = Math.max(1, ...results.map(r => r[metric]));

  const toggle = (name: string) => {
    setSelected(prev => (prev.includes(name) ? prev.filter(n => n !== name) : prev.length >= 8 ? prev : [...prev, name]));
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setSelected([]);
    setSearch('');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          width: 'min(920px, 100%)',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Сравнение</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Сравнивайте сабреддиты или аккаунты между собой (данные за всё время)</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, lineHeight: 0 }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ display: 'flex', minHeight: 0, flex: 1 }}>
          {/* Left: picker */}
          <div style={{ width: 260, borderRight: '1px solid #f0f1f3', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 4, padding: '12px 14px 8px' }}>
              {(['subreddit', 'account'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    background: mode === m ? '#eff6ff' : '#fff',
                    border: '1px solid ' + (mode === m ? '#bfdbfe' : '#e5e7eb'),
                    borderRadius: 5,
                    color: mode === m ? '#2563eb' : '#6b7280',
                    padding: '6px 0',
                    fontSize: 12,
                    fontWeight: mode === m ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {m === 'subreddit' ? 'Сабреддиты' : 'Аккаунты'}
                </button>
              ))}
            </div>
            <div style={{ padding: '0 14px 10px' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={mode === 'subreddit' ? 'Поиск сабреддита...' : 'Поиск аккаунта...'}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: 'var(--font-sans)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ padding: '0 14px 6px', fontSize: 11, color: '#9ca3af' }}>
              Выбрано {selected.length} / 8
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 6px 10px' }}>
              {visibleNames.map(name => (
                <label
                  key={name}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 12.5, color: '#111827' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseOut={e => (e.currentTarget.style.background = 'none')}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(name)}
                    onChange={() => toggle(name)}
                    style={{ accentColor: '#2563eb', width: 13, height: 13, flexShrink: 0 }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mode === 'subreddit' ? `r/${name}` : name}
                  </span>
                </label>
              ))}
              {visibleNames.length === 0 && (
                <div style={{ padding: '16px 8px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Ничего не найдено</div>
              )}
            </div>
          </div>

          {/* Right: results */}
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 20 }}>
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '60px 0' }}>
                Выберите {mode === 'subreddit' ? 'сабреддиты' : 'аккаунты'} слева, чтобы увидеть сравнение
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
                  {(Object.keys(METRIC_LABELS) as Metric[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMetric(m)}
                      style={{
                        background: metric === m ? '#eff6ff' : '#fff',
                        border: '1px solid ' + (metric === m ? '#bfdbfe' : '#e5e7eb'),
                        borderRadius: 5,
                        color: metric === m ? '#2563eb' : '#6b7280',
                        padding: '5px 10px',
                        fontSize: 11.5,
                        fontWeight: metric === m ? 600 : 400,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {METRIC_LABELS[m]}
                    </button>
                  ))}
                </div>

                {/* Bar chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  {results.map((r, i) => (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 130, fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }} title={r.name}>
                        {mode === 'subreddit' ? `r/${r.name}` : r.name}
                      </div>
                      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden', height: 20 }}>
                        <div
                          style={{
                            width: `${Math.max(2, (r[metric] / maxMetricValue) * 100)}%`,
                            height: '100%',
                            background: PALETTE[i % PALETTE.length],
                            borderRadius: 4,
                            transition: 'width 0.2s',
                          }}
                        />
                      </div>
                      <div style={{ width: 64, textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        {r[metric]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Full data table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{mode === 'subreddit' ? 'Сабреддит' : 'Аккаунт'}</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Постов</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Avg ▲</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Max ▲</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Avg 💬</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '7px 8px', color: '#111827' }}>{mode === 'subreddit' ? `r/${r.name}` : r.name}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#6b7280' }}>{r.totalPosts}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.avgUpvotes}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#6b7280' }}>{r.maxUpvotes}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.avgComments}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: 600 }}>{r.successFormula}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
