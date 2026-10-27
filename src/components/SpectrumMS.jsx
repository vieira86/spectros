import { useEffect, useMemo, useRef, useState } from 'react'
import { pct } from '../utils/format'

// Espectro de massas em barras: m/z × abundância relativa (%)
// peaks: [{ mz, rel, main, isotope }] · selected: m/z selecionada
const SpectrumMS = ({ peaks, M, basePeak, selected, onSelect, height = 320, showIsotopes = true, compact = false, range }) => {
  const [hover, setHover] = useState(null)
  const box = useRef(null)
  const [width, setWidth] = useState(900)
  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(300, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // em telas estreitas o desenho usa a largura real (textos legíveis); em telas largas, escala
  const W = Math.min(900, width)
  const narrow = W < 560
  const H = narrow ? Math.round(height * 0.8) : height
  const pad = { l: compact ? 34 : narrow ? 38 : 46, r: 12, t: compact ? 22 : 30, b: compact ? 30 : 42 }
  const shown = useMemo(() => peaks.filter(p => showIsotopes || !p.isotope || p.rel >= 10), [peaks, showIsotopes])
  const [x0, x1] = useMemo(() => {
    if (range) return range
    const lo = Math.max(0, Math.floor((Math.min(...shown.map(p => p.mz)) - 6) / 10) * 10)
    const hi = Math.ceil((Math.max(M, ...shown.map(p => p.mz)) + 6) / 10) * 10
    return [lo, hi]
  }, [shown, M, range])
  const pw = W - pad.l - pad.r
  const ph = H - pad.t - pad.b
  const X = mz => pad.l + ((mz - x0) / (x1 - x0)) * pw
  const Y = r => pad.t + ph - (r / 100) * ph
  const bw = Math.max(2.5, Math.min(9, (pw / (x1 - x0)) * 0.55))
  const span = x1 - x0
  const pxPerU = pw / span
  const step = [5, 10, 20, 25, 50, 100].find(st => st * pxPerU >= 34) || 100

  // rótulos: picos mais intensos primeiro, sem sobreposição
  const labels = useMemo(() => {
    const cand = shown
      .filter(p => p.rel >= (compact ? 8 : 4) && (!p.isotope || p.rel >= 15))
      .concat(shown.filter(p => p.main === 'M' && !p.isotope))
      .sort((a, b) => b.rel - a.rel)
    const placed = []
    for (const p of cand) {
      if (placed.some(q => q.mz === p.mz)) continue
      const x = X(p.mz)
      if (placed.some(q => Math.abs(X(q.mz) - x) < 26 && Math.abs(Y(q.rel) - Y(p.rel)) < 16)) continue
      placed.push(p)
      if (placed.length >= (compact || narrow ? 8 : 16)) break
    }
    return new Set(placed.map(p => p.mz))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, compact, x0, x1, W])

  const color = p => {
    if (p.mz === selected) return '#f59e0b'
    if (p.isotope) return 'var(--iso-bar)'
    if (p.main === 'M') return '#4f46e5'
    if (p.mz === basePeak) return '#c026d3'
    return 'var(--bar)'
  }
  const hp = hover != null ? shown.find(p => p.mz === hover) : null

  return (
    <div className="relative w-full" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none text-slate-500 dark:text-slate-400" role="img" aria-label="Espectro de massas simulado">
        {[0, 25, 50, 75, 100].map(r => (
          <g key={r}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(r)} y2={Y(r)} stroke="currentColor" strokeOpacity={r === 0 ? 0.6 : 0.12} />
            <text x={pad.l - 6} y={Y(r) + 4} textAnchor="end" fontSize="12" fill="currentColor">
              {r}
            </text>
          </g>
        ))}
        {Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => x0 + i * step).map(t => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={Y(0)} y2={Y(0) + 5} stroke="currentColor" strokeOpacity="0.6" />
            <text x={X(t)} y={Y(0) + 19} textAnchor="middle" fontSize="12" fill="currentColor">
              {t}
            </text>
          </g>
        ))}
        {!compact && (
          <>
            <text x={pad.l + pw / 2} y={H - 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">
              m/z
            </text>
            <text x={12} y={pad.t + ph / 2} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor" transform={`rotate(-90 12 ${pad.t + ph / 2})`}>
              {narrow ? '%' : 'Abundância relativa (%)'}
            </text>
          </>
        )}
        {shown.map(p => (
          <g key={p.mz} onMouseEnter={() => setHover(p.mz)} onMouseLeave={() => setHover(null)} onClick={() => onSelect?.(p.mz)} style={{ cursor: onSelect ? 'pointer' : 'default' }}>
            <rect x={X(p.mz) - 7} y={pad.t} width={14} height={ph} fill="transparent" />
            <rect x={X(p.mz) - bw / 2} y={Y(p.rel)} width={bw} height={Math.max(1, Y(0) - Y(p.rel))} fill={color(p)} rx="1" />
          </g>
        ))}
        {shown
          .filter(p => labels.has(p.mz) || p.mz === selected)
          .map(p => (
            <text key={`l${p.mz}`} x={X(p.mz)} y={Y(p.rel) - 6} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={p.mz === selected ? '#d97706' : p.main === 'M' && !p.isotope ? '#4f46e5' : 'currentColor'} className="font-mono pointer-events-none">
              {p.mz}
              {p.main === 'M' && !p.isotope ? ' M⁺•' : ''}
            </text>
          ))}
      </svg>
      {hp && (
        <div className="pointer-events-none absolute top-1 right-2 rounded-xl bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow px-3 py-1.5 text-xs">
          <b className="wn">m/z {hp.mz}</b> · {pct(hp.rel)}%{hp.isotope ? ' · pico isotópico' : ''}
          {hp.main === 'M' && !hp.isotope ? ' · íon molecular' : ''}
        </div>
      )}
    </div>
  )
}

export default SpectrumMS
