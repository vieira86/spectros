// Análise completa: molécula → massas, íon molecular, isótopos, fragmentos e espectro.
import { formulaOf } from './molecule.js'
import { formulaOfAtoms, formulaText, nominalMass, monoMass, avgMass, ionExactMz, isotopePattern, isotopeRelative, ruleOf13, nitrogenRule } from './mass.js'
import { detectGroups, groupList } from './features.js'
import { ionizationSites, molecularIonStability } from './ionization.js'
import { primaryFragments, secondaryFragments, fragFormula, neutralFormula } from './fragments.js'
import { K, KNOWN_IONS, KNOWN_NEUTRALS } from '../data/rules.js'
import { MECHANISMS } from '../data/mechanisms.js'

export { buildMolecule } from './molecule.js'

const PRETTY_NEUTRAL = { ClH: 'HCl', BrH: 'HBr', FH: 'HF', HO: 'OH', H2N: 'NH2', H3N: 'NH3', HI: 'HI', NO2: 'NO2', CHO2: 'COOH', C2H3O: 'CH3CO', CHO: 'CHO', CHN: 'HCN', C2H2O: 'CH2=C=O' }
export const neutralText = f => {
  const t = formulaText(f)
  return PRETTY_NEUTRAL[t] || t
}

export const MIN_REL = 0.3 // % mínimo para manter um pico

export function analyzeMolecule(mol) {
  const all = new Set(mol.atoms.map(a => a.idx))
  const F = formulaOfAtoms(mol, all)
  const basic = formulaOf(mol)
  const M = nominalMass(F)
  const groups = detectGroups(mol)
  const sites = ionizationSites(mol, groups)
  const mStab = molecularIonStability(mol, groups)
  const warnings = []
  if (mol.atoms.some(a => a.chg) && mol.atoms.reduce((s, a) => s + a.chg, 0) !== 0) warnings.push('A molécula tem carga líquida: a EM-IE parte de moléculas neutras.')

  // ── íons ───────────────────────────────────────────────────────────────────
  const ions = []
  const pushIon = (frag, formula, a, level, parent) => {
    const nf = neutralFormula(mol, frag)
    if (!formula.C && !Object.keys(formula).some(k => k !== 'H')) return null
    if (Object.values(formula).some(n => n < 0) || Object.values(nf).some(n => n < 0)) return null
    const mz = nominalMass(formula)
    if (mz < 12 || mz >= M) return null
    const ion = { frag, formula, mz, a, level, parent, neutral: nf }
    ions.push(ion)
    return ion
  }
  for (const p of primaryFragments(mol)) pushIon(p, fragFormula(mol, p), p.mult * Math.exp(K * p.score), 0, null)
  // secundárias (até 2 níveis)
  for (let i = 0; i < ions.length; i++) {
    const ion = ions[i]
    if (ion.level >= 2) continue
    for (const { frag, f } of secondaryFragments(mol, ion.frag, ion.formula)) {
      if (!f) continue
      const fo = fragFormula(mol, frag, ion.formula)
      const child = pushIon(frag, fo, ion.a * f, ion.level + 1, ion)
      if (child) ion.a *= 1 - f / 2
    }
  }

  // ── agrupa caminhos equivalentes ─────────────────────────────────────────
  const groupsMap = new Map()
  for (const ion of ions) {
    const ft = formulaText(ion.formula)
    const nt = neutralText(ion.neutral)
    const key = `${ion.frag.type}|${ft}|${nt}|${ion.parent ? ion.parent.mz : 'M'}`
    let g = groupsMap.get(key)
    if (!g) {
      g = { key, type: ion.frag.type, formula: ion.formula, formulaText: ft, mz: ion.mz, neutral: ion.neutral, neutralText: nt, a: 0, count: 0, rep: null, repA: -1, parentMz: ion.parent ? ion.parent.mz : M, level: ion.level }
      groupsMap.set(key, g)
    }
    g.a += ion.a
    g.count += 1
    if (ion.a > g.repA) {
      g.rep = ion
      g.repA = ion.a
    }
  }

  // ── espectro (com isótopos) ──────────────────────────────────────────────
  const peaks = new Map()
  const addPeak = (mz, a, src, d) => {
    let p = peaks.get(mz)
    if (!p) peaks.set(mz, (p = { mz, a: 0, contributors: [] }))
    p.a += a
    p.contributors.push({ src, a, d })
  }
  const aM = Math.exp(K * mStab.score)
  const mPattern = isotopePattern(F)
  for (const x of mPattern) addPeak(M + x.d, aM * x.p, 'M', x.d)
  const pathways = [...groupsMap.values()]
  pathways.forEach((g, i) => {
    g.id = `P${i}`
    for (const x of isotopePattern(g.formula)) addPeak(g.mz + x.d, g.a * x.p, g.id, x.d)
  })
  const base = Math.max(...[...peaks.values()].map(p => p.a))
  const peakList = [...peaks.values()]
    .map(p => {
      const main = p.contributors.reduce((a, b) => (b.a > a.a ? b : a))
      return { mz: p.mz, rel: (100 * p.a) / base, main: main.src, isotope: main.d !== 0, contributors: p.contributors.sort((a, b) => b.a - a.a).map(c => ({ ...c, share: c.a / p.a })) }
    })
    .filter(p => p.rel >= MIN_REL || (p.main === 'M' && !p.isotope))
    .sort((a, b) => a.mz - b.mz)
  const basePeak = peakList.reduce((a, b) => (b.rel > a.rel ? b : a))

  // intensidade relativa de cada caminho (na m/z monoisotópica)
  for (const g of pathways) {
    const mono = isotopePattern(g.formula).find(x => x.d === 0)?.p ?? 1
    g.rel = (100 * g.a * mono) / base
    g.exactMz = ionExactMz(g.formula)
    g.neutralMass = nominalMass(g.neutral)
    g.mech = MECHANISMS[g.type] || { short: g.type, group: 'sigma', color: '#64748b', text: '' }
    const fr = g.rep.frag
    g.oddElectron = !!fr.oddElectron
    g.cation = fr.cation
    g.parts = fr.parts
    g.score = fr.score
    const known = KNOWN_IONS[g.formulaText] && !g.oddElectron && (fr.cation?.kind !== 'aryl' || g.formulaText === 'C6H5')
    g.ionName = known ? KNOWN_IONS[g.formulaText] : fr.cation?.label || ''
    g.neutralName = KNOWN_NEUTRALS[formulaText(g.neutral)] || ''
    g.neutralRadical = !!fr.neutralRadical
  }
  const visible = pathways.filter(g => g.rel >= 0.5).sort((a, b) => b.rel - a.rel)

  const mMono = (100 * aM * (mPattern.find(x => x.d === 0)?.p ?? 1)) / base
  const mInfo = {
    ...mStab,
    rel: mMono,
    label: mMono >= 60 ? 'intenso' : mMono >= 20 ? 'moderado' : mMono >= 5 ? 'fraco' : mMono >= 1 ? 'muito fraco' : 'praticamente ausente'
  }

  return {
    mol,
    formula: { ...basic, F, text: formulaText(F) },
    M,
    masses: { nominal: M, mono: monoMass(F), avg: avgMass(F), ionExact: ionExactMz(F) },
    groups,
    groupNames: groupList(groups),
    sites,
    mInfo,
    isotopes: isotopeRelative(F).filter(x => x.d >= 0 && x.d <= 6 && x.rel >= 0.05),
    rule13: ruleOf13(M),
    nitrogen: nitrogenRule(M, F.N || 0),
    pathways: visible,
    allPathways: pathways,
    peaks: peakList,
    basePeak,
    warnings
  }
}

// Texto no formato de artigo: EM (IE, 70 eV), m/z (%): …
export function msReport(an, min = 3, max = 12) {
  const top = an.peaks
    .filter(p => (p.rel >= min && (!p.isotope || p.rel >= 10)) || (p.main === 'M' && !p.isotope))
    .sort((a, b) => b.rel - a.rel)
    .slice(0, max)
    .sort((a, b) => b.mz - a.mz)
  const items = top.map(p => `${p.mz} (${p.main === 'M' && !p.isotope ? 'M⁺•, ' : ''}${Math.max(1, Math.round(p.rel))})`)
  return `EM (IE, 70 eV), m/z (%): ${items.join(', ')}.`
}
