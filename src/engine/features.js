// Reconhecimento de grupos funcionais e propriedades estruturais usadas pelas regras de fragmentação.
import { multipleTo, isCarbonyl, isSp3C } from './molecule.js'

export const carbonOf = (mol, a) => mol.atoms[a].el === 'C'

// ligação pertence a anel?
export function isRingBond(mol, b) {
  const bond = mol.bonds[b]
  return mol.rings.some(r => {
    const i = r.indexOf(bond.a)
    if (i < 0) return false
    const n = r.length
    return r[(i + 1) % n] === bond.b || r[(i - 1 + n) % n] === bond.b
  })
}

// O carbonílico ligado ao carbono a (ou -1)
export function carbonylO(mol, a) {
  const n = multipleTo(mol, a, 2, 'O')
  return n ? n.atom : -1
}

// tipo de carbonila: aldehyde | ketone | acid | ester | amide | acyl_halide | other
export function carbonylKind(mol, c) {
  if (!isCarbonyl(mol, c)) return null
  const at = mol.atoms[c]
  const o = carbonylO(mol, c)
  const others = at.nbrs.filter(n => n.atom !== o).map(n => mol.atoms[n.atom])
  if (others.some(x => x.el === 'N')) return 'amide'
  if (others.some(x => ['Cl', 'Br', 'F', 'I'].includes(x.el))) return 'acyl_halide'
  const os = others.filter(x => x.el === 'O')
  if (os.length) return os.some(x => x.hs > 0 || x.chg < 0) ? 'acid' : 'ester'
  if (at.hs > 0) return 'aldehyde'
  return 'ketone'
}

const isNitroN = (mol, a) => {
  const at = mol.atoms[a]
  return at.el === 'N' && at.nbrs.filter(n => mol.atoms[n.atom].el === 'O').length >= 2
}
export const isNitro = isNitroN

// N do tipo amina: sp³, sem ligação múltipla, não amida, não aromático, não nitro
export function isAmineN(mol, a) {
  const at = mol.atoms[a]
  if (at.el !== 'N' || at.arom || at.chg !== 0) return false
  if (at.nbrs.some(n => mol.bonds[n.bond].order !== 1 || mol.bonds[n.bond].arom)) return false
  if (at.nbrs.some(n => isCarbonyl(mol, n.atom))) return false
  return true
}
export function isAmideN(mol, a) {
  const at = mol.atoms[a]
  return at.el === 'N' && !at.arom && at.nbrs.some(n => isCarbonyl(mol, n.atom))
}

// O de álcool/éter (ligações simples a C ou H, não ligado a carbonila)
export function etherLikeO(mol, a) {
  const at = mol.atoms[a]
  if (at.el !== 'O' || at.arom || at.chg !== 0) return null
  if (at.nbrs.some(n => mol.bonds[n.bond].order !== 1)) return null
  if (at.nbrs.some(n => isCarbonyl(mol, n.atom))) return 'ester_o'
  if (at.hs > 0) return at.nbrs.some(n => mol.atoms[n.atom].arom) ? 'phenol' : 'alcohol'
  return 'ether'
}

export const isAromaticAtom = (mol, a) => mol.atoms[a].arom

// C sp³ ligado a anel aromático
export const isBenzylic = (mol, a, within) =>
  isSp3C(mol, a) && mol.atoms[a].nbrs.some(n => mol.atoms[n.atom].arom && (!within || within.has(n.atom)))

export function isAllylic(mol, a, within) {
  if (!isSp3C(mol, a)) return false
  return mol.atoms[a].nbrs.some(n => {
    if (within && !within.has(n.atom)) return false
    const x = mol.atoms[n.atom]
    if (x.el !== 'C' || x.arom) return false
    return x.nbrs.some(m => {
      const b = mol.bonds[m.bond]
      return m.atom !== a && !b.arom && b.order >= 2 && mol.atoms[m.atom].el === 'C' && (!within || within.has(m.atom))
    })
  })
}

// Grupos funcionais presentes (para textos e para estimar a estabilidade de M⁺•)
export function detectGroups(mol) {
  const g = {
    aromatic: false,
    fused: false,
    ketone: 0,
    aldehyde: 0,
    acid: 0,
    ester: 0,
    amide: 0,
    alcohol: { primary: 0, secondary: 0, tertiary: 0 },
    phenol: 0,
    ether: 0,
    amine: 0,
    nitrile: 0,
    nitro: 0,
    alkene: 0,
    alkyne: 0,
    halogen: { F: 0, Cl: 0, Br: 0, I: 0 },
    sulfur: 0,
    ringsSat: 0,
    tertiaryC: 0,
    quaternaryC: 0,
    heteroaromatic: false
  }
  const aromRings = mol.rings.filter(r => r.every(i => mol.atoms[i].arom))
  g.aromatic = aromRings.length > 0
  g.fused = aromRings.some((r, i) => aromRings.some((s, j) => j !== i && r.some(x => s.includes(x))))
  g.heteroaromatic = aromRings.some(r => r.some(i => mol.atoms[i].el !== 'C'))
  for (const r of mol.rings) if (r.every(i => isSp3C(mol, i))) g.ringsSat++

  for (const at of mol.atoms) {
    const i = at.idx
    if (at.el === 'C') {
      const k = carbonylKind(mol, i)
      if (k && g[k] !== undefined) g[k]++
      if (isSp3C(mol, i)) {
        const nc = at.nbrs.filter(n => mol.atoms[n.atom].el === 'C').length
        if (nc === 3) g.tertiaryC++
        if (nc === 4) g.quaternaryC++
      }
      for (const n of at.nbrs) {
        const b = mol.bonds[n.bond]
        const y = mol.atoms[n.atom]
        if (n.atom < i || b.arom) continue
        if (y.el === 'C' && b.order === 2) g.alkene++
        if (y.el === 'C' && b.order === 3) g.alkyne++
      }
      if (at.nbrs.some(n => mol.bonds[n.bond].order === 3 && mol.atoms[n.atom].el === 'N')) g.nitrile++
    } else if (at.el === 'O') {
      const t = etherLikeO(mol, i)
      if (t === 'alcohol') {
        const c = at.nbrs[0]?.atom
        const nc = c != null ? mol.atoms[c].nbrs.filter(n => mol.atoms[n.atom].el === 'C').length : 0
        g.alcohol[nc >= 3 ? 'tertiary' : nc === 2 ? 'secondary' : 'primary']++
      } else if (t === 'phenol') g.phenol++
      else if (t === 'ether') g.ether++
    } else if (at.el === 'N') {
      if (isAmineN(mol, i)) g.amine++
      if (isNitroN(mol, i)) g.nitro++
    } else if (g.halogen[at.el] !== undefined) g.halogen[at.el]++
    else if (at.el === 'S') g.sulfur++
  }
  return g
}

export const nAlcohols = g => g.alcohol.primary + g.alcohol.secondary + g.alcohol.tertiary

// lista legível dos grupos
export function groupList(g) {
  const out = []
  if (g.aromatic) out.push(g.fused ? 'aromático policíclico' : g.heteroaromatic ? 'heteroaromático' : 'anel aromático')
  if (g.ketone) out.push('cetona')
  if (g.aldehyde) out.push('aldeído')
  if (g.acid) out.push('ácido carboxílico')
  if (g.ester) out.push('éster')
  if (g.amide) out.push('amida')
  if (nAlcohols(g)) out.push('álcool')
  if (g.phenol) out.push('fenol')
  if (g.ether) out.push('éter')
  if (g.amine) out.push('amina')
  if (g.nitrile) out.push('nitrila')
  if (g.nitro) out.push('nitro')
  if (g.alkene) out.push('alceno')
  if (g.alkyne) out.push('alcino')
  for (const [x, n] of Object.entries(g.halogen)) if (n) out.push({ F: 'flúor', Cl: 'cloro', Br: 'bromo', I: 'iodo' }[x])
  if (g.sulfur) out.push('enxofre')
  if (!out.length) out.push(g.ringsSat ? 'cicloalcano' : 'alcano')
  return out
}

export { isSp3C, isCarbonyl }
