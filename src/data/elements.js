// Dados dos elementos usados no cálculo de massas e de padrões isotópicos.
// nominal: massa inteira do isótopo mais abundante · mono: massa exata desse isótopo (u)
// avg: massa atômica média (IUPAC) · iso: [diferença de massa nominal, abundância natural]
export const ELEMENTS = {
  H: { nominal: 1, mono: 1.0078250319, avg: 1.008, iso: [[0, 0.999885], [1, 0.000115]] },
  B: { nominal: 11, mono: 11.0093054, avg: 10.81, iso: [[-1, 0.199], [0, 0.801]] },
  C: { nominal: 12, mono: 12.0, avg: 12.011, iso: [[0, 0.9893], [1, 0.0107]] },
  N: { nominal: 14, mono: 14.0030740052, avg: 14.007, iso: [[0, 0.99636], [1, 0.00364]] },
  O: { nominal: 16, mono: 15.9949146221, avg: 15.999, iso: [[0, 0.99757], [1, 0.00038], [2, 0.00205]] },
  F: { nominal: 19, mono: 18.99840320, avg: 18.998, iso: [[0, 1]] },
  Na: { nominal: 23, mono: 22.98976966, avg: 22.99, iso: [[0, 1]] },
  Si: { nominal: 28, mono: 27.9769265327, avg: 28.085, iso: [[0, 0.92223], [1, 0.04685], [2, 0.03092]] },
  P: { nominal: 31, mono: 30.97376151, avg: 30.974, iso: [[0, 1]] },
  S: { nominal: 32, mono: 31.97207069, avg: 32.06, iso: [[0, 0.9499], [1, 0.0075], [2, 0.0425], [4, 0.0001]] },
  Cl: { nominal: 35, mono: 34.96885271, avg: 35.45, iso: [[0, 0.7576], [2, 0.2424]] },
  K: { nominal: 39, mono: 38.9637069, avg: 39.098, iso: [[0, 0.932581], [2, 0.067302]] },
  Se: { nominal: 80, mono: 79.9165218, avg: 78.971, iso: [[-6, 0.0089], [-4, 0.0937], [-3, 0.0763], [-2, 0.2377], [0, 0.4961], [2, 0.0873]] },
  Br: { nominal: 79, mono: 78.9183376, avg: 79.904, iso: [[0, 0.5069], [2, 0.4931]] },
  I: { nominal: 127, mono: 126.904468, avg: 126.904, iso: [[0, 1]] }
}

export const ELECTRON_MASS = 0.00054858

// Energias de ionização típicas (eV) de compostos-modelo: orientam onde o elétron é removido.
// Quanto menor a energia, mais fácil remover o elétron desse sítio.
export const IONIZATION_SITES = {
  amine: { ie: 8.0, label: 'par de elétrons n do nitrogênio (amina)', model: '(CH₃)₃N ≈ 7,8 eV' },
  sulfur: { ie: 8.7, label: 'par de elétrons n do enxofre', model: '(CH₃)₂S ≈ 8,7 eV' },
  aromaticFused: { ie: 8.1, label: 'elétrons π do sistema aromático policíclico', model: 'naftaleno ≈ 8,1 eV' },
  aromatic: { ie: 9.2, label: 'elétrons π do anel aromático', model: 'benzeno ≈ 9,2 eV' },
  iodine: { ie: 9.5, label: 'par de elétrons n do iodo', model: 'CH₃I ≈ 9,5 eV' },
  ether: { ie: 9.6, label: 'par de elétrons n do oxigênio (éter)', model: '(C₂H₅)₂O ≈ 9,5 eV' },
  carbonyl: { ie: 9.7, label: 'par de elétrons n do oxigênio da carbonila', model: 'acetona ≈ 9,7 eV' },
  alkene: { ie: 9.8, label: 'elétrons π da ligação C=C', model: 'propeno ≈ 9,7 eV' },
  alkyne: { ie: 10.4, label: 'elétrons π da ligação C≡C', model: 'propino ≈ 10,4 eV' },
  bromine: { ie: 10.5, label: 'par de elétrons n do bromo', model: 'CH₃Br ≈ 10,5 eV' },
  alcohol: { ie: 10.4, label: 'par de elétrons n do oxigênio (álcool)', model: 'etanol ≈ 10,5 eV' },
  ester: { ie: 10.1, label: 'par de elétrons n do oxigênio carbonílico (éster/ácido)', model: 'acetato de etila ≈ 10,0 eV' },
  chlorine: { ie: 11.2, label: 'par de elétrons n do cloro', model: 'CH₃Cl ≈ 11,2 eV' },
  nitrile: { ie: 11.8, label: 'elétrons do grupo C≡N', model: 'acetonitrila ≈ 12,2 eV' },
  sigma: { ie: 10.8, label: 'elétrons σ de uma ligação C–C', model: 'butano ≈ 10,5 eV; etano ≈ 11,5 eV' }
}
