// ─────────────────────────────────────────────────────────────────────────────
// TABELAS DO MODELO DE FRAGMENTAÇÃO (IE, 70 eV). Ajuste aqui para calibrar o espectro.
//
// Pontuação de um caminho = cátion + radical perdido + penalidade da ligação.
// Abundância relativa ∝ exp(K × pontuação). Uma unidade a mais ≈ 3,3× mais intenso.
// ─────────────────────────────────────────────────────────────────────────────
export const K = 1.2

// Estabilidade do cátion (carga no átomo indicado). kind agrupa o mecanismo.
export const CATION = {
  acylium: { score: 7.5, kind: 'acylium', label: 'íon acílio R–C≡O⁺' },
  acyliumAr: { score: 8.0, kind: 'acylium', label: 'íon acílio Ar–C≡O⁺ (aroíla)' },
  acyliumO: { score: 6.0, kind: 'acylium', label: 'íon acílio O–C≡O⁺ (alcoxi/hidroxicarbonila)' },
  acyliumN: { score: 6.5, kind: 'acylium', label: 'íon acílio N–C≡O⁺ (carbamoíla)' },
  formyl: { score: 6.0, kind: 'acylium', label: 'cátion formila H–C≡O⁺' },
  iminium: { score: 9.0, kind: 'hetero_alpha', label: 'íon imínio C=N⁺' },
  iminiumAmide: { score: 7.0, kind: 'hetero_alpha', label: 'íon imínio (N de amida)' },
  oxonium: { score: 7.5, kind: 'hetero_alpha', label: 'íon oxônio C=O⁺' },
  oxoniumAr: { score: 6.0, kind: 'hetero_alpha', label: 'íon oxônio (O ligado ao anel)' },
  oxoniumEster: { score: 5.5, kind: 'hetero_alpha', label: 'íon oxônio (O de éster)' },
  sulfonium: { score: 8.0, kind: 'hetero_alpha', label: 'íon sulfônio C=S⁺' },
  halonium: { score: 4.5, kind: 'hetero_alpha', label: 'cátion estabilizado pelo halogênio C=X⁺' },
  benzylic: { score: 8.0, kind: 'benzylic', label: 'cátion benzílico (→ tropílio)' },
  allylic: { score: 6.5, kind: 'allylic', label: 'cátion alílico' },
  propargyl: { score: 6.0, kind: 'allylic', label: 'cátion propargílico' },
  aryl: { score: 6.0, kind: 'aryl', label: 'cátion arila' },
  tertiary: { score: 5.5, kind: 'alkyl', label: 'carbocátion terciário' },
  secondary: { score: 4.0, kind: 'alkyl', label: 'carbocátion secundário' },
  primary: { score: 3.0, kind: 'alkyl', label: 'carbocátion primário' },
  // aula: CH₃⁺ < 1º < 2º < 3º < alila < benzila. O cátion etila é muito instável; um primário com ≥ 3 C
  // rearranja (migração de H⁻) a secundário, por isso C₃H₇⁺ (43) e C₄H₉⁺ (57) dominam os alcanos.
  ethyl: { score: 2.5, kind: 'alkyl', label: 'cátion etila (primário, pouco estável)' },
  primaryRearr: { score: 4.0, kind: 'alkyl', label: 'carbocátion primário (rearranja a secundário)' },
  alkynylTerminal: { score: 7.0, kind: 'allylic', label: 'cátion do alcino terminal (M − 1, estabilizado como propargila)' },
  methyl: { score: 0.5, kind: 'alkyl', label: 'cátion metila' },
  vinyl: { score: 2.0, kind: 'other', label: 'cátion vinila' },
  phenoxy: { score: 5.0, kind: 'charge_hetero', label: 'cátion ArO⁺' },
  oxenium: { score: 1.0, kind: 'charge_hetero', label: 'carga no oxigênio (RO⁺)' },
  nitronium: { score: 2.5, kind: 'charge_hetero', label: 'íon NO₂⁺' },
  nitrenium: { score: 1.5, kind: 'charge_hetero', label: 'carga no nitrogênio' },
  iodine: { score: 4.0, kind: 'charge_hetero', label: 'cátion I⁺' },
  bromine: { score: 2.0, kind: 'charge_hetero', label: 'cátion Br⁺' },
  chlorine: { score: 1.0, kind: 'charge_hetero', label: 'cátion Cl⁺' },
  thio: { score: 3.0, kind: 'charge_hetero', label: 'carga no enxofre' },
  other: { score: 0.5, kind: 'other', label: 'cátion pouco estabilizado' }
}

// Estabilidade do radical neutro expulso
export const RADICAL = {
  H: -1.5,
  methyl: 0,
  primary: 1.0,
  secondary: 1.5,
  tertiary: 2.0,
  benzyl: 2.2,
  allyl: 2.0,
  alphaHetero: 1.8,
  acyl: 1.5,
  aryl: 0,
  vinyl: 0.3,
  cyano: 0,
  hydroxyl: 0.5,
  alkoxyl: 3.0, // •OR de éter (clivagem indutiva dos éteres: m/z 43, 57…)
  alkoxylEster: 1.2, // •OR que sai do acílio de um éster
  amino: 0.3,
  aminoSub: 0.8,
  nitro: 3.0, // nitroaromáticos: Ar⁺ (M − 46) é muito intenso (77 no nitrobenzeno)
  thiyl: 1.5,
  F: 0,
  Cl: 1.5,
  Br: 3.5, // aula: o Br• sai com facilidade (mais fácil que o Cl•)
  I: 4.0,
  other: 1.0,
  // Regra de Stevenson / aula: "havendo opção, sai o maior radical alquila".
  // Bônus por carbono a mais no radical alquila (até sizeMax carbonos extras).
  sizeStep: 0.25,
  sizeMax: 4
}

export const PENALTY = {
  arylBond: -1.5, // romper ligação com C aromático (sp²) é difícil
  vinylBond: -1.0, // idem para C vinílico ou acetilênico
  alphaCarbonylCation: -2.0, // carbocátion vizinho à C=O é desestabilizado
  alphaNitrileCation: -1.5,
  aldehydeHLoss: 1.0, // aldeídos: M − 1 (acílio) é característico
  unstabilizedHLoss: -1.5, // perder H• formando cátion alquila simples (M − 1 de alcanos) é raro
  ringSideChain: 1.0 // cicloalcanos: a cadeia lateral sai e a carga fica no anel (M − 15 do metilciclopentano)
}

// Rearranjos (pontuação do caminho inteiro)
export const REARR = {
  mclafferty: { ketone: 8.0, aldehyde: 8.3, ester: 8.8, acid: 8.8, amide: 9.0, acyl_halide: 7.0, alkoxy: 6.0, aromatic: 7.5, alkene: 5.5, nitrile: 8.5 },
  mclaffertyLabel: { ketone: 'cetona', aldehyde: 'aldeído', ester: 'éster', acid: 'ácido', amide: 'amida', acyl_halide: 'haleto de acila', alkoxy: 'lado alcoxi do éster', aromatic: 'alquilbenzeno', alkene: 'alceno', nitrile: 'nitrila' },
  mclaffertyPlus1: 7.0, // ésteres com porção alcoólica ≥ C₂: ácido + H⁺ (61, 75, 89…); + bônus por C
  mclaffertyPlus1Step: 0.4,
  ringAlpha: { ketone: 8.0, alcohol: 8.3 }, // cicloexanona → 55, cicloexanol → 57 (abre o anel, migra H, sai radical)
  ringAlphaEthylene: 6.8, // cicloexanona: abre o anel e perde eteno → 70
  ringAmine: 7.0, // N-metilpirrolidina: abre o anel e perde eteno → 57
  arylEtherAlkene: 8.5, // ArO–CH₂CH₃ → ArOH⁺• + CH₂=CH₂ (M − 28)
  cyclicHalonium: { Cl: 6.5, Br: 6.0 }, // R–(CH₂)₄–X → halônio cíclico de 5 membros (91/93 Cl; 135/137 Br) + radical
  water14: 8.0, // álcool com H no C4 (eliminação 1,4 por estado de transição de 6 membros)
  water12: 4.5,
  hx: { F: 6.0, Cl: 6.5, Br: 5.0, I: 3.0 },
  rdaDiene: 7.0,
  rdaEne: 5.0,
  ringEthylene: 6.0,
  phenolCO: 6.5,
  phenolCHO: 6.0,
  anisoleCH2O: 6.5,
  nitroNO: 5.5,
  ketene: 8.5, // ArNH–COCH₃ / ArO–COCH₃ → ArNH₂⁺• / ArOH⁺• + CH₂=C=O
  hcn: 6.5
}

// Fragmentações secundárias: fração do íon-pai que se decompõe
export const SECONDARY = {
  coBase: 0.08, // acílio → R⁺ + CO: f = coBase·exp(coSlope·(estab. R⁺ − 3))
  coSlope: 0.6,
  coMin: 0.02,
  coMax: 0.8,
  alkeneFromIminium: 0.5,
  alkeneFromOxonium: 0.6,
  acetylene: { C7H7: 0.12, C6H5: 0.35, C5H5: 0.3, C4H3: 0 },
  h2Alkyl: 0.45,
  h2Ethyl: 0.5,
  waterThenEthylene: 0.5,
  phenoxyCO: 0.6, // ArO⁺ (93 do nitrobenzeno) → C₅H₅⁺ (65) + CO
  c5h6H: 0.45, // C₅H₆⁺• (66 do fenol e da anilina) → C₅H₅⁺ (65) + H•
  ringKetoneCO: 0.6, // 70 da cicloexanona → 42 + CO
  ringIminiumAlkene: 0.5, // 84 da N-metilpirrolidina → 42 + C₃H₆
  ringAmineAlkyl: 0.7 // 57 da N-metilpirrolidina → 42 (CH₂=N⁺=CH₂) + •CH₃
}

// Nomes de íons conhecidos (fórmula → nome), usados como rótulo didático
export const KNOWN_IONS = {
  C7H7: 'íon tropílio (C₇H₇⁺)',
  C6H5: 'cátion fenila (C₆H₅⁺)',
  C7H5O: 'íon benzoíla (C₆H₅CO⁺)',
  C2H3O: 'íon acetila (CH₃CO⁺)',
  C5H5: 'cátion ciclopentadienila (C₅H₅⁺)',
  C4H3: 'C₄H₃⁺ (do anel aromático)',
  C3H3: 'cátion ciclopropenila (C₃H₃⁺)',
  C3H5: 'cátion alila (C₃H₅⁺)',
  C3H3O: 'íon acriloíla (CH₂=CH–C≡O⁺)',
  C3H5O: 'íon oxônio insaturado (CH₂=CH–CH=OH⁺)',
  C2H4N: 'íon imínio CH₂=N⁺=CH₂',
  C2H3N: 'cátion-radical CH₂=C=NH⁺• (McLafferty de nitrila)',
  CH3O: 'íon oxônio CH₂=OH⁺',
  CH4N: 'íon imínio CH₂=NH₂⁺',
  CHO: 'cátion formila (HCO⁺)',
  CHO2: 'íon carboxila (HO–C≡O⁺)',
  CH2NO: 'íon carbamoíla (H₂N–C≡O⁺)',
  C2H3O2: 'íon metoxicarbonila (CH₃O–C≡O⁺)',
  C2H5: 'cátion etila (C₂H₅⁺)',
  C2H3: 'cátion vinila (C₂H₃⁺)',
  CH3: 'cátion metila (CH₃⁺)',
  I: 'cátion I⁺'
}

// Nomes de neutros perdidos
export const KNOWN_NEUTRALS = {
  H: 'hidrogênio',
  H2: 'hidrogênio molecular',
  CH3: 'metila',
  C2H5: 'etila',
  C3H7: 'propila',
  C4H9: 'butila',
  C5H11: 'pentila',
  H2O: 'água',
  HO: 'hidroxila',
  CO: 'monóxido de carbono',
  C2H4: 'eteno',
  C3H6: 'propeno',
  C4H8: 'buteno',
  C2H2: 'etino (acetileno)',
  CHO: 'formila',
  CH2O: 'formaldeído',
  CH3O: 'metoxila',
  C2H5O: 'etoxila',
  CHO2: 'carboxila',
  C2H3O: 'acetila',
  NO: 'monóxido de nitrogênio',
  NO2: 'dióxido de nitrogênio',
  H2N: 'amino',
  H3N: 'amônia',
  ClH: 'cloreto de hidrogênio',
  BrH: 'brometo de hidrogênio',
  FH: 'fluoreto de hidrogênio',
  HI: 'iodeto de hidrogênio',
  Cl: 'cloro',
  Br: 'bromo',
  I: 'iodo',
  C6H5: 'fenila',
  C7H7: 'benzila',
  CN: 'ciano',
  CHN: 'cianeto de hidrogênio (HCN)',
  C2H3: 'vinila',
  C3H5: 'alila',
  C4H7: 'butenila',
  C2H2O: 'ceteno (CH₂=C=O)'
}
