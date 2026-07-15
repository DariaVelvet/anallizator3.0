import { useState } from 'react';
import { getSubredditModelBreakdown, getSubredditModelPosts } from '../lib/dataUtils';
import { formatKyivTime } from '../lib/timeUtils';
import AvatarLink from './AvatarLink';

type PostSortKey = 'score' | 'date';

function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}

function BackIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard API unavailable (permissions/insecure context) — fail silently.
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Скопировать тайтл"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        lineHeight: 0,
        color: copied ? '#16a34a' : '#9ca3af',
        flexShrink: 0,
      }}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

function ModelPostsView({
  subreddit,
  modelName,
  avatar,
  onBack,
}: {
  subreddit: string;
  modelName: string;
  avatar: string;
  onBack: () => void;
}) {
  const [sortKey, setSortKey] = useState<PostSortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const perPage = 8;

  const posts = getSubredditModelPosts(subreddit, modelName);
  const sorted = [...posts].sort((a, b) => {
    const av = sortKey === 'score' ? a.score : a.created_utc;
    const bv = sortKey === 'score' ? b.score : b.created_utc;
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const clampedPage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(clampedPage * perPage, (clampedPage + 1) * perPage);

  const handleSort = (key: PostSortKey) => {
    if (key === sortKey) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
        <button
          onClick={onBack}
          title="Назад к моделям"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, lineHeight: 0, flexShrink: 0 }}
        >
          <BackIcon />
        </button>
        <AvatarLink src={avatar} size={26} alt={modelName} fallbackLetter={modelName[0]} border="1.5px solid #e5e7eb" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modelName}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>r/{subreddit} · {posts.length} post{posts.length === 1 ? '' : 's'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '8px 18px', borderBottom: '1px solid #f3f4f6' }}>
        {(['score', 'date'] as const).map(k => (
          <button
            key={k}
            onClick={() => handleSort(k)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: sortKey === k ? '#eff6ff' : '#fff',
              border: '1px solid ' + (sortKey === k ? '#bfdbfe' : '#e5e7eb'),
              borderRadius: 5,
              color: sortKey === k ? '#2563eb' : '#6b7280',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: sortKey === k ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {k === 'score' ? 'Апвоуты' : 'Дата'} {sortKey === k && (sortDir === 'desc' ? '↓' : '↑')}
          </button>
        ))}
      </div>

      <div style={{ overflowY: 'auto', padding: '4px 0' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '24px 18px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Нет постов</div>
        ) : (
          paginated.map(post => (
            <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px' }}>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                title={post.title}
                style={{ flex: 1, minWidth: 0, color: '#111827', textDecoration: 'none' }}
                onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                <div style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{formatKyivTime(post.created_utc)}</div>
              </a>
              <span style={{ fontSize: 12, color: '#FF4500', fontWeight: 600, fontFamily: 'var(--font-mono)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                ▲ {post.score}
              </span>
              <CopyButton text={post.title} />
            </div>
          ))
        )}
      </div>

      {sorted.length > perPage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 18px',
          borderTop: '1px solid #f3f4f6',
          background: '#fafafa',
        }}>
          <span style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            {clampedPage * perPage + 1}–{Math.min((clampedPage + 1) * perPage, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={clampedPage === 0}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 5,
                color: clampedPage === 0 ? '#d1d5db' : '#374151',
                padding: '4px 10px',
                cursor: clampedPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: 11,
                fontFamily: 'var(--font-sans)',
              }}
            >
              ← Назад
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={clampedPage >= totalPages - 1}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 5,
                color: clampedPage >= totalPages - 1 ? '#d1d5db' : '#374151',
                padding: '4px 10px',
                cursor: clampedPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: 11,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Далее →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ModelsModal({
  subreddit,
  onClose,
  onNavigateToModel,
}: {
  subreddit: string;
  onClose: () => void;
  onNavigateToModel: (modelName: string) => void;
}) {
  const [postsView, setPostsView] = useState<{ modelName: string; avatar: string } | null>(null);
  const breakdown = getSubredditModelBreakdown(subreddit);

  const handleNavigate = (modelName: string) => {
    onClose();
    onNavigateToModel(modelName);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.35)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          width: 380,
          maxHeight: '72vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {postsView === null ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>r/{subreddit}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Модели · всё время · {breakdown.length}</div>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, lineHeight: 0 }}
              >
                <CloseIcon />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '6px 0' }}>
              {breakdown.length === 0 ? (
                <div style={{ padding: '24px 18px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Нет данных</div>
              ) : (
                breakdown.map(m => (
                  <div key={m.modelName} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px' }}>
                    <button
                      onClick={() => handleNavigate(m.modelName)}
                      title="Открыть страницу модели"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                      onMouseOver={e => (e.currentTarget.style.opacity = '0.7')}
                      onMouseOut={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <AvatarLink src={m.avatar} size={28} alt={m.modelName} fallbackLetter={m.modelName[0]} border="1.5px solid #e5e7eb" />
                      <span style={{ fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.modelName}</span>
                    </button>
                    <button
                      onClick={() => setPostsView({ modelName: m.modelName, avatar: m.avatar })}
                      title="Показать посты модели в этом сабреддите"
                      style={{
                        fontSize: 12,
                        color: '#2563eb',
                        fontFamily: 'var(--font-mono)',
                        background: '#eff6ff',
                        border: 'none',
                        borderRadius: 5,
                        padding: '3px 9px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {m.count} post{m.count === 1 ? '' : 's'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <ModelPostsView
            subreddit={subreddit}
            modelName={postsView.modelName}
            avatar={postsView.avatar}
            onBack={() => setPostsView(null)}
          />
        )}
      </div>
    </div>
  );
}
