// Regras de fragmentação por impacto de elétrons (IE, 70 eV) — nível didático.
//
// Cada caminho recebe uma pontuação = estabilidade do cátion formado + estabilidade do neutro perdido
// + penalidade da ligação rompida. A abundância relativa é proporcional a exp(K·pontuação).
// Os valores estão em src/data/rules.js e podem ser ajustados.
import { isSp3C, isCarbonyl, alkenePartner } from './molecule.js'
import { formulaOfAtoms } from './mass.js'
import { carbonylKind, carbonylO, etherLikeO, isAmideN, isAmineN, isNitro, isRingBond, isBenzylic, isAllylic } from './features.js'
import { CATION, RADICAL, PENALTY, REARR, SECONDARY } from '../data/rules.js'

const HAL = ['F', 'Cl', 'Br', 'I']

export function component(mol, start, cut = new Set(), within = null) {
  const seen = new Set([start])
  const stack = [start]
  while (stack.length) {
    const c = stack.pop()
    for (const n of mol.atoms[c].nbrs) {
      if (cut.has(n.bond) || seen.has(n.atom)) continue
      if (within && !within.has(n.atom)) continue
      seen.add(n.atom)
      stack.push(n.atom)
    }
  }
  return seen
}
const netCharge = (mol, set) => [...set].reduce((s, i) => s + mol.atoms[i].chg, 0)
const allAtoms = mol => new Set(mol.atoms.map(a => a.idx))
const hasDoubleTo = (mol, a, el, within) =>
  mol.atoms[a].nbrs.find(n => mol.bonds[n.bond].order === 2 && !mol.bonds[n.bond].arom && mol.atoms[n.atom].el === el && (!within || within.has(n.atom)))
const isVinylC = (mol, a) => mol.atoms[a].el === 'C' && !mol.atoms[a].arom && alkenePartner(mol, a) >= 0
const isAlkyneC = (mol, a) => mol.atoms[a].el === 'C' && mol.atoms[a].nbrs.some(n => mol.bonds[n.bond].order === 3 && mol.atoms[n.atom].el === 'C')

// ── estabilidade do cátion com a carga no átomo c (fragmento ion) ───────────
export function cationScore(mol, c, ion) {
  const at = mol.atoms[c]
  const nb = at.nbrs.filter(n => ion.has(n.atom))
  const opts = []
  const add = (key, extra = 0) => opts.push({ key, score: CATION[key].score + extra, label: CATION[key].label, kind: CATION[key].kind })

  if (at.el === 'C') {
    const o = hasDoubleTo(mol, c, 'O', ion)
    if (o) {
      const others = nb.filter(n => n.atom !== o.atom).map(n => mol.atoms[n.atom])
      if (!others.length) add(at.hs ? 'formyl' : 'other')
      else if (others.some(x => x.el === 'N')) add('acyliumN')
      else if (others.some(x => x.el === 'O')) add('acyliumO')
      else if (others.some(x => x.arom)) add('acyliumAr')
      else add('acylium')
      return best(opts)
    }
    for (const n of at.arom ? [] : nb) {
      const b = mol.bonds[n.bond]
      if (b.order !== 1 || b.arom) continue
      const y = mol.atoms[n.atom]
      if (y.el === 'N' && !y.arom && y.chg === 0) {
        if (isAmineN(mol, n.atom)) add('iminium')
        else if (isAmideN(mol, n.atom)) add('iminiumAmide')
      }
      if (y.el === 'O' && y.chg === 0) {
        const t = etherLikeO(mol, n.atom)
        if (t === 'ether' && y.nbrs.some(m => mol.atoms[m.atom].arom)) add('oxoniumAr')
        else if (t === 'alcohol' || t === 'ether') add('oxonium')
        else if (t === 'ester_o') add('oxoniumEster')
      }
      if (y.el === 'S' && y.chg === 0) add('sulfonium')
      if (y.el === 'Cl' || y.el === 'Br' || y.el === 'I') add('halonium')
    }
    if (at.arom) add('aryl')
    else if (isSp3C(mol, c)) {
      let mod = 0
      if (nb.some(n => isCarbonyl(mol, n.atom))) mod += PENALTY.alphaCarbonylCation
      if (nb.some(n => mol.atoms[n.atom].nbrs.some(m => mol.bonds[m.bond].order === 3 && mol.atoms[m.atom].el === 'N'))) mod += PENALTY.alphaNitrileCation
      if (isBenzylic(mol, c, ion)) add('benzylic', mod * 0.5)
      if (isAllylic(mol, c, ion)) add('allylic', mod * 0.5)
      if (nb.some(n => ion.has(n.atom) && isAlkyneC(mol, n.atom))) add('propargyl', mod * 0.5)
      const nc = nb.filter(n => mol.atoms[n.atom].el === 'C').length
      if (nc === 1) {
        // primário: etila é muito instável; com ≥ 3 C rearranja a secundário (migração de H⁻)
        const ionC = [...ion].filter(i => mol.atoms[i].el === 'C').length
        const onlyCH = [...ion].every(i => mol.atoms[i].el === 'C')
        if (onlyCH && ionC === 2) add('ethyl', mod)
        else if (onlyCH && ionC >= 3) add('primaryRearr', mod)
        else add('primary', mod)
      } else add(nc >= 3 ? 'tertiary' : nc === 2 ? 'secondary' : 'methyl', mod)
    } else if (isVinylC(mol, c) || isAlkyneC(mol, c)) add('vinyl')
    else add('other')
  } else if (at.el === 'O') {
    add(nb.some(n => mol.atoms[n.atom].arom) ? 'phenoxy' : 'oxenium')
  } else if (at.el === 'N') {
    add(isNitro(mol, c) ? 'nitronium' : 'nitrenium')
  } else if (at.el === 'I') add('iodine')
  else if (at.el === 'Br') add('bromine')
  else if (at.el === 'Cl') add('chlorine')
  else if (at.el === 'S') add('thio')
  else add('other')
  return best(opts)
}
const best = opts => opts.reduce((a, b) => (b.score > a.score ? b : a), opts[0] || { score: 0, label: 'cátion', kind: 'other' })

// ── estabilidade do radical neutro formado no átomo r (fragmento neu) ───────
export function radicalScore(mol, r, neu) {
  const at = mol.atoms[r]
  const nb = at.nbrs.filter(n => neu.has(n.atom))
  if (at.el === 'C') {
    if (hasDoubleTo(mol, r, 'O', neu)) return RADICAL.acyl
    if (at.arom) return RADICAL.aryl
    if (isSp3C(mol, r)) {
      if (isBenzylic(mol, r, neu)) return RADICAL.benzyl
      if (isAllylic(mol, r, neu)) return RADICAL.allyl
      if (nb.some(n => ['O', 'N', 'S'].includes(mol.atoms[n.atom].el))) return RADICAL.alphaHetero
      const nc = nb.filter(n => mol.atoms[n.atom].el === 'C').length
      // regra da aula: havendo opção, sai o MAIOR radical alquila
      const size = [...neu].filter(i => mol.atoms[i].el === 'C').length - 1
      return [RADICAL.methyl, RADICAL.primary, RADICAL.secondary, RADICAL.tertiary][Math.min(nc, 3)] + RADICAL.sizeStep * Math.min(Math.max(size, 0), RADICAL.sizeMax)
    }
    if (at.nbrs.some(n => mol.bonds[n.bond].order === 3 && mol.atoms[n.atom].el === 'N')) return RADICAL.cyano
    return RADICAL.vinyl
  }
  if (at.el === 'O') {
    if (at.hs) return RADICAL.hydroxyl
    // •OR que sai de um acílio (éster) é diferente do •OR da clivagem indutiva de éteres
    // (e o •OR que sai do anel aromático, cuja ligação C(sp²)–O é forte)
    return at.nbrs.some(n => !neu.has(n.atom) && (isCarbonyl(mol, n.atom) || mol.atoms[n.atom].arom)) ? RADICAL.alkoxylEster : RADICAL.alkoxyl
  }
  if (at.el === 'N') return isNitro(mol, r) ? RADICAL.nitro : at.hs >= 2 ? RADICAL.amino : RADICAL.aminoSub
  if (at.el === 'S') return RADICAL.thiyl
  if (RADICAL[at.el] != null) return RADICAL[at.el]
  return RADICAL.other
}

function bondPenalty(mol, a, b) {
  if (mol.atoms[a].arom || mol.atoms[b].arom) return PENALTY.arylBond
  if (isVinylC(mol, a) || isVinylC(mol, b) || isAlkyneC(mol, a) || isAlkyneC(mol, b)) return PENALTY.vinylBond
  return 0
}

function mechanismOf(cat, mol, rEl) {
  if (cat.kind === 'acylium') return 'alpha_co'
  if (cat.kind === 'hetero_alpha') return rEl === 'H' ? 'h_alpha' : 'alpha'
  if (rEl === 'H') return 'h_loss'
  if (cat.kind === 'charge_hetero') return 'hetero'
  if (rEl !== 'C') return 'inductive'
  if (cat.kind === 'benzylic') return 'benzylic'
  if (cat.kind === 'allylic') return 'allylic'
  if (cat.kind === 'aryl') return 'aryl'
  return 'sigma'
}

// ── fragmentos primários ────────────────────────────────────────────────────
export function primaryFragments(mol) {
  const frags = []
  const all = allAtoms(mol)

  // 1) clivagens simples de ligações acíclicas (σ, α, indutiva, benzílica, alílica)
  for (const bond of mol.bonds) {
    if (bond.order !== 1 || bond.arom || isRingBond(mol, bond.idx)) continue
    const cut = new Set([bond.idx])
    const A = component(mol, bond.a, cut)
    const B = component(mol, bond.b, cut)
    if (netCharge(mol, A) !== 0 || netCharge(mol, B) !== 0) continue
    for (const [ion, c, neu, r] of [
      [A, bond.a, B, bond.b],
      [B, bond.b, A, bond.a]
    ]) {
      const cat = cationScore(mol, c, ion)
      const rad = radicalScore(mol, r, neu)
      let pen = bondPenalty(mol, bond.a, bond.b)
      // cicloalcano com cadeia lateral: a cadeia sai e a carga fica no anel
      const ringSide = !pen && mol.atoms[r].el === 'C' && isSp3C(mol, c) && mol.rings.some(rg => rg.includes(c) && rg.every(i => isSp3C(mol, i))) && !mol.rings.some(rg => rg.some(i => neu.has(i)))
      if (ringSide && cat.kind === 'alkyl') pen += PENALTY.ringSideChain
      frags.push({
        type: mechanismOf(cat, mol, mol.atoms[r].el),
        ion,
        ionH: 0,
        chargeAtom: c,
        cut: [bond.idx],
        neutral: neu,
        neutralH: 0,
        neutralRadical: true,
        oddElectron: false,
        cation: cat,
        score: cat.score + rad + pen,
        parts: [
          { label: cat.label, value: cat.score },
          { label: 'radical perdido', value: rad },
          ...(pen ? [{ label: pen > 0 ? 'carga fica no anel (sai a cadeia lateral)' : 'ligação forte (C sp²)', value: pen }] : [])
        ],
        mult: 1
      })
    }
  }

  // 2) perda de H• (α ao heteroátomo, aldeído, benzílico…)
  for (const at of mol.atoms) {
    if (!at.hs) continue
    if (isAlkyneC(mol, at.idx) && at.hs === 1) {
      // alcinos terminais: M − 1 forte (perda do H ligado ao C sp)
      const cat = { ...CATION.alkynylTerminal, key: 'alkynylTerminal' }
      frags.push({ type: 'alkyne_h', ion: all, ionH: -1, chargeAtom: at.idx, cut: [], hAtom: at.idx, neutral: new Set(), neutralH: 1, neutralRadical: true, oddElectron: false, cation: cat, score: cat.score + RADICAL.H, parts: [{ label: cat.label, value: cat.score }, { label: 'radical perdido (H•)', value: RADICAL.H }], mult: 1 })
      continue
    }
    const cat = cationScore(mol, at.idx, all)
    let pen = at.arom ? PENALTY.arylBond : isVinylC(mol, at.idx) ? PENALTY.vinylBond : 0
    // H• só sai com facilidade quando o cátion é bem estabilizado
    if (['alkyl', 'other', 'charge_hetero'].includes(cat.kind)) pen += PENALTY.unstabilizedHLoss
    if (cat.kind === 'acylium') pen += PENALTY.aldehydeHLoss
    frags.push({
      type: mechanismOf(cat, mol, 'H'),
      ion: all,
      ionH: -1,
      chargeAtom: at.idx,
      cut: [],
      hAtom: at.idx,
      neutral: new Set(),
      neutralH: 1,
      neutralRadical: true,
      oddElectron: false,
      cation: cat,
      score: cat.score + RADICAL.H + pen,
      parts: [
        { label: cat.label, value: cat.score },
        { label: 'radical perdido (H•)', value: RADICAL.H },
        ...(pen ? [{ label: pen > 0 ? 'H do aldeído (fácil de perder)' : 'cátion pouco estabilizado / C–H em C sp²', value: pen }] : [])
      ],
      mult: at.hs
    })
  }

  frags.push(...ketene(mol), ...hcnLoss(mol), ...mclafferty(mol), ...mclaffertyPlus1(mol), ...waterLoss(mol), ...hxLoss(mol), ...cyclicHalonium(mol), ...rda(mol), ...ringEthylene(mol), ...ringAlpha(mol), ...ringAmine(mol), ...phenolCO(mol), ...arylEtherAlkene(mol), ...nitroNO(mol))
  return frags
}

// ── rearranjo de McLafferty: Y=C–α–β–γ–H ────────────────────────────────────
function mclafferty(mol) {
  const out = []
  const seen = new Set()
  const tryChain = (y, cc, kind, carbonyl = false) => {
    for (const na of mol.atoms[cc].nbrs) {
      const al = na.atom
      if (al === y) continue
      const bAlpha = mol.bonds[na.bond]
      if (bAlpha.order !== 1 || bAlpha.arom) continue
      const alEl = mol.atoms[al].el
      if (!(isSp3C(mol, al) || (alEl === 'O' && carbonyl))) continue
      for (const nb of mol.atoms[al].nbrs) {
        const be = nb.atom
        if (be === cc) continue
        const bond = mol.bonds[nb.bond]
        if (bond.order !== 1 || bond.arom || isRingBond(mol, bond.idx) || !isSp3C(mol, be)) continue
        const gam = mol.atoms[be].nbrs.find(ng => ng.atom !== al && mol.atoms[ng.atom].hs > 0 && (isSp3C(mol, ng.atom) || mol.atoms[ng.atom].el !== 'C'))
        if (!gam) continue
        const key = `${cc}-${al}-${be}`
        if (seen.has(key)) continue
        seen.add(key)
        const cut = new Set([bond.idx])
        const ion = component(mol, al, cut)
        const neu = component(mol, be, cut)
        if (ion.has(be) || netCharge(mol, ion) || netCharge(mol, neu)) continue
        const k = alEl === 'O' ? 'alkoxy' : kind
        const r = REARR.mclafferty[k] ?? REARR.mclafferty.ketone
        out.push({
          type: 'mclafferty',
          subtype: k,
          ion,
          ionH: 1,
          chargeAtom: y,
          cut: [bond.idx],
          hFrom: gam.atom,
          hTo: y,
          neutral: neu,
          neutralH: -1,
          neutralRadical: false,
          oddElectron: true,
          cation: { label: carbonyl ? (k === 'alkoxy' ? 'cátion-radical do ácido (enol)' : 'cátion-radical (enol)') : kind === 'aromatic' ? 'cátion-radical (metilenociclo-hexadieno)' : kind === 'nitrile' ? 'cátion-radical da cetenimina (CH₂=C=NH⁺•)' : 'cátion-radical (alceno)', kind: 'oe' },
          score: r,
          parts: [{ label: `McLafferty (${REARR.mclaffertyLabel[k]})`, value: r }],
          mult: 1
        })
      }
    }
  }
  for (const at of mol.atoms) {
    const c = at.idx
    if (at.el !== 'C') continue
    const o = carbonylO(mol, c)
    if (o >= 0) {
      const k = carbonylKind(mol, c)
      tryChain(o, c, k, true)
      continue
    }
    if (at.arom) {
      // alquilbenzeno: H vai para o C orto
      const ortho = at.nbrs.find(n => mol.atoms[n.atom].arom)
      if (ortho && at.nbrs.some(n => !mol.atoms[n.atom].arom)) tryChain(ortho.atom, c, 'aromatic')
      continue
    }
    // nitrila: N≡C–Cα–Cβ–Cγ–H → CH₂=C=NH⁺• (m/z 41, confundível com C₃H₅⁺)
    const tn = at.nbrs.find(n => mol.bonds[n.bond].order === 3 && mol.atoms[n.atom].el === 'N')
    if (tn) {
      tryChain(tn.atom, c, 'nitrile')
      continue
    }
    const p = alkenePartner(mol, c)
    if (p >= 0) tryChain(p, c, 'alkene')
  }
  return out
}

// ── perda de água (álcoois) ─────────────────────────────────────────────────
function waterLoss(mol) {
  const out = []
  for (const at of mol.atoms) {
    if (etherLikeO(mol, at.idx) !== 'alcohol') continue
    const c1 = at.nbrs[0]?.atom
    if (c1 == null || !isSp3C(mol, c1)) continue
    // distâncias a partir de C1 (só C sp³)
    const dist = new Map([[c1, 0]])
    const q = [c1]
    while (q.length) {
      const x = q.shift()
      for (const n of mol.atoms[x].nbrs) {
        if (dist.has(n.atom) || !isSp3C(mol, n.atom)) continue
        dist.set(n.atom, dist.get(x) + 1)
        q.push(n.atom)
      }
    }
    const d3 = [...dist.entries()].find(([a, d]) => d === 3 && mol.atoms[a].hs > 0)
    const d1 = [...dist.entries()].find(([a, d]) => d === 1 && mol.atoms[a].hs > 0)
    if (!d3 && !d1) continue
    const ion = new Set([...allAtoms(mol)].filter(i => i !== at.idx))
    const score = d3 ? REARR.water14 : REARR.water12
    out.push({
      type: 'water',
      ion,
      ionH: -1,
      chargeAtom: c1,
      cut: [at.nbrs[0].bond],
      hFrom: (d3 || d1)[0],
      neutral: new Set([at.idx]),
      neutralH: 1,
      neutralRadical: false,
      oddElectron: true,
      cation: { label: 'cátion-radical (alceno/cicloalcano)', kind: 'oe' },
      score,
      parts: [{ label: d3 ? 'eliminação 1,4 de H₂O' : 'eliminação 1,2 de H₂O', value: score }],
      mult: 1,
      alcoholClass: mol.atoms[c1].nbrs.filter(n => mol.atoms[n.atom].el === 'C').length,
      chainC: Math.max(...dist.values()) + 1
    })
  }
  return out
}

// ── perda de HX (haletos de alquila) ────────────────────────────────────────
function hxLoss(mol) {
  const out = []
  for (const at of mol.atoms) {
    if (!HAL.includes(at.el)) continue
    const c = at.nbrs[0]?.atom
    if (c == null || !isSp3C(mol, c)) continue
    const beta = mol.atoms[c].nbrs.find(n => n.atom !== at.idx && isSp3C(mol, n.atom) && mol.atoms[n.atom].hs > 0)
    if (!beta) continue
    const ion = new Set([...allAtoms(mol)].filter(i => i !== at.idx))
    const score = REARR.hx[at.el]
    out.push({
      type: 'hx',
      ion,
      ionH: -1,
      chargeAtom: c,
      cut: [at.nbrs[0].bond],
      hFrom: beta.atom,
      neutral: new Set([at.idx]),
      neutralH: 1,
      neutralRadical: false,
      oddElectron: true,
      cation: { label: 'cátion-radical (alceno)', kind: 'oe' },
      score,
      parts: [{ label: `eliminação de H${at.el}`, value: score }],
      mult: 1
    })
  }
  return out
}

// ── retro-Diels–Alder (ciclo-hexenos) ───────────────────────────────────────
function rda(mol) {
  const out = []
  for (const ring of mol.rings) {
    if (ring.length !== 6 || ring.some(i => mol.atoms[i].arom)) continue
    const n = 6
    const bondAt = k => mol.atoms[ring[k % n]].nbrs.find(x => x.atom === ring[(k + 1) % n])
    const doubles = [...Array(n).keys()].filter(k => mol.bonds[bondAt(k).bond].order === 2)
    if (doubles.length !== 1) continue
    const i = doubles[0]
    const c1 = ring[i]
    const c4 = ring[(i + 3) % n]
    // aula (α × β-ionona): se a C=C do anel está conjugada com outra ligação π fora do anel, não há RDA
    const conj = [ring[i], ring[(i + 1) % n]].some(a =>
      mol.atoms[a].nbrs.some(nb => !ring.includes(nb.atom) && mol.atoms[nb.atom].nbrs.some(m => m.atom !== a && (mol.bonds[m.bond].order >= 2 || mol.bonds[m.bond].arom)))
    )
    if (conj) continue
    const b34 = bondAt(i + 2).bond
    const b56 = bondAt(i + 4).bond
    const cut = new Set([b34, b56])
    const diene = component(mol, c1, cut)
    const ene = component(mol, c4, cut)
    if (diene.has(c4) || netCharge(mol, diene) || netCharge(mol, ene)) continue
    for (const [ion, neu, s, lbl] of [
      [diene, ene, REARR.rdaDiene, 'carga no dieno'],
      [ene, diene, REARR.rdaEne, 'carga no alceno']
    ]) {
      out.push({
        type: 'rda',
        ion,
        ionH: 0,
        chargeAtom: [...ion][0],
        cut: [b34, b56],
        neutral: neu,
        neutralH: 0,
        neutralRadical: false,
        oddElectron: true,
        cation: { label: `cátion-radical (${lbl})`, kind: 'oe' },
        score: s,
        parts: [{ label: `retro-Diels–Alder (${lbl})`, value: s }],
        mult: 1
      })
    }
  }
  return out
}

// ── cicloalcanos: perda de eteno (M − 28) ───────────────────────────────────
function ringEthylene(mol) {
  const out = []
  for (const ring of mol.rings) {
    if (ring.length < 5 || !ring.every(i => isSp3C(mol, i))) continue
    const n = ring.length
    for (let k = 0; k < n; k++) {
      const a = ring[k]
      const b = ring[(k + 1) % n]
      if (mol.atoms[a].hs === 2 && mol.atoms[b].hs === 2 && mol.atoms[a].nbrs.length === 2 && mol.atoms[b].nbrs.length === 2) {
        const ion = new Set([...allAtoms(mol)].filter(i => i !== a && i !== b))
        const bonds = [mol.atoms[a].nbrs.find(x => x.atom === ring[(k - 1 + n) % n]).bond, mol.atoms[b].nbrs.find(x => x.atom === ring[(k + 2) % n]).bond]
        out.push({
          type: 'ring_c2h4',
          ion,
          ionH: 0,
          chargeAtom: ring[(k + 2) % n],
          cut: bonds,
          neutral: new Set([a, b]),
          neutralH: 0,
          neutralRadical: false,
          oddElectron: true,
          cation: { label: 'cátion-radical', kind: 'oe' },
          score: REARR.ringEthylene,
          parts: [{ label: 'abertura do anel + perda de C₂H₄', value: REARR.ringEthylene }],
          mult: 1
        })
        break
      }
    }
  }
  return out
}

// ── fenóis: perda de CO (M − 28) e de CHO• (M − 29) ─────────────────────────
function phenolCO(mol) {
  const out = []
  for (const at of mol.atoms) {
    const t = etherLikeO(mol, at.idx)
    if (t !== 'phenol' && t !== 'ether') continue
    const ipso = at.nbrs.find(n => mol.atoms[n.atom].arom)
    if (!ipso || (t === 'ether' && at.nbrs.some(n => !mol.atoms[n.atom].arom && !isSp3C(mol, n.atom)))) continue
    if (t === 'ether') {
      // anisóis: perda de formaldeído (CH₂O) — O–CH₃
      const me = at.nbrs.find(n => !mol.atoms[n.atom].arom && mol.atoms[n.atom].hs === 3)
      if (!me) continue
      const ion = new Set([...allAtoms(mol)].filter(i => i !== at.idx && i !== me.atom))
      out.push(rearr('ch2o', ion, ipso.atom, [ipso.bond], new Set([at.idx, me.atom]), 1, -1, REARR.anisoleCH2O, 'perda de CH₂O (anisol)', false))
      continue
    }
    const ion = new Set([...allAtoms(mol)].filter(i => i !== at.idx && i !== ipso.atom))
    out.push(rearr('phenol_co', ion, [...ion][0], [ipso.bond], new Set([at.idx, ipso.atom]), 1, -1, REARR.phenolCO, 'contração do anel e perda de CO', false))
    out.push(rearr('phenol_cho', ion, [...ion][0], [ipso.bond], new Set([at.idx, ipso.atom]), 0, 0, REARR.phenolCHO, 'perda de CHO•', true))
  }
  return out
}

// ── acetanilidas e acetatos de arila: perda de ceteno CH₂=C=O (M − 42) ─────
function ketene(mol) {
  const out = []
  for (const at of mol.atoms) {
    const c = at.idx
    if (carbonylKind(mol, c) !== 'amide' && carbonylKind(mol, c) !== 'ester') continue
    const o = carbonylO(mol, c)
    const x = at.nbrs.find(n => ['N', 'O'].includes(mol.atoms[n.atom].el) && n.atom !== o)
    const me = at.nbrs.find(n => isSp3C(mol, n.atom) && mol.atoms[n.atom].hs > 0)
    if (!x || !me || !mol.atoms[x.atom].nbrs.some(n => mol.atoms[n.atom].arom)) continue
    const neu = component(mol, c, new Set([x.bond]))
    if (neu.has(x.atom)) continue
    const ion = new Set([...allAtoms(mol)].filter(i => !neu.has(i)))
    out.push(rearr('ketene', ion, x.atom, [x.bond], neu, 1, -1, REARR.ketene, 'transferência de H ao heteroátomo e perda de CH₂=C=O', false))
  }
  return out
}

// ── piridinas, anilinas e benzonitrilas: perda de HCN (M − 27) ──────────────
function hcnLoss(mol) {
  const out = []
  let done = false
  for (const at of mol.atoms) {
    if (done || at.el !== 'N') continue
    let ion = null
    let cutAtoms = null
    if (at.arom) {
      const cN = at.nbrs.find(n => mol.atoms[n.atom].el === 'C' && mol.atoms[n.atom].hs > 0)
      if (!cN || mol.rings.filter(r => r.includes(at.idx)).length !== 1) continue
      cutAtoms = [at.idx, cN.atom]
    } else if (isAmineN(mol, at.idx) && at.hs === 2 && at.nbrs.length === 1 && mol.atoms[at.nbrs[0].atom].arom) {
      cutAtoms = [at.idx, at.nbrs[0].atom]
    } else if (at.nbrs.length === 1 && mol.bonds[at.nbrs[0].bond].order === 3 && mol.atoms[at.nbrs[0].atom].nbrs.some(n => mol.atoms[n.atom].arom)) {
      cutAtoms = [at.idx, at.nbrs[0].atom]
    } else continue
    ion = new Set([...allAtoms(mol)].filter(i => !cutAtoms.includes(i)))
    const hC = mol.atoms[cutAtoms[1]].hs
    const hN = mol.atoms[cutAtoms[0]].hs
    // HCN leva 1 H: ajusta para que o neutro seja sempre HCN
    out.push(rearr('hcn', ion, [...ion][0], [], new Set(cutAtoms), hC + hN - 1, 1 - hC - hN, REARR.hcn, 'abertura do anel / rearranjo e perda de HCN', false))
    done = true
  }
  return out
}

// ── nitroaromáticos: perda de NO (M − 30) ───────────────────────────────────
function nitroNO(mol) {
  const out = []
  for (const at of mol.atoms) {
    if (!isNitro(mol, at.idx)) continue
    const ar = at.nbrs.find(n => mol.atoms[n.atom].arom)
    if (!ar) continue
    const os = at.nbrs.filter(n => mol.atoms[n.atom].el === 'O').map(n => n.atom)
    const ion = new Set([...allAtoms(mol)].filter(i => i !== at.idx && i !== os[0]))
    out.push(rearr('nitro_no', ion, os[1], [ar.bond], new Set([at.idx, os[0]]), 0, 0, REARR.nitroNO, 'rearranjo nitro → nitrito e perda de NO•', true))
  }
  return out
}

// ── McLafferty + 1 (ésteres com porção alcoólica ≥ C₂): ácido protonado + radical alquenila ──
function mclaffertyPlus1(mol) {
  const out = []
  for (const at of mol.atoms) {
    if (carbonylKind(mol, at.idx) !== 'ester') continue
    const o = carbonylO(mol, at.idx)
    const os = at.nbrs.find(n => mol.atoms[n.atom].el === 'O' && n.atom !== o)
    if (!os) continue
    const ca = mol.atoms[os.atom].nbrs.find(n => n.atom !== at.idx && isSp3C(mol, n.atom))
    if (!ca) continue
    const branch = component(mol, ca.atom, new Set([ca.bond]))
    if (branch.has(at.idx) || [...branch].some(i => !isSp3C(mol, i))) continue
    const cb = mol.atoms[ca.atom].nbrs.find(n => n.atom !== os.atom && isSp3C(mol, n.atom) && mol.atoms[n.atom].hs > 0)
    if (!cb || !mol.atoms[ca.atom].hs) continue
    const ion = new Set([...allAtoms(mol)].filter(i => !branch.has(i)))
    const nC = branch.size
    const score = REARR.mclaffertyPlus1 + REARR.mclaffertyPlus1Step * Math.min(nC - 2, 3)
    out.push(rearr('mclafferty1', ion, o, [ca.bond], branch, 2, -2, score, 'McLafferty + 1 (migram 2 H da porção alcoólica)', true))
  }
  return out
}

// ── abertura de anel por α-clivagem (cicloexanona → 55, cicloexanol → 57) ───
function ringAlpha(mol) {
  const out = []
  for (const ring of mol.rings) {
    const n = ring.length
    if (n < 5 || n > 7) continue
    for (let k = 0; k < n; k++) {
      const c1 = ring[k]
      const a1 = mol.atoms[c1]
      if (a1.el !== 'C') continue
      const kindC = carbonylKind(mol, c1) === 'ketone' ? 'ketone' : a1.nbrs.some(nb => !ring.includes(nb.atom) && etherLikeO(mol, nb.atom) === 'alcohol') ? 'alcohol' : null
      if (!kindC) continue
      const others = ring.filter(i => i !== c1)
      if (!others.every(i => isSp3C(mol, i))) continue
      for (const dir of [1, -1]) {
        const at = j => ring[(k + dir * j + 10 * n) % n]
        const bondTo = (x, y) => mol.atoms[x].nbrs.find(m => m.atom === y).bond
        // ion: C1 + C(n−1) + C(n−2) [no sentido oposto]; neutro: C2 … C(n−3)
        const cutA = bondTo(c1, at(1))
        const cutB = bondTo(at(n - 3), at(n - 2))
        if (!mol.atoms[at(n - 2)].hs) continue
        const cut = new Set([cutA, cutB])
        const ion = component(mol, c1, cut)
        const neu = component(mol, at(1), cut)
        if (ion.has(at(1))) continue
        out.push(rearr('ring_alpha', ion, c1, [cutA, cutB], neu, -1, 1, REARR.ringAlpha[kindC], 'α-clivagem abre o anel, migra H e sai um radical', true))
        if (kindC === 'ketone') {
          // abre o anel e perde eteno (C2–C3): cátion-radical acílio distônico
          const cutC = bondTo(at(2), at(3))
          const cut2 = new Set([cutA, cutC])
          const ion2 = component(mol, c1, cut2)
          const neu2 = component(mol, at(1), cut2)
          if (!ion2.has(at(1)) && neu2.size === 2) out.push(rearr('ring_alpha_ene', ion2, c1, [cutA, cutC], neu2, 0, 0, REARR.ringAlphaEthylene, 'α-clivagem abre o anel e sai eteno', false))
        }
      }
    }
  }
  return out
}

// ── aminas cíclicas: abre o anel (α) e perde alceno (N-metilpirrolidina → 57) ──
function ringAmine(mol) {
  const out = []
  for (const ring of mol.rings) {
    const n = ring.length
    if (n < 5 || n > 6) continue
    const N = ring.find(i => isAmineN(mol, i))
    if (N == null || !ring.every(i => i === N || isSp3C(mol, i))) continue
    const k = ring.indexOf(N)
    const at = j => ring[(k + j) % n]
    const bondTo = (x, y) => mol.atoms[x].nbrs.find(m => m.atom === y).bond
    const cutA = bondTo(at(1), at(2))
    const cutB = bondTo(at(n - 2), at(n - 1))
    const cut = new Set([cutA, cutB])
    const ion = component(mol, N, cut)
    const neu = component(mol, at(2), cut)
    if (ion.has(at(2)) || [...neu].some(i => !ring.includes(i))) continue
    out.push(rearr('ring_amine', ion, N, [cutA, cutB], neu, 0, 0, REARR.ringAmine, 'α-clivagem abre o anel e sai um alceno', false))
  }
  return out
}

// ── éteres aril-alquílicos (≥ C₂): ArO–CH₂CH₃ → ArOH⁺• + alceno (M − 28) ──────
function arylEtherAlkene(mol) {
  const out = []
  for (const at of mol.atoms) {
    if (etherLikeO(mol, at.idx) !== 'ether') continue
    const ar = at.nbrs.find(n => mol.atoms[n.atom].arom)
    const al = at.nbrs.find(n => !mol.atoms[n.atom].arom && isSp3C(mol, n.atom))
    if (!ar || !al) continue
    const branch = component(mol, al.atom, new Set([al.bond]))
    if (branch.size < 2 || [...branch].some(i => !isSp3C(mol, i))) continue
    if (!mol.atoms[al.atom].nbrs.some(n => branch.has(n.atom) && mol.atoms[n.atom].hs > 0)) continue
    const ion = new Set([...allAtoms(mol)].filter(i => !branch.has(i)))
    out.push(rearr('aryl_ether_alkene', ion, at.idx, [al.bond], branch, 1, -1, REARR.arylEtherAlkene, 'H migra para o O/anel e sai um alceno', false))
  }
  return out
}

// ── haletos de cadeia longa: halônio cíclico de 5 membros ───────────────────
function cyclicHalonium(mol) {
  const out = []
  for (const at of mol.atoms) {
    if (!REARR.cyclicHalonium[at.el]) continue
    const c1 = at.nbrs[0]?.atom
    if (c1 == null || !isSp3C(mol, c1) || mol.atoms[c1].hs !== 2) continue
    // caminho linear C1–C2–C3–C4–C5
    const path = [c1]
    let prev = at.idx
    for (let j = 0; j < 4; j++) {
      const cur = path[path.length - 1]
      const nx = mol.atoms[cur].nbrs.filter(m => m.atom !== prev && isSp3C(mol, m.atom))
      if (nx.length !== 1) break
      prev = cur
      path.push(nx[0].atom)
    }
    if (path.length < 5) continue
    const b = mol.atoms[path[3]].nbrs.find(m => m.atom === path[4])
    if (isRingBond(mol, b.bond)) continue
    const cut = new Set([b.bond])
    const ion = component(mol, at.idx, cut)
    const neu = component(mol, path[4], cut)
    const rad = radicalScore(mol, path[4], neu)
    const f = rearr('halonium_ring', ion, at.idx, [b.bond], neu, 0, 0, REARR.cyclicHalonium[at.el] + rad, 'halônio cíclico de 5 membros', true)
    f.parts = [{ label: 'halônio cíclico de 5 membros', value: REARR.cyclicHalonium[at.el] }, { label: 'radical perdido', value: rad }]
    out.push(f)
  }
  return out
}

function rearr(type, ion, chargeAtom, cut, neutral, ionH, neutralH, score, label, neutralRadical) {
  return {
    type,
    ion,
    ionH,
    chargeAtom,
    cut,
    neutral,
    neutralH,
    neutralRadical,
    oddElectron: !neutralRadical,
    cation: { label: neutralRadical ? 'cátion (par de elétrons)' : 'cátion-radical', kind: neutralRadical ? 'ee' : 'oe' },
    score,
    parts: [{ label, value: score }],
    mult: 1
  }
}

// ── fragmentações secundárias (a partir de um íon primário) ─────────────────
// Retorna [{ frag, f }] onde f é a fração do íon-pai que se decompõe.
export function secondaryFragments(mol, parent, formula) {
  const out = []
  const ionAtoms = parent.ion
  const ft = formula
  const onlyCH = Object.keys(ft).every(k => k === 'C' || k === 'H')

  // acílio → R⁺ + CO
  if (parent.cation?.kind === 'acylium') {
    const c = parent.chargeAtom
    const o = hasDoubleTo(mol, c, 'O', ionAtoms)
    const rN = mol.atoms[c].nbrs.filter(n => ionAtoms.has(n.atom) && n.atom !== o?.atom)
    if (o && rN.length === 1 && (!parent.ionH || parent.hAtom === c)) {
      const R = new Set([...ionAtoms].filter(i => i !== c && i !== o.atom))
      const cat = cationScore(mol, rN[0].atom, R)
      const f = Math.min(SECONDARY.coMax, Math.max(SECONDARY.coMin, SECONDARY.coBase * Math.exp(SECONDARY.coSlope * (cat.score - 3))))
      out.push({
        f,
        frag: {
          type: 'sec_co',
          ion: R,
          ionH: 0,
          chargeAtom: rN[0].atom,
          cut: [rN[0].bond],
          neutral: new Set([c, o.atom]),
          neutralH: 0,
          neutralRadical: false,
          oddElectron: false,
          cation: cat,
          parts: [{ label: `${cat.label} a partir do acílio`, value: cat.score }]
        }
      })
    }
  }

  // imínio / oxônio com N- ou O-alquila ≥ C₂ → perde alceno (transferência de H)
  if (parent.cation?.kind === 'hetero_alpha' && !parent.oddElectron) {
    const c = parent.chargeAtom
    for (const n of mol.atoms[c].nbrs) {
      const y = n.atom
      const yEl = mol.atoms[y].el
      if (!ionAtoms.has(y) || (yEl !== 'N' && yEl !== 'O')) continue
      for (const m of mol.atoms[y].nbrs) {
        const z = m.atom
        if (z === c || !ionAtoms.has(z) || !isSp3C(mol, z)) continue
        const within = new Set([...ionAtoms].filter(i => i !== y))
        const branch = component(mol, z, new Set(), within)
        if (branch.size < 2 || branch.has(c) || [...branch].some(i => !isSp3C(mol, i))) continue
        // o "grupo N/O-alquila" não pode ser parte de um anel que volta ao heteroátomo
        if ([...branch].some(i => i !== z && mol.atoms[y].nbrs.some(k => k.atom === i))) continue
        if (!mol.atoms[z].nbrs.some(k => branch.has(k.atom) && mol.atoms[k.atom].hs > 0)) continue
        const ion = new Set([...ionAtoms].filter(i => !branch.has(i)))
        out.push({
          f: yEl === 'N' ? SECONDARY.alkeneFromIminium : SECONDARY.alkeneFromOxonium,
          frag: {
            type: 'sec_alkene',
            ion,
            ionH: parent.ionH + 1,
            chargeAtom: c,
            cut: [m.bond],
            hTo: y,
            neutral: branch,
            neutralH: -1,
            neutralRadical: false,
            oddElectron: false,
            cation: parent.cation,
            parts: [{ label: 'perda de alceno com transferência de H', value: 0 }]
          }
        })
        break
      }
    }
  }

  // C₇H₇⁺ → C₅H₅⁺ + C₂H₂ ; C₆H₅⁺ → C₄H₃⁺ + C₂H₂ ; C₅H₅⁺ → C₃H₃⁺ + C₂H₂
  const key = onlyCH ? `C${ft.C}H${ft.H || 0}` : ''
  const acet = SECONDARY.acetylene[key]
  if (acet != null && !parent.oddElectron) {
    out.push({
      f: acet,
      frag: { type: 'sec_c2h2', ion: ionAtoms, ionH: parent.ionH, formulaDelta: { C: -2, H: -2 }, chargeAtom: parent.chargeAtom, cut: [], neutral: new Set(), neutralFormula: { C: 2, H: 2 }, neutralRadical: false, oddElectron: false, cation: { label: 'cátion (após perda de C₂H₂)', kind: 'ee' }, parts: [] }
    })
  }

  // carbocátions alquila CnH(2n+1)⁺ → CnH(2n−1)⁺ + H₂
  if (onlyCH && !parent.oddElectron && ft.C >= 2 && ft.H === 2 * ft.C + 1 && ['alkyl'].includes(parent.cation?.kind)) {
    out.push({
      f: ft.C === 2 ? SECONDARY.h2Ethyl : SECONDARY.h2Alkyl,
      frag: { type: 'sec_h2', ion: ionAtoms, ionH: parent.ionH, formulaDelta: { H: -2 }, chargeAtom: parent.chargeAtom, cut: [], neutral: new Set(), neutralFormula: { H: 2 }, neutralRadical: false, oddElectron: false, cation: { label: ft.C === 2 ? 'cátion vinila' : 'cátion alila', kind: 'ee' }, parts: [] }
    })
  }

  // ArO⁺ (nitroaromático após perder NO•) → C₅H₅⁺ + CO  (123 → 93 → 65)
  if (parent.type === 'nitro_no') {
    out.push({ f: SECONDARY.phenoxyCO, frag: { type: 'sec_co', ion: ionAtoms, ionH: parent.ionH, formulaDelta: { C: -1, O: -1 }, chargeAtom: parent.chargeAtom, cut: [], neutral: new Set(), neutralFormula: { C: 1, O: 1 }, neutralRadical: false, oddElectron: false, cation: { label: 'cátion ciclopentadienila', kind: 'ee' }, parts: [] } })
  }
  // cicloexanona: 70 → 42 + CO
  if (parent.type === 'ring_alpha_ene') {
    out.push({ f: SECONDARY.ringKetoneCO, frag: { type: 'sec_co', ion: ionAtoms, ionH: parent.ionH, formulaDelta: { C: -1, O: -1 }, chargeAtom: parent.chargeAtom, cut: [], neutral: new Set(), neutralFormula: { C: 1, O: 1 }, neutralRadical: false, oddElectron: true, cation: { label: 'cátion-radical', kind: 'oe' }, parts: [] } })
  }
  // imínio cíclico (M − 1 de amina cíclica, 84) → perde alceno com o resto do anel → 42
  if (parent.type === 'h_alpha' && parent.cation?.kind === 'hetero_alpha') {
    const c = parent.chargeAtom
    const ring = mol.rings.find(r => r.includes(c) && r.some(i => isAmineN(mol, i)) && r.length >= 5 && r.length <= 6)
    if (ring) {
      const N = ring.find(i => isAmineN(mol, i))
      const other = ring.filter(i => i !== c && i !== N && !mol.atoms[N].nbrs.some(k => k.atom === i))
      const alphaOther = ring.find(i => i !== c && mol.atoms[N].nbrs.some(k => k.atom === i))
      const neu = new Set([...other, alphaOther].filter(i => i != null))
      if (other.every(i => isSp3C(mol, i)) && neu.size === ring.length - 2) {
        const keep = new Set([...ionAtoms].filter(i => !neu.has(i)))
        // fica CH₃–N⁺≡CH / CH₂=N⁺=CH₂ (2 C + N + substituintes do N)
        const bonds = mol.atoms[N].nbrs.filter(k => k.atom === alphaOther).map(k => k.bond).concat(mol.atoms[c].nbrs.filter(k => neu.has(k.atom)).map(k => k.bond))
        out.push({ f: SECONDARY.ringIminiumAlkene, frag: { type: 'sec_alkene', ion: keep, ionH: parent.ionH, chargeAtom: c, cut: bonds, neutral: neu, neutralH: 0, neutralRadical: false, oddElectron: false, cation: parent.cation, parts: [] } })
      }
    }
  }
  // amina cíclica aberta (57) → perde o grupo N-alquila como radical → CH₂=N⁺=CH₂ (42)
  if (parent.type === 'ring_amine') {
    const N = parent.chargeAtom
    const sub = mol.atoms[N].nbrs.find(m => ionAtoms.has(m.atom) && isSp3C(mol, m.atom) && !mol.rings.some(r => r.includes(m.atom)))
    if (sub) {
      const branch = component(mol, sub.atom, new Set([sub.bond]))
      const ion = new Set([...ionAtoms].filter(i => !branch.has(i)))
      out.push({ f: SECONDARY.ringAmineAlkyl, frag: { type: 'sec_radical', ion, ionH: parent.ionH, chargeAtom: N, cut: [sub.bond], neutral: branch, neutralH: 0, neutralRadical: true, oddElectron: false, cation: { label: 'íon imínio CH₂=N⁺=CH₂', kind: 'hetero_alpha' }, parts: [] } })
    }
  }
  // C₅H₆⁺• (fenol −CO; anilina −HCN) → C₅H₅⁺ + H•  (66 → 65)
  if (onlyCH && key === 'C5H6' && parent.oddElectron) {
    out.push({ f: SECONDARY.c5h6H, frag: { type: 'sec_h', ion: ionAtoms, ionH: parent.ionH, formulaDelta: { H: -1 }, chargeAtom: parent.chargeAtom, cut: [], neutral: new Set(), neutralFormula: { H: 1 }, neutralRadical: true, oddElectron: false, cation: { label: 'cátion ciclopentadienila (C₅H₅⁺)', kind: 'ee' }, parts: [] } })
  }

  // álcool primário (M − H₂O) → perde também C₂H₄
  if (parent.type === 'water' && parent.alcoholClass <= 1 && parent.chainC >= 4) {
    out.push({
      f: SECONDARY.waterThenEthylene,
      frag: { type: 'sec_c2h4', ion: ionAtoms, ionH: parent.ionH, formulaDelta: { C: -2, H: -4 }, chargeAtom: parent.chargeAtom, cut: [], neutral: new Set(), neutralFormula: { C: 2, H: 4 }, neutralRadical: false, oddElectron: true, cation: { label: 'cátion-radical', kind: 'oe' }, parts: [] }
    })
  }
  return out
}

export function fragFormula(mol, frag, parentFormula = null) {
  if (frag.formulaDelta && parentFormula) {
    const f = { ...parentFormula }
    for (const [el, n] of Object.entries(frag.formulaDelta)) {
      f[el] = (f[el] || 0) + n
      if (!f[el]) delete f[el]
    }
    return f
  }
  return formulaOfAtoms(mol, frag.ion, frag.ionH)
}
export function neutralFormula(mol, frag) {
  if (frag.neutralFormula) return frag.neutralFormula
  return formulaOfAtoms(mol, frag.neutral, frag.neutralH)
}
