import { useMemo } from 'react'

// Desenho 2D da molécula (coordenadas do RDKit) com destaques e rótulos clicáveis.
// tags: Map(atomIdx → { text, color }) · halos: Map(atomIdx → color) · selected: Set(atomIdx)
// focus: Set(atomIdx) — átomos que ficam no íon (o resto aparece esmaecido) · cutBonds: Set(bondIdx) — ligações rompidas
const SUBS = { 2: '₂', 3: '₃', 4: '₄' }

function atomText(a, leftH) {
  if (a.el === 'C' && a.nbrs.length > 0) return null
  const h = a.hs ? 'H' + (a.hs > 1 ? SUBS[a.hs] || a.hs : '') : ''
  const chg = a.chg ? (Math.abs(a.chg) > 1 ? Math.abs(a.chg) : '') + (a.chg > 0 ? '+' : '−') : ''
  return { main: a.el, h, chg, leftH: leftH && !!h }
}

const MoleculeView = ({ mol, tags, halos, selected, focus, cutBonds, onAtomClick, className = '', maxHeight = 280 }) => {
  const geo = useMemo(() => {
    if (!mol || !mol.atoms.length) return null
    const xs = mol.atoms.map(a => a.x)
    const ys = mol.atoms.map(a => -a.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const bl = 1.5 // comprimento de ligação do RDKit
    const S = 40 / bl // px por unidade
    const pad = 34
    const W = Math.max(160, (maxX - minX) * S + 2 * pad)
    const H = Math.max(110, (maxY - minY) * S + 2 * pad)
    const P = a => ({ x: (a.x - minX) * S + pad + (W - ((maxX - minX) * S + 2 * pad)) / 2, y: (-a.y - minY) * S + pad + (H - ((maxY - minY) * S + 2 * pad)) / 2 })
    const pts = mol.atoms.map(P)
    const L = 40 // ligação em px
    const labels = mol.atoms.map((a, i) => {
      const nb = a.nbrs.map(n => pts[n.atom])
      const mx = nb.length ? nb.reduce((s, p) => s + p.x, 0) / nb.length : pts[i].x + 1
      return atomText(a, mx > pts[i].x + 1)
    })
    // direção livre para a etiqueta de sinal
    const free = mol.atoms.map((a, i) => {
      const p = pts[i]
      if (!a.nbrs.length) return { x: p.x, y: p.y - 0.6 * L }
      let vx = 0
      let vy = 0
      for (const n of a.nbrs) {
        const q = pts[n.atom]
        const d = Math.hypot(q.x - p.x, q.y - p.y) || 1
        vx += (q.x - p.x) / d
        vy += (q.y - p.y) / d
      }
      let len = Math.hypot(vx, vy)
      if (len < 0.3) {
        // vizinhos opostos: perpendicular
        const q = pts[a.nbrs[0].atom]
        vx = -(q.y - p.y)
        vy = q.x - p.x
        len = Math.hypot(vx, vy) || 1
        return { x: p.x + (vx / len) * 0.62 * L, y: p.y + (vy / len) * 0.62 * L }
      }
      const k = labels[i] ? 0.78 : 0.62
      return { x: p.x - (vx / len) * k * L, y: p.y - (vy / len) * k * L }
    })
    const ringCenter = (a, b) => {
      const ring = mol.rings.filter(r => r.includes(a) && r.includes(b)).sort((x, y) => x.length - y.length)[0]
      if (!ring) return null
      return { x: ring.reduce((s, i) => s + pts[i].x, 0) / ring.length, y: ring.reduce((s, i) => s + pts[i].y, 0) / ring.length }
    }
    const bonds = mol.bonds.map(b => {
      let p = { ...pts[b.a] }
      let q = { ...pts[b.b] }
      const dx = q.x - p.x
      const dy = q.y - p.y
      const d = Math.hypot(dx, dy) || 1
      const ux = dx / d
      const uy = dy / d
      const cut = 0.3 * L
      if (labels[b.a]) p = { x: p.x + ux * cut, y: p.y + uy * cut }
      if (labels[b.b]) q = { x: q.x - ux * cut, y: q.y - uy * cut }
      const nx = -uy
      const ny = ux
      const lines = []
      if (b.order === 1) lines.push([p, q])
      else if (b.order === 2) {
        const c = ringCenter(b.a, b.b)
        if (c) {
          const side = Math.sign((c.x - p.x) * nx + (c.y - p.y) * ny) || 1
          const o = 0.17 * L * side
          const sh = 0.14 * L
          lines.push([p, q])
          lines.push([
            { x: p.x + nx * o + ux * sh, y: p.y + ny * o + uy * sh },
            { x: q.x + nx * o - ux * sh, y: q.y + ny * o - uy * sh }
          ])
        } else {
          const o = 0.09 * L
          lines.push([{ x: p.x + nx * o, y: p.y + ny * o }, { x: q.x + nx * o, y: q.y + ny * o }])
          lines.push([{ x: p.x - nx * o, y: p.y - ny * o }, { x: q.x - nx * o, y: q.y - ny * o }])
        }
      } else {
        const o = 0.15 * L
        lines.push([p, q])
        lines.push([{ x: p.x + nx * o, y: p.y + ny * o }, { x: q.x + nx * o, y: q.y + ny * o }])
        lines.push([{ x: p.x - nx * o, y: p.y - ny * o }, { x: q.x - nx * o, y: q.y - ny * o }])
      }
      return { idx: b.idx, a: b.a, b: b.b, lines, mid: { x: (pts[b.a].x + pts[b.b].x) / 2, y: (pts[b.a].y + pts[b.b].y) / 2 }, nx, ny }
    })
    return { W, H, pts, labels, free, bonds, L }
  }, [mol])

  if (!geo) return null
  const { W, H, pts, labels, free, bonds, L } = geo
  // etiquetas podem sair da área: margem extra
  const m = 18
  return (
    <svg viewBox={`${-m} ${-m} ${W + 2 * m} ${H + 2 * m}`} className={`w-full text-slate-800 dark:text-slate-100 ${className}`} style={{ maxHeight }} role="img" aria-label="Estrutura da molécula">
      {halos &&
        [...halos.entries()].map(([i, color]) => (
          <circle key={`h${i}`} cx={pts[i].x} cy={pts[i].y} r={selected?.has(i) ? 0.48 * L : 0.36 * L} fill={color} opacity={selected?.size ? (selected.has(i) ? 0.38 : 0.08) : 0.2} />
        ))}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {bonds.map(b => {
          const faded = focus && !(focus.has(b.a) && focus.has(b.b))
          return (
            <g key={b.idx} opacity={faded ? 0.22 : 1}>
              {b.lines.map(([p, q], k) => (
                <line key={k} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />
              ))}
            </g>
          )
        })}
      </g>
      {cutBonds &&
        bonds
          .filter(b => cutBonds.has(b.idx))
          .map(b => (
            <g key={`cut${b.idx}`}>
              <line x1={b.mid.x - b.nx * 0.42 * L} y1={b.mid.y - b.ny * 0.42 * L} x2={b.mid.x + b.nx * 0.42 * L} y2={b.mid.y + b.ny * 0.42 * L} stroke="#e11d48" strokeWidth="3" strokeDasharray="4 3" strokeLinecap="round" />
            </g>
          ))}
      {labels.map((t, i) => {
        if (!t) return null
        const p = pts[i]
        const color = { O: '#dc2626', N: '#2563eb', S: '#ca8a04', F: '#16a34a', Cl: '#16a34a', Br: '#9a3412', I: '#7e22ce', P: '#ea580c' }[t.main]
        const text = t.leftH ? t.h + t.main : t.main + t.h
        // ancora o símbolo do elemento no átomo
        const anchor = t.leftH ? 'end' : 'start'
        const dx = t.leftH ? 7 : -7
        return (
          <g key={`l${i}`} fontFamily="Inter, system-ui, sans-serif" fontWeight="600" fontSize="17" fill={color || 'currentColor'} opacity={focus && !focus.has(i) ? 0.3 : 1}>
            <text x={p.x + dx} y={p.y + 6} textAnchor={anchor} stroke="var(--mol-bg)" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke">
              {text}
              {t.chg && (
                <tspan fontSize="11" dy="-8">
                  {t.chg}
                </tspan>
              )}
            </text>
          </g>
        )
      })}
      {tags &&
        [...tags.entries()].map(([i, tag]) => {
          const f = free[i]
          const dim = selected?.size && !selected.has(i)
          return (
            <g key={`t${i}`} opacity={dim ? 0.35 : 1} onClick={onAtomClick ? () => onAtomClick(i) : undefined} style={{ cursor: onAtomClick ? 'pointer' : 'default' }}>
              <circle cx={f.x} cy={f.y} r={tag.text.length > 1 ? 12 : 10} fill={tag.color} />
              <text x={f.x} y={f.y + 4.2} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="Inter, system-ui, sans-serif">
                {tag.text}
              </text>
            </g>
          )
        })}
      {onAtomClick &&
        pts.map((p, i) => <circle key={`c${i}`} cx={p.x} cy={p.y} r={0.4 * L} fill="transparent" onClick={() => onAtomClick(i)} style={{ cursor: 'pointer' }} />)}
    </svg>
  )
}

export default MoleculeView
