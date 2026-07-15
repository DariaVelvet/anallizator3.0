import { useState, useRef, useEffect } from 'react';

interface Props {
  hidden: string[];
  onRestore: (subreddit: string) => void;
}

export default function HiddenSubredditsPanel({ hidden, onRestore }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Скрытые сабреддиты"
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
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
        </svg>
        Скрытые
        {hidden.length > 0 && (
          <span style={{
            background: '#eff6ff',
            color: '#2563eb',
            borderRadius: 10,
            padding: '1px 7px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
          }}>
            {hidden.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          zIndex: 500,
          minWidth: 260,
          maxHeight: 320,
          overflowY: 'auto',
          padding: '4px 0',
        }}>
          {hidden.length === 0 ? (
            <div style={{ padding: '16px 14px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              Нет скрытых сабреддитов
            </div>
          ) : (
            hidden.map(sub => (
              <div
                key={sub}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px' }}
                onMouseOver={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ fontSize: 12, color: '#111827', fontFamily: 'var(--font-mono)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  r/{sub}
                </span>
                <button
                  onClick={() => onRestore(sub)}
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: 'none',
                    borderRadius: 5,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    flexShrink: 0,
                  }}
                >
                  Вернуть
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
