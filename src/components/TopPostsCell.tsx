import { useState } from 'react';
import type { PostWithMeta } from '../lib/types';
import { formatKyivTime } from '../lib/timeUtils';

interface Props {
  posts: PostWithMeta[];
}

interface TooltipState {
  post: PostWithMeta;
  clientX: number;
  clientY: number;
}

export default function TopPostsCell({ posts }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  if (posts.length === 0) return <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>;

  const handleEnter = (post: PostWithMeta, e: React.MouseEvent) => {
    setTooltip({ post, clientX: e.clientX, clientY: e.clientY });
  };

  const handleMove = (e: React.MouseEvent) => {
    if (tooltip) setTooltip(t => t ? { ...t, clientX: e.clientX, clientY: e.clientY } : null);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }} onMouseMove={handleMove}>
      {posts.map((post, i) => (
        <a
          key={post.id}
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={e => handleEnter(post, e)}
          onMouseLeave={() => setTooltip(null)}
          style={{
            display: 'block',
            width: 22,
            height: 22,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #e5e7eb',
            flexShrink: 0,
            position: 'relative',
            zIndex: i,
            marginLeft: i === 0 ? 0 : -9,
            transition: 'border-color 0.15s, transform 0.15s',
          }}
          onMouseOver={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = '#2563eb';
            el.style.transform = 'scale(1.18)';
            el.style.zIndex = '10';
          }}
          onMouseOut={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = '#e5e7eb';
            el.style.transform = 'scale(1)';
            el.style.zIndex = String(i);
          }}
        >
          {post.modelAvatar ? (
            <img src={post.modelAvatar} alt={post.modelName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>
              {post.modelName[0]}
            </div>
          )}
        </a>
      ))}

      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.clientX + 14,
          top: tooltip.clientY - 10,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '12px 14px',
          zIndex: 9999,
          pointerEvents: 'none',
          minWidth: 190,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
            {tooltip.post.modelAvatar && (
              <img src={tooltip.post.modelAvatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e5e7eb' }} />
            )}
            <div>
              <div style={{ color: '#111827', fontSize: 13, fontWeight: 600 }}>{tooltip.post.modelName}</div>
              <div style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'var(--font-mono)' }}>@{tooltip.post.account}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 16px', fontSize: 12 }}>
            <span style={{ color: '#9ca3af' }}>Upvotes</span>
            <span style={{ color: '#FF4500', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{tooltip.post.score}</span>
            <span style={{ color: '#9ca3af' }}>Comments</span>
            <span style={{ color: '#7c3aed', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{tooltip.post.comments}</span>
            <span style={{ color: '#9ca3af' }}>Score</span>
            <span style={{ color: '#374151', fontFamily: 'var(--font-mono)' }}>{tooltip.post.successScore}</span>
          </div>
          <div style={{ marginTop: 10, color: '#9ca3af', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            {formatKyivTime(tooltip.post.created_utc)}
          </div>
        </div>
      )}
    </div>
  );
}
