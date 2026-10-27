// Fórmulas, massas (nominal, exata, média) e padrão isotópico.
import { ELEMENTS, ELECTRON_MASS } from '../data/elements.js'

// fórmula = { C: 2, H: 6, O: 1 }
export function addF(a, b, k = 1) {
  const out = { ...a }
  for (const [el, n] of Object.entries(b)) {
    out[el] = (out[el] || 0) + k * n
    if (!out[el]) delete out[el]
  }
  return out
}
export const subF = (a, b) => addF(a, b, -1)

export function formulaOfAtoms(mol, atomSet, extraH = 0) {
  const f = {}
  let h = extraH
  for (const i of atomSet) {
    const a = mol.atoms[i]
    f[a.el] = (f[a.el] || 0) + 1
    h += a.hs
  }
  if (h) f.H = h
  return f
}

// ordem de Hill: C, H, depois alfabética (sem C: tudo alfabético)
export function hillOrder(f) {
  const keys = Object.keys(f).filter(k => f[k] > 0)
  if (f.C) return ['C', ...(f.H ? ['H'] : []), ...keys.filter(k => k !== 'C' && k !== 'H').sort()]
  return keys.sort()
}
export const formulaText = f => hillOrder(f).map(el => el + (f[el] > 1 ? f[el] : '')).join('')

export const nominalMass = f => Object.entries(f).reduce((s, [el, n]) => s + (ELEMENTS[el]?.nominal ?? 0) * n, 0)
export const monoMass = f => Object.entries(f).reduce((s, [el, n]) => s + (ELEMENTS[el]?.mono ?? 0) * n, 0)
export const avgMass = f => Object.entries(f).reduce((s, [el, n]) => s + (ELEMENTS[el]?.avg ?? 0) * n, 0)
// m/z exata de um cátion (carga +1): massa da espécie neutra menos um elétron
export const ionExactMz = f => monoMass(f) - ELECTRON_MASS

// Distribuição isotópica por convolução, em deslocamentos de massa nominal (0 = monoisotópico).
// Retorna [{ d, p }] com p relativo (soma 1).
export function isotopePattern(f, maxShift = 8) {
  let dist = new Map([[0, 1]])
  for (const [el, n] of Object.entries(f)) {
    const iso = ELEMENTS[el]?.iso
    if (!iso || iso.length === 1) continue
    const base = iso.find(([d]) => d === 0)?.[1] ?? 1
    for (let k = 0; k < n; k++) {
      const next = new Map()
      for (const [d, p] of dist) {
        for (const [di, pi] of iso) {
          const nd = d + di
          if (nd < -maxShift || nd > maxShift) continue
          const v = p * (pi / base)
          if (v < 1e-7) continue
          next.set(nd, (next.get(nd) || 0) + v)
        }
      }
      dist = next
    }
  }
  const total = [...dist.values()].reduce((s, p) => s + p, 0)
  return [...dist.entries()]
    .map(([d, p]) => ({ d, p: p / total }))
    .filter(x => x.p > 1e-5)
    .sort((a, b) => a.d - b.d)
}

// Padrão relativo ao pico monoisotópico (M = 100), útil para M, M+1, M+2…
export function isotopeRelative(f) {
  const pat = isotopePattern(f)
  const m0 = pat.find(x => x.d === 0)?.p || 1
  return pat.map(x => ({ d: x.d, rel: (100 * x.p) / m0 }))
}

// Regra do 13: M/13 = n + r/13 → fórmula-base CnH(n+r)
export function ruleOf13(M) {
  const n = Math.floor(M / 13)
  const r = M - 13 * n
  const idh = (n - r + 2) / 2
  return { n, r, base: { C: n, H: n + r }, idh }
}

// Regra do nitrogênio: M nominal ímpar ↔ número ímpar de N
export function nitrogenRule(M, nN) {
  const odd = M % 2 === 1
  return { odd, nN, ok: odd === (nN % 2 === 1) }
}

// Fórmulas CHNO de mesma massa nominal (para mostrar por que a alta resolução identifica a fórmula)
// evenElectronIon: true para cátions de número par de elétrons (DBE fracionário, ex.: C₂H₃O⁺)
export function isobaricFormulas(f, limit = 5, evenElectronIon = false) {
  const M = nominalMass(f)
  const onlyCHNO = Object.keys(f).every(k => ['C', 'H', 'N', 'O'].includes(k))
  if (!onlyCHNO) return []
  const target = monoMass(f)
  const parity = evenElectronIon ? 1 : 0
  const out = []
  for (let c = 1; c <= Math.floor(M / 12); c++)
    for (let n = 0; n <= 4; n++)
      for (let o = 0; o <= 6; o++) {
        const h = M - 12 * c - 14 * n - 16 * o
        if (h < 0) continue
        const dbe2 = 2 * c + 2 + n - h
        if (dbe2 < 0 || dbe2 % 2 !== parity) continue
        const g = { C: c, H: h, N: n, O: o }
        for (const k of Object.keys(g)) if (!g[k]) delete g[k]
        const m = monoMass(g)
        out.push({ formula: g, text: formulaText(g), mono: m, delta: m - target, dbe: dbe2 / 2 })
      }
  return out.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta)).slice(0, limit)
}
