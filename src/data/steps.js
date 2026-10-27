// Etapas da análise guiada (textos fáceis de editar)
export const STEPS = [
  {
    id: 'estrutura',
    short: 'Massa',
    icon: '⚖️',
    title: 'Estrutura, fórmula e massa',
    intro: 'O espectrômetro mede a razão massa/carga (m/z) de íons. Como quase todos os íons formados por impacto de elétrons têm carga +1, m/z é a própria massa do íon. Comece calculando a massa da molécula.'
  },
  {
    id: 'ionizacao',
    short: 'Ionização',
    icon: '⚡',
    title: 'Ionização por elétrons e o íon molecular (M⁺•)',
    intro: 'Um elétron de 70 eV arranca um elétron da molécula: M + e⁻ → M⁺• + 2 e⁻. O íon molecular é um cátion-radical (carga + e um elétron desemparelhado). O elétron removido é o de menor energia de ionização: n > π > σ. Como 70 eV é muito mais que o necessário (~10 eV), o excesso de energia quebra a molécula.'
  },
  {
    id: 'isotopos',
    short: 'Isótopos',
    icon: '🧬',
    title: 'Padrão isotópico: M, M+1, M+2',
    intro: 'Os elementos têm isótopos pesados naturais (¹³C, ¹⁵N, ¹⁸O, ³⁷Cl, ⁸¹Br, ³⁴S). Por isso cada íon aparece acompanhado de picos menores em m/z +1 e +2, cuja altura revela a composição.'
  },
  {
    id: 'fragmentos',
    short: 'Fragmentação',
    icon: '✂️',
    title: 'Fragmentações do íon molecular',
    intro: 'M⁺• tem energia em excesso e se quebra. Os mecanismos seguem padrões reprodutíveis (por isso o espectro é uma "impressão digital"): clivagens de uma ligação (α, indutiva, benzílica) e de duas ligações (perda de neutro, McLafferty, retro-Diels–Alder). Só os fragmentos com carga são detectados; o pedaço neutro (radical ou molécula) não aparece no espectro, mas a sua massa aparece como uma "perda". Clique em um caminho para ver, na estrutura, a ligação rompida e o íon formado.'
  },
  {
    id: 'perdas',
    short: 'Perdas neutras',
    icon: '➖',
    title: 'Perdas neutras e íons diagnósticos',
    intro: 'Subtrair a m/z de um fragmento da m/z de M⁺• dá a massa do neutro perdido. Algumas perdas (M − 15, M − 18, M − 28…) e alguns íons de baixa massa (43, 77, 91…) são assinaturas de grupos funcionais.'
  },
  {
    id: 'espectro',
    short: 'Espectro',
    icon: '📊',
    title: 'Espectro de massas simulado',
    intro: 'Juntando o íon molecular, os isótopos e os fragmentos com as respectivas abundâncias, obtemos o espectro. O pico mais alto (pico-base) recebe 100%; os demais são relativos a ele.'
  }
]
