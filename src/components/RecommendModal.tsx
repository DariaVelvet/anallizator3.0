import { useState } from 'react';
import { models } from '../lib/dataUtils';

interface Props {
  subreddit: string;
  defaultModelName?: string;
  onClose: () => void;
}

function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}

type Action = 'recommend' | 'ban';

export default function RecommendModal({ subreddit, defaultModelName, onClose }: Props) {
  const [modelName, setModelName] = useState(defaultModelName ?? models[0]?.name ?? '');
  const [action, setAction] = useState<Action>('recommend');
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    // Intentionally a no-op beyond local UI state: this is a UI stub only —
    // it doesn't send or persist anything anywhere yet.
    setSent(true);
    setTimeout(onClose, 1100);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.35)',
        zIndex: 1100,
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
          width: 'min(420px, 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>r/{subreddit}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Рекомендация по сабреддиту</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, lineHeight: 0 }}>
            <CloseIcon />
          </button>
        </div>

        {sent ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>Сохранено (демо)</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Пока что это просто интерфейс — никуда не отправляется</div>
          </div>
        ) : (
          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Модель</div>
            <select
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 13,
                color: '#111827',
                fontFamily: 'var(--font-sans)',
                marginBottom: 14,
              }}
            >
              {models.map(m => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>

            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Действие</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                onClick={() => setAction('recommend')}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 6,
                  border: '1px solid ' + (action === 'recommend' ? '#bbf7d0' : '#e5e7eb'),
                  background: action === 'recommend' ? '#f0fdf4' : '#fff',
                  color: action === 'recommend' ? '#16a34a' : '#6b7280',
                  fontWeight: action === 'recommend' ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M7 10v12M15 5.88 14 10h7a2 2 0 0 1 2 2v0a2 2 0 0 1-.31 1.06l-4 6.4A2 2 0 0 1 17 20.5H2V10h4.5L11 4a2 2 0 0 1 4 1.88Z" /></svg>
                Рекомендовать
              </button>
              <button
                onClick={() => setAction('ban')}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 6,
                  border: '1px solid ' + (action === 'ban' ? '#fecaca' : '#e5e7eb'),
                  background: action === 'ban' ? '#fef2f2' : '#fff',
                  color: action === 'ban' ? '#dc2626' : '#6b7280',
                  fontWeight: action === 'ban' ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></svg>
                Запретить
              </button>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Комментарий</div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Почему стоит (не) постить в этот сабреддит..."
              rows={4}
              style={{
                width: '100%',
                padding: '9px 10px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 13,
                color: '#111827',
                fontFamily: 'var(--font-sans)',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: '8px 14px', borderRadius: 6, fontFamily: 'var(--font-sans)' }}
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  background: action === 'ban' ? '#dc2626' : '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Отправить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
