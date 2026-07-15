import { useState, useRef, useEffect } from 'react';

interface Props {
  onExportCurrentView: () => void;
  onExportDailyHistory: () => void;
}

export default function ExportMenu({ onExportCurrentView, onExportDailyHistory }: Props) {
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
        style={{
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 7,
          padding: '8px 20px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        onMouseOver={e => (e.currentTarget.style.background = '#1d4ed8')}
        onMouseOut={e => (e.currentTarget.style.background = '#2563eb')}
      >
        Экспорт дата
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
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
          overflow: 'hidden',
        }}>
          <button
            onClick={() => { onExportCurrentView(); setOpen(false); }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '11px 14px',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #f3f4f6',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#f9fafb')}
            onMouseOut={e => (e.currentTarget.style.background = 'none')}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Как отображено на сайте</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Текущие фильтры, сортировка и колонки таблицы</div>
          </button>
          <button
            onClick={() => { onExportDailyHistory(); setOpen(false); }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '11px 14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#f9fafb')}
            onMouseOut={e => (e.currentTarget.style.background = 'none')}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>История постинга по дням</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Количество постов и апвоутов за каждый день</div>
          </button>
        </div>
      )}
    </div>
  );
}
