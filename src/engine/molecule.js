// Grafo molecular a partir do JSON do RDKit (get_json) + coordenadas 2D (molblock).
// O motor trabalha só com este grafo: não depende do RDKit (testável no Node).

const SYMBOLS = { 1: 'H', 3: 'Li', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 11: 'Na', 12: 'Mg', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 19: 'K', 34: 'Se', 35: 'Br', 53: 'I' }

function parseCoords(molblock) {
  if (!molblock) return []
  const lines = molblock.split('\n')
  const counts = lines[3] || ''
  const n = parseInt(counts.slice(0, 3), 10)
  const out = []
  for (let i = 0; i < n; i++) {
    const l = lines[4 + i] || ''
    out.push({ x: parseFloat(l.slice(0, 10)) || 0, y: parseFloat(l.slice(10, 20)) || 0 })
  }
  return out
}

export function buildMolecule(json, molblock) {
  const doc = typeof json === 'string' ? JSON.parse(json) : json
  const defA = doc.defaults?.atom || {}
  const defB = doc.defaults?.bond || {}
  const m = doc.molecules[0]
  const ext = (m.extensions || []).find(e => e.name === 'rdkitRepresentation') || {}
  const aromA = new Set(ext.aromaticAtoms || [])
  const aromB = new Set(ext.aromaticBonds || [])
  const coords = parseCoords(molblock)

  const raw = m.atoms.map(a => ({
    z: a.z ?? defA.z ?? 6,
    hs: a.impHs ?? defA.impHs ?? 0,
    chg: a.chg ?? defA.chg ?? 0
  }))
  const map = {}
  const atoms = []
  raw.forEach((a, i) => {
    if (a.z === 1) return
    map[i] = atoms.length
    atoms.push({
      idx: atoms.length,
      z: a.z,
      el: SYMBOLS[a.z] || '?',
      hs: a.hs,
      chg: a.chg,
      arom: aromA.has(i),
      x: coords[i]?.x ?? 0,
      y: coords[i]?.y ?? 0,
      nbrs: []
    })
  })

  const bonds = []
  ;(m.bonds || []).forEach((b, bi) => {
    const [p, q] = b.atoms
    if (raw[p].z === 1 || raw[q].z === 1) {
      const heavy = raw[p].z === 1 ? q : p
      if (raw[heavy].z !== 1) atoms[map[heavy]].hs += 1
      return
    }
    bonds.push({
      idx: bonds.length,
      a: map[p],
      b: map[q],
      order: b.bo ?? defB.bo ?? 1,
      arom: aromB.has(bi),
      stereo: b.stereo && b.stereo !== 'unspecified' ? b.stereo : null,
      stereoAtoms: b.stereoAtoms ? b.stereoAtoms.map(s => map[s]) : null
    })
  })
  for (const b of bonds) {
    atoms[b.a].nbrs.push({ atom: b.b, bond: b.idx })
    atoms[b.b].nbrs.push({ atom: b.a, bond: b.idx })
  }

  const mol = { atoms, bonds }
  mol.rings = findRings(mol)
  for (const a of atoms) {
    a.rings = mol.rings.filter(r => r.includes(a.idx))
    a.ringSize = a.rings.length ? Math.min(...a.rings.map(r => r.length)) : 0
  }
  return mol
}

// Menores ciclos: para cada ligação, o caminho mais curto entre as pontas sem usá-la.
function findRings(mol) {
  const seen = new Map()
  for (const bond of mol.bonds) {
    const path = shortestPath(mol, bond.a, bond.b, bond.idx)
    if (!path || path.length > 12) continue
    const key = [...path].sort((x, y) => x - y).join(',')
    if (!seen.has(key)) seen.set(key, path)
  }
  // mantém só ciclos "elementares" (descarta o contorno de sistemas fundidos)
  const rings = [...seen.values()].sort((a, b) => a.length - b.length)
  return rings.filter(r => {
    // um anel maior formado pela união de menores é descartado se cada ligação dele
    // já pertence a um anel menor
    const smaller = rings.filter(s => s.length < r.length)
    if (!smaller.length) return true
    for (let i = 0; i < r.length; i++) {
      const a = r[i]
      const b = r[(i + 1) % r.length]
      if (!smaller.some(s => ringHasBond(s, a, b))) return true
    }
    return false
  })
}

function ringHasBond(ring, a, b) {
  const i = ring.indexOf(a)
  if (i < 0) return false
  const n = ring.length
  return ring[(i + 1) % n] === b || ring[(i - 1 + n) % n] === b
}

function shortestPath(mol, from, to, skipBond) {
  const prev = new Map([[from, -1]])
  const queue = [from]
  while (queue.length) {
    const cur = queue.shift()
    if (cur === to) break
    for (const n of mol.atoms[cur].nbrs) {
      if (n.bond === skipBond || prev.has(n.atom)) continue
      prev.set(n.atom, cur)
      queue.push(n.atom)
    }
  }
  if (!prev.has(to)) return null
  const path = []
  for (let c = to; c !== -1; c = prev.get(c)) path.push(c)
  return path.reverse()
}

// ── utilitários ──────────────────────────────────────────────────────────────
export const bondOf = (mol, a, b) => {
  const n = mol.atoms[a].nbrs.find(x => x.atom === b)
  return n ? mol.bonds[n.bond] : null
}

export const heavyNbrs = (mol, a, except = -1) => mol.atoms[a].nbrs.filter(n => n.atom !== except).map(n => n.atom)

// ligação múltipla (não aromática) de a para um átomo do elemento el
export function multipleTo(mol, a, order, el) {
  return mol.atoms[a].nbrs.find(n => {
    const b = mol.bonds[n.bond]
    return !b.arom && b.order === order && (!el || mol.atoms[n.atom].el === el)
  })
}

export const isCarbonyl = (mol, a) => mol.atoms[a].el === 'C' && !!multipleTo(mol, a, 2, 'O')

// carbono sp³ "de esqueleto": só ligações simples, não aromático
export function isSp3C(mol, a) {
  const at = mol.atoms[a]
  if (at.el !== 'C' || at.arom) return false
  return at.nbrs.every(n => mol.bonds[n.bond].order === 1 && !mol.bonds[n.bond].arom)
}

// parceiro de uma ligação C=C não aromática
export function alkenePartner(mol, a) {
  const at = mol.atoms[a]
  if (at.el !== 'C' || at.arom) return -1
  const n = at.nbrs.find(x => {
    const b = mol.bonds[x.bond]
    return !b.arom && b.order === 2 && mol.atoms[x.atom].el === 'C' && !mol.atoms[x.atom].arom
  })
  return n ? n.atom : -1
}

export function formulaOf(mol) {
  const count = {}
  let h = 0
  for (const a of mol.atoms) {
    count[a.el] = (count[a.el] || 0) + 1
    h += a.hs
  }
  if (h) count.H = h
  const order = ['C', 'H', ...Object.keys(count).filter(k => k !== 'C' && k !== 'H').sort()]
  const parts = order.filter(k => count[k]).map(k => ({ el: k, n: count[k] }))
  const text = parts.map(p => p.el + (p.n > 1 ? p.n : '')).join('')
  // IDH = C − H/2 − X/2 + N/2 + 1
  const X = (count.F || 0) + (count.Cl || 0) + (count.Br || 0) + (count.I || 0)
  const idh = (count.C || 0) - h / 2 - X / 2 + ((count.N || 0) + (count.P || 0)) / 2 + 1
  const charge = mol.atoms.reduce((s, a) => s + a.chg, 0)
  return { parts, text, count, hydrogens: h, idh: charge === 0 ? idh : null }
}
