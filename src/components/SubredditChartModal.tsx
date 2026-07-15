import type { PostWithMeta } from '../lib/types';
import PostsScatterChart from './PostsScatterChart';

interface Props {
  subreddit: string;
  modelName: string;
  posts: PostWithMeta[];
  onClose: () => void;
}

function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}

export default function SubredditChartModal({ subreddit, modelName, posts, onClose }: Props) {
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
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          width: 'min(880px, 100%)',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>r/{subreddit}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{modelName} · апвоуты по времени</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, lineHeight: 0 }}
          >
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto' }}>
          {posts.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
              Нет постов в этом сабреддите для текущих фильтров
            </div>
          ) : (
            <PostsScatterChart posts={posts} />
          )}
        </div>
      </div>
    </div>
  );
}
