import { beforeAll, describe, expect, it } from 'vitest'
import init from '@rdkit/rdkit'
import { buildMolecule, analyzeMolecule, msReport } from './index.js'
import { isotopeRelative, nominalMass, monoMass, isobaricFormulas } from './mass.js'
import { EXAMPLES } from '../data/examples.js'

let R
beforeAll(async () => {
  R = await init()
})

function run(smiles) {
  const m = R.get_mol(smiles)
  const mol = buildMolecule(m.get_json(), m.get_molblock())
  m.delete()
  return analyzeMolecule(mol)
}
const rel = (an, mz) => an.peaks.find(p => p.mz === mz)?.rel ?? 0

describe('massas e isótopos', () => {
  it('massa nominal e exata', () => {
    expect(nominalMass({ C: 2, H: 6, O: 1 })).toBe(46)
    expect(monoMass({ C: 2, H: 6, O: 1 })).toBeCloseTo(46.0419, 3)
  })
  it('M+1 ≈ 1,1% por carbono', () => {
    const iso = isotopeRelative({ C: 10, H: 8 })
    expect(iso.find(x => x.d === 1).rel).toBeCloseTo(10.8, 0)
  })
  it('cloro 3:1 e bromo 1:1', () => {
    expect(isotopeRelative({ C: 6, H: 5, Cl: 1 }).find(x => x.d === 2).rel).toBeCloseTo(32.5, 0)
    expect(isotopeRelative({ C: 2, H: 5, Br: 1 }).find(x => x.d === 2).rel).toBeCloseTo(97.3, 0)
  })
  it('isóbaros de m/z 28', () => {
    const alt = isobaricFormulas({ C: 2, H: 4 }).map(x => x.text)
    expect(alt).toContain('CO')
  })
})

// pico-base e íons-chave esperados (espectros de referência de IE a 70 eV)
const CASES = [
  ['CCO', 31, [45, 46]],
  ['CCC(C)=O', 43, [72, 57]],
  ['CC(C)=O', 43, [58]],
  ['CCCCC(C)=O', 43, [58, 100]],
  ['Cc1ccccc1', 91, [92, 65]],
  ['CCc1ccccc1', 91, [106]],
  ['CCCc1ccccc1', 91, [92, 120]],
  ['CCNCC', 58, [30, 73]],
  ['CCCCN', 30, []],
  ['CCOCC', 59, [31, 74]],
  ['CCCCCC', 43, [57, 41, 29, 86]],
  ['CC(C)(C)C', 57, []],
  ['CCCCO', 31, [56]],
  ['CC(C)(C)O', 59, []],
  ['CCCC=O', 44, [72, 29]],
  ['CCCC(=O)O', 60, [73 - 2, 45]],
  ['CCCC(N)=O', 59, [44]],
  ['CCCC(=O)OC', 74, [71, 59]],
  ['CCOC(C)=O', 43, [88]],
  ['CC(=O)c1ccccc1', 105, [77, 120, 51]],
  ['O=Cc1ccccc1', 106, [105, 77]],
  ['Clc1ccccc1', 112, [114, 77]],
  ['CCCCCl', 56, [92, 94]],
  ['C1CCCCC1', 56, [84]],
  ['C1=CCCCC1', 54, [82]],
  ['CC1=CCC(CC1)C(C)=C', 68, [136]],
  ['Oc1ccccc1', 94, [66, 65]],
  ['COc1ccccc1', 108, [78]],
  ['O=[N+]([O-])c1ccccc1', 77, [123, 93, 65, 51]],
  ['c1ccncc1', 79, [52]],
  ['CC(=O)Nc1ccc(O)cc1', 109, [151, 43]]
]

describe('espectro simulado: pico-base e íons característicos', () => {
  for (const [smi, base, keys] of CASES) {
    it(smi, () => {
      const an = run(smi)
      expect(an.basePeak.mz).toBe(base)
      for (const k of keys) expect(rel(an, k)).toBeGreaterThan(2)
    })
  }
})

// exemplos dos slides do minicurso (Química Orgânica III · IFRO)
const AULA = [
  ['butano: pico mais intenso em C₃', 'CCCC', 43, [29, 58]],
  ['isoctano: cátion terc-butila', 'CC(C)CC(C)(C)C', 57, []],
  ['metilciclopentano: M − 28 e M − 15', 'CC1CCCC1', 56, [69, 84]],
  ['cicloexeno: retro-Diels–Alder', 'C1=CCCCC1', 54, [82]],
  ['alcino terminal: M − 1 e propargila', 'C#CCC', 39, [53, 54]],
  ['butilbenzeno: tropílio e McLafferty 92', 'CCCCc1ccccc1', 91, [92, 134, 65]],
  ['cumeno: R = CH₃ → 105', 'CC(C)c1ccccc1', 105, [120]],
  ['2-pentanol: sai o maior radical → 45', 'CC(O)CCC', 45, [73]],
  ['cicloexanol: abre o anel → 57', 'OC1CCCCC1', 57, [82]],
  ['éter di-sec-butílico', 'CCC(C)OC(C)CC', null, [115, 101, 57, 45, 59]],
  ['4-etoxitolueno: perde eteno (M − 28)', 'CCOc1ccc(C)cc1', 108, [136, 107]],
  ['pentanal: McLafferty 44', 'CCCCC=O', 44, [29, 85]],
  ['2-octanona: sai o radical hexila → 43', 'CCCCCCC(C)=O', 43, [58]],
  ['cicloexanona: abre o anel → 55', 'O=C1CCCCC1', 55, [98, 70, 42]],
  ['butirofenona: 105, 77 e McLafferty 120', 'CCCC(=O)c1ccccc1', 105, [77, 120]],
  ['ácido 4-metoxibenzoico: 152 → 135 → 107', 'COc1ccc(C(=O)O)cc1', null, [152, 135, 107]],
  ['butanoato de butila: McLafferty + 1 (89)', 'CCCC(=O)OCCCC', null, [71, 89, 116, 101]],
  ['acetato de etila: McLafferty + 1 (61)', 'CCOC(C)=O', 43, [61]],
  ['N-metilpirrolidina: 84 e 42', 'CN1CCCC1', 84, [42, 57]],
  ['anilina: 93 → 66 → 65', 'Nc1ccccc1', 93, [66, 65]],
  ['nitrila: McLafferty 41', 'CCCCC#N', 41, []],
  ['1-clorohexano: halônio cíclico 91/93', 'CCCCCCCl', 91, [93]],
  ['1-bromo-2-cloroetano: sai Br•', 'ClCCBr', 63, [65]],
  ['dibromometano: CH₂Br⁺ 93/95', 'BrCBr', 93, [95]]
]

describe('exemplos da aula', () => {
  for (const [name, smi, base, keys] of AULA) {
    it(name, () => {
      const an = run(smi)
      if (base != null) expect(an.basePeak.mz).toBe(base)
      for (const k of keys) expect(rel(an, k)).toBeGreaterThan(2)
    })
  }
  it('β-ionona não faz retro-Diels–Alder (dupla conjugada); α-ionona faz (m/z 136)', () => {
    expect(run('CC(=O)/C=C/C1=C(C)CCCC1(C)C').allPathways.some(g => g.type === 'rda')).toBe(false)
    expect(rel(run('CC(=O)/C=C/C1C(C)=CCCC1(C)C'), 136)).toBeGreaterThan(10)
  })
  it('2 Cl: M, M+2, M+4 ≈ 9 : 6 : 1', () => {
    const iso = isotopeRelative({ C: 1, H: 2, Cl: 2 })
    expect(iso.find(x => x.d === 2).rel / 100).toBeCloseTo(6 / 9, 1)
    expect(iso.find(x => x.d === 4).rel / 100).toBeCloseTo(1 / 9, 1)
  })
  it('2-cloro-heptano: M⁺• quase invisível', () => {
    expect(run('CCCCCC(C)Cl').mInfo.rel).toBeLessThan(5)
  })
})

describe('regras clássicas', () => {
  it('regra do nitrogênio', () => {
    expect(run('CCCCN').nitrogen.odd).toBe(true)
    expect(run('CCCCO').nitrogen.odd).toBe(false)
  })
  it('bromoetano: par M/M+2 1:1', () => {
    const an = run('CCBr')
    expect(rel(an, 110) / rel(an, 108)).toBeCloseTo(0.97, 1)
  })
  it('McLafferty da 2-hexanona é cátion-radical de m/z par', () => {
    const p = run('CCCCC(C)=O').pathways.find(g => g.type === 'mclafferty')
    expect(p.mz).toBe(58)
    expect(p.oddElectron).toBe(true)
  })
  it('álcool terciário: M⁺• praticamente ausente', () => {
    expect(run('CC(C)(C)O').mInfo.rel).toBeLessThan(2)
  })
  it('texto no formato de artigo', () => {
    expect(msReport(run('CC(=O)c1ccccc1'))).toMatch(/^EM \(IE, 70 eV\), m\/z \(%\): 120 \(M⁺•, \d+\), 105 \(100\)/)
  })
  it('todos os exemplos rodam', () => {
    for (const ex of EXAMPLES) {
      const an = run(ex.smiles)
      expect(an.peaks.length).toBeGreaterThan(1)
      expect(an.basePeak.rel).toBeCloseTo(100, 5)
    }
  })
})
