import { useMemo, useRef, useState } from 'react';
import type { PostWithMeta } from '../lib/types';
import { formatKyivTime } from '../lib/timeUtils';

interface Props {
  posts: PostWithMeta[];
  height?: number;
}

interface Domain {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const VIEW_W = 760;
const PAD_L = 58;
const PAD_R = 20;
const PAD_T = 18;
const PAD_B = 42;

function computeFullDomain(posts: PostWithMeta[]): Domain {
  if (posts.length === 0) {
    const now = Date.now();
    return { xMin: now - 7 * 86400000, xMax: now, yMin: 0, yMax: 10 };
  }
  const times = posts.map(p => p.created_utc * 1000);
  const scores = posts.map(p => p.score);
  let xMin = Math.min(...times);
  let xMax = Math.max(...times);
  let yMax = Math.max(...scores);
  const yMin = 0;
  if (xMin === xMax) {
    xMin -= 86400000;
    xMax += 86400000;
  }
  const xPad = (xMax - xMin) * 0.04;
  xMin -= xPad;
  xMax += xPad;
  if (yMax === 0) yMax = 10;
  yMax *= 1.12;
  return { xMin, xMax, yMin, yMax };
}

function formatAxisDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function niceTicks(min: number, max: number, count: number): number[] {
  if (max <= min) return [min];
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, i) => min + step * i);
}

export default function PostsScatterChart({ posts, height = 360 }: Props) {
  const fullDomain = useMemo(() => computeFullDomain(posts), [posts]);
  const [domain, setDomain] = useState<Domain>(fullDomain);
  const [hovered, setHovered] = useState<{ post: PostWithMeta; clientX: number; clientY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragState = useRef<{ startX: number; startY: number; domain: Domain; moved: boolean } | null>(null);


  const plotW = VIEW_W - PAD_L - PAD_R;
  const plotH = height - PAD_T - PAD_B;

  const xScale = (t: number) => PAD_L + ((t - domain.xMin) / (domain.xMax - domain.xMin || 1)) * plotW;
  const yScale = (v: number) => PAD_T + (1 - (v - domain.yMin) / (domain.yMax - domain.yMin || 1)) * plotH;

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW_W,
      y: ((clientY - rect.top) / rect.height) * height,
    };
  };

  const clampDomain = (d: Domain): Domain => {
    // Don't allow zooming out further than the full dataset range, and don't
    // allow zooming in past a sensible minimum window.
    const minXSpan = (fullDomain.xMax - fullDomain.xMin) * 0.01;
    const minYSpan = Math.max((fullDomain.yMax - fullDomain.yMin) * 0.02, 1);
    let { xMin, xMax, yMin, yMax } = d;
    if (xMax - xMin < minXSpan) {
      const c = (xMax + xMin) / 2;
      xMin = c - minXSpan / 2;
      xMax = c + minXSpan / 2;
    }
    if (yMax - yMin < minYSpan) {
      const c = (yMax + yMin) / 2;
      yMin = c - minYSpan / 2;
      yMax = c + minYSpan / 2;
    }
    return { xMin, xMax, yMin, yMax };
  };

  const zoomAt = (factor: number, pivot: { x: number; y: number }) => {
    setDomain(d => {
      const pivotDataX = d.xMin + ((pivot.x - PAD_L) / plotW) * (d.xMax - d.xMin);
      const pivotDataY = d.yMin + (1 - (pivot.y - PAD_T) / plotH) * (d.yMax - d.yMin);
      const xMin = pivotDataX - (pivotDataX - d.xMin) * factor;
      const xMax = pivotDataX + (d.xMax - pivotDataX) * factor;
      const yMin = pivotDataY - (pivotDataY - d.yMin) * factor;
      const yMax = pivotDataY + (d.yMax - pivotDataY) * factor;
      return clampDomain({ xMin, xMax, yMin, yMax });
    });
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const pivot = toSvgPoint(e.clientX, e.clientY);
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    zoomAt(factor, pivot);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    dragState.current = { startX: p.x, startY: p.y, domain, moved: false };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragState.current) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    const drag = dragState.current;
    const dxPx = p.x - drag.startX;
    const dyPx = p.y - drag.startY;
    if (Math.abs(dxPx) > 1 || Math.abs(dyPx) > 1) drag.moved = true;
    const dxData = (dxPx / plotW) * (drag.domain.xMax - drag.domain.xMin);
    const dyData = (dyPx / plotH) * (drag.domain.yMax - drag.domain.yMin);
    setDomain(clampDomain({
      xMin: drag.domain.xMin - dxData,
      xMax: drag.domain.xMax - dxData,
      yMin: drag.domain.yMin + dyData,
      yMax: drag.domain.yMax + dyData,
    }));
  };

  const endDrag = () => {
    dragState.current = null;
  };

  const handlePointClick = (post: PostWithMeta) => {
    if (dragState.current?.moved) return;
    window.open(post.url, '_blank', 'noopener,noreferrer');
  };

  const xTicks = niceTicks(domain.xMin, domain.xMax, 5);
  const yTicks = niceTicks(domain.yMin, domain.yMax, 5);
  const isZoomed = Math.abs(domain.xMin - fullDomain.xMin) > 1 || Math.abs(domain.xMax - fullDomain.xMax) > 1
    || Math.abs(domain.yMax - fullDomain.yMax) > 0.5;

  return (
    <div>
      {/* Toolbar — standard chart tools: zoom in/out, reset, hints */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => zoomAt(0.7, { x: PAD_L + plotW / 2, y: PAD_T + plotH / 2 })}
          title="Приблизить"
          style={toolBtnStyle}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v6M8 11h6" /></svg>
        </button>
        <button
          onClick={() => zoomAt(1.4, { x: PAD_L + plotW / 2, y: PAD_T + plotH / 2 })}
          title="Отдалить"
          style={toolBtnStyle}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M8 11h6" /></svg>
        </button>
        <button
          onClick={() => setDomain(fullDomain)}
          disabled={!isZoomed}
          title="Сбросить масштаб"
          style={{ ...toolBtnStyle, opacity: isZoomed ? 1 : 0.4, cursor: isZoomed ? 'pointer' : 'default' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          Сброс
        </button>
        <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>
          Колесо мыши — зум, перетаскивание — панорама, клик по точке — открыть пост
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
          {posts.length} пост{posts.length === 1 ? '' : posts.length >= 2 && posts.length <= 4 ? 'а' : 'ов'}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${height}`}
        width="100%"
        height={height}
        style={{ display: 'block', cursor: dragState.current ? 'grabbing' : 'grab', background: '#fff', borderRadius: 8, border: '1px solid #f0f1f3' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        {/* Grid + Y axis */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={VIEW_W - PAD_R} y1={yScale(t)} y2={yScale(t)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={PAD_L - 8} y={yScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#9ca3af" fontFamily="var(--font-mono)">
              {Math.round(t)}
            </text>
          </g>
        ))}
        {/* X axis */}
        {xTicks.map((t, i) => (
          <g key={i}>
            <line x1={xScale(t)} x2={xScale(t)} y1={PAD_T} y2={height - PAD_B} stroke="#f9fafb" strokeWidth={1} />
            <text x={xScale(t)} y={height - PAD_B + 16} textAnchor="middle" fontSize={10} fill="#9ca3af" fontFamily="var(--font-mono)">
              {formatAxisDate(t)}
            </text>
          </g>
        ))}
        {/* Axis lines */}
        <line x1={PAD_L} x2={VIEW_W - PAD_R} y1={height - PAD_B} y2={height - PAD_B} stroke="#e5e7eb" strokeWidth={1} />
        <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={height - PAD_B} stroke="#e5e7eb" strokeWidth={1} />

        {/* Axis labels */}
        <text x={(PAD_L + VIEW_W - PAD_R) / 2} y={height - 6} textAnchor="middle" fontSize={10} fill="#6b7280" fontFamily="var(--font-sans)">Время публикации</text>
        <text x={14} y={(PAD_T + height - PAD_B) / 2} textAnchor="middle" fontSize={10} fill="#6b7280" fontFamily="var(--font-sans)" transform={`rotate(-90 14 ${(PAD_T + height - PAD_B) / 2})`}>Апвоуты</text>

        {/* Clip so points don't render over the axis area while panned/zoomed */}
        <clipPath id="plot-clip">
          <rect x={PAD_L} y={PAD_T} width={plotW} height={plotH} />
        </clipPath>

        <g clipPath="url(#plot-clip)">
          {posts.map(post => {
            const x = xScale(post.created_utc * 1000);
            const y = yScale(post.score);
            if (x < PAD_L - 20 || x > VIEW_W - PAD_R + 20 || y < PAD_T - 20 || y > height - PAD_B + 20) return null;
            return (
              <circle
                key={post.id}
                cx={x}
                cy={y}
                r={5}
                fill="#2563eb"
                fillOpacity={0.65}
                stroke="#1d4ed8"
                strokeWidth={1}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => setHovered({ post, clientX: e.clientX, clientY: e.clientY })}
                onMouseMove={e => setHovered(h => (h ? { ...h, clientX: e.clientX, clientY: e.clientY } : h))}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handlePointClick(post)}
              />
            );
          })}
        </g>
      </svg>

      {hovered && (
        <div style={{
          position: 'fixed',
          left: hovered.clientX + 14,
          top: hovered.clientY - 10,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '10px 12px',
          zIndex: 9999,
          pointerEvents: 'none',
          maxWidth: 260,
          boxShadow: '0 8px 30px rgba(0,0,0,0.14)',
        }}>
          <div style={{ fontSize: 12, color: '#111827', fontWeight: 600, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {hovered.post.title}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 12px', fontSize: 11 }}>
            <span style={{ color: '#9ca3af' }}>Апвоуты</span>
            <span style={{ color: '#FF4500', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{hovered.post.score}</span>
            <span style={{ color: '#9ca3af' }}>Комментарии</span>
            <span style={{ color: '#7c3aed', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{hovered.post.comments}</span>
            <span style={{ color: '#9ca3af' }}>Дата</span>
            <span style={{ color: '#374151', fontFamily: 'var(--font-mono)' }}>{formatKyivTime(hovered.post.created_utc)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const toolBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  padding: '5px 10px',
  fontSize: 11,
  color: '#374151',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};
