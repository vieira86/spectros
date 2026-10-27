// Ionização por elétrons (70 eV): onde o elétron é removido e quão estável é M⁺•.
import { IONIZATION_SITES } from '../data/elements.js'
import { isSp3C } from './molecule.js'
import { carbonylKind, carbonylO, etherLikeO, isAmineN, nAlcohols } from './features.js'

// Sítios candidatos (átomos) com a energia de ionização típica
export function ionizationSites(mol, g) {
  const sites = []
  const push = (key, atoms) => sites.push({ key, atoms, ...IONIZATION_SITES[key] })
  for (const at of mol.atoms) {
    const i = at.idx
    if (isAmineN(mol, i)) push('amine', [i])
    else if (at.el === 'S' && !at.arom) push('sulfur', [i])
    else if (at.el === 'I') push('iodine', [i])
    else if (at.el === 'Br') push('bromine', [i])
    else if (at.el === 'Cl') push('chlorine', [i])
    else if (at.el === 'O') {
      const t = etherLikeO(mol, i)
      if (t === 'ether') push('ether', [i])
      else if (t === 'alcohol') push('alcohol', [i])
    } else if (at.el === 'C') {
      const k = carbonylKind(mol, i)
      if (k) push(k === 'ketone' || k === 'aldehyde' ? 'carbonyl' : 'ester', [carbonylO(mol, i)])
      const tn = at.nbrs.find(n => mol.bonds[n.bond].order === 3 && mol.atoms[n.atom].el === 'N')
      if (tn) push('nitrile', [i, tn.atom])
    }
  }
  if (g.aromatic) {
    const ring = mol.rings.find(r => r.every(i => mol.atoms[i].arom))
    push(g.fused ? 'aromaticFused' : 'aromatic', ring)
  }
  for (const b of mol.bonds) {
    if (b.arom || mol.atoms[b.a].el !== 'C' || mol.atoms[b.b].el !== 'C') continue
    if (b.order === 2) push('alkene', [b.a, b.b])
    if (b.order === 3) push('alkyne', [b.a, b.b])
  }
  if (!sites.length) {
    // alcano: ligação C–C mais substituída
    let best = null
    for (const b of mol.bonds) {
      if (!isSp3C(mol, b.a) || !isSp3C(mol, b.b)) continue
      const deg = mol.atoms[b.a].nbrs.length + mol.atoms[b.b].nbrs.length
      if (!best || deg > best.deg) best = { deg, atoms: [b.a, b.b] }
    }
    push('sigma', best ? best.atoms : [0])
  }
  // um sítio por tipo (o primeiro encontrado), ordenado pela energia de ionização
  const seen = new Set()
  return sites
    .filter(s => (seen.has(s.key) ? false : seen.add(s.key)))
    .sort((a, b) => a.ie - b.ie)
}

// Estimativa (escala do motor) da "sobrevivência" de M⁺• e os motivos didáticos
export function molecularIonStability(mol, g) {
  const reasons = []
  let score
  const heavy = mol.atoms.length
  if (g.aromatic) {
    score = 7.3 + (g.fused ? 0.8 : 0)
    reasons.push('O anel aromático deslocaliza a carga e o elétron desemparelhado: M⁺• costuma ser intenso.')
  } else {
    const cands = []
    const add = (v, txt) => cands.push({ v, txt })
    if (g.amine) add(7.0, 'Aminas: a α-clivagem é muito rápida, M⁺• geralmente fraco a moderado (ímpar se houver 1 N).')
    if (g.amide) add(7.0, 'Amidas: M⁺• costuma ser observável.')
    if (g.ketone) add(6.8, 'Cetonas: M⁺• geralmente visível (moderado).')
    if (g.aldehyde) add(6.5, 'Aldeídos alifáticos: M⁺• moderado a fraco; M − 1 característico.')
    if (g.acid) add(6.3, 'Ácidos carboxílicos alifáticos: M⁺• fraco a moderado.')
    if (g.ester) add(6.0, 'Ésteres: M⁺• geralmente fraco.')
    if (g.ether) add(6.4, 'Éteres: M⁺• fraco a moderado.')
    if (g.alcohol.primary) add(6.0, 'Álcoois primários: M⁺• fraco (perdem H₂O e sofrem α-clivagem com facilidade).')
    if (g.alcohol.secondary) add(5.3, 'Álcoois secundários: M⁺• muito fraco.')
    if (g.alcohol.tertiary) add(3.8, 'Álcoois terciários: M⁺• quase sempre ausente.')
    if (g.nitrile) add(4.5, 'Nitrilas alifáticas: M⁺• fraco; M − 1 comum.')
    if (g.nitro) add(3.5, 'Nitroalcanos: M⁺• muito fraco ou ausente.')
    if (g.halogen.I) add(7.0, 'Iodetos: M⁺• intenso (C–I fraca, mas o I retém bem a carga).')
    if (g.halogen.Br) add(6.0, 'Brometos: M⁺• visível, sempre com o par M/M+2 (1:1).')
    if (g.halogen.Cl) add(5.5, 'Cloretos: M⁺• fraco a moderado, com M+2 (3:1).')
    if (g.halogen.F) add(5.0, 'Fluoretos: M⁺• fraco.')
    if (g.sulfur) add(7.0, 'Compostos de enxofre: M⁺• geralmente intenso.')
    if (g.alkene) add(g.ringsSat || mol.rings.length ? 6.5 : 5.8, 'Alcenos: a ligação π ajuda a estabilizar M⁺•.')
    if (g.alkyne) add(5.5, 'Alcinos: M⁺• fraco a moderado.')
    if (!cands.length) {
      let v = mol.rings.length ? 5.5 : 3.0
      let txt = mol.rings.length ? 'Cicloalcanos: M⁺• relativamente intenso (é preciso romper duas ligações do anel).' : 'Alcanos lineares: M⁺• fraco e diminui com o tamanho da cadeia.'
      if (g.tertiaryC || g.quaternaryC) {
        v -= 0.7 * g.tertiaryC + 1.5 * g.quaternaryC
        txt = 'Alcanos ramificados: M⁺• muito fraco ou ausente (a clivagem no ponto de ramificação forma carbocátions estáveis).'
      }
      add(v, txt)
    }
    // haletos: quanto mais ramificado (X em C secundário/terciário), menos intenso o M⁺•
    const hx = mol.atoms.find(a => ['Cl', 'Br', 'I', 'F'].includes(a.el) && a.nbrs.length === 1 && mol.atoms[a.nbrs[0].atom].nbrs.filter(n => mol.atoms[n.atom].el === 'C').length >= 2 && isSp3C(mol, a.nbrs[0].atom))
    if (hx) for (const c of cands) if (/Cloretos|Brometos|Iodetos|Fluoretos/.test(c.txt)) c.v -= 1.5
    if (hx) reasons.push('Haletos ramificados (X em carbono secundário ou terciário): M⁺• ainda mais fraco.')
    cands.sort((a, b) => a.v - b.v)
    score = cands[0].v
    for (const c of cands) reasons.push(c.txt)
    if (g.alcohol.tertiary && nAlcohols(g)) score = Math.min(score, 3.8)
  }
  if (heavy > 8) {
    score -= 0.05 * (heavy - 8)
    reasons.push('Moléculas maiores têm mais caminhos de fragmentação: M⁺• tende a ficar mais fraco.')
  }
  return { score, reasons }
}
